import axios from 'axios'
import { authService } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://facerecognition.mpanel.app'
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10)

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken()
    if (token) {
      // Note: Main app uses token without "Bearer" prefix
      config.headers.Authorization = token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Skip auth redirect for certain endpoints (test/recognize endpoints may return 401 for other reasons)
      const skipRedirectUrls = ['/recognize', '/api/test/recognize', '/upload-for-detection']
      const requestUrl = error.config?.url || ''
      const shouldSkipRedirect = skipRedirectUrls.some(url => requestUrl.includes(url))

      if (shouldSkipRedirect) {
        // For test/recognition endpoints, don't auto-redirect - let the component handle the error
        return Promise.reject(error)
      }

      // Check if we still have a token (might be expired)
      const hasToken = !!localStorage.getItem('photolytics_auth_token')

      if (hasToken) {
        // Token exists but is invalid - clear it
        authService.clearToken()

        // Show user-friendly message before redirect
        const message = authService.isTokenExpired()
          ? 'Your session has expired. Please log in again.'
          : 'Authentication failed. Please log in again.'

        // Store redirect message
        sessionStorage.setItem('auth_redirect_message', message)
      }

      // Delay redirect slightly to allow the error to be caught by the calling code
      setTimeout(() => {
        window.location.href = '/training/login'
      }, 100)
    }

    // For other errors, add helpful context
    if (error.response?.status === 404) {
      console.warn('API endpoint not found:', error.config?.url)
    } else if (error.response?.status >= 500) {
      console.error('Server error:', error.response.status, error.config?.url)
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error.config?.url)
    }

    return Promise.reject(error)
  }
)

export default api
