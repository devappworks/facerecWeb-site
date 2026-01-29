import { useState, useEffect, useCallback } from 'react'
import { mergeCandidatesService } from '../services/mergeCandidates'
import { trainingService } from '../services/training'
import { useAuth } from '../hooks/useAuth'
import '../styles/smart-training.css'

// Person preview panel component
function PersonPanel({ title, person, onSelect, persons, loading, domain, color }) {
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    if (!person) {
      setPreview(null)
      return
    }

    const fetchPreview = async () => {
      setPreviewLoading(true)
      try {
        const result = await mergeCandidatesService.getPersonPreview(person, domain)
        if (result.success) {
          setPreview(result.data)
        }
      } catch (err) {
        console.error('Failed to load preview:', err)
      } finally {
        setPreviewLoading(false)
      }
    }

    fetchPreview()
  }, [person, domain])

  return (
    <div style={{
      flex: 1,
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      border: `2px solid ${color}`,
      minWidth: '300px'
    }}>
      <h3 style={{ color, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {title}
      </h3>

      <div className="form-group">
        <label>Select Person</label>
        <select
          className="form-input"
          value={person || ''}
          onChange={(e) => onSelect(e.target.value || null)}
          disabled={loading}
          style={{ fontSize: '1rem' }}
        >
          <option value="">-- Select a person --</option>
          {persons.map((p, i) => (
            <option key={i} value={p.name}>
              {p.display_name || p.name} ({p.image_count || p.embedding_count || 0} images)
            </option>
          ))}
        </select>
      </div>

      {person && (
        <div style={{ marginTop: '1rem' }}>
          {previewLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
              Loading preview...
            </div>
          ) : preview ? (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem'
              }}>
                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{preview.person_name}</span>
                <span style={{
                  background: color + '20',
                  color: color,
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}>
                  {preview.image_count} images
                </span>
              </div>

              {preview.preview_images && preview.preview_images.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem'
                }}>
                  {preview.preview_images.map((img, i) => (
                    <div key={i} style={{
                      aspectRatio: '1',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#333'
                    }}>
                      <img
                        src={`https://facerecognition.mpanel.app${img.url}`}
                        alt={`Preview ${i + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  background: '#242424',
                  borderRadius: '8px',
                  color: '#999'
                }}>
                  No preview images available
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default function ManualMerge() {
  const { user } = useAuth()
  const [domain, setDomain] = useState(user?.domain || 'serbia')
  const [persons, setPersons] = useState([])
  const [loading, setLoading] = useState(false)
  const [merging, setMerging] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [sourcePerson, setSourcePerson] = useState(null)
  const [targetPerson, setTargetPerson] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')

  // Load persons list
  const loadPersons = useCallback(async () => {
    setLoading(true)
    try {
      const response = await trainingService.getTrainingProgress(domain, 'production', 1, 2000, null)
      if (response.success) {
        setPersons(response.data.folders || [])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [domain])

  useEffect(() => {
    loadPersons()
  }, [loadPersons])

  // Filter persons by search
  const filteredPersons = searchQuery
    ? persons.filter(p =>
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.display_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : persons

  // Handle merge
  const handleMerge = async () => {
    if (!sourcePerson || !targetPerson) {
      setError('Please select both source and target persons')
      return
    }

    if (sourcePerson === targetPerson) {
      setError('Source and target must be different persons')
      return
    }

    const confirmMsg = `Are you sure you want to merge "${sourcePerson}" into "${targetPerson}"?\n\nThis will:\n- Move all images from "${sourcePerson}" to "${targetPerson}"\n- Transfer all face embeddings\n- Delete the "${sourcePerson}" entry\n\nThis action cannot be undone.`

    if (!confirm(confirmMsg)) return

    setMerging(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await mergeCandidatesService.mergePersons(sourcePerson, targetPerson, domain)
      if (result.success) {
        setSuccess(`Successfully merged "${sourcePerson}" into "${targetPerson}". ${result.embeddings_moved || 0} embeddings moved, ${result.files_renamed || 0} files renamed.`)
        setSourcePerson(null)
        setTargetPerson(null)
        // Reload persons list
        loadPersons()
      } else {
        setError(result.error || 'Merge failed')
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Merge failed')
    } finally {
      setMerging(false)
    }
  }

  // Swap source and target
  const handleSwap = () => {
    const temp = sourcePerson
    setSourcePerson(targetPerson)
    setTargetPerson(temp)
  }

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h1>Manual Merge Tool</h1>
          <p className="subtitle">
            Merge two persons into one - select source (will be deleted) and target (will keep)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            className="form-input"
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value)
              setSourcePerson(null)
              setTargetPerson(null)
            }}
            style={{ width: 'auto' }}
          >
            <option value="serbia">Serbia</option>
            <option value="slovenia">Slovenia</option>
          </select>
          <button
            className="btn btn-secondary"
            onClick={loadPersons}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{
          marginBottom: '1rem',
          background: '#d1fae5',
          color: '#065f46',
          padding: '1rem',
          borderRadius: '8px'
        }}>
          {success}
        </div>
      )}

      {/* Search */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Search Persons</label>
          <input
            type="text"
            className="form-input"
            placeholder="Type to filter persons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <div style={{ marginTop: '0.5rem', color: '#999', fontSize: '0.875rem' }}>
              Found {filteredPersons.length} of {persons.length} persons
            </div>
          )}
        </div>
      </div>

      {/* Side by side panels */}
      <div style={{
        display: 'flex',
        gap: '1.5rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <PersonPanel
          title="Source Person (will be deleted)"
          person={sourcePerson}
          onSelect={setSourcePerson}
          persons={filteredPersons.filter(p => p.name !== targetPerson)}
          loading={loading}
          domain={domain}
          color="#dc2626"
        />

        {/* Swap button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <button
            className="btn"
            onClick={handleSwap}
            disabled={!sourcePerson && !targetPerson}
            style={{
              background: '#999',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              fontSize: '1.25rem',
              cursor: (!sourcePerson && !targetPerson) ? 'not-allowed' : 'pointer',
              opacity: (!sourcePerson && !targetPerson) ? 0.5 : 1
            }}
            title="Swap source and target"
          >
            &#8646;
          </button>
        </div>

        <PersonPanel
          title="Target Person (will keep)"
          person={targetPerson}
          onSelect={setTargetPerson}
          persons={filteredPersons.filter(p => p.name !== sourcePerson)}
          loading={loading}
          domain={domain}
          color="#10b981"
        />
      </div>

      {/* Merge summary and action */}
      {sourcePerson && targetPerson && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          border: '2px solid #f59e0b'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#92400e' }}>Merge Preview</h3>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              background: '#fee2e2',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #fecaca'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#dc2626', marginBottom: '0.25rem' }}>Source (delete)</div>
              <div style={{ fontWeight: 600 }}>{sourcePerson}</div>
            </div>

            <div style={{ fontSize: '2rem', color: '#92400e' }}>&#8594;</div>

            <div style={{
              background: '#d1fae5',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #a7f3d0'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#10b981', marginBottom: '0.25rem' }}>Target (keep)</div>
              <div style={{ fontWeight: 600 }}>{targetPerson}</div>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <h4 style={{ marginBottom: '0.5rem' }}>What will happen:</h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#4b5563' }}>
              <li>All images from "{sourcePerson}" will be renamed to "{targetPerson}"</li>
              <li>All face embeddings will be transferred to "{targetPerson}"</li>
              <li>The person entry "{sourcePerson}" will be deleted from the database</li>
              <li style={{ color: '#dc2626', fontWeight: 500 }}>This action cannot be undone</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSourcePerson(null)
                setTargetPerson(null)
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleMerge}
              disabled={merging}
              style={{
                background: '#10b981',
                minWidth: '200px'
              }}
            >
              {merging ? 'Merging...' : 'Merge Persons'}
            </button>
          </div>
        </div>
      )}

      {/* Help info */}
      <div className="info-box" style={{ marginTop: '2rem' }}>
        <h4>How to use the Manual Merge Tool</h4>
        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
          <li><strong>Source Person:</strong> The person entry that will be merged and deleted</li>
          <li><strong>Target Person:</strong> The person entry that will receive all images and embeddings</li>
          <li>Use the search box to quickly find persons by name</li>
          <li>Preview images are shown to help you confirm you're selecting the right persons</li>
          <li>Click the swap button to reverse source and target</li>
          <li>All image files will be renamed and embeddings transferred automatically</li>
        </ul>
      </div>
    </div>
  )
}
