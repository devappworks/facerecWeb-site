import { describe, it, expect, beforeEach } from 'vitest'
import { authService } from './auth'

describe('API client', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should use token from localStorage for Authorization header', () => {
    localStorage.setItem('photolytics_auth_token', 'test-token')
    expect(authService.getToken()).toBe('test-token')
  })

  it('should return null when no token exists', () => {
    expect(authService.getToken()).toBeNull()
  })

  it('should clear token on logout', () => {
    localStorage.setItem('photolytics_auth_token', 'test-token')
    authService.clearToken()
    expect(localStorage.getItem('photolytics_auth_token')).toBeNull()
  })
})
