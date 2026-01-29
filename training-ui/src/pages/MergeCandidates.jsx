import { useState, useEffect, useCallback } from 'react'
import { mergeCandidatesService } from '../services/mergeCandidates'
import { useAuth } from '../hooks/useAuth'
import '../styles/smart-training.css'

// Badge component for candidate types
function TypeBadge({ type }) {
  const colors = {
    TYPO: { bg: '#fee2e2', color: '#dc2626', label: 'Typo' },
    DUPLICATE: { bg: '#fef3c7', color: '#d97706', label: 'Duplicate' },
    SPELLING_VARIANT: { bg: '#dbeafe', color: '#2563eb', label: 'Spelling' },
    NICKNAME: { bg: '#f3e8ff', color: '#7c3aed', label: 'Nickname' }
  }

  const style = colors[type] || { bg: '#333', color: '#999', label: type }

  return (
    <span style={{
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: 600,
      backgroundColor: style.bg,
      color: style.color
    }}>
      {style.label}
    </span>
  )
}

// Action button component
function ActionButton({ action, onClick, disabled, loading, small }) {
  const styles = {
    MERGE: { bg: '#10b981', hover: '#059669', icon: '🔗' },
    RENAME: { bg: '#3b82f6', hover: '#2563eb', icon: '✏️' },
    DELETE: { bg: '#ef4444', hover: '#dc2626', icon: '🗑️' },
    SKIP: { bg: '#999', hover: '#4b5563', icon: '⏭️' }
  }

  const style = styles[action] || styles.SKIP

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: small ? '0.375rem 0.5rem' : '0.5rem 0.75rem',
        borderRadius: '6px',
        border: 'none',
        backgroundColor: style.bg,
        color: 'white',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontSize: small ? '0.75rem' : '0.875rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}
    >
      {loading ? '...' : style.icon} {action}
    </button>
  )
}

