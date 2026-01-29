// Auth service - shares localStorage with main app
const TOKEN_KEY = 'photolytics_auth_token'
const EMAIL_KEY = 'photolytics_user_email'
const DOMAIN_KEY = 'photolytics_user_domain'
const TOKEN_TIMESTAMP_KEY = 'photolytics_token_timestamp'
const TOKEN_EXPIRY_HOURS = 24 // Tokens expire after 24 hours

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://facerecognition.mpanel.app'

export const authService = {
  // Get token (shared with main app)
  getToken() {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return null

    // Check if token is expired
    if (this.isTokenExpired()) {
      this.clearToken()
      return null
    }

    return token
  },

  // Save token (shared with main app)
  saveToken(token, email, domain = null) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(EMAIL_KEY, email)
    localStorage.setItem(TOKEN_TIMESTAMP_KEY, Date.now().toString())
    if (domain) {
      localStorage.setItem(DOMAIN_KEY, domain)
    }
  },

  // Clear token (shared with main app)
  clearToken() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(EMAIL_KEY)
    localStorage.removeItem(DOMAIN_KEY)
    localStorage.removeItem(TOKEN_TIMESTAMP_KEY)
  },

  // Check if token is expired
  isTokenExpired() {
    const timestamp = localStorage.getItem(TOKEN_TIMESTAMP_KEY)
    if (!timestamp) {
      // No timestamp means token was set by main app (which doesn't track timestamps).
      // Treat as valid - the backend will reject if truly expired.
      return false
    }

    const tokenAge = Date.now() - parseInt(timestamp, 10)
    const expiryTime = TOKEN_EXPIRY_HOURS * 60 * 60 * 1000 // Convert to milliseconds
    return tokenAge > expiryTime
  },

  // Get time until token expires (in minutes)
  getTokenTimeRemaining() {
    const timestamp = localStorage.getItem(TOKEN_TIMESTAMP_KEY)
    if (!timestamp) return 0

    const tokenAge = Date.now() - parseInt(timestamp, 10)
    const expiryTime = TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
    const remaining = expiryTime - tokenAge

    return Math.max(0, Math.floor(remaining / (60 * 1000))) // Return minutes
  },

  // Check if authenticated
  isAuthenticated() {
    return !!this.getToken() && !this.isTokenExpired()
  },

  // Get user email
  getEmail() {
    return localStorage.getItem(EMAIL_KEY)
  },

  // Get user domain
  getDomain() {
    return localStorage.getItem(DOMAIN_KEY) || 'serbia' // Default to serbia for backwards compatibility
  },

  // Login via email
  async login(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/token-by-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Check if multiple domains
        if (Array.isArray(data.data)) {
          // Multiple domains - return for user selection
          return {
            success: true,
            multiDomain: true,
            domains: data.data,
          }
        } else {
          // Single domain - save token and return
          this.saveToken(data.data.token, data.data.email)
          return {
            success: true,
            multiDomain: false,
            token: data.data.token,
            email: data.data.email,
          }
        }
      }

      throw new Error(data.error || 'Login failed')
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  // Select domain (for multi-domain accounts)
  selectDomain(domainData) {
    this.saveToken(domainData.token, domainData.email, domainData.domain)
    return {
      success: true,
      token: domainData.token,
      email: domainData.email,
      domain: domainData.domain,
    }
  },
}
