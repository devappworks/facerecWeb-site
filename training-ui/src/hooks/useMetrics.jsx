import { useState, useCallback } from 'react'
import { usePolling } from './usePolling'
import { abTestingService } from '../services/abTesting'

export function useMetrics(period = 'daily', date = null, pollingInterval = 30000) {
  const [error, setError] = useState(null)

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null)
      const response =
        period === 'daily'
          ? await abTestingService.getDailyMetrics(date)
          : await abTestingService.getWeeklyMetrics()

      if (response.success) {
        return response.summary
      }
      throw new Error(response.message || 'Failed to fetch metrics')
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch metrics'
      setError(errorMessage)
      throw err
    }
  }, [period, date])

  const {
    data: metrics,
    loading,
    refetch,
    isPolling,
    startPolling,
    stopPolling,
  } = usePolling(fetchMetrics, pollingInterval, true)

  return {
    metrics,
    loading,
    error,
    refetch,
    isPolling,
    startPolling,
    stopPolling,
  }
}
