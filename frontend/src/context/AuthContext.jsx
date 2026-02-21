import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const savedToken = localStorage.getItem('sb_token')
        const savedUser = localStorage.getItem('sb_user')
        if (savedToken && savedUser) {
            setToken(savedToken)
            setUser(JSON.parse(savedUser))
        }
        setLoading(false)
    }, [])

    function login(tokenData) {
        localStorage.setItem('sb_token', tokenData.access_token)
        localStorage.setItem('sb_user', JSON.stringify(tokenData))
        setToken(tokenData.access_token)
        setUser(tokenData)
    }

    function logout() {
        localStorage.removeItem('sb_token')
        localStorage.removeItem('sb_user')
        setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, isAuth: !!token }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
