import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authService } from './auth'

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('getToken', () => {
    it('should return null when no token is stored', () => {
      expect(authService.getToken()).toBeNull()
    })

    it('should return stored token', () => {
      localStorage.setItem('photolytics_auth_token', 'test-token')
      expect(authService.getToken()).toBe('test-token')
    })
  })

  describe('saveToken', () => {
    it('should save token and email to localStorage', () => {
      authService.saveToken('test-token', 'test@example.com')
      expect(localStorage.getItem('photolytics_auth_token')).toBe('test-token')
      expect(localStorage.getItem('photolytics_user_email')).toBe('test@example.com')
    })
  })

  describe('clearToken', () => {
    it('should remove token and email from localStorage', () => {
      localStorage.setItem('photolytics_auth_token', 'test-token')
      localStorage.setItem('photolytics_user_email', 'test@example.com')

      authService.clearToken()

      expect(localStorage.getItem('photolytics_auth_token')).toBeNull()
      expect(localStorage.getItem('photolytics_user_email')).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('should return false when no token is stored', () => {
      expect(authService.isAuthenticated()).toBe(false)
    })

    it('should return true when token is stored', () => {
      localStorage.setItem('photolytics_auth_token', 'test-token')
      expect(authService.isAuthenticated()).toBe(true)
    })
  })

  describe('getEmail', () => {
    it('should return null when no email is stored', () => {
      expect(authService.getEmail()).toBeNull()
    })

    it('should return stored email', () => {
      localStorage.setItem('photolytics_user_email', 'test@example.com')
      expect(authService.getEmail()).toBe('test@example.com')
    })
  })

  describe('login', () => {
    it('should login with single domain account', async () => {
      const mockResponse = {
        success: true,
        data: {
          token: 'test-token',
          email: 'test@example.com',
        },
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await authService.login('test@example.com')

      expect(result).toEqual({
        success: true,
        multiDomain: false,
        token: 'test-token',
        email: 'test@example.com',
      })
      expect(localStorage.getItem('photolytics_auth_token')).toBe('test-token')
      expect(localStorage.getItem('photolytics_user_email')).toBe('test@example.com')
    })

    it('should return domains for multi-domain account', async () => {
      const mockResponse = {
        success: true,
        data: [
          { token: 'token1', email: 'test@example.com', domain: 'domain1' },
          { token: 'token2', email: 'test@example.com', domain: 'domain2' },
        ],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await authService.login('test@example.com')

      expect(result).toEqual({
        success: true,
        multiDomain: true,
        domains: mockResponse.data,
      })
      expect(localStorage.getItem('photolytics_auth_token')).toBeNull()
    })

    it('should throw error when login fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      })

      await expect(authService.login('test@example.com')).rejects.toThrow()
    })

    it('should throw error when API returns error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Invalid email',
        }),
      })

      await expect(authService.login('invalid@example.com')).rejects.toThrow('Invalid email')
    })
  })

  describe('selectDomain', () => {
    it('should save selected domain token and email', () => {
      const domainData = {
        token: 'domain-token',
        email: 'test@example.com',
        domain: 'domain1',
      }

      const result = authService.selectDomain(domainData)

      expect(result).toEqual({
        success: true,
        token: 'domain-token',
        email: 'test@example.com',
      })
      expect(localStorage.getItem('photolytics_auth_token')).toBe('domain-token')
      expect(localStorage.getItem('photolytics_user_email')).toBe('test@example.com')
    })
  })
})
