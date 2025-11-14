import { useEffect, useRef, useState } from 'react'

/**
 * Custom hook for polling data at regular intervals
 * @param {Function} fetchFn - The function to call for fetching data
 * @param {number} interval - Polling interval in milliseconds (default: 5000)
 * @param {boolean} enabled - Whether polling is enabled (default: true)
 * @returns {Object} - { data, loading, error, refetch, startPolling, stopPolling }
 */
export function usePolling(fetchFn, interval = 5000, enabled = true) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isPolling, setIsPolling] = useState(enabled)
  const intervalRef = useRef(null)
  const isMountedRef = useRef(true)

  const fetchData = async () => {
    try {
      const result = await fetchFn()
      if (isMountedRef.current) {
        setData(result)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message || 'Failed to fetch data')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const startPolling = () => {
    setIsPolling(true)
  }

  const stopPolling = () => {
    setIsPolling(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const refetch = async () => {
    setLoading(true)
    await fetchData()
  }

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isPolling) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Initial fetch
    fetchData()

    // Set up polling
    intervalRef.current = setInterval(fetchData, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPolling, interval])

  return {
    data,
    loading,
    error,
    refetch,
    startPolling,
    stopPolling,
    isPolling,
  }
}
