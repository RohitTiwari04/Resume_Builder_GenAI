const { GoogleGenAI } = require("@google/genai")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

const AI_MODELS = Array.from(new Set([
    process.env.GOOGLE_GENAI_MODEL || "gemini-3-flash-preview",
    process.env.GOOGLE_GENAI_FALLBACK_MODEL || "gemini-2.5-flash"
].filter(Boolean)))

const AI_MAX_RETRIES = Math.max(Number(process.env.GOOGLE_GENAI_MAX_RETRIES || 3), 1)
const AI_RETRY_DELAY_MS = Math.max(Number(process.env.GOOGLE_GENAI_RETRY_DELAY_MS || 1500), 250)

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableAiError(error) {
    return [ 429, 500, 502, 503, 504 ].includes(error?.status)
}

function extractAiErrorMessage(error) {
    if (typeof error?.error?.error?.message === "string") {
        return error.error.error.message
    }

    if (typeof error?.error?.message === "string") {
        return error.error.message
    }

    if (typeof error?.message === "string" && error.message.trim()) {
        return error.message
    }

    return null
}

function createAiServiceError(error) {
    const upstreamStatus = typeof error?.status === "number" ? error.status : 500
    const statusCode = isRetryableAiError(error) ? 503 : upstreamStatus

    let message = extractAiErrorMessage(error)

    if (!message && statusCode === 503) {
        message = "AI service is temporarily busy. Please try again in a minute."
    } else if (!message && upstreamStatus === 429) {
        message = "AI rate limit reached. Please try again shortly."
    } else if (!message) {
        message = "AI service request failed."
    }

    const wrappedError = new Error(message)
    wrappedError.statusCode = statusCode
    wrappedError.cause = error

    return wrappedError
}

async function generateStructuredJson({ prompt, schema }) {
    let lastError = null

    for (const model of AI_MODELS) {
        for (let attempt = 1; attempt <= AI_MAX_RETRIES; attempt++) {
            try {
                const response = await ai.models.generateContent({
                    model,
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: schema,
                    }
                })

                return JSON.parse(response.text)
            } catch (error) {
                lastError = error

                const shouldRetry = isRetryableAiError(error) && attempt < AI_MAX_RETRIES

                if (shouldRetry) {
                    const delay = AI_RETRY_DELAY_MS * (2 ** (attempt - 1))
                    console.warn(`AI request failed with status ${error.status} on model ${model}. Retrying in ${delay}ms (attempt ${attempt + 1}/${AI_MAX_RETRIES}).`)
                    await sleep(delay)
                    continue
                }

                if (!isRetryableAiError(error)) {
                    throw createAiServiceError(error)
                }
            }
        }
    }

    throw createAiServiceError(lastError)
}


const interviewReportSchema = {
    type: "OBJECT",
    properties: {
        matchScore: {
            type: "INTEGER",
            description: "A score between 0 and 100 indicating how well the candidate's profile matches the job description."
        },
        technicalQuestions: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    question: { type: "STRING", description: "The technical question that can be asked in the interview." },
                    intention: { type: "STRING", description: "The intention of the interviewer behind asking this question." },
                    answer: { type: "STRING", description: "How to answer this question, what points to cover, what approach to take etc." }
                },
                required: ["question", "intention", "answer"]
            },
            description: "Technical questions that can be asked in the interview along with their intention and how to answer them."
        },
        behavioralQuestions: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    question: { type: "STRING", description: "The behavioral question that can be asked in the interview." },
                    intention: { type: "STRING", description: "The intention of the interviewer behind asking this question." },
                    answer: { type: "STRING", description: "How to answer this question, what points to cover, what approach to take etc." }
                },
                required: ["question", "intention", "answer"]
            },
            description: "Behavioral questions that can be asked in the interview along with their intention and how to answer them."
        },
        skillGaps: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    skill: { type: "STRING", description: "The skill which the candidate is lacking." },
                    severity: { 
                        type: "STRING", 
                        enum: ["low", "medium", "high"], 
                        description: "The severity of this skill gap." 
                    }
                },
                required: ["skill", "severity"]
            },
            description: "List of skill gaps in the candidate's profile along with their severity."
        },
        preparationPlan: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    day: { type: "INTEGER", description: "The day number in the preparation plan, starting from 1." },
                    focus: { type: "STRING", description: "The main focus of this day in the preparation plan." },
                    tasks: {
                        type: "ARRAY",
                        items: { type: "STRING" },
                        description: "List of tasks to be done on this day."
                    }
                },
                required: ["day", "focus", "tasks"]
            },
            description: "A day-wise preparation plan for the candidate to follow."
        },
        title: {
            type: "STRING",
            description: "The title of the job for which the interview report is generated."
        }
    },
    required: ["matchScore", "technicalQuestions", "behavioralQuestions", "skillGaps", "preparationPlan", "title"]
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {


    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        Return valid JSON only.
                        Important rules:
                        - title must be the actual job title for this role.
                        - matchScore must be an integer between 0 and 100.
                        - technicalQuestions must contain at least 5 useful questions.
                        - behavioralQuestions must contain at least 3 useful questions.
                        - skillGaps must contain at least 3 concrete gaps when possible.
                        - preparationPlan must contain at least 5 days.
                        - Never return empty arrays.
                        - If the candidate information is limited, infer the most relevant interview questions and roadmap from the job description.
                        - Keep every question, intention, answer, and task specific to the target role instead of generic filler.
`

    return generateStructuredJson({
        prompt,
        schema: interviewReportSchema
    })


}



async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = {
        type: "OBJECT",
        properties: {
            html: {
                type: "STRING",
                description: "The HTML content of the resume which can be converted to PDF using any library like puppeteer."
            }
        },
        required: ["html"]
    }

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const jsonContent = await generateStructuredJson({
        prompt,
        schema: resumePdfSchema
    })

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf }
