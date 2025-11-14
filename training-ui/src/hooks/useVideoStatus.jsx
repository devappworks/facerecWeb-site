import { useState, useEffect, useCallback, useRef } from 'react'
import { videoRecognitionService } from '../services/videoRecognition'

/**
 * Custom hook for polling video processing status
 * @param {string} videoId - Video ID to poll
 * @param {number} pollingInterval - Interval in milliseconds (default: 3000)
 * @param {boolean} enabled - Whether to start polling automatically
 */
export function useVideoStatus(videoId, pollingInterval = 3000, enabled = false) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isPolling, setIsPolling] = useState(false)
  const pollingTimeoutRef = useRef(null)

  const fetchStatus = useCallback(async () => {
    if (!videoId) return

    setLoading(true)
    setError(null)

    try {
      const response = await videoRecognitionService.getStatus(videoId)

      if (response.status === 'processing') {
        // Still processing
        setStatus({ ...response, isProcessing: true, isComplete: false })
        return response
      } else if (response.success && response.status === 'completed') {
        // Completed successfully
        setStatus({ ...response, isProcessing: false, isComplete: true })
        stopPolling()
        return response
      } else {
        // Error or not found
        throw new Error(response.message || 'Failed to get video status')
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to get video status'
      setError(errorMessage)
      stopPolling()
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [videoId])

  const startPolling = useCallback(() => {
    if (!videoId) return

    setIsPolling(true)

    const poll = async () => {
      try {
        const response = await fetchStatus()

        // Continue polling if still processing
        if (response?.status === 'processing') {
          pollingTimeoutRef.current = setTimeout(poll, pollingInterval)
        } else {
          setIsPolling(false)
        }
      } catch (err) {
        setIsPolling(false)
      }
    }

    poll()
  }, [videoId, pollingInterval, fetchStatus])

  const stopPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current)
      pollingTimeoutRef.current = null
    }
    setIsPolling(false)
  }, [])

  // Auto-start polling if enabled
  useEffect(() => {
    if (enabled && videoId) {
      startPolling()
    }

    return () => {
      stopPolling()
    }
  }, [enabled, videoId, startPolling, stopPolling])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current)
      }
    }
  }, [])

  return {
    status,
    loading,
    error,
    isPolling,
    startPolling,
    stopPolling,
    refetch: fetchStatus,
  }
}
