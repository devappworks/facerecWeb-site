import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../hooks/useAuth'
import Login from '../pages/Login'

describe('Authentication Flow', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should complete login flow for single domain account', async () => {
    const user = userEvent.setup()

    // Mock successful login response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          token: 'test-token-123',
          email: 'test@example.com',
        },
      }),
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    // Find and fill email input
    const emailInput = screen.getByPlaceholderText('Enter your email')
    await user.type(emailInput, 'test@example.com')

    // Click login button
    const loginButton = screen.getByRole('button', { name: /get access token/i })
    await user.click(loginButton)

    // Wait for login to complete
    await waitFor(() => {
      expect(localStorage.getItem('photolytics_auth_token')).toBe('test-token-123')
      expect(localStorage.getItem('photolytics_user_email')).toBe('test@example.com')
    })
  })

  it('should show domain selection for multi-domain account', async () => {
    const user = userEvent.setup()

    // Mock multi-domain response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          { token: 'token1', email: 'test@example.com', domain: 'Domain 1' },
          { token: 'token2', email: 'test@example.com', domain: 'Domain 2' },
        ],
      }),
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    // Fill email and login
    const emailInput = screen.getByPlaceholderText('Enter your email')
    await user.type(emailInput, 'test@example.com')

    const loginButton = screen.getByRole('button', { name: /get access token/i })
    await user.click(loginButton)

    // Wait for domain selection to appear
    await waitFor(() => {
      expect(screen.getByText('Select Domain')).toBeInTheDocument()
    })

    // Should show both domains
    expect(screen.getByText('Domain 1')).toBeInTheDocument()
    expect(screen.getByText('Domain 2')).toBeInTheDocument()
  })

  it('should show error message on failed login', async () => {
    const user = userEvent.setup()

    // Mock failed login
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    const emailInput = screen.getByPlaceholderText('Enter your email')
    await user.type(emailInput, 'test@example.com')

    const loginButton = screen.getByRole('button', { name: /get access token/i })
    await user.click(loginButton)

    // Should show error
    await waitFor(() => {
      expect(screen.getByText(/HTTP error! status: 401/i)).toBeInTheDocument()
    })
  })
})
