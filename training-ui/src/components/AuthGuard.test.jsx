import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AuthGuard from './AuthGuard'
import { AuthProvider } from '../hooks/useAuth'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('AuthGuard', () => {
  beforeEach(() => {
    localStorage.clear()
    mockNavigate.mockClear()
  })

  it('should redirect to login when not authenticated', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
    })
  })

  it('should render children when authenticated', async () => {
    localStorage.setItem('photolytics_auth_token', 'test-token')
    localStorage.setItem('photolytics_user_email', 'test@example.com')

    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </AuthProvider>
      </BrowserRouter>
    )

    // Should render protected content
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })
})
