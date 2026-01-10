import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import LiveComparison from '../LiveComparison'
import { useComparison } from '../../../hooks/useComparison'

vi.mock('../../../hooks/useComparison', () => ({
  useComparison: vi.fn(),
}))

describe('LiveComparison', () => {
  const mockRunComparison = vi.fn()
  const mockClearResult = vi.fn()

  const defaultHookReturn = {
    runComparison: mockRunComparison,
    clearResult: mockClearResult,
    testing: false,
    result: null,
    error: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useComparison.mockReturnValue(defaultHookReturn)
    global.alert = vi.fn()
  })

  it('should render page title', () => {
    render(<LiveComparison />)
    expect(screen.getByText(/Live Comparison/i)).toBeInTheDocument()
  })

  it('should render upload section', () => {
    render(<LiveComparison />)
    expect(screen.getByText(/Upload an image/i)).toBeInTheDocument()
  })

  it('should have run comparison button', () => {
    render(<LiveComparison />)
    expect(screen.getByRole('button', { name: /Run Comparison/i })).toBeInTheDocument()
  })

  it('should show loading state when testing', () => {
    useComparison.mockReturnValue({
      ...defaultHookReturn,
      testing: true,
    })

    render(<LiveComparison />)
    expect(screen.getByText(/Running/i)).toBeInTheDocument()
  })

  it('should display error when present', () => {
    useComparison.mockReturnValue({
      ...defaultHookReturn,
      error: 'Test error message',
    })

    render(<LiveComparison />)
    expect(screen.getByText(/Test error message/i)).toBeInTheDocument()
  })

  it('should display results when available', () => {
    const mockResult = {
      image_id: 'test.jpg',
      pipeline_a_result: {
        status: 'success',
        person: 'John Doe',
        confidence: 93.5,
      },
      pipeline_b_result: {
        status: 'success',
        person: 'John Doe',
        confidence: 97.2,
      },
      comparison: {
        comparison_metrics: {
          both_succeeded: true,
          results_match: true,
        },
      },
    }

    useComparison.mockReturnValue({
      ...defaultHookReturn,
      result: mockResult,
    })

    render(<LiveComparison />)

    expect(screen.getByText(/Comparison Results/i)).toBeInTheDocument()
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument()
  })
})
