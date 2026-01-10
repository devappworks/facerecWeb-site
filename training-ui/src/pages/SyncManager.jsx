import { useState } from 'react'
import { trainingService } from '../services/training'
import HelpButton from '../components/HelpButton'

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
      <HelpButton pageName="sync" />
      <h1>Sync to Production</h1>
      <p className="subtitle">
        Move validated training data from staging to production database.
      </p>

      {/* Deprecation Notice */}
      <div className="card" style={{ maxWidth: '800px', marginTop: '2rem', background: '#fef2f2', borderColor: '#fecaca' }}>
        <div style={{
          background: '#fee2e2',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '2px solid #fca5a5',
          marginBottom: '0'
        }}>
          <h3 style={{ margin: '0 0 0.75rem 0', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🚨 Legacy Feature - Modern Workflow Available
          </h3>
          <p style={{ margin: '0 0 1rem 0', color: '#7f1d1d', fontSize: '1rem', lineHeight: '1.6' }}>
            <strong>This manual sync feature is now legacy.</strong> The modern training workflow includes <strong>automatic deployment</strong> that eliminates the need for manual syncing.
          </p>
          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #fca5a5' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#991b1b' }}>Modern Training Workflow:</h4>
            <ol style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem', color: '#7f1d1d', lineHeight: '1.8' }}>
              <li><strong>Generate Candidates:</strong> Query Wikidata for celebrities (Automated Training)</li>
              <li><strong>Download Images:</strong> Free Wikimedia → Paid SERP fallback (waterfall strategy)</li>
              <li><strong>Auto-Validate:</strong> DeepFace validates images automatically (no manual approval needed)</li>
              <li><strong>Staging:</strong> Validated images wait in staging for review (optional QA)</li>
              <li><strong>Deploy:</strong> Use <code style={{ background: '#fef2f2', padding: '2px 6px', borderRadius: '3px' }}>/api/training/deploy</code> endpoint for production deployment</li>
            </ol>
          </div>
          <p style={{ margin: '1rem 0 0 0', color: '#7f1d1d', fontSize: '0.875rem' }}>
            <strong>Note:</strong> This page uses the legacy <code style={{ background: '#ffffff', padding: '2px 6px', borderRadius: '3px' }}>/sync-faces</code> endpoint.
            For new implementations, use the modern deployment endpoint instead.
          </p>
        </div>
      </div>

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
