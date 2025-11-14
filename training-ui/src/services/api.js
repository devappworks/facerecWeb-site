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
      config.headers.Authorization = `Bearer ${token}`
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
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Unauthorized - clear token and redirect to login
      authService.clearToken()
      window.location.href = '/training/login'
    }
    return Promise.reject(error)
  }
)

export default api
