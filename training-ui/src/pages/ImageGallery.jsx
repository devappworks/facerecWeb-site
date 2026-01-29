import { useState, useEffect, useRef } from 'react'
import { usePolling } from '../hooks/usePolling'
import { trainingService } from '../services/training'
import HelpButton from '../components/HelpButton'
import '../styles/gallery.css'

export default function ImageGallery() {
  const [domain, setDomain] = useState('serbia')
  const [view, setView] = useState('production')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedFolder, setSelectedFolder] = useState('')
  const [galleryData, setGalleryData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [deletingImage, setDeletingImage] = useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  // Multi-select state
  const [selectedImages, setSelectedImages] = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  // Approved folders state (server-side storage)
  const [approvedFolders, setApprovedFolders] = useState({})
  const [approvalsLoading, setApprovalsLoading] = useState(false)
  // Hide approved filter
  const [hideApproved, setHideApproved] = useState(false)

  const itemsPerPage = 50

  // Load approvals from server when domain/view changes
  useEffect(() => {
    const loadApprovals = async () => {
      setApprovalsLoading(true)
      try {
        const response = await trainingService.getApprovals(domain, view)
        if (response.success) {
          setApprovedFolders(response.data.approvals || {})
        }
      } catch (err) {
        console.error('Failed to load approvals:', err)
      } finally {
        setApprovalsLoading(false)
      }
    }
    loadApprovals()
  }, [domain, view])

  // Track actual image counts (filesystem) for folders we've viewed
  // This syncs the dropdown count with the gallery count
  const [actualImageCounts, setActualImageCounts] = useState({})

  // Track which folder to auto-select after page change
  // Format: { select: 'first'|'last', forPage: number } or null
  const [autoSelectFolder, setAutoSelectFolder] = useState(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1) // Reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Clear selection when an approved folder becomes hidden
  useEffect(() => {
    if (hideApproved && selectedFolder && approvedFolders[selectedFolder]) {
      setSelectedFolder('')
      setGalleryData(null)
    }
  }, [hideApproved, selectedFolder, approvedFolders])

  // Fetch folders for dropdown with current domain and view (and search)
  const { data: foldersResponse } = usePolling(
    async () => {
      const response = await trainingService.getTrainingProgress(domain, view, currentPage, itemsPerPage, debouncedSearch || null, hideApproved)
      if (response.success) {
        return response
      }
      return null
    },
    30000, // Poll every 30 seconds
    true,
    [domain, view, currentPage, debouncedSearch, hideApproved] // Re-fetch when these change
  )

  const foldersData = foldersResponse?.data?.folders || []
  const pagination = foldersResponse?.data?.pagination || {}
  const summary = foldersResponse?.data?.summary || {}

  // Check if folder is approved (uses person name directly as key)
  const isFolderApproved = (folderName) => {
    return !!approvedFolders[folderName]
  }

  // Server-side filtering is now used - foldersData already excludes approved when hideApproved is true
  const filteredFolders = foldersData

  const loadFolderImages = async (folderName, page = 1) => {
    if (!folderName) return

    try {
      setLoading(true)
      setError(null)
      const response = await trainingService.getFolderImages(folderName, domain, view, page, itemsPerPage)
      if (response.success) {
        setGalleryData(response.data)
        // Update actual image count for this folder (filesystem count is authoritative)
        if (response.data?.pagination?.total_items !== undefined) {
          setActualImageCounts(prev => ({
            ...prev,
            [folderName]: response.data.pagination.total_items
          }))
        }
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
      loadFolderImages(folderName, 1)
    } else {
      setGalleryData(null)
    }
  }

  const handleDomainChange = (e) => {
    console.log('Domain change triggered:', e.target.value)
    setDomain(e.target.value)
    setCurrentPage(1)
    setSelectedFolder('')
    setGalleryData(null)
    setSearchQuery('') // Clear search when domain changes
  }

  const handleViewChange = (e) => {
    setView(e.target.value)
    setCurrentPage(1)
    setSelectedFolder('')
    setGalleryData(null)
    setSearchQuery('') // Clear search when view changes
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteImage = async (imagePath) => {
    if (!confirm('Are you sure you want to delete this image? This will also remove it from the recognition database.')) {
      return
    }

    try {
      setDeletingImage(imagePath)
      await trainingService.deleteImage(imagePath, domain)
      // Reload folder images
      await loadFolderImages(selectedFolder, galleryData?.pagination?.page || 1)
    } catch (err) {
      setError(err.message || 'Failed to delete image')
    } finally {
      setDeletingImage(null)
    }
  }

  // Multi-select handlers
  const toggleImageSelection = (imagePath) => {
    const newSelection = new Set(selectedImages)
    if (newSelection.has(imagePath)) {
      newSelection.delete(imagePath)
    } else {
      newSelection.add(imagePath)
    }
    setSelectedImages(newSelection)
  }

  const selectAllImages = () => {
    if (!galleryData?.images) return
    const allPaths = new Set(
      galleryData.images.map((img) => (typeof img === 'string' ? img : img.path))
    )
    setSelectedImages(allPaths)
  }

  const deselectAllImages = () => {
    setSelectedImages(new Set())
  }

  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) return

    const count = selectedImages.size
    if (!confirm(`Are you sure you want to delete ${count} image${count > 1 ? 's' : ''}? This will also remove them from the recognition database.`)) {
      return
    }

    try {
      setBulkDeleting(true)
      setError(null)

      // Delete images one by one
      const imagesToDelete = Array.from(selectedImages)
      let deleted = 0
      let failed = 0

      for (const imagePath of imagesToDelete) {
        try {
          await trainingService.deleteImage(imagePath, domain)
          deleted++
        } catch (err) {
          console.error(`Failed to delete ${imagePath}:`, err)
          failed++
        }
      }

      // Clear selection and reload
      setSelectedImages(new Set())
      await loadFolderImages(selectedFolder, galleryData?.pagination?.page || 1)

      if (failed > 0) {
        setError(`Deleted ${deleted} images, but ${failed} failed to delete.`)
      }
    } catch (err) {
      setError(err.message || 'Failed to delete images')
    } finally {
      setBulkDeleting(false)
    }
  }

  const openLightbox = (image) => {
    setLightboxImage(image)
  }

  const closeLightbox = () => {
    setLightboxImage(null)
  }

  // Calculate global folder index (across all pages)
  const getGlobalFolderIndex = () => {
    if (!filteredFolders || !selectedFolder) return -1
    const localIndex = filteredFolders.findIndex(f => f.name === selectedFolder)
    if (localIndex === -1) return -1
    return (currentPage - 1) * itemsPerPage + localIndex
  }

  // Navigate to previous folder (crosses page boundaries)
  const handlePreviousFolder = () => {
    if (!filteredFolders || filteredFolders.length === 0) return
    const localIndex = filteredFolders.findIndex(f => f.name === selectedFolder)

    if (localIndex > 0) {
      // Previous folder on same page
      const prevFolder = filteredFolders[localIndex - 1]
      setSelectedFolder(prevFolder.name)
      loadFolderImages(prevFolder.name, 1)
      setSelectedImages(new Set())
    } else if (currentPage > 1) {
      // Need to go to previous page and select last folder
      const targetPage = currentPage - 1
      setAutoSelectFolder({ select: 'last', forPage: targetPage })
      setCurrentPage(targetPage)
    }
  }

  // Navigate to next folder (crosses page boundaries)
  const handleNextFolder = () => {
    if (!filteredFolders || filteredFolders.length === 0) return
    const localIndex = filteredFolders.findIndex(f => f.name === selectedFolder)

    if (localIndex < filteredFolders.length - 1) {
      // Next folder on same page
      const nextFolder = filteredFolders[localIndex + 1]
      setSelectedFolder(nextFolder.name)
      loadFolderImages(nextFolder.name, 1)
      setSelectedImages(new Set())
    } else if (currentPage < (pagination.total_pages || 1)) {
      // Need to go to next page and select first folder
      const targetPage = currentPage + 1
      setAutoSelectFolder({ select: 'first', forPage: targetPage })
      setCurrentPage(targetPage)
    }
  }

  // Effect to handle cross-page navigation
  // Only triggers when folders are loaded AND we're on the target page
  useEffect(() => {
    if (autoSelectFolder &&
        filteredFolders &&
        filteredFolders.length > 0 &&
        pagination.page === autoSelectFolder.forPage) {
      if (autoSelectFolder.select === 'first') {
        const firstFolder = filteredFolders[0]
        setSelectedFolder(firstFolder.name)
        loadFolderImages(firstFolder.name, 1)
        setSelectedImages(new Set())
      } else if (autoSelectFolder.select === 'last') {
        const lastFolder = filteredFolders[filteredFolders.length - 1]
        setSelectedFolder(lastFolder.name)
        loadFolderImages(lastFolder.name, 1)
        setSelectedImages(new Set())
      }
      setAutoSelectFolder(null)
    }
  }, [filteredFolders, autoSelectFolder, pagination.page])

  // Get current folder index for navigation display (local to page)
  const getCurrentFolderIndex = () => {
    if (!filteredFolders || !selectedFolder) return -1
    return filteredFolders.findIndex(f => f.name === selectedFolder)
  }

  // Approve current folder (server-side)
  const handleApproveFolder = async () => {
    if (!selectedFolder) return
    try {
      const imageCount = galleryData?.pagination?.total_items || 0
      await trainingService.approvePerson(selectedFolder, domain, view, imageCount)
      // Update local state immediately for responsive UI
      setApprovedFolders(prev => ({
        ...prev,
        [selectedFolder]: {
          approved_at: new Date().toISOString(),
          image_count: imageCount
        }
      }))
    } catch (err) {
      console.error('Failed to approve:', err)
      setError('Failed to save approval')
    }
  }

  // Unapprove current folder (server-side)
  const handleUnapproveFolder = async () => {
    if (!selectedFolder) return
    try {
      await trainingService.unapprovePerson(selectedFolder, domain, view)
      // Update local state immediately
      setApprovedFolders(prev => {
        const newState = { ...prev }
        delete newState[selectedFolder]
        return newState
      })
    } catch (err) {
      console.error('Failed to unapprove:', err)
      setError('Failed to remove approval')
    }
  }

  // Approve and go to next
  const handleApproveAndNext = () => {
    handleApproveFolder()
    handleNextFolder()
  }

  // Delete person from database (for empty entries)
  const [deletingPerson, setDeletingPerson] = useState(false)

  const handleDeletePerson = async () => {
    if (!selectedFolder) return

    const imageCount = galleryData?.pagination?.total_items || 0
    const confirmMsg = imageCount > 0
      ? `Are you sure you want to delete "${selectedFolder}"?\n\nThis will permanently delete ${imageCount} image(s) and the database entry.\n\nThis action cannot be undone.`
      : `Are you sure you want to delete "${selectedFolder}"?\n\nThis person has 0 images and will be removed from the database.`

    if (!confirm(confirmMsg)) return

    setDeletingPerson(true)
    setError(null)

    try {
      const result = await trainingService.deletePerson(selectedFolder, domain)
      if (result.success) {
        // Move to next folder before refreshing (or clear selection if last)
        const localIndex = filteredFolders.findIndex(f => f.name === selectedFolder)
        if (localIndex < filteredFolders.length - 1) {
          // There's a next folder
          const nextFolder = filteredFolders[localIndex + 1]
          setSelectedFolder(nextFolder.name)
          loadFolderImages(nextFolder.name, 1)
        } else if (localIndex > 0) {
          // No next, but there's previous
          const prevFolder = filteredFolders[localIndex - 1]
          setSelectedFolder(prevFolder.name)
          loadFolderImages(prevFolder.name, 1)
        } else {
          // Only folder on page, clear selection
          setSelectedFolder('')
          setGalleryData(null)
        }
        setSelectedImages(new Set())
        // Remove from approved if it was approved
        if (approvedFolders[selectedFolder]) {
          setApprovedFolders(prev => {
            const newState = { ...prev }
            delete newState[selectedFolder]
            return newState
          })
        }
      } else {
        setError(result.error || 'Failed to delete person')
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete person')
    } finally {
      setDeletingPerson(false)
    }
  }

  const renderPagination = () => {
    if (!pagination || pagination.total_pages <= 1) return null

    const pages = []
    const maxPagesToShow = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
    let endPage = Math.min(pagination.total_pages, startPage + maxPagesToShow - 1)

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return (
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', marginTop: '2rem' }}>
        <button
          className="btn"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          style={{
            padding: '0.5rem 1rem',
            opacity: currentPage === 1 ? 0.5 : 1,
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
          }}
        >
          ⏮️ First
        </button>
        <button
          className="btn"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '0.5rem 1rem',
            opacity: currentPage === 1 ? 0.5 : 1,
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
          }}
        >
          ⏪ Prev
        </button>

        {startPage > 1 && <span>...</span>}

        {pages.map((page) => (
          <button
            key={page}
            className="btn"
            onClick={() => handlePageChange(page)}
            style={{
              padding: '0.5rem 1rem',
              background: page === currentPage ? '#f5a623' : '#3a3a3a',
              color: page === currentPage ? 'white' : '#1a202c',
              fontWeight: page === currentPage ? 'bold' : 'normal'
            }}
          >
            {page}
          </button>
        ))}

        {endPage < pagination.total_pages && <span>...</span>}

        <button
          className="btn"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === pagination.total_pages}
          style={{
            padding: '0.5rem 1rem',
            opacity: currentPage === pagination.total_pages ? 0.5 : 1,
            cursor: currentPage === pagination.total_pages ? 'not-allowed' : 'pointer'
          }}
        >
          Next ⏩
        </button>
        <button
          className="btn"
          onClick={() => handlePageChange(pagination.total_pages)}
          disabled={currentPage === pagination.total_pages}
          style={{
            padding: '0.5rem 1rem',
            opacity: currentPage === pagination.total_pages ? 0.5 : 1,
            cursor: currentPage === pagination.total_pages ? 'not-allowed' : 'pointer'
          }}
        >
          Last ⏭️
        </button>

        <span style={{ marginLeft: '1rem', color: '#718096' }}>
          Page {currentPage} of {pagination.total_pages}
        </span>
      </div>
    )
  }

  return (
    <div className="page-container">
      <HelpButton pageName="gallery" />
      <h1>Image Gallery</h1>
      <p className="subtitle">
        Browse and manage training images by domain, view, and folder.
      </p>

      {/* Domain and View Selection */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="domain-select">Domain</label>
            <select
              id="domain-select"
              className="form-input"
              value={domain}
              onChange={handleDomainChange}
              style={{ fontSize: '1rem', padding: '0.75rem' }}
            >
              <option value="serbia">Serbia</option>
              <option value="slovenia">Slovenia</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="view-select">View</label>
            <select
              id="view-select"
              className="form-input"
              value={view}
              onChange={handleViewChange}
              style={{ fontSize: '1rem', padding: '0.75rem' }}
            >
              <option value="production">Production (Live Recognition)</option>
              <option value="staging">Staging (Awaiting Deployment)</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#f7fafc',
            borderRadius: '0.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#718096' }}>Total People</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748' }}>
                {pagination.total_items || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#718096' }}>Total Images</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748' }}>
                {summary.total_images || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#718096' }}>Ready (50+ images)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38a169' }}>
                {summary.ready_for_training || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#718096' }}>Insufficient (&lt;20)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e53e3e' }}>
                {summary.insufficient_images || 0}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination for Folders */}
      {renderPagination()}

      {/* Folder Selection */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label htmlFor="folder-search">Search Person</label>
          <input
            id="folder-search"
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type to filter people..."
            style={{ fontSize: '1rem', padding: '0.75rem' }}
          />
          {searchQuery && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#718096' }}>
              Found {filteredFolders.length} of {foldersData.length} people
            </div>
          )}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <input
            id="hide-approved"
            type="checkbox"
            checked={hideApproved}
            onChange={(e) => setHideApproved(e.target.checked)}
            style={{
              width: '18px',
              height: '18px',
              cursor: 'pointer',
              accentColor: '#f5a623'
            }}
          />
          <label
            htmlFor="hide-approved"
            style={{
              cursor: 'pointer',
              fontSize: '0.95rem',
              color: '#4a5568',
              userSelect: 'none'
            }}
          >
            Hide approved ({Object.keys(approvedFolders).length} approved)
          </label>
        </div>
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
            {filteredFolders && filteredFolders.map((folder, index) => {
              // Use actual filesystem count if we've loaded this folder, otherwise use API count
              const imageCount = actualImageCounts[folder.name] ?? folder.image_count ?? 0
              return (
                <option key={index} value={folder.name}>
                  {isFolderApproved(folder.name) ? '✓ ' : ''}{folder.display_name || folder.name} ({imageCount} images)
                </option>
              )
            })}
          </select>
        </div>

        {/* Person Navigation */}
        {selectedFolder && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '1rem',
            padding: '1rem',
            background: '#f7fafc',
            borderRadius: '0.5rem'
          }}>
            <button
              className="btn"
              onClick={handlePreviousFolder}
              disabled={getGlobalFolderIndex() <= 0}
              style={{
                padding: '0.5rem 1rem',
                opacity: getGlobalFolderIndex() <= 0 ? 0.5 : 1,
                cursor: getGlobalFolderIndex() <= 0 ? 'not-allowed' : 'pointer'
              }}
            >
              ← Previous
            </button>

            <span style={{ color: '#4a5568', fontWeight: '500' }}>
              Person {getGlobalFolderIndex() + 1} of {pagination.total_items || filteredFolders.length}
            </span>

            <button
              className="btn"
              onClick={handleNextFolder}
              disabled={getGlobalFolderIndex() >= (pagination.total_items || filteredFolders.length) - 1}
              style={{
                padding: '0.5rem 1rem',
                opacity: getGlobalFolderIndex() >= (pagination.total_items || filteredFolders.length) - 1 ? 0.5 : 1,
                cursor: getGlobalFolderIndex() >= (pagination.total_items || filteredFolders.length) - 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Next →
            </button>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
              {isFolderApproved(selectedFolder) ? (
                <button
                  className="btn"
                  onClick={handleUnapproveFolder}
                  style={{
                    background: '#718096',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem'
                  }}
                >
                  ✓ Approved - Undo
                </button>
              ) : (
                <>
                  <button
                    className="btn"
                    onClick={handleApproveFolder}
                    style={{
                      background: '#38a169',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className="btn"
                    onClick={handleApproveAndNext}
                    style={{
                      background: '#2b6cb0',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    ✓ Approve & Next →
                  </button>
                </>
              )}
              <button
                className="btn"
                onClick={handleDeletePerson}
                disabled={deletingPerson}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  opacity: deletingPerson ? 0.7 : 1
                }}
                title="Delete this person from the database"
              >
                {deletingPerson ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        )}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>
              {galleryData.folder} - {galleryData.pagination?.total_items || 0} images
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Selection controls - always visible when images selected */}
              {selectedImages.size > 0 && (
                <>
                  <span style={{ color: '#4a5568', fontWeight: '500' }}>
                    {selectedImages.size} selected
                  </span>
                  <button
                    className="btn"
                    onClick={selectAllImages}
                    style={{ background: '#4299e1', color: 'white', border: 'none' }}
                  >
                    Select All
                  </button>
                  <button
                    className="btn"
                    onClick={deselectAllImages}
                    style={{ background: '#718096', color: 'white', border: 'none' }}
                  >
                    Clear
                  </button>
                  <button
                    className="btn"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting}
                    style={{
                      background: '#e53e3e',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
                  </button>
                </>
              )}

              <button
                className="btn"
                onClick={() => loadFolderImages(selectedFolder, galleryData.pagination?.page || 1)}
                style={{ background: '#f5a623', color: 'white', border: 'none' }}
              >
                Refresh
              </button>
            </div>
          </div>

          {galleryData.images && galleryData.images.length > 0 ? (
            <>
              <div className="gallery-grid">
                {galleryData.images.map((image, index) => {
                  const imageName = typeof image === 'string' ? image : image.name
                  const imagePath = typeof image === 'string' ? image : image.path
                  const isSelected = selectedImages.has(imagePath)

                  // All images from database use flat structure
                  // imagePath format: recognized_faces_prod/{domain}/{filename}
                  const imageUrl = `https://facerecognition.mpanel.app/api/training/image/production/${domain}/${imageName}`

                  return (
                    <div
                      key={index}
                      className="gallery-item"
                      style={{
                        border: isSelected ? '3px solid #e53e3e' : '1px solid #3a3a3a',
                        boxShadow: isSelected ? '0 0 10px rgba(229, 62, 62, 0.5)' : 'none',
                        position: 'relative'
                      }}
                    >
                      {/* Selection checkbox - always visible */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          zIndex: 10
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleImageSelection(imagePath)}
                          style={{
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            accentColor: '#e53e3e'
                          }}
                        />
                      </div>
                      <img
                        src={imageUrl}
                        alt={`${galleryData.folder} - ${index + 1}`}
                        onClick={() => openLightbox({ name: imageName, path: imagePath, url: imageUrl })}
                        loading="lazy"
                        style={{ cursor: 'zoom-in' }}
                      />
                      <div className="gallery-item-overlay">
                        <button
                          className="gallery-action-btn view-btn"
                          onClick={() => openLightbox({ name: imageName, path: imagePath, url: imageUrl })}
                          title="View full size"
                        >
                          🔍
                        </button>
                        <button
                          className="gallery-action-btn delete-btn"
                          onClick={() => handleDeleteImage(imagePath)}
                          disabled={deletingImage === imagePath}
                          title="Delete image"
                        >
                          {deletingImage === imagePath ? '⏳' : '🗑️'}
                        </button>
                      </div>
                      <div className="gallery-item-info">
                        <small>{imageName || `Image ${index + 1}`}</small>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination for images within folder */}
              {galleryData.pagination && galleryData.pagination.total_pages > 1 && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', marginTop: '2rem' }}>
                  <button
                    className="btn"
                    onClick={() => loadFolderImages(selectedFolder, 1)}
                    disabled={galleryData.pagination.page === 1}
                    style={{
                      padding: '0.5rem 1rem',
                      opacity: galleryData.pagination.page === 1 ? 0.5 : 1,
                      cursor: galleryData.pagination.page === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    ⏮️ First
                  </button>
                  <button
                    className="btn"
                    onClick={() => loadFolderImages(selectedFolder, galleryData.pagination.page - 1)}
                    disabled={galleryData.pagination.page === 1}
                    style={{
                      padding: '0.5rem 1rem',
                      opacity: galleryData.pagination.page === 1 ? 0.5 : 1,
                      cursor: galleryData.pagination.page === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    ⏪ Prev
                  </button>

                  <span style={{ color: '#718096' }}>
                    Page {galleryData.pagination.page} of {galleryData.pagination.total_pages}
                  </span>

                  <button
                    className="btn"
                    onClick={() => loadFolderImages(selectedFolder, galleryData.pagination.page + 1)}
                    disabled={galleryData.pagination.page === galleryData.pagination.total_pages}
                    style={{
                      padding: '0.5rem 1rem',
                      opacity: galleryData.pagination.page === galleryData.pagination.total_pages ? 0.5 : 1,
                      cursor: galleryData.pagination.page === galleryData.pagination.total_pages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next ⏩
                  </button>
                  <button
                    className="btn"
                    onClick={() => loadFolderImages(selectedFolder, galleryData.pagination.total_pages)}
                    disabled={galleryData.pagination.page === galleryData.pagination.total_pages}
                    style={{
                      padding: '0.5rem 1rem',
                      opacity: galleryData.pagination.page === galleryData.pagination.total_pages ? 0.5 : 1,
                      cursor: galleryData.pagination.page === galleryData.pagination.total_pages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Last ⏭️
                  </button>
                </div>
              )}
            </>
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
          <li><strong>Production View:</strong> Browse all 29k+ images currently used for face recognition</li>
          <li><strong>Staging View:</strong> Review validated images awaiting deployment</li>
          <li><strong>Domain Switching:</strong> Switch between Serbia and Slovenia databases</li>
          <li><strong>Pagination:</strong> Navigate large datasets efficiently (50 items per page)</li>
          <li>Click any image to view full size</li>
          <li>Delete unwanted or low-quality images</li>
          <li>Minimum 20 images per person recommended, 50+ optimal for training</li>
        </ul>
      </div>
    </div>
  )
}
