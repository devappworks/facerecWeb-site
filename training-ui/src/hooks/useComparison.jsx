import { useState } from 'react'
import { abTestingService } from '../services/abTesting'

export function useComparison() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const runComparison = async (file, options = {}) => {
    if (!file) {
      setError('No file provided')
      return null
    }

    setTesting(true)
    setError(null)
    setResult(null)

    try {
      const data = await abTestingService.runComparison(file, options)
      setResult(data)
      return data
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to run comparison'
      setError(errorMessage)
      throw err
    } finally {
      setTesting(false)
    }
  }

  const clearResult = () => {
    setResult(null)
    setError(null)
  }

  return {
    runComparison,
    clearResult,
    testing,
    result,
    error,
  }
}
