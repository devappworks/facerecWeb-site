// Auth service - shares localStorage with main app
const TOKEN_KEY = 'photolytics_auth_token'
const EMAIL_KEY = 'photolytics_user_email'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://facerecognition.mpanel.app'

export const authService = {
  // Get token (shared with main app)
  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },

  // Save token (shared with main app)
  saveToken(token, email) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(EMAIL_KEY, email)
  },

  // Clear token (shared with main app)
  clearToken() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(EMAIL_KEY)
  },

  // Check if authenticated
  isAuthenticated() {
    return !!this.getToken()
  },

  // Get user email
  getEmail() {
    return localStorage.getItem(EMAIL_KEY)
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
    this.saveToken(domainData.token, domainData.email)
    return {
      success: true,
      token: domainData.token,
      email: domainData.email,
    }
  },
}
