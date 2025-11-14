import { useState, useCallback } from 'react'
import { usePolling } from './usePolling'
import { automatedTrainingService } from '../services/automatedTraining'

export function useBatchStatus(batchId, pollingInterval = 3000) {
  const [error, setError] = useState(null)

  const fetchBatchStatus = useCallback(async () => {
    if (!batchId) return null

    try {
      setError(null)
      const response = await automatedTrainingService.getBatchStatus(batchId)

      if (response.success) {
        return response
      }
      throw new Error(response.message || 'Failed to fetch batch status')
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch batch status'
      setError(errorMessage)
      throw err
    }
  }, [batchId])

  const {
    data: batchStatus,
    loading,
    refetch,
    isPolling,
    startPolling,
    stopPolling,
  } = usePolling(fetchBatchStatus, pollingInterval, !!batchId)

  const cancelBatch = useCallback(async () => {
    if (!batchId) return

    try {
      const response = await automatedTrainingService.cancelBatch(batchId)
      if (response.success) {
        stopPolling()
        await refetch()
      }
      return response
    } catch (err) {
      setError(err.message || 'Failed to cancel batch')
      throw err
    }
  }, [batchId, stopPolling, refetch])

  return {
    batchStatus,
    loading,
    error,
    refetch,
    isPolling,
    startPolling,
    stopPolling,
    cancelBatch,
  }
}