export default function MergeCandidates() {
  const { user } = useAuth()
  const domain = user?.domain || 'serbia'

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [processedIds, setProcessedIds] = useState(new Set())
  const [actionLoading, setActionLoading] = useState(null)
  const [renameModal, setRenameModal] = useState(null)
  const [newName, setNewName] = useState('')
  const [filterType, setFilterType] = useState('all')

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkAction, setBulkAction] = useState(null)
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 })

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await mergeCandidatesService.getCandidates(domain)
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [domain])

  useEffect(() => {
    fetchCandidates()
  }, [fetchCandidates])

  const handleScan = async () => {
    setScanning(true)
    setError(null)
    try {
      const result = await mergeCandidatesService.scanForCandidates(domain)
      setData(result)
      setProcessedIds(new Set())
      setSelectedIds(new Set())
    } catch (err) {
      setError(err.message)
    } finally {
      setScanning(false)
    }
  }

  const handleAction = async (candidateIndex, action, candidateNewName = null, swapDirection = false) => {
    setActionLoading(candidateIndex)
    try {
      await mergeCandidatesService.executeAction(
        candidateIndex,
        action,
        domain,
        candidateNewName,
        swapDirection
      )

      // Mark as processed
      setProcessedIds(prev => new Set([...prev, candidateIndex]))
      // Remove from selection
      setSelectedIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(candidateIndex)
        return newSet
      })

      // Close rename modal if open
      setRenameModal(null)
      setNewName('')

    } catch (err) {
      alert(`Failed to execute ${action}: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  // Bulk action handler
  const handleBulkAction = async (action) => {
    if (selectedIds.size === 0) return

    const selectedArray = Array.from(selectedIds).sort((a, b) => b - a) // Process in reverse order
    setBulkAction(action)
    setBulkProgress({ current: 0, total: selectedArray.length })

    for (let i = 0; i < selectedArray.length; i++) {
      const candidateIndex = selectedArray[i]
      setBulkProgress({ current: i + 1, total: selectedArray.length })

      try {
        await mergeCandidatesService.executeAction(candidateIndex, action, domain)
        setProcessedIds(prev => new Set([...prev, candidateIndex]))
      } catch (err) {
        console.error(`Failed to ${action} candidate ${candidateIndex}:`, err)
      }
    }

    setSelectedIds(new Set())
    setBulkAction(null)
  }

  const openRenameModal = (candidateIndex, currentName) => {
    setRenameModal(candidateIndex)
    setNewName(currentName)
  }

  // Toggle selection
  const toggleSelection = (index) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  // Select all visible (filtered) candidates
  const selectAll = () => {
    const allIndices = filteredCandidates
      .map((_, i) => {
        const originalIndex = candidates.indexOf(filteredCandidates[i])
        return originalIndex
      })
      .filter(i => !processedIds.has(i))
    setSelectedIds(new Set(allIndices))
  }

  // Deselect all
  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const candidates = data?.candidates || []
  const filteredCandidates = filterType === 'all'
    ? candidates
    : candidates.filter(c => c.type === filterType)

  const pendingCandidates = filteredCandidates.filter((c, i) => {
    const originalIndex = candidates.indexOf(c)
    return !processedIds.has(originalIndex)
  })

  // Check if all filtered items are selected
  const allSelected = pendingCandidates.length > 0 &&
    pendingCandidates.every(c => {
      const originalIndex = candidates.indexOf(c)
      return selectedIds.has(originalIndex)
    })

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h1>Merge Candidates</h1>
          <p className="subtitle">
            Review and resolve duplicate or similar person entries - <strong>{domain}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            onClick={fetchCandidates}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleScan}
            disabled={scanning}
          >
            {scanning ? 'Scanning...' : 'Scan Database'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Summary Cards */}
      {data && (
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-label">Total Persons</div>
              <div className="stat-value">{data.total_persons?.toLocaleString() || 0}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <div className="stat-label">Candidates Found</div>
              <div className="stat-value">{data.total_candidates || 0}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-label">Processed</div>
              <div className="stat-value">{processedIds.size}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-label">Remaining</div>
              <div className="stat-value">{pendingCandidates.length}</div>
            </div>
          </div>
        </div>
      )}

      {/* Type Summary */}
      {data?.summary && (
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}>
          <button
            className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('all')}
          >
            All ({data.total_candidates})
          </button>
          {data.summary.typos > 0 && (
            <button
              className={`btn ${filterType === 'TYPO' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType('TYPO')}
            >
              Typos ({data.summary.typos})
            </button>
          )}
          {data.summary.duplicates > 0 && (
            <button
              className={`btn ${filterType === 'DUPLICATE' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType('DUPLICATE')}
            >
              Duplicates ({data.summary.duplicates})
            </button>
          )}
          {data.summary.spelling_variants > 0 && (
            <button
              className={`btn ${filterType === 'SPELLING_VARIANT' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType('SPELLING_VARIANT')}
            >
              Spelling ({data.summary.spelling_variants})
            </button>
          )}
          {data.summary.nicknames > 0 && (
            <button
              className={`btn ${filterType === 'NICKNAME' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType('NICKNAME')}
            >
              Nicknames ({data.summary.nicknames})
            </button>
          )}
        </div>
      )}

      {/* Selection Controls */}
      {pendingCandidates.length > 0 && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem 1rem',
          background: selectedIds.size > 0 ? '#fef3c7' : '#333',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => allSelected ? deselectAll() : selectAll()}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontWeight: 500 }}>
                {allSelected ? 'Deselect All' : 'Select All'}
              </span>
            </label>
            {selectedIds.size > 0 && (
              <span style={{ color: '#92400e', fontWeight: 600 }}>
                {selectedIds.size} selected
              </span>
            )}
          </div>

          {selectedIds.size > 0 && !bulkAction && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <ActionButton
                action="MERGE"
                onClick={() => handleBulkAction('MERGE')}
                small
              />
              <ActionButton
                action="SKIP"
                onClick={() => handleBulkAction('SKIP')}
                small
              />
              <ActionButton
                action="DELETE"
                onClick={() => {
                  if (confirm(`Delete ${selectedIds.size} selected persons?`)) {
                    handleBulkAction('DELETE')
                  }
                }}
                small
              />
            </div>
          )}

          {bulkAction && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="spinner" style={{ width: '16px', height: '16px' }}></span>
              <span>
                {bulkAction}ing {bulkProgress.current}/{bulkProgress.total}...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Last Scan Info */}
      {data?.scanned_at && (
        <div style={{
          fontSize: '0.875rem',
          color: '#999',
          marginBottom: '1rem'
        }}>
          Last scan: {new Date(data.scanned_at).toLocaleString()}
        </div>
      )}

      {/* Candidates List */}
      {loading && !data ? (
        <div className="text-muted">Loading candidates...</div>
      ) : !data ? (
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '12px',
          textAlign: 'center',
          color: '#999'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
          <h3>No scan results yet</h3>
          <p>Click "Scan Database" to detect merge candidates</p>
        </div>
      ) : pendingCandidates.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '12px',
          textAlign: 'center',
          color: '#999'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h3>All candidates processed!</h3>
          <p>No more merge candidates to review</p>
          <button
            className="btn btn-primary"
            onClick={handleScan}
            style={{ marginTop: '1rem' }}
          >
            Scan for new candidates
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredCandidates.map((candidate) => {
            const originalIndex = candidates.indexOf(candidate)
            const isProcessed = processedIds.has(originalIndex)
            const isSelected = selectedIds.has(originalIndex)

            if (isProcessed) return null

            return (
              <div
                key={originalIndex}
                style={{
                  background: isSelected ? '#fef9c3' : 'white',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: isSelected ? '2px solid #fbbf24' : '1px solid #3a3a3a'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  {/* Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(originalIndex)}
                      style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                    />

                    {/* Info */}
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.25rem'
                      }}>
                        <TypeBadge type={candidate.type} />
                        <span style={{ fontSize: '0.75rem', color: '#999' }}>
                          #{originalIndex + 1}
                        </span>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.25rem',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          fontWeight: 600,
                          color: '#dc2626'
                        }}>
                          {candidate.source_name}
                        </span>
                        <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                          ({candidate.source_embeddings})
                        </span>

                        {candidate.target_name && (
                          <>
                            <span style={{ color: '#999' }}>→</span>
                            <span style={{
                              fontWeight: 600,
                              color: '#10b981'
                            }}>
                              {candidate.target_name}
                            </span>
                            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                              ({candidate.target_embeddings})
                            </span>
                          </>
                        )}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#999' }}>
                        {candidate.reason}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    gap: '0.375rem',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}>
                    {candidate.target_name && (
                      <>
                        <ActionButton
                          action="MERGE"
                          onClick={() => handleAction(originalIndex, 'MERGE')}
                          loading={actionLoading === originalIndex}
                          disabled={actionLoading !== null || bulkAction !== null}
                          small
                        />
                        <button
                          onClick={() => handleAction(originalIndex, 'MERGE', null, true)}
                          disabled={actionLoading !== null || bulkAction !== null}
                          title={`Merge "${candidate.target_name}" into "${candidate.source_name}" instead`}
                          style={{
                            padding: '0.375rem 0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #10b981',
                            backgroundColor: 'white',
                            color: '#10b981',
                            cursor: actionLoading !== null ? 'not-allowed' : 'pointer',
                            opacity: actionLoading !== null ? 0.5 : 1,
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <span style={{ transform: 'scaleX(-1)' }}>↔</span>
                        </button>
                      </>
                    )}
                    <ActionButton
                      action="RENAME"
                      onClick={() => openRenameModal(originalIndex, candidate.source_name)}
                      loading={actionLoading === originalIndex}
                      disabled={actionLoading !== null || bulkAction !== null}
                      small
                    />
                    <ActionButton
                      action="DELETE"
                      onClick={() => {
                        if (confirm(`Delete "${candidate.source_name}"?`)) {
                          handleAction(originalIndex, 'DELETE')
                        }
                      }}
                      loading={actionLoading === originalIndex}
                      disabled={actionLoading !== null || bulkAction !== null}
                      small
                    />
                    <ActionButton
                      action="SKIP"
                      onClick={() => handleAction(originalIndex, 'SKIP')}
                      loading={actionLoading === originalIndex}
                      disabled={actionLoading !== null || bulkAction !== null}
                      small
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Rename Modal */}
      {renameModal !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Rename Person</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                marginBottom: '1rem',
                fontSize: '1rem'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setRenameModal(null)
                  setNewName('')
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleAction(renameModal, 'RENAME', newName)}
                disabled={!newName.trim()}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
