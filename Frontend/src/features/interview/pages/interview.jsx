import { useState } from 'react'
import { useParams } from 'react-router'
import { useInterview } from '../hooks/useInterview.js'
import '../style/interview.scss'

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

const Interview = () => {
    const [ activeNav, setActiveNav ] = useState('technical')
    const { report, loading, getResumePdf } = useInterview()
    const { interviewId } = useParams()

    if (loading || !report) {
        return (
            <main className='loading-screen'>
                <h1>Loading your interview plan...</h1>
            </main>
        )
    }

    const technicalQuestions = Array.isArray(report.technicalQuestions) ? report.technicalQuestions : []
    const behavioralQuestions = Array.isArray(report.behavioralQuestions) ? report.behavioralQuestions : []
    const preparationPlan = Array.isArray(report.preparationPlan) ? report.preparationPlan : []
    const skillGaps = Array.isArray(report.skillGaps) ? report.skillGaps : []
    const matchScore = typeof report.matchScore === 'number' ? report.matchScore : 0
    const hasGeneratedInsights = technicalQuestions.length > 0 || behavioralQuestions.length > 0 || preparationPlan.length > 0 || skillGaps.length > 0
    const reportTitle = report.title || 'Interview Report'

    const scoreColor =
        matchScore >= 80 ? 'score--high'
            : matchScore >= 60 ? 'score--mid' : 'score--low'

    return (
        <div className='interview-page'>
            <div className='interview-layout'>
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
                        onClick={() => { getResumePdf(interviewId) }}
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
                        <h1>{reportTitle}</h1>
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
    )
}

export default Interview
