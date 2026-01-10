import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import '../styles/login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sessionMessage, setSessionMessage] = useState(null)
  const [domains, setDomains] = useState(null)
  const { login, selectDomain } = useAuth()
  const navigate = useNavigate()

  // Check for session expiry message
  useEffect(() => {
    const message = sessionStorage.getItem('auth_redirect_message')
    if (message) {
      setSessionMessage(message)
      sessionStorage.removeItem('auth_redirect_message')

      // Clear the message after 10 seconds
      setTimeout(() => setSessionMessage(null), 10000)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await login(email)

      if (result.multiDomain) {
        // Show domain selection
        setDomains(result.domains)
      } else {
        // Single domain - redirect to dashboard
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDomainSelect = (domainData) => {
    selectDomain(domainData)
    navigate('/dashboard', { replace: true })
  }

  if (domains) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Select Domain</h1>
          <p className="subtitle">Choose which organization to access</p>
          <div className="domain-list">
            {domains.map((domainData, index) => (
              <button
                key={index}
                className="domain-button"
                onClick={() => handleDomainSelect(domainData)}
              >
                <span className="domain-name">{domainData.domain}</span>
                <span className="domain-icon">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Training UI</h1>
          <p className="subtitle">Face Recognition Training Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {sessionMessage && (
            <div className="alert" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fbbf24', marginBottom: '1rem' }}>
              ⚠️ {sessionMessage}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Loading...' : 'Get Access Token'}
          </button>
        </form>

        <div className="login-footer">
          <a href="/" className="link">
            ← Back to Main App
          </a>
        </div>
      </div>
    </div>
  )
}
