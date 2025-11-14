import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TestHistory from '../TestHistory'
import { abTestingService } from '../../../services/abTesting'

vi.mock('../../../services/abTesting', () => ({
  abTestingService: {
    getTestHistory: vi.fn(),
  },
}))

describe('TestHistory', () => {
  const mockHistoryData = {
    success: true,
    data: {
      tests: [
        {
          test_id: '1',
          image_id: 'test_001.jpg',
          timestamp: '2025-01-15T10:00:00Z',
          pipeline_a_result: {
            person: 'John Doe',
            confidence: 93.5,
            status: 'success',
          },
          pipeline_b_result: {
            person: 'John Doe',
            confidence: 97.2,
            status: 'success',
          },
          comparison_metrics: {
            both_succeeded: true,
            results_match: true,
          },
        },
      ],
      total: 1,
      page: 0,
      per_page: 20,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    abTestingService.getTestHistory.mockResolvedValue(mockHistoryData)
  })

  it('should render page title', async () => {
    render(<TestHistory />)

    await waitFor(() => {
      expect(screen.getByText(/History/i)).toBeInTheDocument()
    })
  })

  it('should fetch history on mount', async () => {
    render(<TestHistory />)

    await waitFor(() => {
      expect(abTestingService.getTestHistory).toHaveBeenCalled()
    })
  })

  it('should display loading state initially', () => {
    render(<TestHistory />)

    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
  })

  it('should display history data after loading', async () => {
    render(<TestHistory />)

    await waitFor(() => {
      expect(screen.getByText('test_001.jpg')).toBeInTheDocument()
    })
  })

  it('should have filter controls', async () => {
    render(<TestHistory />)

    await waitFor(() => {
      expect(screen.getByLabelText(/Search/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Status/i)).toBeInTheDocument()
    })
  })

  it('should have export buttons', async () => {
    render(<TestHistory />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Export JSON/i })).toBeInTheDocument()
    })
  })

  it('should display error message on fetch failure', async () => {
    abTestingService.getTestHistory.mockRejectedValue(new Error('Network error'))

    render(<TestHistory />)

    await waitFor(() => {
      expect(screen.getByText(/Failed/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
