import { useState, useEffect } from 'react'
import api from '../services/api'
import HelpButton from '../components/HelpButton'
import '../styles/gallery.css'

export default function RejectedFacesGallery() {
  const [selectedDate, setSelectedDate] = useState('')
  const [availableDates, setAvailableDates] = useState([])
  const [summary, setSummary] = useState(null)
  const [selectedPerson, setSelectedPerson] = useState('')
  const [personImages, setPersonImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [imagesLoading, setImagesLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)

  // Fetch available dates on mount
  useEffect(() => {
    fetchDates()
  }, [])

  // Fetch summary when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchSummary(selectedDate)
    }
  }, [selectedDate])

  const fetchDates = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/training/rejected-faces/dates')
      if (response.data.success) {
        setAvailableDates(response.data.dates)
        // Auto-select today if available
        const today = new Date().toISOString().split('T')[0]
        if (response.data.dates.includes(today)) {
          setSelectedDate(today)
        } else if (response.data.dates.length > 0) {
          setSelectedDate(response.data.dates[0])
        }
      }
    } catch (err) {
      setError('Failed to load rejection dates')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async (date) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/api/training/rejected-faces?date=${date}`)
      if (response.data.success) {
        setSummary(response.data.summary)
        setSelectedPerson('')
        setPersonImages([])
      }
    } catch (err) {
      setError('Failed to load rejection summary')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPersonImages = async (personName) => {
    if (!personName || !selectedDate) return

    try {
      setImagesLoading(true)
      setError(null)
      const response = await api.get(`/api/training/rejected-faces/${selectedDate}/${encodeURIComponent(personName)}/images`)
      if (response.data.success) {
        setPersonImages(response.data.images)
      }
    } catch (err) {
      setError('Failed to load images')
      console.error(err)
    } finally {
      setImagesLoading(false)
    }
  }

  const handlePersonSelect = (personName) => {
    setSelectedPerson(personName)
    fetchPersonImages(personName)
  }

  const getReasonColor = (reason) => {
    const colors = {
      'no_face_detected': '#e53e3e',
      'face_too_small': '#dd6b20',
      'face_blurry': '#d69e2e',
      'multiple_faces': '#805ad5',
      'multiple_invalid': '#d53f8c',
      'low_confidence': '#3182ce',
      'no_eyes_detected': '#38a169',
      'download_failed': '#718096',
      'invalid_image_format': '#4a5568'
    }
    return colors[reason] || '#718096'
  }

  const getReasonLabel = (reason) => {
    const labels = {
      'no_face_detected': 'No Face',
      'face_too_small': 'Too Small',
      'face_blurry': 'Blurry',
      'multiple_faces': 'Multiple Faces',
      'multiple_invalid': 'Invalid Faces',
      'low_confidence': 'Low Confidence',
      'no_eyes_detected': 'No Eyes',
      'download_failed': 'Download Failed',
      'invalid_image_format': 'Invalid Format'
    }
    return labels[reason] || reason
  }

  const openLightbox = (image) => {
    setLightboxImage(image)
  }

  const closeLightbox = () => {
    setLightboxImage(null)
  }

  return (
    <div className="page-container">
      <HelpButton pageName="rejected-faces" />
      <h1>Rejected Faces Gallery</h1>
      <p className="subtitle">
        Review images that failed quality validation during training.
      </p>

      {/* Date Selection */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="form-group">
          <label htmlFor="date-select">Select Date</label>
          <select
            id="date-select"
            className="form-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ fontSize: '1rem', padding: '0.75rem' }}
          >
            <option value="">-- Select a date --</option>
            {availableDates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#f7fafc',
            borderRadius: '0.5rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{ margin: 0 }}>
                Total Rejections: {summary.total_rejections}
              </h3>
            </div>

            {/* Breakdown by Reason */}
            {summary.by_reason && Object.keys(summary.by_reason).length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ marginBottom: '0.5rem', color: '#4a5568' }}>By Reason:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {Object.entries(summary.by_reason).map(([reason, count]) => (
                    <span
                      key={reason}
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        background: getReasonColor(reason),
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      {getReasonLabel(reason)}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* People with Rejections */}
            {summary.by_person && Object.keys(summary.by_person).length > 0 && (
              <div>
                <h4 style={{ marginBottom: '0.5rem', color: '#4a5568' }}>
                  By Person ({Object.keys(summary.by_person).length} people):
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '0.5rem',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {Object.entries(summary.by_person)
                    .sort((a, b) => b[1] - a[1])
                    .map(([person, count]) => (
                      <button
                        key={person}
                        onClick={() => handlePersonSelect(person)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          border: selectedPerson === person ? '2px solid #667eea' : '1px solid #e2e8f0',
                          background: selectedPerson === person ? '#ebf4ff' : 'white',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {person}
                        </span>
                        <span style={{
                          background: '#e53e3e',
                          color: 'white',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          marginLeft: '0.5rem',
                          flexShrink: 0
                        }}>
                          {count}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}

      {/* Image Gallery for Selected Person */}
      {selectedPerson && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>
            Rejected Images: {selectedPerson}
          </h2>

          {imagesLoading ? (
            <div className="loading-state">
              <span className="spinner" style={{ width: '2rem', height: '2rem' }}></span>
              <p>Loading images...</p>
            </div>
          ) : personImages.length > 0 ? (
            <div className="gallery-grid">
              {personImages.map((image, index) => (
                <div key={index} className="gallery-item">
                  <img
                    src={`data:image/jpeg;base64,${image.image_base64}`}
                    alt={`Rejected - ${image.reason}`}
                    onClick={() => openLightbox(image)}
                    loading="lazy"
                  />
                  <div className="gallery-item-overlay">
                    <button
                      className="gallery-action-btn view-btn"
                      onClick={() => openLightbox(image)}
                      title="View full size"
                    >
                      View
                    </button>
                  </div>
                  <div className="gallery-item-info">
                    <span
                      style={{
                        padding: '0.125rem 0.5rem',
                        borderRadius: '0.25rem',
                        background: getReasonColor(image.reason),
                        color: 'white',
                        fontSize: '0.75rem'
                      }}
                    >
                      {getReasonLabel(image.reason)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">Images not stored</div>
              <h3>No Images Available</h3>
              <p>Images may have been cleaned up or not stored for this person.</p>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && !summary && (
        <div className="loading-state" style={{ marginTop: '3rem' }}>
          <span className="spinner" style={{ width: '2rem', height: '2rem' }}></span>
          <p>Loading rejection data...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !summary && selectedDate && (
        <div className="empty-state" style={{ marginTop: '3rem' }}>
          <div className="empty-icon">No rejections</div>
          <h3>No Rejections Found</h3>
          <p>No rejected faces recorded for this date.</p>
        </div>
      )}

      {!selectedDate && !loading && (
        <div className="empty-state" style={{ marginTop: '3rem' }}>
          <div className="empty-icon">Calendar</div>
          <h3>Select a Date</h3>
          <p>Choose a date above to view rejected faces.</p>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div className="lightbox" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>
              Close
            </button>
            <img
              src={`data:image/jpeg;base64,${lightboxImage.image_base64}`}
              alt={lightboxImage.filename || 'Rejected image'}
            />
            <div className="lightbox-info">
              <p>
                <strong>Reason:</strong> {getReasonLabel(lightboxImage.reason)}
              </p>
              <p>
                <strong>Filename:</strong> {lightboxImage.filename}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="info-box" style={{ marginTop: '2rem' }}>
        <h4>About Rejected Faces</h4>
        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
          <li><strong>Blurry:</strong> Laplacian variance too low (threshold: 100 for images, 75 for video)</li>
          <li><strong>Too Small:</strong> Face region smaller than minimum size (70x70 pixels)</li>
          <li><strong>Low Confidence:</strong> Detection confidence below 95%</li>
          <li><strong>Multiple Faces:</strong> Ambiguous identity - multiple valid faces detected</li>
          <li><strong>No Eyes:</strong> Eye landmarks not detected properly</li>
          <li>Images are kept for 7 days then automatically cleaned up</li>
        </ul>
      </div>
    </div>
  )
}
