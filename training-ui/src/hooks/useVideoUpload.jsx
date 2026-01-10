import { useState, useCallback } from 'react'
import { videoRecognitionService } from '../services/videoRecognition'

/**
 * Custom hook for video upload with validation
 */
export function useVideoUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)

  const uploadSync = useCallback(async (file, domain = 'serbia', intervalSeconds = 3.0) => {
    // Validate file
    const fileValidation = videoRecognitionService.validateFile(file)
    if (!fileValidation.valid) {
      setError(fileValidation.errors.join(', '))
      return { success: false, message: fileValidation.errors.join(', ') }
    }

    // Validate interval
    const intervalValidation = videoRecognitionService.validateInterval(intervalSeconds)
    if (!intervalValidation.valid) {
      setError(intervalValidation.error)
      return { success: false, message: intervalValidation.error }
    }

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await videoRecognitionService.uploadSync(file, domain, intervalSeconds)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.success) {
        throw new Error(response.message || 'Upload failed')
      }

      return response
    } catch (err) {
      setError(err.message || 'Failed to upload video')
      return {
        success: false,
        message: err.message || 'Failed to upload video',
      }
    } finally {
      setUploading(false)
    }
  }, [])

  const uploadAsync = useCallback(async (file, domain = 'serbia', intervalSeconds = 3.0) => {
    // Validate file
    const fileValidation = videoRecognitionService.validateFile(file)
    if (!fileValidation.valid) {
      setError(fileValidation.errors.join(', '))
      return { success: false, message: fileValidation.errors.join(', ') }
    }

    // Validate interval
    const intervalValidation = videoRecognitionService.validateInterval(intervalSeconds)
    if (!intervalValidation.valid) {
      setError(intervalValidation.error)
      return { success: false, message: intervalValidation.error }
    }

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 100)

      const response = await videoRecognitionService.uploadAsync(file, domain, intervalSeconds)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.success) {
        throw new Error(response.message || 'Upload failed')
      }

      return response
    } catch (err) {
      setError(err.message || 'Failed to upload video')
      return {
        success: false,
        message: err.message || 'Failed to upload video',
      }
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    uploading,
    uploadProgress,
    error,
    uploadSync,
    uploadAsync,
    clearError,
  }
}
