import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useVideoUpload } from '../useVideoUpload'
import { videoRecognitionService } from '../../services/videoRecognition'

// Mock the service
vi.mock('../../services/videoRecognition')

describe('useVideoUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    videoRecognitionService.validateFile.mockReturnValue({
      valid: true,
      errors: [],
    })

    videoRecognitionService.validateInterval.mockReturnValue({
      valid: true,
    })

    videoRecognitionService.uploadSync.mockResolvedValue({
      success: true,
      video_id: 'test-123',
      statistics: { total_frames: 10 },
      performance: { processing_time_seconds: 30 },
      results: [],
    })

    videoRecognitionService.uploadAsync.mockResolvedValue({
      success: true,
      video_id: 'test-123',
      status_endpoint: '/api/video/status/test-123',
    })
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useVideoUpload())

      expect(result.current.uploading).toBe(false)
      expect(result.current.uploadProgress).toBe(0)
      expect(result.current.error).toBe(null)
    })

    it('should provide upload functions', () => {
      const { result } = renderHook(() => useVideoUpload())

      expect(typeof result.current.uploadSync).toBe('function')
      expect(typeof result.current.uploadAsync).toBe('function')
      expect(typeof result.current.clearError).toBe('function')
    })
  })

  describe('uploadSync', () => {
    it('should upload video successfully', async () => {
      const { result } = renderHook(() => useVideoUpload())
      const mockFile = new File(['video'], 'test.mp4', { type: 'video/mp4' })

      let response
      await act(async () => {
        response = await result.current.uploadSync(mockFile, 'serbia', 3.0)
      })

      expect(response.success).toBe(true)
      expect(response.video_id).toBeDefined()
      expect(videoRecognitionService.uploadSync).toHaveBeenCalledWith(mockFile, 'serbia', 3.0)
    })

    it('should set uploading state during upload', async () => {
      const { result } = renderHook(() => useVideoUpload())
      const mockFile = new File(['video'], 'test.mp4', { type: 'video/mp4' })

      let uploadPromise
      act(() => {
        uploadPromise = result.current.uploadSync(mockFile)
      })

      expect(result.current.uploading).toBe(true)

      await act(async () => {
        await uploadPromise
      })

      expect(result.current.uploading).toBe(false)
    })

    it('should handle validation errors', async () => {
      videoRecognitionService.validateFile.mockReturnValue({
        valid: false,
        errors: ['File too large'],
      })

      const { result } = renderHook(() => useVideoUpload())
      const mockFile = new File(['video'], 'test.mp4', { type: 'video/mp4' })

      let response
      await act(async () => {
        response = await result.current.uploadSync(mockFile)
      })

      expect(response.success).toBe(false)
      expect(result.current.error).toContain('File too large')
    })

    it('should handle interval validation errors', async () => {
      videoRecognitionService.validateInterval.mockReturnValue({
        valid: false,
        error: 'Interval must be between 0.1 and 60',
      })

      const { result } = renderHook(() => useVideoUpload())
      const mockFile = new File(['video'], 'test.mp4', { type: 'video/mp4' })

      let response
      await act(async () => {
        response = await result.current.uploadSync(mockFile, 'serbia', 100)
      })

      expect(response.success).toBe(false)
      expect(result.current.error).toContain('between')
    })

    it('should handle upload failure', async () => {
      videoRecognitionService.uploadSync.mockResolvedValue({
        success: false,
        message: 'Upload failed',
      })

      const { result } = renderHook(() => useVideoUpload())
      const mockFile = new File(['video'], 'test.mp4', { type: 'video/mp4' })

      let response
      await act(async () => {
        response = await result.current.uploadSync(mockFile)
      })

      expect(response.success).toBe(false)
      expect(result.current.error).toBeDefined()
    })
  })

  describe('uploadAsync', () => {
    it('should upload video successfully', async () => {
      const { result } = renderHook(() => useVideoUpload())
      const mockFile = new File(['video'], 'test.mp4', { type: 'video/mp4' })

      let response
      await act(async () => {
        response = await result.current.uploadAsync(mockFile, 'serbia', 3.0)
      })

      expect(response.success).toBe(true)
      expect(response.video_id).toBeDefined()
      expect(response.status_endpoint).toBeDefined()
      expect(videoRecognitionService.uploadAsync).toHaveBeenCalledWith(mockFile, 'serbia', 3.0)
    })

    it('should set uploading state during upload', async () => {
      const { result } = renderHook(() => useVideoUpload())
      const mockFile = new File(['video'], 'test.mp4', { type: 'video/mp4' })

      let uploadPromise
      act(() => {
        uploadPromise = result.current.uploadAsync(mockFile)
      })

      expect(result.current.uploading).toBe(true)

      await act(async () => {
        await uploadPromise
      })

      expect(result.current.uploading).toBe(false)
    })

    it('should handle validation errors', async () => {
      videoRecognitionService.validateFile.mockReturnValue({
        valid: false,
        errors: ['Invalid format'],
      })

      const { result } = renderHook(() => useVideoUpload())
      const mockFile = new File(['video'], 'test.txt', { type: 'text/plain' })

      let response
      await act(async () => {
        response = await result.current.uploadAsync(mockFile)
      })

      expect(response.success).toBe(false)
      expect(result.current.error).toContain('Invalid format')
    })

    it('should reset upload progress after completion', async () => {
      const { result } = renderHook(() => useVideoUpload())
      const mockFile = new File(['video'], 'test.mp4', { type: 'video/mp4' })

      await act(async () => {
        await result.current.uploadAsync(mockFile)
      })

      expect(result.current.uploadProgress).toBe(100)

      // Wait for timeout to reset progress
      await waitFor(() => {
        expect(result.current.uploadProgress).toBe(0)
      }, { timeout: 2000 })
    })
  })

  describe('clearError', () => {
    it('should clear error message', async () => {
      videoRecognitionService.validateFile.mockReturnValue({
        valid: false,
        errors: ['Test error'],
      })

      const { result } = renderHook(() => useVideoUpload())
      const mockFile = new File(['video'], 'test.mp4', { type: 'video/mp4' })

      // Cause an error
      await act(async () => {
        await result.current.uploadSync(mockFile)
      })

      expect(result.current.error).toBeDefined()

      // Clear error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBe(null)
    })
  })
})
