import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing token on mount
    const token = authService.getToken()
    const email = authService.getEmail()
    const domain = authService.getDomain()

    if (token && email) {
      setUser({ email, token, domain })
    }

    setLoading(false)

    // Listen for storage changes (logout from other tab/window)
    const handleStorageChange = (e) => {
      if (e.key === 'photolytics_auth_token' && !e.newValue) {
        // Token was removed - user logged out
        setUser(null)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const login = async (email) => {
    const result = await authService.login(email)

    if (!result.multiDomain) {
      const userData = {
        email: authService.getEmail(),
        token: authService.getToken(),
        domain: authService.getDomain(),
      }
      setUser(userData)
      return { success: true, user: userData }
    }

    // Return domains for selection
    return result
  }

  const selectDomain = (domainData) => {
    authService.selectDomain(domainData)
    setUser({ email: domainData.email, token: domainData.token, domain: domainData.domain })
  }

  const logout = () => {
    authService.clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        selectDomain,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
