import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { act } from 'react'
import { useMetrics } from '../useMetrics'
import { abTestingService } from '../../services/abTesting'
import { usePolling } from '../usePolling'

vi.mock('../../services/abTesting', () => ({
  abTestingService: {
    getDailyMetrics: vi.fn(),
    getWeeklyMetrics: vi.fn(),
  },
}))

vi.mock('../usePolling', () => ({
  usePolling: vi.fn(),
}))

describe('useMetrics', () => {
  const mockPollingReturn = {
    data: null,
    loading: false,
    refetch: vi.fn(),
    isPolling: true,
    startPolling: vi.fn(),
    stopPolling: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    usePolling.mockReturnValue(mockPollingReturn)
  })

  describe('initialization', () => {
    it('should call usePolling with correct parameters', () => {
      renderHook(() => useMetrics('daily', '2025-01-15', 30000))

      expect(usePolling).toHaveBeenCalledWith(
        expect.any(Function),
        30000,
        true
      )
    })

    it('should return correct structure', () => {
      const { result } = renderHook(() => useMetrics())

      expect(result.current).toHaveProperty('metrics')
      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('error')
      expect(result.current).toHaveProperty('refetch')
      expect(result.current).toHaveProperty('isPolling')
      expect(result.current).toHaveProperty('startPolling')
      expect(result.current).toHaveProperty('stopPolling')
    })

    it('should initialize error as null', () => {
      const { result } = renderHook(() => useMetrics())

      expect(result.current.error).toBeNull()
    })
  })

  describe('fetchMetrics callback', () => {
    it('should fetch daily metrics when period is daily', async () => {
      const mockMetrics = {
        success: true,
        summary: { total_comparisons: 100 },
      }
      abTestingService.getDailyMetrics.mockResolvedValueOnce(mockMetrics)

      let fetchCallback
      usePolling.mockImplementation((callback) => {
        fetchCallback = callback
        return mockPollingReturn
      })

      renderHook(() => useMetrics('daily', '2025-01-15'))

      const result = await fetchCallback()

      expect(abTestingService.getDailyMetrics).toHaveBeenCalledWith('2025-01-15')
      expect(result).toEqual(mockMetrics.summary)
    })

    it('should fetch daily metrics with null date when not provided', async () => {
      const mockMetrics = {
        success: true,
        summary: { total_comparisons: 50 },
      }
      abTestingService.getDailyMetrics.mockResolvedValueOnce(mockMetrics)

      let fetchCallback
      usePolling.mockImplementation((callback) => {
        fetchCallback = callback
        return mockPollingReturn
      })

      renderHook(() => useMetrics('daily', null))

      await fetchCallback()

      expect(abTestingService.getDailyMetrics).toHaveBeenCalledWith(null)
    })

    it('should fetch weekly metrics when period is weekly', async () => {
      const mockMetrics = {
        success: true,
        summary: { total_comparisons: 500 },
      }
      abTestingService.getWeeklyMetrics.mockResolvedValueOnce(mockMetrics)

      let fetchCallback
      usePolling.mockImplementation((callback) => {
        fetchCallback = callback
        return mockPollingReturn
      })

      renderHook(() => useMetrics('weekly'))

      const result = await fetchCallback()

      expect(abTestingService.getWeeklyMetrics).toHaveBeenCalled()
      expect(result).toEqual(mockMetrics.summary)
    })

    it('should throw error when response is not successful', async () => {
      const mockResponse = {
        success: false,
        message: 'Data unavailable',
      }
      abTestingService.getDailyMetrics.mockResolvedValueOnce(mockResponse)

      let fetchCallback
      usePolling.mockImplementation((callback) => {
        fetchCallback = callback
        return mockPollingReturn
      })

      const { result } = renderHook(() => useMetrics('daily'))

      await expect(fetchCallback()).rejects.toThrow('Data unavailable')
    })

    it('should handle service error and set error state', async () => {
      abTestingService.getDailyMetrics.mockRejectedValueOnce(
        new Error('Network error')
      )

      let fetchCallback
      usePolling.mockImplementation((callback) => {
        fetchCallback = callback
        return mockPollingReturn
      })

      const { result } = renderHook(() => useMetrics('daily'))

      await expect(fetchCallback()).rejects.toThrow()

      // The error should be set
      await waitFor(() => {
        expect(result.current.error).toBe('Network error')
      })
    })

    it('should clear error on successful fetch', async () => {
      const mockMetrics = {
        success: true,
        summary: { total_comparisons: 100 },
      }

      let fetchCallback
      usePolling.mockImplementation((callback) => {
        fetchCallback = callback
        return mockPollingReturn
      })

      const { result, rerender } = renderHook(() => useMetrics('daily'))

      // First, trigger an error
      abTestingService.getDailyMetrics.mockRejectedValueOnce(
        new Error('Network error')
      )
      try {
        await fetchCallback()
      } catch (e) {}

      await waitFor(() => {
        expect(result.current.error).toBe('Network error')
      })

      // Then, successful fetch should clear error
      abTestingService.getDailyMetrics.mockResolvedValueOnce(mockMetrics)
      await fetchCallback()

      await waitFor(() => {
        expect(result.current.error).toBeNull()
      })
    })
  })

  describe('period and date changes', () => {
    it('should update fetch callback when period changes', () => {
      const { rerender } = renderHook(
        ({ period }) => useMetrics(period),
        { initialProps: { period: 'daily' } }
      )

      const firstCall = usePolling.mock.calls[0][0]

      rerender({ period: 'weekly' })

      const secondCall = usePolling.mock.calls[1][0]

      // The callback should be different (useCallback dependency changed)
      expect(firstCall).not.toBe(secondCall)
    })

    it('should update fetch callback when date changes', () => {
      const { rerender } = renderHook(
        ({ date }) => useMetrics('daily', date),
        { initialProps: { date: '2025-01-15' } }
      )

      const firstCall = usePolling.mock.calls[0][0]

      rerender({ date: '2025-01-16' })

      const secondCall = usePolling.mock.calls[1][0]

      expect(firstCall).not.toBe(secondCall)
    })
  })

  describe('polling controls', () => {
    it('should expose polling controls from usePolling', () => {
      const mockPolling = {
        data: { total_comparisons: 100 },
        loading: false,
        refetch: vi.fn(),
        isPolling: true,
        startPolling: vi.fn(),
        stopPolling: vi.fn(),
      }

      usePolling.mockReturnValue(mockPolling)

      const { result } = renderHook(() => useMetrics())

      expect(result.current.metrics).toEqual(mockPolling.data)
      expect(result.current.loading).toBe(mockPolling.loading)
      expect(result.current.isPolling).toBe(mockPolling.isPolling)
      expect(result.current.refetch).toBe(mockPolling.refetch)
      expect(result.current.startPolling).toBe(mockPolling.startPolling)
      expect(result.current.stopPolling).toBe(mockPolling.stopPolling)
    })

    it('should pass polling interval to usePolling', () => {
      renderHook(() => useMetrics('daily', null, 60000))

      expect(usePolling).toHaveBeenCalledWith(
        expect.any(Function),
        60000,
        true
      )
    })
  })
})
