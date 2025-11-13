import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { act } from 'react'
import { useComparison } from '../useComparison'
import { abTestingService } from '../../services/abTesting'

vi.mock('../../services/abTesting', () => ({
  abTestingService: {
    runComparison: vi.fn(),
  },
}))

describe('useComparison', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useComparison())

    expect(result.current.testing).toBe(false)
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
    expect(typeof result.current.runComparison).toBe('function')
    expect(typeof result.current.clearResult).toBe('function')
  })

  describe('runComparison', () => {
    it('should set testing to true while running', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockResult = {
        image_id: 'test.jpg',
        pipeline_a_result: { status: 'success' },
        pipeline_b_result: { status: 'success' },
      }

      abTestingService.runComparison.mockResolvedValueOnce(mockResult)

      const { result } = renderHook(() => useComparison())

      act(() => {
        result.current.runComparison(mockFile)
      })

      // Testing should be true immediately
      expect(result.current.testing).toBe(true)

      await waitFor(() => {
        expect(result.current.testing).toBe(false)
      })
    })

    it('should call service with file and options', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const options = { imageId: 'custom', groundTruth: 'John Doe' }
      const mockResult = { image_id: 'custom' }

      abTestingService.runComparison.mockResolvedValueOnce(mockResult)

      const { result } = renderHook(() => useComparison())

      await act(async () => {
        await result.current.runComparison(mockFile, options)
      })

      expect(abTestingService.runComparison).toHaveBeenCalledWith(mockFile, options)
    })

    it('should set result on successful comparison', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockResult = {
        image_id: 'test.jpg',
        pipeline_a_result: { status: 'success', person: 'John Doe' },
        pipeline_b_result: { status: 'success', person: 'John Doe' },
      }

      abTestingService.runComparison.mockResolvedValueOnce(mockResult)

      const { result } = renderHook(() => useComparison())

      await act(async () => {
        await result.current.runComparison(mockFile)
      })

      expect(result.current.result).toEqual(mockResult)
      expect(result.current.error).toBeNull()
      expect(result.current.testing).toBe(false)
    })

    it('should set error when no file provided', async () => {
      const { result } = renderHook(() => useComparison())

      await act(async () => {
        const returnValue = await result.current.runComparison(null)
        expect(returnValue).toBeNull()
      })

      expect(result.current.error).toBe('No file provided')
      expect(result.current.result).toBeNull()
      expect(result.current.testing).toBe(false)
    })

    it('should handle service error', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockError = new Error('Network error')

      abTestingService.runComparison.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useComparison())

      await act(async () => {
        try {
          await result.current.runComparison(mockFile)
        } catch (err) {
          // Expected to throw
        }
      })

      expect(result.current.error).toBe('Network error')
      expect(result.current.result).toBeNull()
      expect(result.current.testing).toBe(false)
    })

    it('should handle API error response', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockError = {
        response: {
          data: {
            error: 'Invalid image format',
          },
        },
      }

      abTestingService.runComparison.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useComparison())

      await act(async () => {
        try {
          await result.current.runComparison(mockFile)
        } catch (err) {
          // Expected to throw
        }
      })

      expect(result.current.error).toBe('Invalid image format')
    })

    it('should clear previous results before new comparison', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockResult1 = { image_id: 'first' }
      const mockResult2 = { image_id: 'second' }

      abTestingService.runComparison
        .mockResolvedValueOnce(mockResult1)
        .mockResolvedValueOnce(mockResult2)

      const { result } = renderHook(() => useComparison())

      // First comparison
      await act(async () => {
        await result.current.runComparison(mockFile)
      })
      expect(result.current.result).toEqual(mockResult1)

      // Second comparison
      await act(async () => {
        await result.current.runComparison(mockFile)
      })
      expect(result.current.result).toEqual(mockResult2)
    })

    it('should return data from successful comparison', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockResult = { image_id: 'test.jpg' }

      abTestingService.runComparison.mockResolvedValueOnce(mockResult)

      const { result } = renderHook(() => useComparison())

      let returnedData
      await act(async () => {
        returnedData = await result.current.runComparison(mockFile)
      })

      expect(returnedData).toEqual(mockResult)
    })
  })

  describe('clearResult', () => {
    it('should clear result and error', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockResult = { image_id: 'test.jpg' }

      abTestingService.runComparison.mockResolvedValueOnce(mockResult)

      const { result } = renderHook(() => useComparison())

      // Run comparison first
      await act(async () => {
        await result.current.runComparison(mockFile)
      })

      expect(result.current.result).not.toBeNull()

      // Clear result
      act(() => {
        result.current.clearResult()
      })

      expect(result.current.result).toBeNull()
      expect(result.current.error).toBeNull()
    })

    it('should clear error from failed comparison', async () => {
      const { result } = renderHook(() => useComparison())

      // Trigger error
      await act(async () => {
        await result.current.runComparison(null)
      })

      expect(result.current.error).toBe('No file provided')

      // Clear error
      act(() => {
        result.current.clearResult()
      })

      expect(result.current.error).toBeNull()
    })
  })
})
