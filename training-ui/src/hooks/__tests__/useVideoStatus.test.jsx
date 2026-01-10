import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useVideoStatus } from '../useVideoStatus'
import { videoRecognitionService } from '../../services/videoRecognition'

// Mock the service
vi.mock('../../services/videoRecognition')

describe('useVideoStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useVideoStatus('test-123', 3000, false))

      expect(result.current.status).toBe(null)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.isPolling).toBe(false)
    })

    it('should provide control functions', () => {
      const { result } = renderHook(() => useVideoStatus('test-123', 3000, false))

      expect(typeof result.current.startPolling).toBe('function')
      expect(typeof result.current.stopPolling).toBe('function')
      expect(typeof result.current.refetch).toBe('function')
    })
  })

  describe('fetchStatus', () => {
    it('should fetch status successfully', async () => {
      videoRecognitionService.getStatus.mockResolvedValue({
        success: true,
        status: 'completed',
        video_id: 'test-123',
        statistics: { total_frames: 10 },
      })

      const { result } = renderHook(() => useVideoStatus('test-123', 3000, false))

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.status).toBeDefined()
      expect(result.current.status.isComplete).toBe(true)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle processing status', async () => {
      videoRecognitionService.getStatus.mockResolvedValue({
        success: false,
        status: 'processing',
        video_id: 'test-123',
      })

      const { result } = renderHook(() => useVideoStatus('test-123', 3000, false))

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.status.isProcessing).toBe(true)
      expect(result.current.status.isComplete).toBe(false)
    })

    it('should handle errors', async () => {
      videoRecognitionService.getStatus.mockResolvedValue({
        success: false,
        status: 'not_found',
        message: 'Video not found',
      })

      const { result } = renderHook(() => useVideoStatus('test-123', 3000, false))

      await act(async () => {
        try {
          await result.current.refetch()
        } catch (err) {
          // Expected to throw
        }
      })

      expect(result.current.error).toBeDefined()
    })
  })

  describe('Polling', () => {
    it('should start polling when requested', async () => {
      videoRecognitionService.getStatus.mockResolvedValue({
        success: false,
        status: 'processing',
        video_id: 'test-123',
      })

      const { result } = renderHook(() => useVideoStatus('test-123', 1000, false))

      act(() => {
        result.current.startPolling()
      })

      await waitFor(() => {
        expect(result.current.isPolling).toBe(true)
      })
    })

    it('should stop polling when requested', async () => {
      videoRecognitionService.getStatus.mockResolvedValue({
        success: false,
        status: 'processing',
        video_id: 'test-123',
      })

      const { result } = renderHook(() => useVideoStatus('test-123', 1000, false))

      act(() => {
        result.current.startPolling()
      })

      await waitFor(() => {
        expect(result.current.isPolling).toBe(true)
      })

      act(() => {
        result.current.stopPolling()
      })

      expect(result.current.isPolling).toBe(false)
    })

    it('should stop polling when video is completed', async () => {
      let callCount = 0
      videoRecognitionService.getStatus.mockImplementation(async () => {
        callCount++
        if (callCount >= 2) {
          return {
            success: true,
            status: 'completed',
            video_id: 'test-123',
            statistics: {},
          }
        }
        return {
          success: false,
          status: 'processing',
          video_id: 'test-123',
        }
      })

      const { result } = renderHook(() => useVideoStatus('test-123', 100, false))

      act(() => {
        result.current.startPolling()
      })

      await waitFor(() => {
        expect(callCount).toBeGreaterThanOrEqual(2)
      }, { timeout: 3000 })

      await waitFor(() => {
        expect(result.current.isPolling).toBe(false)
        expect(result.current.status.isComplete).toBe(true)
      })
    })

    it('should auto-start polling when enabled', async () => {
      videoRecognitionService.getStatus.mockResolvedValue({
        success: false,
        status: 'processing',
        video_id: 'test-123',
      })

      const { result } = renderHook(() => useVideoStatus('test-123', 1000, true))

      await waitFor(() => {
        expect(result.current.isPolling).toBe(true)
      })
    })

    it('should not start polling without video ID', async () => {
      const { result } = renderHook(() => useVideoStatus(null, 1000, true))

      expect(result.current.isPolling).toBe(false)
    })
  })

  describe('Cleanup', () => {
    it('should cleanup polling on unmount', async () => {
      videoRecognitionService.getStatus.mockResolvedValue({
        success: false,
        status: 'processing',
        video_id: 'test-123',
      })

      const { result, unmount } = renderHook(() => useVideoStatus('test-123', 1000, false))

      act(() => {
        result.current.startPolling()
      })

      await waitFor(() => {
        expect(result.current.isPolling).toBe(true)
      })

      unmount()

      // After unmount, polling should be stopped
      expect(result.current.isPolling).toBe(false)
    })
  })
})
