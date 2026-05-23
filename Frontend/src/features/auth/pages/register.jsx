import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'

const Register = () => {
    const navigate = useNavigate()
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [emailTouched, setEmailTouched] = useState(false)

    // OTP states for Gmail verification workflow
    const [otpMode, setOtpMode] = useState(false)
    const [otp, setOtp] = useState("")
    const [devOtp, setDevOtp] = useState("")
    const [countdown, setCountdown] = useState(60)
    const [timerActive, setTimerActive] = useState(false)

    const { loading, handleRegister, validateEmail } = useAuth()
    
    const isEmailValid = validateEmail(email)
    const isFormInvalid = !username || !email || !password || !isEmailValid

    // OTP countdown timer tick handling
    useEffect(() => {
        let timer = null
        if (timerActive && countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1)
            }, 1000)
        } else if (countdown === 0) {
            setTimerActive(false)
            clearInterval(timer)
        }
        return () => clearInterval(timer)
    }, [timerActive, countdown])

    const triggerOtpRequest = async () => {
        const res = await handleRegister({ username, email, password })
        if (res?.requiresOtp) {
            setOtpMode(true)
            setDevOtp(res.devOtp)
            setCountdown(60)
            setTimerActive(true)
        } else if (res?.success) {
            navigate("/")
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!isEmailValid) {
            window.alert("Please enter a valid email address.")
            return
        }

        const isGmail = email.toLowerCase().endsWith("@gmail.com")
        if (isGmail && !otpMode) {
            await triggerOtpRequest()
            return
        }

        // Complete registration by validating OTP code
        const res = await handleRegister({ 
            username, 
            email, 
            password, 
            otp: otpMode ? otp : undefined 
        })
        if (res?.success) {
            navigate("/")
        }
    }

    const handleResendOtp = async (e) => {
        e.preventDefault()
        if (timerActive) return
        await triggerOtpRequest()
    }

    if (loading && !otpMode) {
        return (<main><h1>Loading.......</h1></main>)
    }

    if (otpMode) {
        return (
            <main>
                <div className="form-container otp-card">
                    <div className="otp-header">
                        <div className="otp-icon-wrapper">
                            <span className="otp-icon">✉</span>
                        </div>
                        <h1>Verify Your Email</h1>
                        <p>We staged a 6-digit verification code for</p>
                        <strong className="highlight-email">{email}</strong>
                    </div>

                    {devOtp && (
                        <div className="dev-hud-bubble">
                            <div className="dev-hud-title">🛠️ DEV ASSISTANT HUD</div>
                            <div className="dev-hud-code">Generated OTP: <strong>{devOtp}</strong></div>
                            <div className="dev-hud-info">(Also printed in neon colors in the Node terminal logs)</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label htmlFor="otp">Enter 6-Digit Code</label>
                            <input
                                onChange={(e) => setOtp(e.target.value)}
                                value={otp}
                                type="text"
                                id="otp"
                                name="otp"
                                placeholder="e.g. 123456"
                                maxLength={6}
                                required
                                className="otp-input-field"
                            />
                        </div>

                        <button 
                            className={`button primary-button ${otp.trim().length !== 6 ? 'disabled' : ''}`} 
                            disabled={otp.trim().length !== 6 || loading}
                        >
                            {loading ? "Verifying..." : "Verify & Register"}
                        </button>
                    </form>

                    <div className="otp-footer">
                        {timerActive ? (
                            <p className="resend-countdown-text">Resend verification code in <strong>{countdown}s</strong></p>
                        ) : (
                            <button className="text-action-link" onClick={handleResendOtp}>
                                Resend Verification Code
                            </button>
                        )}
                        <button className="back-link-btn" onClick={() => { setOtpMode(false); setOtp(""); }}>
                            ← Change details (go back)
                        </button>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main>
            <div className="form-container">
                <h1>Register</h1>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            onChange={(e) => { setUsername(e.target.value) }}
                            type="text" id="username" name='username' placeholder='Enter username' required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            onChange={(e) => { 
                                setEmail(e.target.value)
                                if (!emailTouched) setEmailTouched(true)
                            }}
                            onBlur={() => setEmailTouched(true)}
                            type="email" 
                            id="email" 
                            name='email' 
                            placeholder='Enter email address' 
                            required
                            className={emailTouched ? (isEmailValid ? 'valid' : 'invalid') : ''}
                        />
                        {emailTouched && email && !isEmailValid && (
                            <span className="validation-message error-message">Please enter a valid email address (e.g., name@domain.com)</span>
                        )}
                        {emailTouched && email && isEmailValid && (
                            <span className="validation-message success-message">Valid email address format</span>
                        )}
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            onChange={(e) => { setPassword(e.target.value) }}
                            type="password" id="password" name='password' placeholder='Enter password' required />
                    </div>

                    <button 
                        className={`button primary-button ${isFormInvalid ? 'disabled' : ''}`} 
                        disabled={isFormInvalid}
                    >
                        Register
                    </button>
                </form>

                <p>Already have an account? <Link to={"/login"} >Login</Link> </p>
            </div>
        </main>
    )
}

export default Register