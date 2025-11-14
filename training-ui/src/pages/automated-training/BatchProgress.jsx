import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBatchStatus } from '../../hooks/useBatchStatus'

const STATUS_ICONS = {
  pending: '⏳',
  processing: '🔄',
  completed: '✅',
  failed: '✗',
}

const STATUS_COLORS = {
  pending: 'text-gray-500',
  processing: 'text-blue-500',
  completed: 'text-green-500',
  failed: 'text-red-500',
}

export default function BatchProgress() {
  const { batchId } = useParams()
  const navigate = useNavigate()
  const {
    batchStatus,
    loading,
    error,
    isPolling,
    startPolling,
    stopPolling,
    cancelBatch,
  } = useBatchStatus(batchId, 3000)

  useEffect(() => {
    // Start polling when component mounts
    startPolling()
    return () => stopPolling()
  }, [startPolling, stopPolling])

  useEffect(() => {
    // Auto-navigate to review page when batch is complete
    if (batchStatus?.status === 'completed') {
      stopPolling()
      setTimeout(() => {
        navigate('/training/automated/review')
      }, 2000) // Give user 2 seconds to see completion
    }
  }, [batchStatus?.status, navigate, stopPolling])

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this batch?')) return

    try {
      await cancelBatch()
    } catch (err) {
      console.error('Failed to cancel batch:', err)
    }
  }

  const getProgressPercentage = () => {
    if (!batchStatus) return 0
    return Math.round((batchStatus.completed / batchStatus.total) * 100)
  }

  if (loading && !batchStatus) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading batch status...</p>
        </div>
      </div>
    )
  }

  if (error && !batchStatus) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6">
          <p className="font-medium">Error Loading Batch</p>
          <p className="text-sm mt-2">{error}</p>
          <button
            onClick={() => navigate('/training/automated/generate')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Back to Generate
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Batch Training Progress</h1>
        <p className="text-gray-600 mt-2">
          Batch ID: <span className="font-mono">{batchId}</span>
        </p>
      </div>

      {/* Status Overview */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Overall Progress
            </h2>
            <p className="text-sm text-gray-600">
              {batchStatus?.status === 'running'
                ? 'Processing...'
                : batchStatus?.status === 'completed'
                ? 'Batch Complete!'
                : batchStatus?.status === 'cancelled'
                ? 'Batch Cancelled'
                : 'Unknown Status'}
            </p>
          </div>
          {batchStatus?.status === 'running' && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Cancel Batch
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              {batchStatus?.completed || 0} of {batchStatus?.total || 0} people
              processed
            </span>
            <span>{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                batchStatus?.status === 'completed'
                  ? 'bg-green-500'
                  : batchStatus?.status === 'cancelled'
                  ? 'bg-red-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-blue-600">
              {batchStatus?.total || 0}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {batchStatus?.completed || 0}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Processing</p>
            <p className="text-2xl font-bold text-yellow-600">
              {batchStatus?.processing || 0}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Failed</p>
            <p className="text-2xl font-bold text-red-600">
              {batchStatus?.failed || 0}
            </p>
          </div>
        </div>

        {/* Polling Indicator */}
        {isPolling && batchStatus?.status === 'running' && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Auto-refreshing every 3 seconds...</span>
          </div>
        )}
      </div>

      {/* Individual Person Progress */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Person-by-Person Progress
        </h2>

        {batchStatus?.people?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No people in this batch
          </div>
        ) : (
          <div className="space-y-4">
            {batchStatus?.people?.map((person) => (
              <div
                key={person.person_id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-2xl ${
                        STATUS_COLORS[person.status] || 'text-gray-500'
                      }`}
                    >
                      {STATUS_ICONS[person.status] || '⏳'}
                    </span>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {person.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Wikidata: {person.wikidata_id}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      person.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : person.status === 'processing'
                        ? 'bg-blue-100 text-blue-700'
                        : person.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {person.status || 'pending'}
                  </span>
                </div>

                {/* Download Progress */}
                {person.download_progress !== undefined && (
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Download</span>
                      <span>
                        {person.downloaded_images || 0} / {person.total_images || 0}{' '}
                        images
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${person.download_progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Validation Progress */}
                {person.validation_progress !== undefined && (
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Validation</span>
                      <span>
                        {person.validated_images || 0} /{' '}
                        {person.downloaded_images || 0} validated
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${person.validation_progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {person.error_message && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                    {person.error_message}
                  </div>
                )}

                {/* Success Info */}
                {person.status === 'completed' && person.valid_photos !== undefined && (
                  <div className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                    ✓ Completed with {person.valid_photos} valid photos
                    {person.valid_photos >= 5
                      ? ' - Ready for production'
                      : ' - Not enough photos for production'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completion Message */}
      {batchStatus?.status === 'completed' && (
        <div className="mt-6 bg-green-50 border border-green-200 text-green-800 rounded-lg p-6">
          <p className="font-medium text-lg">Batch Training Complete!</p>
          <p className="text-sm mt-2">
            Redirecting to review and deploy page in a moment...
          </p>
        </div>
      )}

      {/* Cancellation Message */}
      {batchStatus?.status === 'cancelled' && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-6">
          <p className="font-medium text-lg">Batch Cancelled</p>
          <p className="text-sm mt-2">This batch was cancelled by the user.</p>
          <button
            onClick={() => navigate('/training/automated/generate')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Start New Batch
          </button>
        </div>
      )}
    </div>
  )
}
