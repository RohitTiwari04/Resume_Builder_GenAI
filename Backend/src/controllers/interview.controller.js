const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

function deriveJobTitle(jobDescription = "") {
    const firstLine = jobDescription
        .split("\n")
        .map((line) => line.trim())
        .find(Boolean)

    if (!firstLine) {
        return "Untitled Position"
    }

    return firstLine.length > 120 ? `${firstLine.slice(0, 117).trim()}...` : firstLine
}

function normalizeInterviewReport(aiReport = {}, jobDescription = "") {
    return {
        title: typeof aiReport.title === "string" && aiReport.title.trim()
            ? aiReport.title.trim()
            : deriveJobTitle(jobDescription),
        matchScore: typeof aiReport.matchScore === "number" ? aiReport.matchScore : 0,
        technicalQuestions: Array.isArray(aiReport.technicalQuestions) ? aiReport.technicalQuestions : [],
        behavioralQuestions: Array.isArray(aiReport.behavioralQuestions) ? aiReport.behavioralQuestions : [],
        skillGaps: Array.isArray(aiReport.skillGaps) ? aiReport.skillGaps : [],
        preparationPlan: Array.isArray(aiReport.preparationPlan) ? aiReport.preparationPlan : []
    }
}



/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        const { selfDescription = "", jobDescription = "" } = req.body

        if (!jobDescription.trim()) {
            return res.status(400).json({
                message: "Job description is required."
            })
        }

        if (!req.file && !selfDescription.trim()) {
            return res.status(400).json({
                message: "Upload a PDF resume or provide a self description."
            })
        }

        if (req.file && req.file.mimetype !== "application/pdf") {
            return res.status(400).json({
                message: "Only PDF resumes are supported right now."
            })
        }

        let resumeText = ""

        if (req.file) {
            try {
                const pdfInstance = new pdfParse.PDFParse({ data: req.file.buffer })
                const resumeContent = await pdfInstance.getText()
                await pdfInstance.destroy()
                resumeText = resumeContent.text || ""
            } catch (pdfError) {
                console.error("PDF parsing error:", pdfError.message)
                return res.status(400).json({
                    message: "Failed to read PDF. Please ensure the file is a valid, non-encrypted PDF resume."
                })
            }
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        })

        const normalizedInterviewReport = normalizeInterviewReport(interViewReportByAi, jobDescription)

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            ...normalizedInterviewReport
        })

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (error) {
        console.error(error)
        return res.status(error.statusCode || 500).json({
            message: error.message || "Failed to generate interview report."
        })
    }

}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)
    } catch (error) {
        console.error(error)
        return res.status(error.statusCode || 500).json({
            message: error.message || "Failed to generate resume PDF."
        })
    }
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }
