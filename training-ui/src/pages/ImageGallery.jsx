import { useState } from 'react'
import { usePolling } from '../hooks/usePolling'
import { trainingService } from '../services/training'
import '../styles/gallery.css'

export default function ImageGallery() {
  const [selectedFolder, setSelectedFolder] = useState('')
  const [galleryData, setGalleryData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [deletingImage, setDeletingImage] = useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)

  // Fetch folders for dropdown
  const { data: foldersData } = usePolling(
    async () => {
      const response = await trainingService.getTrainingProgress()
      if (response.success) {
        return response.data.folders || []
      }
      return []
    },
    30000, // Poll every 30 seconds
    true
  )

  const loadFolderImages = async (folderName) => {
    if (!folderName) return

    try {
      setLoading(true)
      setError(null)
      const response = await trainingService.getFolderImages(folderName)
      if (response.success) {
        setGalleryData(response.data)
      }
    } catch (err) {
      setError(err.message || 'Failed to load images')
    } finally {
      setLoading(false)
    }
  }

  const handleFolderSelect = (e) => {
    const folderName = e.target.value
    setSelectedFolder(folderName)
    if (folderName) {
      loadFolderImages(folderName)
    } else {
      setGalleryData(null)
    }
  }

  const handleDeleteImage = async (imagePath) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return
    }

    try {
      setDeletingImage(imagePath)
      await trainingService.deleteImage(imagePath)
      // Reload folder images
      await loadFolderImages(selectedFolder)
    } catch (err) {
      setError(err.message || 'Failed to delete image')
    } finally {
      setDeletingImage(null)
    }
  }

  const openLightbox = (image) => {
    setLightboxImage(image)
  }

  const closeLightbox = () => {
    setLightboxImage(null)
  }

  return (
    <div className="page-container">
      <h1>Image Gallery</h1>
      <p className="subtitle">
        Browse and manage training images by folder.
      </p>

      {/* Folder Selection */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="form-group">
          <label htmlFor="folder-select">Select Training Folder</label>
          <select
            id="folder-select"
            className="form-input"
            value={selectedFolder}
            onChange={handleFolderSelect}
            style={{ fontSize: '1rem', padding: '0.75rem' }}
          >
            <option value="">-- Choose a folder --</option>
            {foldersData && foldersData.map((folder, index) => (
              <option key={index} value={folder.name}>
                {folder.name} ({folder.imageCount || 0} images)
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}

      {/* Gallery Display */}
      {loading ? (
        <div className="loading-state" style={{ marginTop: '3rem' }}>
          <span className="spinner" style={{ width: '2rem', height: '2rem' }}></span>
          <p>Loading images...</p>
        </div>
      ) : galleryData ? (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>
              {galleryData.folderName} - {galleryData.totalCount} images
            </h2>
            <button
              className="btn"
              onClick={() => loadFolderImages(selectedFolder)}
              style={{ background: '#667eea', color: 'white', border: 'none' }}
            >
              🔄 Refresh Gallery
            </button>
          </div>

          {galleryData.images && galleryData.images.length > 0 ? (
            <div className="gallery-grid">
              {galleryData.images.map((image, index) => (
                <div key={index} className="gallery-item">
                  <img
                    src={image.url || image.path}
                    alt={`${galleryData.folderName} - ${index + 1}`}
                    onClick={() => openLightbox(image)}
                    loading="lazy"
                  />
                  <div className="gallery-item-overlay">
                    <button
                      className="gallery-action-btn view-btn"
                      onClick={() => openLightbox(image)}
                      title="View full size"
                    >
                      🔍
                    </button>
                    <button
                      className="gallery-action-btn delete-btn"
                      onClick={() => handleDeleteImage(image.path)}
                      disabled={deletingImage === image.path}
                      title="Delete image"
                    >
                      {deletingImage === image.path ? '⏳' : '🗑️'}
                    </button>
                  </div>
                  <div className="gallery-item-info">
                    <small>{image.name || `Image ${index + 1}`}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📷</div>
              <h3>No Images Found</h3>
              <p>This folder doesn't contain any images yet.</p>
            </div>
          )}
        </div>
      ) : selectedFolder ? (
        <div className="empty-state" style={{ marginTop: '3rem' }}>
          <div className="empty-icon">📁</div>
          <h3>Loading...</h3>
          <p>Please wait while we load the images.</p>
        </div>
      ) : (
        <div className="empty-state" style={{ marginTop: '3rem' }}>
          <div className="empty-icon">🖼️</div>
          <h3>No Folder Selected</h3>
          <p>Select a training folder above to view its images.</p>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div className="lightbox" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>
              ×
            </button>
            <img
              src={lightboxImage.url || lightboxImage.path}
              alt={lightboxImage.name || 'Full size image'}
            />
            <div className="lightbox-info">
              <p>{lightboxImage.name || 'Image'}</p>
              {lightboxImage.size && <small>Size: {(lightboxImage.size / 1024).toFixed(2)} KB</small>}
            </div>
          </div>
        </div>
      )}

      <div className="info-box" style={{ marginTop: '2rem' }}>
        <h4>ℹ️ Gallery Features</h4>
        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
          <li>Browse all images in a training folder</li>
          <li>Click any image to view full size</li>
          <li>Delete unwanted or low-quality images</li>
          <li>Gallery auto-updates when new images are added</li>
          <li>Minimum 20 images per person recommended for training</li>
        </ul>
      </div>
    </div>
  )
}
