import { useState } from 'react'
import { trainingService } from '../services/training'

export default function SyncManager() {
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [syncResult, setSyncResult] = useState(null)

  const handleSync = async () => {
    setError(null)
    setSuccess(null)
    setSyncResult(null)
    setSyncing(true)

    try {
      const response = await trainingService.syncFaces()

      if (response.status === 'success' || response.success) {
        setSuccess('Sync to production started successfully!')
        setSyncResult(response)
      } else {
        setError(response.message || 'Sync failed')
      }
    } catch (err) {
      setError(err.message || 'An error occurred during sync')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="page-container">
      <h1>Sync to Production</h1>
      <p className="subtitle">
        Move validated training data from staging to production database.
      </p>

      <div className="card" style={{ maxWidth: '800px', marginTop: '2rem' }}>
        <div className="warning-box" style={{
          background: '#fef3c7',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #fde68a',
          marginBottom: '2rem'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>
            ⚠️ Important
          </h4>
          <p style={{ margin: 0, color: '#92400e' }}>
            This operation will sync validated training data to the production database.
            Make sure you have reviewed the training data before proceeding.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <button
          className="btn btn-primary"
          onClick={handleSync}
          disabled={syncing}
          style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }}
        >
          {syncing ? (
            <>
              <span className="spinner"></span>
              Syncing to Production...
            </>
          ) : (
            <>🔄 Start Sync to Production</>
          )}
        </button>

        {syncResult && (
          <div className="result-box" style={{ marginTop: '2rem' }}>
            <h3>Sync Result</h3>
            <div style={{ marginTop: '1rem' }}>
              <p>
                <strong>Status:</strong> {syncResult.status || 'Completed'}
              </p>
              {syncResult.message && (
                <p>
                  <strong>Message:</strong> {syncResult.message}
                </p>
              )}
              {syncResult.facesSynced !== undefined && (
                <p>
                  <strong>Faces Synced:</strong> {syncResult.facesSynced}
                </p>
              )}
              {syncResult.errors && syncResult.errors.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>Errors:</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    {syncResult.errors.map((error, index) => (
                      <li key={index} style={{ color: '#dc2626' }}>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="info-box" style={{ marginTop: '2rem' }}>
          <h4>ℹ️ Sync Process</h4>
          <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
            <li>Copies validated training data from staging to production</li>
            <li>Updates production face recognition database</li>
            <li>Process may take several minutes for large datasets</li>
            <li>Old production data is preserved as backup</li>
            <li>Changes take effect immediately after sync</li>
          </ul>
        </div>

        <div className="info-box" style={{ marginTop: '1rem', background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <h4>✅ Before You Sync</h4>
          <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', color: '#14532d' }}>
            <li>Verify all training folders have sufficient images (20+ recommended)</li>
            <li>Check that DeepFace validation has completed for all persons</li>
            <li>Review the Progress Monitor to ensure data quality</li>
            <li>Test recognition accuracy with sample images</li>
            <li>Ensure no processing is currently running</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
