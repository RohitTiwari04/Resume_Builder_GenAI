import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const Login = () => {
    const { loading, handleLogin, validateEmail } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [emailTouched, setEmailTouched] = useState(false)

    const isEmailValid = validateEmail(email)
    const isFormInvalid = !email || !password || !isEmailValid

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!isEmailValid) {
            window.alert("Please enter a valid email address.")
            return
        }
        const success = await handleLogin({ email, password })
        if (success) {
            navigate('/')
        }
    }

    if (loading) {
        return (<main><h1>Loading.......</h1></main>)
    }

    return (
        <main>
            <div className="form-container">
                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
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
                        Login
                    </button>
                </form>
                <p>Don't have an account? <Link to={"/register"} >Register</Link> </p>
            </div>
        </main>
    )
}

export default Login