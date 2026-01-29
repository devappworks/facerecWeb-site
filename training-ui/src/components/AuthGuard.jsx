import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Admin users who can access the training UI
const ADMIN_EMAILS = ['nikola1jankovic@gmail.com']

function isAdminUser(email) {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

export default function AuthGuard({ children }) {
  const { isAuthenticated, loading, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate('/login', { replace: true })
      } else if (!isAdminUser(user?.email)) {
        // Redirect non-admin users to main photolytics app
        window.location.href = '/'
      }
    }
  }, [isAuthenticated, loading, navigate, user])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    )
  }

  // Only render children if user is authenticated AND is admin
  return isAuthenticated && isAdminUser(user?.email) ? children : null
}
