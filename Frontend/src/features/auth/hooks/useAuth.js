import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../services/auth.api";



export const useAuth = () => {

    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context


    const validateEmail = (email) => {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(String(email).toLowerCase());
    }

    const handleLogin = async ({ email, password }) => {
        if (!validateEmail(email)) {
            window.alert("Please enter a valid email address (e.g., candidate@domain.com).")
            return false
        }
        setLoading(true)
        try {
            const data = await login({ email, password })
            if (data?.user) {
                setUser(data.user)
                return true
            } else {
                window.alert("Login failed. Please check your credentials.")
                return false
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Login failed. Please try again."
            window.alert(msg)
            return false
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password, otp }) => {
        if (!validateEmail(email)) {
            window.alert("Please enter a valid email address (e.g., candidate@domain.com).")
            return { success: false }
        }
        setLoading(true)
        try {
            const data = await register({ username, email, password, otp })
            if (data?.requiresOtp) {
                return { requiresOtp: true, devOtp: data.devOtp }
            }
            if (data?.user) {
                setUser(data.user)
                return { success: true }
            } else {
                window.alert("Registration failed. Please check your details (username/email may already be in use).")
                return { success: false }
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Registration failed. Please try again."
            window.alert(msg)
            return { success: false }
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            const data = await logout()
            setUser(null)
            return true
        } catch (err) {
            return false
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {

        const getAndSetUser = async () => {
            try {

                const data = await getMe()
                setUser(data.user)
            } catch (err) { } finally {
                setLoading(false)
            }
        }

        getAndSetUser()

    }, [])

    return { user, loading, handleRegister, handleLogin, handleLogout, validateEmail }
}