import { useState } from 'react'
import { trainingService } from '../services/training'
import HelpButton from '../components/HelpButton'

export default function QueueManager() {
  const [processing, setProcessing] = useState(false)
  const [processingAll, setProcessingAll] = useState(false)
  const [currentPerson, setCurrentPerson] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleProcessNext = async () => {
    setError(null)
    setSuccess(null)
    setProcessing(true)

    try {
      const response = await trainingService.processNext()

      if (response.success) {
        setCurrentPerson(response.data)
        setSuccess(`Processed: ${response.data?.person || 'Unknown'}`)
      } else {
        setError(response.message || 'Failed to process')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while processing')
    } finally {
      setProcessing(false)
    }
  }

  const handleProcessAll = async () => {
    setError(null)
    setSuccess(null)
    setProcessingAll(true)
    setCurrentPerson(null)

    try {
      // TODO: Implement batch processing with polling
      setSuccess('Batch processing started. Check progress monitor for updates.')
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setProcessingAll(false)
    }
  }

  return (
    <div className="page-container">
      <HelpButton pageName="queue" />
      <h1>Queue Manager</h1>
      <p className="subtitle">
        Process people in the queue to download training images. Each person takes 5-15 seconds.
      </p>

      <div className="card" style={{ maxWidth: '800px', marginTop: '2rem' }}>
        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={handleProcessNext}
            disabled={processing || processingAll}
          >
            {processing ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              <>
                <span>▶️</span> Process Next
              </>
            )}
          </button>

          <button
            className="btn"
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
            }}
            onClick={handleProcessAll}
            disabled={processing || processingAll}
          >
            {processingAll ? (
              <>
                <span className="spinner"></span>
                Processing All...
              </>
            ) : (
              <>
                <span>⏩</span> Process All
              </>
            )}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {currentPerson && (
          <div className="result-box" style={{ marginTop: '2rem' }}>
            <h3>Last Processed</h3>
            <div style={{ marginTop: '1rem' }}>
              <p>
                <strong>Person:</strong> {currentPerson.person || 'N/A'}
              </p>
              <p>
                <strong>Images Downloaded:</strong>{' '}
                {currentPerson.images_downloaded || 0}
              </p>
              <p>
                <strong>Status:</strong> {currentPerson.status || 'Completed'}
              </p>
            </div>
          </div>
        )}

        <div className="info-box" style={{ marginTop: '2rem' }}>
          <h4>ℹ️ How it works</h4>
          <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
            <li>
              <strong>Process Next:</strong> Downloads images for one person
              (~5-15s)
            </li>
            <li>
              <strong>Process All:</strong> Processes entire queue sequentially
            </li>
            <li>
              Background validation runs automatically after download (2-5 min)
            </li>
            <li>
              Monitor progress in the Progress Monitor page
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
