import { useState, useRef } from 'react'
import "../style/home.scss"
import "../style/interview.scss" // Import for integrated strategy layout
import { useInterview } from '../hooks/useInterview.js'
import { useAuth } from '../../auth/hooks/useAuth.js'

const NAV_ITEMS = [
    {
        id: 'technical',
        label: 'Technical Questions',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
            </svg>
        )
    },
    {
        id: 'behavioral',
        label: 'Behavioral Questions',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        )
    },
    {
        id: 'roadmap',
        label: 'Road Map',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
        )
    }
]

const QuestionCard = ({ item, index }) => {
    const [ open, setOpen ] = useState(false)

    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen((current) => !current)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <p>{item.answer}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

const RoadMapDay = ({ day }) => (
    <div className='roadmap-day'>
        <div className='roadmap-day__header'>
            <span className='roadmap-day__badge'>Day {day.day}</span>
            <h3 className='roadmap-day__focus'>{day.focus}</h3>
        </div>
        <ul className='roadmap-day__tasks'>
            {day.tasks.map((task, index) => (
                <li key={index}>
                    <span className='roadmap-day__bullet' />
                    {task}
                </li>
            ))}
        </ul>
    </div>
)

const EmptyState = ({ title, description }) => (
    <div className='empty-state'>
        <div className='empty-state__icon'>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        </div>
        <h3>{title}</h3>
        <p>{description}</p>
    </div>
)

const getScoreSubtitle = (score, hasContent) => {
    if (!hasContent || score === 0) {
        return "This report needs more detail before we can score it confidently."
    }
    if (score >= 80) {
        return "Strong match for this role"
    }
    if (score >= 60) {
        return "Promising match with a few gaps to close"
    }
    return "This role may need more preparation and tailoring"
}

const getNow = () => Date.now()

const THINKING_STEPS = [
    { label: "Reading and extracting text from your PDF resume...", icon: "📄" },
    { label: "Analyzing target job description and core requirements...", icon: "🎯" },
    { label: "Comparing candidate profiles and calculating job match score...", icon: "⚖️" },
    { label: "Formulating key technical and behavioral questions...", icon: "💡" },
    { label: "Drafting daily preparation roadmap and action plan...", icon: "🚀" }
]

const Home = () => {
    const { user, handleLogout } = useAuth()
    const [ showProfileDropdown, setShowProfileDropdown ] = useState(false)
    const { loading, generateReport, reports, getReportById, getResumePdf } = useInterview()
    const [ jobDescription, setJobDescription ] = useState("")
    const [ selfDescription, setSelfDescription ] = useState("")
    
    // File upload states
    const [ selectedFile, setSelectedFile ] = useState(null)
    
    // Dynamic thinking/loading engine states
    const [ isGenerating, setIsGenerating ] = useState(false)
    const [ currentThinkingStep, setCurrentThinkingStep ] = useState(0)
    
    // Dynamic inline results states
    const [ activeReport, setActiveReport ] = useState(null)
    const [ activeNav, setActiveNav ] = useState('technical')
    
    const resumeInputRef = useRef()
    const resultsRef = useRef(null)

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (file.type !== "application/pdf") {
                window.alert("Only PDF files are supported.")
                setSelectedFile(null)
                if (resumeInputRef.current) resumeInputRef.current.value = ""
                return
            }
            if (file.size > 5 * 1024 * 1024) {
                window.alert("File size exceeds 5MB limit.")
                setSelectedFile(null)
                if (resumeInputRef.current) resumeInputRef.current.value = ""
                return
            }
            setSelectedFile(file)
        }
    }

    const handleDragOver = (e) => {
        e.preventDefault()
    }

    const handleDrop = (e) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file) {
            if (file.type !== "application/pdf") {
                window.alert("Only PDF files are supported.")
                return
            }
            if (file.size > 5 * 1024 * 1024) {
                window.alert("File size exceeds 5MB limit.")
                return
            }
            setSelectedFile(file)
            if (resumeInputRef.current) {
                // To keep input synced, we create a DataTransfer if browser supports it
                try {
                    const dt = new DataTransfer()
                    dt.items.add(file)
                    resumeInputRef.current.files = dt.files
                } catch (err) {
                    console.warn("Could not sync file input", err)
                }
            }
        }
    }

    const handleGenerateReport = async () => {
        const resumeFile = selectedFile || (resumeInputRef.current?.files ? resumeInputRef.current.files[0] : null)
        
        if (!jobDescription.trim()) {
            window.alert("Please add the job description before generating the report.")
            return
        }

        if (!resumeFile && !selfDescription.trim()) {
            window.alert("Please upload a PDF resume or add a self description.")
            return
        }

        setIsGenerating(true)
        setCurrentThinkingStep(0)
        
        // Start stepper timer
        const timer = setInterval(() => {
            setCurrentThinkingStep(prev => {
                if (prev < THINKING_STEPS.length - 1) {
                    return prev + 1;
                }
                return prev;
            });
        }, 800); // 800ms per step gives 4 seconds total for 5 steps

        const startTime = getNow();

        try {
            const data = await generateReport({ 
                jobDescription, 
                selfDescription, 
                resumeFile 
            })

            if (data?._id) {
                const elapsedTime = getNow() - startTime;
                const remainingTime = Math.max(0, 4200 - elapsedTime);

                setTimeout(() => {
                    clearInterval(timer);
                    setActiveReport(data);
                    setIsGenerating(false);
                    setTimeout(() => {
                        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                }, remainingTime);
            } else {
                clearInterval(timer);
                setIsGenerating(false);
            }
        } catch (err) {
            clearInterval(timer);
            setIsGenerating(false);
            console.error(err);
            window.alert("Failed to generate report. Please try again.");
        }
    }

    const handleSelectRecentReport = async (reportId) => {
        setIsGenerating(true)
        setCurrentThinkingStep(0)
        
        const timer = setInterval(() => {
            setCurrentThinkingStep(prev => {
                if (prev < 2) {
                    return prev + 1;
                }
                return prev;
            });
        }, 400);

        try {
            const data = await getReportById(reportId)
            setTimeout(() => {
                clearInterval(timer)
                setActiveReport(data)
                setIsGenerating(false)
                setTimeout(() => {
                    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 100);
            }, 1000);
        } catch (err) {
            clearInterval(timer)
            setIsGenerating(false)
            console.error(err)
        }
    }

    if (loading && !isGenerating) {
        return (
            <main className='loading-screen'>
                <h1>Loading your interview plan...</h1>
            </main>
        )
    }

    // Results presentation parameters
    const technicalQuestions = activeReport && Array.isArray(activeReport.technicalQuestions) ? activeReport.technicalQuestions : []
    const behavioralQuestions = activeReport && Array.isArray(activeReport.behavioralQuestions) ? activeReport.behavioralQuestions : []
    const preparationPlan = activeReport && Array.isArray(activeReport.preparationPlan) ? activeReport.preparationPlan : []
    const skillGaps = activeReport && Array.isArray(activeReport.skillGaps) ? activeReport.skillGaps : []
    const matchScore = activeReport && typeof activeReport.matchScore === 'number' ? activeReport.matchScore : 0
    const hasGeneratedInsights = activeReport && (technicalQuestions.length > 0 || behavioralQuestions.length > 0 || preparationPlan.length > 0 || skillGaps.length > 0)
    
    const scoreColor =
        matchScore >= 80 ? 'score--high'
            : matchScore >= 60 ? 'score--mid' : 'score--low'

    return (
        <div className='home-page'>

            {/* Premium Top Navigation Bar with Profile details and logout button statically visible */}
            <div className='top-bar'>
                <div className='top-bar__logo'>
                    <span className='logo-icon'>✨</span>
                    <span>Interview<span className='highlight-logo'>Genius</span></span>
                </div>
                {user && (
                    <div className='top-bar__user-info'>
                        <span className='user-details-text'>
                            Logged in as <strong>{user.username}</strong> ({user.email})
                        </span>
                        <button className='logout-btn logout-btn--header' onClick={handleLogout}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Log Out
                        </button>
                    </div>
                )}
            </div>

            {/* Page Header */}
            <header className='page-header'>
                <h1>Create Your Custom <span className='highlight'>Interview Plan</span></h1>
                <p>Let our AI analyze the job requirements and your unique profile to build a winning strategy.</p>
            </header>

            {/* Main Card */}
            <div className='interview-card'>
                <div className='interview-card__body'>

                    {/* Left Panel - Job Description */}
                    <div className='panel panel--left'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                            </span>
                            <h2>Target Job Description</h2>
                            <span className='badge badge--required'>Required</span>
                        </div>
                        <textarea
                            onChange={(e) => { setJobDescription(e.target.value) }}
                            className='panel__textarea'
                            placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'`}
                            maxLength={5000}
                            value={jobDescription}
                        />
                        <div className='char-counter'>{jobDescription.length} / 5000 chars</div>
                    </div>

                    {/* Vertical Divider */}
                    <div className='panel-divider' />

                    {/* Right Panel - Profile */}
                    <div className='panel panel--right'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </span>
                            <h2>Your Profile</h2>
                        </div>

                        {/* Upload Resume */}
                        <div className='upload-section'>
                            <label className='section-label'>
                                Upload Resume
                                <span className='badge badge--best'>Best Results</span>
                            </label>
                            
                            {selectedFile ? (
                                <>
                                    <div className='selected-file-card'>
                                        <div className='file-details'>
                                            <span className='file-icon'>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                                            </span>
                                            <div className='file-meta'>
                                                <p className='file-name'>{selectedFile.name}</p>
                                                <p className='file-size'>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                            </div>
                                        </div>
                                        <button 
                                            type="button" 
                                            className='remove-file-btn' 
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                setSelectedFile(null)
                                                if (resumeInputRef.current) resumeInputRef.current.value = ""
                                            }}
                                            title="Remove file"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                    </div>
                                    <div className='upload-acknowledgment'>
                                        <span className='ack-icon'>✓</span>
                                        <span className='ack-message'>Resume PDF successfully processed &amp; staged!</span>
                                    </div>
                                </>
                            ) : (
                                <label className='dropzone' htmlFor='resume' onDragOver={handleDragOver} onDrop={handleDrop}>
                                    <span className='dropzone__icon'>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                                    </span>
                                    <p className='dropzone__title'>Click to upload or drag &amp; drop</p>
                                    <p className='dropzone__subtitle'>PDF only (Max 5MB)</p>
                                    <input 
                                        ref={resumeInputRef} 
                                        hidden 
                                        type='file' 
                                        id='resume' 
                                        name='resume' 
                                        accept='.pdf,application/pdf'
                                        onChange={handleFileChange}
                                    />
                                </label>
                            )}
                        </div>

                        {/* OR Divider */}
                        <div className='or-divider'><span>OR</span></div>

                        {/* Quick Self-Description */}
                        <div className='self-description'>
                            <label className='section-label' htmlFor='selfDescription'>Quick Self-Description</label>
                            <textarea
                                onChange={(e) => { setSelfDescription(e.target.value) }}
                                id='selfDescription'
                                name='selfDescription'
                                className='panel__textarea panel__textarea--short'
                                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                                value={selfDescription}
                            />
                        </div>

                        {/* Info Box */}
                        <div className='info-box'>
                            <span className='info-box__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" stroke="#1a1f27" strokeWidth="2" /><line x1="12" y1="16" x2="12.01" y2="16" stroke="#1a1f27" strokeWidth="2" /></svg>
                            </span>
                            <p>Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.</p>
                        </div>
                    </div>
                </div>

                {/* Card Footer */}
                <div className='interview-card__footer'>
                    <span className='footer-info'>AI-Powered Strategy Generation &bull; Approx 30s</span>
                    <button
                        onClick={handleGenerateReport}
                        className='generate-btn'
                        disabled={isGenerating}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
                        {isGenerating ? "Analyzing Requirements..." : "Generate My Interview Strategy"}
                    </button>
                </div>
            </div>

            {/* Thinking / Loading Stepper */}
            {isGenerating && (
                <div className='thinking-container' ref={resultsRef}>
                    <div className='thinking-card'>
                        <div className='thinking-header'>
                            <div className='thinking-spinner'>
                                <div className='spinner-ring'></div>
                                <span className='spinner-icon'>⚡</span>
                            </div>
                            <div className='thinking-title-area'>
                                <h2>AI Analyst Is Processing...</h2>
                                <p>We are cross-referencing your profile and the job description to craft a custom strategy.</p>
                            </div>
                        </div>
                        <div className='thinking-steps'>
                            {THINKING_STEPS.map((step, idx) => {
                                const isCompleted = idx < currentThinkingStep;
                                const isActive = idx === currentThinkingStep;
                                return (
                                    <div key={idx} className={`thinking-step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                                        <div className='step-status'>
                                            {isCompleted ? (
                                                <span className='status-dot status-dot--completed'>✓</span>
                                            ) : isActive ? (
                                                <span className='status-dot status-dot--active'>
                                                    <span className='pulse-ring'></span>
                                                </span>
                                            ) : (
                                                <span className='status-dot'></span>
                                            )}
                                        </div>
                                        <span className='step-icon'>{step.icon}</span>
                                        <p className='step-label'>{step.label}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Inline Dynamic Interview Results */}
            {activeReport && !isGenerating && (
                <div className='interview-results-section' ref={resultsRef}>
                    <div className='results-header-actions'>
                        <h2>Generated Interview Strategy</h2>
                        <button className='clear-results-btn' onClick={() => setActiveReport(null)}>
                            Clear Results
                        </button>
                    </div>

                    <div className='interview-page' style={{ minHeight: 'auto', padding: 0 }}>
                        <div className='interview-layout' style={{ maxWidth: '100%' }}>
                            <nav className='interview-nav'>
                                <div className='nav-content'>
                                    <p className='interview-nav__label'>Sections</p>
                                    {NAV_ITEMS.map((item) => (
                                        <button
                                            key={item.id}
                                            className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                            onClick={() => setActiveNav(item.id)}
                                        >
                                            <span className='interview-nav__icon'>{item.icon}</span>
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => { getResumePdf(activeReport._id) }}
                                    className='button primary-button'
                                >
                                    <svg height={'0.8rem'} style={{ marginRight: '0.8rem' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z" />
                                    </svg>
                                    Download Resume
                                </button>
                            </nav>

                            <div className='interview-divider' />

                            <main className='interview-content'>
                                <section className='report-summary'>
                                    <p className='report-summary__eyebrow'>Interview Plan</p>
                                    <h1>{activeReport.title || 'Untitled Position'}</h1>
                                    <p className='report-summary__description'>
                                        {hasGeneratedInsights
                                            ? 'Your tailored interview preparation breakdown is ready below.'
                                            : 'We saved the report, but the AI did not generate enough detailed interview content this time. You can regenerate with a more detailed resume or self-description.'}
                                    </p>
                                </section>

                                {activeNav === 'technical' && (
                                    <section>
                                        <div className='content-header'>
                                            <h2>Technical Questions</h2>
                                            <span className='content-header__count'>{technicalQuestions.length} questions</span>
                                        </div>
                                        <div className='q-list'>
                                            {technicalQuestions.length > 0 ? technicalQuestions.map((question, index) => (
                                                <QuestionCard key={index} item={question} index={index} />
                                            )) : (
                                                <EmptyState
                                                    title='No technical questions generated yet'
                                                    description='Try regenerating this report with a richer resume or a more specific self-description so the AI has more material to work with.'
                                                />
                                            )}
                                        </div>
                                    </section>
                                )}

                                {activeNav === 'behavioral' && (
                                    <section>
                                        <div className='content-header'>
                                            <h2>Behavioral Questions</h2>
                                            <span className='content-header__count'>{behavioralQuestions.length} questions</span>
                                        </div>
                                        <div className='q-list'>
                                            {behavioralQuestions.length > 0 ? behavioralQuestions.map((question, index) => (
                                                <QuestionCard key={index} item={question} index={index} />
                                            )) : (
                                                <EmptyState
                                                    title='No behavioral questions generated yet'
                                                    description='Behavioral prompts usually improve when your profile includes project impact, teamwork examples, and measurable outcomes.'
                                                />
                                            )}
                                        </div>
                                    </section>
                                )}

                                {activeNav === 'roadmap' && (
                                    <section>
                                        <div className='content-header'>
                                            <h2>Preparation Road Map</h2>
                                            <span className='content-header__count'>{preparationPlan.length}-day plan</span>
                                        </div>
                                        <div className='roadmap-list'>
                                            {preparationPlan.length > 0 ? preparationPlan.map((day) => (
                                                <RoadMapDay key={day.day} day={day} />
                                            )) : (
                                                <EmptyState
                                                    title='No preparation roadmap available'
                                                    description='A roadmap appears here when the report includes enough job and candidate details to create a day-by-day plan.'
                                                />
                                            )}
                                        </div>
                                    </section>
                                )}
                            </main>

                            <div className='interview-divider' />

                            <aside className='interview-sidebar'>
                                <div className='match-score'>
                                    <p className='match-score__label'>Match Score</p>
                                    <div className={`match-score__ring ${scoreColor}`}>
                                        <span className='match-score__value'>{matchScore}</span>
                                        <span className='match-score__pct'>%</span>
                                    </div>
                                    <p className={`match-score__sub ${!hasGeneratedInsights || matchScore === 0 ? 'match-score__sub--muted' : ''}`}>
                                        {getScoreSubtitle(matchScore, hasGeneratedInsights)}
                                    </p>
                                </div>

                                <div className='sidebar-divider' />

                                <div className='skill-gaps'>
                                    <p className='skill-gaps__label'>Skill Gaps</p>
                                    <div className='skill-gaps__list'>
                                        {skillGaps.length > 0 ? skillGaps.map((gap, index) => (
                                            <span key={index} className={`skill-tag skill-tag--${gap.severity}`}>
                                                {gap.skill}
                                            </span>
                                        )) : (
                                            <p className='skill-gaps__empty'>No skill gaps were generated for this report yet.</p>
                                        )}
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </div>
                </div>
            )}

            {/* Dashboard Footer/Bottom Section: Profile details and Recent Reports side-by-side */}
            <div className='dashboard-bottom-section'>
                
                {/* Dedicated Profile Card (Always visible so they see their details & logout immediately!) */}
                {user && (
                    <section className='profile-card-section'>
                        <h2>My Profile</h2>
                        <div className='profile-card-details'>
                            <div className='profile-header-meta'>
                                <div className='profile-avatar-large'>
                                    {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className='profile-titles'>
                                    <h3>{user.username}</h3>
                                    <p>{user.email}</p>
                                </div>
                            </div>
                            
                            <div className='profile-fields-list'>
                                <div className='profile-field-row'>
                                    <span className='field-label'>Account Role</span>
                                    <span className='field-value'>Candidate / Interviewee</span>
                                </div>
                                <div className='profile-field-row'>
                                    <span className='field-label'>Member Status</span>
                                    <span className='field-value'>Active</span>
                                </div>
                            </div>
                            
                            <button className='logout-btn logout-btn--large' onClick={handleLogout}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                Log Out of My Account
                            </button>
                        </div>
                    </section>
                )}

                {/* Recent Reports List */}
                {reports.length > 0 && (
                    <section className='recent-reports'>
                        <h2>My Recent Interview Plans</h2>
                        <ul className='reports-list'>
                            {reports.map(report => (
                                <li key={report._id} className='report-item' onClick={() => handleSelectRecentReport(report._id)}>
                                    <h3>{report.title || 'Untitled Position'}</h3>
                                    <p className='report-meta'>Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                                    <p className={`match-score ${report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>Match Score: {report.matchScore}%</p>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>

            {/* Page Footer */}
            <footer className='page-footer'>
                <a href='#'>Privacy Policy</a>
                <a href='#'>Terms of Service</a>
                <a href='#'>Help Center</a>
            </footer>
        </div>
    )
}

export default Home
