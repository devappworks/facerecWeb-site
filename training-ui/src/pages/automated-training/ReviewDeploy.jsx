import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { automatedTrainingService } from '../../services/automatedTraining'
import HelpButton from '../../components/HelpButton'

export default function ReviewDeploy() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stagingList, setStagingList] = useState([])
  const [selectedPeople, setSelectedPeople] = useState([])
  const [deploying, setDeploying] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState(null)

  // New state for Not Ready actions
  const [notReadyActions, setNotReadyActions] = useState({}) // { folder_name: 'serp' | 'remove' | null }
  const [applyingActions, setApplyingActions] = useState(false)
  const [actionResult, setActionResult] = useState(null)

  // SERP training progress state
  const [serpBatchId, setSerpBatchId] = useState(null)
  const [serpProgress, setSerpProgress] = useState(null)

  // Running batches modal state
  const [showBatches, setShowBatches] = useState(false)
  const [batchesList, setBatchesList] = useState({ running: [], completed: [] })

  // Image preview state
  const [expandedPerson, setExpandedPerson] = useState(null) // folder_name of expanded person

  useEffect(() => {
    console.log('DEBUG: ReviewDeploy useEffect mounted')
    loadStagingList()
    loadBatches() // Load batches on init to filter out people in SERP training

    // Poll for batches list every 3 seconds to keep SERP training list updated
    const batchInterval = setInterval(loadBatches, 3000)
    return () => clearInterval(batchInterval)
  }, [])

  // Poll for SERP batch status when we have a batch ID
  useEffect(() => {
    if (!serpBatchId) return

    const pollStatus = async () => {
      try {
        const status = await automatedTrainingService.getSerpBatchStatus(serpBatchId)
        setSerpProgress(status)

        // Stop polling when complete
        if (status.status === 'completed') {
          setSerpBatchId(null)
          // Reload staging list to see updated photo counts
          setTimeout(() => loadStagingList(), 1000)
        }
      } catch (err) {
        console.error('Failed to poll SERP status:', err)
      }
    }

    // Initial poll
    pollStatus()

    // Poll every 2 seconds
    const interval = setInterval(pollStatus, 2000)
    return () => clearInterval(interval)
  }, [serpBatchId])

  const loadStagingList = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await automatedTrainingService.getStagingList('serbia')
      console.log('DEBUG: loadStagingList response:', response)
      if (response.success) {
        console.log('DEBUG: Setting stagingList with', response.people.length, 'people')
        setStagingList(response.people)
        const readyPeople = response.people
          .filter((p) => p.ready_for_production)
          .map((p) => p.folder_name)
        console.log('DEBUG: readyPeople from response:', readyPeople)
        setSelectedPeople(readyPeople)
        setNotReadyActions({}) // Reset actions
        setActionResult(null)
      } else {
        throw new Error(response.message || 'Failed to load staging list')
      }
    } catch (err) {
      setError(err.message || 'Failed to load staging list')
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePerson = (folderName) => {
    setSelectedPeople((prev) =>
      prev.includes(folderName)
        ? prev.filter((f) => f !== folderName)
        : [...prev, folderName]
    )
  }

  const handleSelectAllReady = () => {
    const readyPeople = stagingList
      .filter((p) => p.ready_for_production)
      .map((p) => p.folder_name)
    setSelectedPeople(readyPeople)
  }

  const handleDeselectAll = () => {
    setSelectedPeople([])
  }

  const handleDeploy = async () => {
    if (selectedPeople.length === 0) {
      alert('Please select at least one person to deploy')
      return
    }

    if (!confirm(`Deploy ${selectedPeople.length} people to production?`)) {
      return
    }

    setDeploying(true)
    setDeploymentResult(null)
    setError(null)

    try {
      const response = await automatedTrainingService.deployToProduction(
        selectedPeople,
        'serbia'
      )
      if (response.success) {
        setDeploymentResult(response)
        setTimeout(() => {
          loadStagingList()
          setSelectedPeople([])
        }, 2000)
      } else {
        throw new Error(response.message || 'Deployment failed')
      }
    } catch (err) {
      setError(err.message || 'Deployment failed')
    } finally {
      setDeploying(false)
    }
  }

  // Handle Not Ready action selection (SERP or Remove)
  const handleNotReadyAction = (folderName, action) => {
    setNotReadyActions((prev) => {
      const newActions = { ...prev }
      if (newActions[folderName] === action) {
        // Toggle off if clicking same action
        delete newActions[folderName]
      } else {
        newActions[folderName] = action
      }
      return newActions
    })
  }

  // Apply actions for Not Ready people
  const handleApplyActions = async () => {
    const serpPeople = []
    const removePeople = []

    Object.entries(notReadyActions).forEach(([folderName, action]) => {
      if (action === 'serp') {
        serpPeople.push({
          folder_name: folderName,
          full_name: folderName.replace(/_/g, ' ')
        })
      } else if (action === 'remove') {
        removePeople.push(folderName)
      }
    })

    if (serpPeople.length === 0 && removePeople.length === 0) {
      alert('Please select at least one action')
      return
    }

    const confirmMessage = []
    if (serpPeople.length > 0) {
      confirmMessage.push(`Train ${serpPeople.length} via SERP`)
    }
    if (removePeople.length > 0) {
      confirmMessage.push(`Remove ${removePeople.length}`)
    }

    if (!confirm(`Apply actions?\n\n${confirmMessage.join('\n')}`)) {
      return
    }

    setApplyingActions(true)
    setActionResult(null)

    try {
      const results = { serp: null, remove: null }

      // Start SERP training (runs in background)
      if (serpPeople.length > 0) {
        results.serp = await automatedTrainingService.trainViaSERP(serpPeople, 'serbia')
        // Start polling for status
        if (results.serp.batch_id) {
          setSerpBatchId(results.serp.batch_id)
        }
      }

      // Remove people
      if (removePeople.length > 0) {
        results.remove = await automatedTrainingService.removeFromStaging(removePeople, 'serbia')
      }

      setActionResult(results)
      setNotReadyActions({})

      // If we have removals but no SERP, reload immediately
      if (removePeople.length > 0 && serpPeople.length === 0) {
        setTimeout(() => loadStagingList(), 1000)
      }
      // If we have SERP, the polling will reload when complete
    } catch (err) {
      setError(err.message || 'Failed to apply actions')
    } finally {
      setApplyingActions(false)
    }
  }

  // Load SERP batches list
  const loadBatches = async () => {
    try {
      const response = await automatedTrainingService.listAllBatches()
      if (response.success) {
        setBatchesList({
          running: response.running_batches || [],
          completed: response.completed_batches || []
        })
      }
    } catch (err) {
      console.error('Failed to load batches:', err)
    }
  }

  // Helper function to get gallery URL for a person by their folder name
  const getGalleryUrl = (folderName) => {
    const allBatches = [...batchesList.running, ...batchesList.completed]
    for (const batch of allBatches) {
      const person = batch.people?.find(p => p.folder_name === folderName)
      if (person?.gallery_url) {
        return person.gallery_url
      }
    }
    return null
  }

  // Toggle image preview for a person
  const toggleImagePreview = (folderName) => {
    setExpandedPerson(expandedPerson === folderName ? null : folderName)
  }

  // Get API base URL for images
  const getImageUrl = (url) => {
    // Use the API base URL from environment or default
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://facerecognition.mpanel.app'
    return `${baseUrl}${url}`
  }

  // Handle image load error - just log it, don't modify state
  // Images that fail to load will show as broken but count stays accurate
  const handleImageError = (folderName, filename, e) => {
    console.warn(`Image failed to load: ${folderName}/${filename}`)
    // Hide the broken image container
    if (e?.target?.parentElement) {
      e.target.parentElement.style.display = 'none'
    }
  }

  // Delete a single image from staging (no confirmation - quick workflow)
  const handleDeleteImage = async (folderName, filename, e) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const response = await automatedTrainingService.deleteStagingImage('serbia', folderName, filename)
      if (response.success) {
        // Update the local state to remove the image
        setStagingList(prev => prev.map(person => {
          if (person.folder_name === folderName) {
            return {
              ...person,
              images: person.images.filter(img => img.filename !== filename),
              image_count: response.remaining_images,
              ready_for_production: response.remaining_images >= 5,
              status: response.remaining_images >= 5 ? 'ready' : 'insufficient'
            }
          }
          return person
        }))
      }
    } catch (err) {
      alert('Failed to delete image: ' + err.message)
    }
  }

  // Approve/deploy a single person to production
  const handleApprovePerson = async (folderName) => {
    try {
      const response = await automatedTrainingService.deployToProduction([folderName], 'serbia')
      if (response.success) {
        // Remove from staging list
        setStagingList(prev => prev.filter(p => p.folder_name !== folderName))
        // Also remove from selected if it was selected
        setSelectedPeople(prev => prev.filter(f => f !== folderName))
      } else {
        alert('Failed to approve: ' + (response.message || 'Unknown error'))
      }
    } catch (err) {
      alert('Failed to approve: ' + err.message)
    }
  }

  // Remove a single person from staging (for Ready people)
  const handleRemoveFromStaging = async (folderName) => {
    if (!confirm(`Remove "${folderName.replace(/_/g, ' ')}" from staging?`)) {
      return
    }

    try {
      const response = await automatedTrainingService.removeFromStaging([folderName], 'serbia')
      if (response.success) {
        loadStagingList()
      } else {
        alert('Failed to remove: ' + (response.message || 'Unknown error'))
      }
    } catch (err) {
      alert('Failed to remove: ' + err.message)
    }
  }

  const readyPeople = stagingList.filter((p) => p.ready_for_production)

  // DEBUG: Log readyPeople to see if it has gallery_url
  console.log('DEBUG readyPeople for rendering:', readyPeople)

  // Get list of folder names currently in SERP training
  const peopleInSerpTraining = new Set(
    batchesList.running.flatMap((batch) =>
      (batch.people || [])
        .filter((p) => p.status === 'queued' || p.status === 'processing')
        .map((p) => p.folder_name)
    )
  )

  // Filter out people currently in SERP training from "Not Ready" list
  const notReadyPeople = stagingList.filter(
    (p) => !p.ready_for_production && !peopleInSerpTraining.has(p.folder_name)
  )

  // People currently in SERP training (show separately)
  const inSerpPeople = stagingList.filter(
    (p) => !p.ready_for_production && peopleInSerpTraining.has(p.folder_name)
  )

  const totalPhotos = stagingList
    .filter((p) => selectedPeople.includes(p.folder_name))
    .reduce((sum, p) => sum + p.image_count, 0)

  // Count selected actions
  const serpCount = Object.values(notReadyActions).filter((a) => a === 'serp').length
  const removeCount = Object.values(notReadyActions).filter((a) => a === 'remove').length
  const hasSelectedActions = serpCount > 0 || removeCount > 0

  // Inline styles to avoid CSS conflicts
  const styles = {
    page: {
      width: '100%',
      minHeight: '100vh',
      padding: '24px',
      paddingBottom: '100px',
      boxSizing: 'border-box',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      marginBottom: '24px',
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#1a1a1a',
      margin: '0 0 8px 0',
    },
    subtitle: {
      color: '#666',
      margin: 0,
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      marginBottom: '24px',
    },
    statCard: {
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid #e0e0e0',
      backgroundColor: '#fff',
    },
    statLabel: {
      fontSize: '14px',
      color: '#666',
      marginBottom: '4px',
    },
    statValue: {
      fontSize: '36px',
      fontWeight: 'bold',
      margin: 0,
    },
    buttonRow: {
      display: 'flex',
      gap: '12px',
      marginBottom: '24px',
      flexWrap: 'wrap',
    },
    btn: {
      padding: '10px 16px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '14px',
    },
    section: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      border: '1px solid #e0e0e0',
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#1a1a1a',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    personCard: {
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    personName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1a1a1a',
      textTransform: 'capitalize',
      margin: '0 0 4px 0',
    },
    badge: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
    },
    checkbox: {
      width: '20px',
      height: '20px',
      cursor: 'pointer',
    },
    floatingButton: {
      position: 'fixed',
      bottom: '24px',
      right: '90px',
      padding: '14px 24px',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '15px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    actionCheckbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      border: '2px solid transparent',
      transition: 'all 0.2s',
    },
    imageGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
      gap: '8px',
      padding: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      marginTop: '12px',
      overflow: 'visible',  // Ensure no hidden overflow
    },
    imageThumbnail: {
      width: '100%',
      aspectRatio: '1',
      objectFit: 'cover',
      borderRadius: '6px',
      border: '2px solid #e0e0e0',
      cursor: 'pointer',
      transition: 'transform 0.2s, border-color 0.2s',
    },
    expandButton: {
      padding: '6px 12px',
      backgroundColor: '#eff6ff',
      color: '#1d4ed8',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    imageContainer: {
      position: 'relative',
      display: 'inline-block',
    },
    deleteImageBtn: {
      position: 'absolute',
      top: '4px',
      right: '4px',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      backgroundColor: 'rgba(220, 38, 38, 0.9)',
      color: '#fff',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: 'bold',
      lineHeight: 1,
      padding: 0,
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      zIndex: 10,
    },
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={{ ...styles.section, textAlign: 'center', padding: '48px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e0e0e0',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{ color: '#666' }}>Loading staging list...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !deploymentResult) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={{
            ...styles.section,
            backgroundColor: '#fef2f2',
            borderColor: '#fecaca',
          }}>
            <p style={{ fontWeight: '600', color: '#dc2626', marginBottom: '8px' }}>Error</p>
            <p style={{ color: '#991b1b', marginBottom: '16px' }}>{error}</p>
            <button
              onClick={loadStagingList}
              style={{
                ...styles.btn,
                backgroundColor: '#dc2626',
                color: '#fff',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <HelpButton pageName="automated-review" />

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Review & Deploy</h1>
          <p style={styles.subtitle}>
            Review trained people in staging and deploy to production
          </p>
        </div>

        {/* SERP Training Progress */}
        {serpProgress && (
          <div style={{
            ...styles.section,
            backgroundColor: serpProgress.status === 'completed' ? '#f0fdf4' : '#eff6ff',
            borderColor: serpProgress.status === 'completed' ? '#86efac' : '#93c5fd',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <p style={{ fontWeight: '600', color: serpProgress.status === 'completed' ? '#166534' : '#1d4ed8', margin: 0 }}>
                {serpProgress.status === 'completed' ? 'SERP Training Complete' : 'SERP Training in Progress'}
              </p>
              <span style={{
                ...styles.badge,
                backgroundColor: serpProgress.status === 'completed' ? '#16a34a' : '#3b82f6',
                color: '#fff',
              }}>
                {serpProgress.completed}/{serpProgress.total} completed
              </span>
            </div>

            {/* Progress bar */}
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e0e0e0',
              borderRadius: '4px',
              marginBottom: '12px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${(serpProgress.completed / serpProgress.total) * 100}%`,
                height: '100%',
                backgroundColor: serpProgress.status === 'completed' ? '#16a34a' : '#3b82f6',
                transition: 'width 0.3s ease',
              }} />
            </div>

            {/* Current person being processed */}
            {serpProgress.current_person && (
              <p style={{ color: '#1d4ed8', margin: '0 0 12px 0', fontSize: '14px' }}>
                Currently processing: <strong>{serpProgress.current_person}</strong>
              </p>
            )}

            {/* Per-person status list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {serpProgress.people?.map((person, idx) => (
                <div
                  key={person.folder_name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    backgroundColor: person.status === 'completed' ? '#dcfce7' :
                      person.status === 'processing' ? '#dbeafe' :
                        person.status === 'failed' ? '#fef2f2' : '#333',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  {/* Status icon */}
                  <span style={{ fontSize: '16px' }}>
                    {person.status === 'completed' ? '\u2713' :
                      person.status === 'processing' ? '\u21BB' :
                        person.status === 'failed' ? '\u2717' : '\u2022'}
                  </span>

                  {/* Name */}
                  <span style={{
                    flex: 1,
                    fontWeight: person.status === 'processing' ? '600' : '400',
                    color: person.status === 'failed' ? '#dc2626' : '#1a1a1a',
                  }}>
                    {person.full_name}
                  </span>

                  {/* Photo count */}
                  {person.status === 'completed' && (
                    <span style={{ color: '#16a34a', fontWeight: '500' }}>
                      +{person.photos_added} photos ({person.photos_after} total)
                    </span>
                  )}

                  {/* Error message */}
                  {person.status === 'failed' && person.error && (
                    <span style={{ color: '#dc2626', fontSize: '12px' }}>
                      {person.error.substring(0, 50)}...
                    </span>
                  )}

                  {/* Status badge */}
                  <span style={{
                    ...styles.badge,
                    backgroundColor:
                      person.status === 'completed' ? '#16a34a' :
                        person.status === 'processing' ? '#3b82f6' :
                          person.status === 'failed' ? '#dc2626' : '#9ca3af',
                    color: '#fff',
                    fontSize: '11px',
                    padding: '2px 8px',
                  }}>
                    {person.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            {/* Dismiss button when complete */}
            {serpProgress.status === 'completed' && (
              <button
                onClick={() => setSerpProgress(null)}
                style={{
                  ...styles.btn,
                  marginTop: '12px',
                  backgroundColor: '#16a34a',
                  color: '#fff',
                }}
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* Action Result */}
        {actionResult && !serpProgress && (
          <div style={{
            ...styles.section,
            backgroundColor: '#f0fdf4',
            borderColor: '#86efac',
            marginBottom: '16px',
          }}>
            <p style={{ fontWeight: '600', color: '#166534', marginBottom: '8px' }}>
              Actions Applied
            </p>
            {actionResult.serp && (
              <p style={{ color: '#15803d', margin: '4px 0' }}>
                SERP training started for {actionResult.serp.people_count} people (processing in background)
              </p>
            )}
            {actionResult.remove && (
              <p style={{ color: '#15803d', margin: '4px 0' }}>
                Removed {actionResult.remove.removed_count} people from staging
              </p>
            )}
          </div>
        )}

        {/* Deployment Result */}
        {deploymentResult && (
          <div style={{
            ...styles.section,
            backgroundColor: '#f0fdf4',
            borderColor: '#86efac',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '18px', fontWeight: '600', color: '#166534', margin: 0 }}>
                Deployment Complete!
              </p>
              <span style={{ fontSize: '14px', color: '#15803d' }}>
                {new Date().toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {/* Successfully Deployed */}
              <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #86efac' }}>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Successfully Deployed</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a', margin: '0 0 12px 0' }}>
                  {deploymentResult.deployed?.length || 0}
                </p>
                {deploymentResult.deployed?.map((item) => (
                  <div key={item.folder} style={{ fontSize: '12px', backgroundColor: '#f0fdf4', padding: '8px', borderRadius: '4px', marginBottom: '4px' }}>
                    <p style={{ fontWeight: '500', color: '#166534', margin: '0 0 4px 0' }}>
                      {item.folder.replace(/_/g, ' ')}
                    </p>
                    <p style={{ color: '#15803d', margin: 0 }}>{item.image_count} photos added</p>
                    {item.duplicates_skipped > 0 && (
                      <p style={{ color: '#ea580c', margin: '4px 0 0 0' }}>{item.duplicates_skipped} duplicates skipped</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Skipped */}
              <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #fde047' }}>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Skipped (Not Ready)</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#ca8a04', margin: '0 0 12px 0' }}>
                  {deploymentResult.skipped?.length || 0}
                </p>
                {deploymentResult.skipped?.map((item) => (
                  <div key={item.folder} style={{ fontSize: '12px', backgroundColor: '#fefce8', padding: '8px', borderRadius: '4px', marginBottom: '4px' }}>
                    <p style={{ fontWeight: '500', color: '#854d0e', margin: '0 0 4px 0' }}>
                      {item.folder.replace(/_/g, ' ')}
                    </p>
                    <p style={{ color: '#a16207', margin: 0 }}>{item.reason}</p>
                  </div>
                ))}
              </div>

              {/* Errors */}
              <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Errors</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626', margin: '0 0 12px 0' }}>
                  {deploymentResult.errors?.length || 0}
                </p>
                {deploymentResult.errors?.map((item) => (
                  <div key={item.folder} style={{ fontSize: '12px', backgroundColor: '#fef2f2', padding: '8px', borderRadius: '4px', marginBottom: '4px' }}>
                    <p style={{ fontWeight: '500', color: '#991b1b', margin: '0 0 4px 0' }}>
                      {item.folder.replace(/_/g, ' ')}
                    </p>
                    <p style={{ color: '#b91c1c', margin: 0 }}>{item.error}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div style={styles.statsGrid}>
          <div style={{ ...styles.statCard, borderLeftColor: '#3b82f6', borderLeftWidth: '4px' }}>
            <p style={styles.statLabel}>Total in Staging</p>
            <p style={{ ...styles.statValue, color: '#3b82f6' }}>{stagingList.length}</p>
          </div>
          <div style={{ ...styles.statCard, borderLeftColor: '#16a34a', borderLeftWidth: '4px' }}>
            <p style={styles.statLabel}>Ready for Production</p>
            <p style={{ ...styles.statValue, color: '#16a34a' }}>{readyPeople.length}</p>
          </div>
          <div style={{ ...styles.statCard, borderLeftColor: '#ca8a04', borderLeftWidth: '4px' }}>
            <p style={styles.statLabel}>Not Ready</p>
            <p style={{ ...styles.statValue, color: '#ca8a04' }}>{notReadyPeople.length}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.buttonRow}>
          <button
            onClick={handleSelectAllReady}
            style={{ ...styles.btn, backgroundColor: '#dcfce7', color: '#166534' }}
          >
            Select All Ready ({readyPeople.length})
          </button>
          <button
            onClick={handleDeselectAll}
            style={{ ...styles.btn, backgroundColor: '#333', color: '#999' }}
          >
            Deselect All
          </button>
          <button
            onClick={loadStagingList}
            style={{ ...styles.btn, backgroundColor: '#dbeafe', color: '#1d4ed8' }}
          >
            Refresh
          </button>
          <button
            onClick={() => { loadBatches(); setShowBatches(true) }}
            style={{ ...styles.btn, backgroundColor: '#fef3c7', color: '#92400e' }}
          >
            View SERP Batches
          </button>
          <button
            onClick={handleDeploy}
            disabled={deploying || selectedPeople.length === 0}
            style={{
              ...styles.btn,
              marginLeft: 'auto',
              backgroundColor: deploying || selectedPeople.length === 0 ? '#9ca3af' : '#16a34a',
              color: '#fff',
              cursor: deploying || selectedPeople.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {deploying
              ? 'Deploying...'
              : `Deploy to Production (${selectedPeople.length} ${selectedPeople.length === 1 ? 'person' : 'people'}, ${totalPhotos} photos)`}
          </button>
        </div>

        {/* Ready for Production */}
        {readyPeople.length > 0 && (
          <div style={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={styles.sectionTitle}>
                <span style={{ color: '#16a34a' }}>&#10003;</span>
                Ready for Production
              </h2>
              <span style={{ ...styles.badge, backgroundColor: '#dcfce7', color: '#166534' }}>
                5+ valid photos
              </span>
            </div>
            <div>
              {readyPeople.map((person) => (
                <div
                  key={person.folder_name}
                  style={{
                    ...styles.personCard,
                    backgroundColor: '#f0fdf4',
                    border: '2px solid #86efac',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <input
                      type="checkbox"
                      checked={selectedPeople.includes(person.folder_name)}
                      onChange={() => handleTogglePerson(person.folder_name)}
                      style={styles.checkbox}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={styles.personName}>
                        {person.full_name || person.folder_name.replace(/_/g, ' ')}
                      </p>
                      <span style={{ ...styles.badge, backgroundColor: '#bbf7d0', color: '#166534' }}>
                        {person.image_count} photos
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        onClick={() => toggleImagePreview(person.folder_name)}
                        style={{
                          ...styles.expandButton,
                          backgroundColor: expandedPerson === person.folder_name ? '#dbeafe' : '#eff6ff',
                        }}
                      >
                        {expandedPerson === person.folder_name ? '▲ Hide' : '▼ Show'} Photos
                      </button>
                      <button
                        onClick={() => handleApprovePerson(person.folder_name)}
                        style={{
                          ...styles.btn,
                          padding: '6px 16px',
                          backgroundColor: '#16a34a',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRemoveFromStaging(person.folder_name)}
                        style={{
                          ...styles.btn,
                          padding: '6px 12px',
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          fontSize: '12px',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Image Preview Grid */}
                  {expandedPerson === person.folder_name && person.images && (
                    <div style={styles.imageGrid}>
                      {(() => {
                        console.log(`DEBUG: Rendering ${person.images.length} images for ${person.folder_name}:`, person.images.map(i => i.filename))
                        return null
                      })()}
                      {person.images.map((img, idx) => (
                        <div key={`${person.folder_name}-${img.filename}-${idx}`} style={styles.imageContainer}>
                          <button
                            onClick={(e) => handleDeleteImage(person.folder_name, img.filename, e)}
                            style={styles.deleteImageBtn}
                            title="Delete this image"
                          >
                            ×
                          </button>
                          <a
                            href={getImageUrl(img.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={getImageUrl(img.url)}
                              alt={img.filename}
                              style={styles.imageThumbnail}
                              onError={(e) => handleImageError(person.folder_name, img.filename, e)}
                            />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Currently in SERP Training */}
        {inSerpPeople.length > 0 && (
          <div style={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={styles.sectionTitle}>
                <span style={{ color: '#3b82f6' }}>&#8635;</span>
                Currently in SERP Training
              </h2>
              <span style={{ ...styles.badge, backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                {inSerpPeople.length} people processing
              </span>
            </div>
            <div>
              {inSerpPeople.map((person) => (
                <div
                  key={person.folder_name}
                  style={{
                    ...styles.personCard,
                    backgroundColor: '#eff6ff',
                    border: '2px solid #93c5fd',
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '3px solid #3b82f6',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  <div style={{ flex: 1 }}>
                    <p style={styles.personName}>
                      {person.full_name || person.folder_name.replace(/_/g, ' ')}
                    </p>
                    <span style={{ ...styles.badge, backgroundColor: '#bfdbfe', color: '#1d4ed8' }}>
                      {person.image_count} photos (searching for more...)
                    </span>
                  </div>
                  <span style={{ ...styles.badge, backgroundColor: '#3b82f6', color: '#fff' }}>
                    SERP TRAINING
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Not Ready for Production */}
        {notReadyPeople.length > 0 && (
          <div style={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={styles.sectionTitle}>
                <span style={{ color: '#ca8a04' }}>&#9888;</span>
                Not Ready for Production
              </h2>
              <span style={{ ...styles.badge, backgroundColor: '#fef2f2', color: '#dc2626' }}>
                Less than 5 photos - select action below
              </span>
            </div>
            <div>
              {notReadyPeople.map((person) => {
                const action = notReadyActions[person.folder_name]
                return (
                  <div
                    key={person.folder_name}
                    style={{
                      ...styles.personCard,
                      backgroundColor: '#fefce8',
                      border: '2px solid #fde047',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <p style={styles.personName}>
                          {person.full_name || person.folder_name.replace(/_/g, ' ')}
                        </p>
                        <span style={{ ...styles.badge, backgroundColor: '#fecaca', color: '#991b1b' }}>
                          Only {person.image_count} {person.image_count === 1 ? 'photo' : 'photos'}
                        </span>
                      </div>

                      {/* Action checkboxes */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => toggleImagePreview(person.folder_name)}
                          style={{
                            ...styles.expandButton,
                            backgroundColor: expandedPerson === person.folder_name ? '#fef3c7' : '#fffbeb',
                          }}
                        >
                          {expandedPerson === person.folder_name ? '▲ Hide' : '▼ Show'} Photos
                        </button>
                        <label
                          style={{
                            ...styles.actionCheckbox,
                            backgroundColor: action === 'serp' ? '#dbeafe' : '#333',
                            borderColor: action === 'serp' ? '#3b82f6' : 'transparent',
                            color: action === 'serp' ? '#1d4ed8' : '#666',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={action === 'serp'}
                            onChange={() => handleNotReadyAction(person.folder_name, 'serp')}
                            style={{ width: '16px', height: '16px' }}
                          />
                          Add via SERP
                        </label>
                        <label
                          style={{
                            ...styles.actionCheckbox,
                            backgroundColor: action === 'remove' ? '#fef2f2' : '#333',
                            borderColor: action === 'remove' ? '#dc2626' : 'transparent',
                            color: action === 'remove' ? '#dc2626' : '#666',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={action === 'remove'}
                            onChange={() => handleNotReadyAction(person.folder_name, 'remove')}
                            style={{ width: '16px', height: '16px' }}
                          />
                          Remove
                        </label>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '80px' }}>
                        <span style={{ ...styles.badge, backgroundColor: '#ca8a04', color: '#fff' }}>
                          NOT READY
                        </span>
                        <p style={{ fontSize: '12px', color: '#dc2626', margin: '8px 0 0 0' }}>
                          Needs {5 - person.image_count} more
                        </p>
                      </div>
                    </div>

                    {/* Image Preview Grid */}
                    {expandedPerson === person.folder_name && person.images && (
                      <div style={{ ...styles.imageGrid, backgroundColor: '#fef9e7' }}>
                        {(() => {
                          console.log(`DEBUG: Rendering ${person.images.length} images for ${person.folder_name} (not ready):`, person.images.map(i => i.filename))
                          return null
                        })()}
                        {person.images.map((img, idx) => (
                          <div key={`${person.folder_name}-${img.filename}-${idx}`} style={styles.imageContainer}>
                            <button
                              onClick={(e) => handleDeleteImage(person.folder_name, img.filename, e)}
                              style={styles.deleteImageBtn}
                              title="Delete this image"
                            >
                              ×
                            </button>
                            <a
                              href={getImageUrl(img.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={getImageUrl(img.url)}
                                alt={img.filename}
                                style={styles.imageThumbnail}
                                onError={(e) => handleImageError(person.folder_name, img.filename, e)}
                              />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Info box */}
            <div style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#eff6ff',
              borderLeft: '4px solid #3b82f6',
              borderRadius: '0 8px 8px 0',
            }}>
              <p style={{ fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>How to handle Not Ready people:</p>
              <ul style={{ color: '#666', margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                <li style={{ marginBottom: '4px' }}><strong>Add via SERP</strong>: Search Google for more photos and add them to training</li>
                <li><strong>Remove</strong>: Delete from staging (cannot be deployed with less than 5 photos)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Floating Apply Button for Not Ready actions */}
        {hasSelectedActions && (
          <button
            onClick={handleApplyActions}
            disabled={applyingActions}
            style={{
              ...styles.floatingButton,
              backgroundColor: applyingActions ? '#9ca3af' : '#3b82f6',
              color: '#fff',
              cursor: applyingActions ? 'not-allowed' : 'pointer',
            }}
          >
            {applyingActions ? (
              'Applying...'
            ) : (
              <>
                Apply Actions
                {serpCount > 0 && <span style={{ backgroundColor: '#1d4ed8', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>SERP: {serpCount}</span>}
                {removeCount > 0 && <span style={{ backgroundColor: '#dc2626', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Remove: {removeCount}</span>}
              </>
            )}
          </button>
        )}

        {/* Empty State */}
        {stagingList.length === 0 && (
          <div style={{ ...styles.section, textAlign: 'center', padding: '48px' }}>
            <p style={{ color: '#666', fontSize: '16px', marginBottom: '16px' }}>
              No people in staging. Complete a batch training first.
            </p>
            <button
              onClick={() => navigate('/training/generate')}
              style={{ ...styles.btn, backgroundColor: '#3b82f6', color: '#fff' }}
            >
              Start New Batch
            </button>
          </div>
        )}

        {/* SERP Batches Modal */}
        {showBatches && (
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
            zIndex: 2000,
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>SERP Training Batches</h2>
                <button
                  onClick={() => setShowBatches(false)}
                  style={{
                    ...styles.btn,
                    backgroundColor: '#333',
                    color: '#999',
                    padding: '8px 16px',
                  }}
                >
                  Close
                </button>
              </div>

              {/* Running Batches */}
              {batchesList.running.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1d4ed8', marginBottom: '12px' }}>
                    Running ({batchesList.running.length})
                  </h3>
                  {batchesList.running.map((batch) => (
                    <div
                      key={batch.batch_id}
                      style={{
                        backgroundColor: '#eff6ff',
                        border: '1px solid #93c5fd',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '600', color: '#1d4ed8' }}>
                          Batch: {batch.batch_id?.substring(0, 20)}...
                        </span>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: '#3b82f6',
                          color: '#fff',
                        }}>
                          {batch.completed}/{batch.total} completed
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#dbeafe',
                        borderRadius: '3px',
                        marginBottom: '8px',
                      }}>
                        <div style={{
                          width: `${(batch.completed / batch.total) * 100}%`,
                          height: '100%',
                          backgroundColor: '#3b82f6',
                          borderRadius: '3px',
                        }} />
                      </div>
                      <div style={{ fontSize: '13px', color: '#4b5563' }}>
                        {batch.people?.map((p) => (
                          <span
                            key={p.folder_name}
                            style={{
                              display: 'inline-block',
                              backgroundColor: p.status === 'completed' ? '#dcfce7' :
                                p.status === 'processing' ? '#dbeafe' : '#333',
                              color: p.status === 'completed' ? '#166534' :
                                p.status === 'processing' ? '#1d4ed8' : '#666',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              marginRight: '4px',
                              marginBottom: '4px',
                              fontSize: '12px',
                            }}
                          >
                            {p.full_name} ({p.status})
                          </span>
                        ))}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
                        Started: {new Date(batch.started_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Completed Batches */}
              {batchesList.completed.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#16a34a', marginBottom: '12px' }}>
                    Recently Completed ({batchesList.completed.length})
                  </h3>
                  {batchesList.completed.map((batch) => (
                    <div
                      key={batch.batch_id}
                      style={{
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: '500', color: '#166534', fontSize: '14px' }}>
                            {batch.people?.map((p) => p.full_name).join(', ')}
                          </span>
                          <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px' }}>
                            {batch.total} people processed
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            ...styles.badge,
                            backgroundColor: '#16a34a',
                            color: '#fff',
                            fontSize: '11px',
                          }}>
                            COMPLETED
                          </span>
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                            {batch.completed_at ? new Date(batch.completed_at).toLocaleString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No batches */}
              {batchesList.running.length === 0 && batchesList.completed.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
                  <p>No SERP batches found.</p>
                  <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                    Start SERP training from the "Not Ready" section below.
                  </p>
                </div>
              )}

              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <button
                  onClick={() => loadBatches()}
                  style={{
                    ...styles.btn,
                    backgroundColor: '#dbeafe',
                    color: '#1d4ed8',
                    marginRight: '8px',
                  }}
                >
                  Refresh
                </button>
                <button
                  onClick={() => setShowBatches(false)}
                  style={{
                    ...styles.btn,
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
