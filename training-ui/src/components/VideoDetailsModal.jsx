import { useState } from 'react'
import Tooltip from './Tooltip'
import VideoPlayer from './VideoPlayer'

export default function VideoDetailsModal({ video, onClose }) {
  const [activeTab, setActiveTab] = useState('player')

  if (!video) return null

  const getRecognitionRateColor = (rate) => {
    if (rate >= 70) return '#10b981'
    if (rate >= 40) return '#f59e0b'
    return '#ef4444'
  }

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A'
    const date = new Date(isoString)
    return date.toLocaleString()
  }

  // Support both old format (flat) and new format (nested under face_recognition)
  const faceRec = video.face_recognition || {}
  const isFaceRecInProgress = video.face_recognition === null && video.processing_stage !== 'complete'

  const stats = video.statistics || faceRec.statistics || {}
  const perf = video.performance || faceRec.performance || {}
  const extraction = video.extraction_info || faceRec.extraction_info || {}
  const results = video.results || faceRec.frame_results || []

  // Multi-frame voting can be at root level, face_recognition level, or inside tracking_results
  const trackingResults = faceRec.tracking_results || {}
  const identityResults = trackingResults.identity_results || {}

  // Build compatible multi_frame_voting structure from tracking results
  const buildMultiFrameVotingFromTracking = () => {
    const confirmed = identityResults.confirmed_persons || {}

    // Convert tracking format to multi_frame_voting format expected by UI
    const filtered_persons = {}
    Object.entries(confirmed).forEach(([name, data]) => {
      filtered_persons[name] = {
        frame_count: data.total_frames || 0,
        weighted_score: (data.avg_confidence || 0) * (data.total_frames || 0),
        avg_confidence: data.avg_confidence || 0,
        best_confidence: data.avg_confidence || 0, // Not available in tracking format
        occurrence_rate: 0
      }
    })

    return {
      primary_person: identityResults.primary_person,
      filtered_persons: filtered_persons,
      min_frame_occurrence: trackingResults.parameters?.min_track_length,
      use_weighted_voting: true,
      persons_filtered_out: identityResults.unresolved_tracks?.map(t => t.top_candidate) || [],
      all_detected_persons: filtered_persons,
      blacklisted_persons: []
    }
  }

  // Try multi_frame_voting from different locations
  const multiFrameVoting = video.multi_frame_voting ||
                           faceRec.multi_frame_voting ||
                           (identityResults.confirmed_persons ? buildMultiFrameVotingFromTracking() : {})

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '1200px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #3a3a3a', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h2 style={{ margin: 0 }}>Video Recognition Details</h2>
            <p style={{ color: '#718096', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
              Video ID: <code style={{ fontSize: '0.85rem' }}>{video.video_id}</code>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#718096',
              padding: '0.25rem 0.5rem'
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{ padding: '0 1.5rem', borderBottom: '1px solid #3a3a3a', display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setActiveTab('player')}
            style={{
              background: 'none',
              border: 'none',
              padding: '1rem 0.5rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'player' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'player' ? '#3b82f6' : '#718096',
              fontWeight: activeTab === 'player' ? '500' : 'normal'
            }}
          >
            🎬 Video Player
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              background: 'none',
              border: 'none',
              padding: '1rem 0.5rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'overview' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'overview' ? '#3b82f6' : '#718096',
              fontWeight: activeTab === 'overview' ? '500' : 'normal'
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('voting')}
            style={{
              background: 'none',
              border: 'none',
              padding: '1rem 0.5rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'voting' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'voting' ? '#3b82f6' : '#718096',
              fontWeight: activeTab === 'voting' ? '500' : 'normal'
            }}
          >
            Multi-Frame Voting
          </button>
          <button
            onClick={() => setActiveTab('frames')}
            style={{
              background: 'none',
              border: 'none',
              padding: '1rem 0.5rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'frames' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'frames' ? '#3b82f6' : '#718096',
              fontWeight: activeTab === 'frames' ? '500' : 'normal'
            }}
          >
            Frame Results ({results.length})
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          {/* In-progress banner */}
          {isFaceRecInProgress && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{ fontSize: '1.25rem' }}>⏳</span>
              <div>
                <strong style={{ color: '#92400e' }}>Face Recognition In Progress</strong>
                <p style={{ margin: '0.25rem 0 0 0', color: '#78350f', fontSize: '0.9rem' }}>
                  {video.message || 'Face recognition is still processing. Refresh to see updated results.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'player' && (
            <VideoPlayer
              videoId={video.video_id}
              results={results}
              extractionInfo={extraction}
            />
          )}

          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Video Information */}
              <div>
                <h3 style={{ marginTop: 0 }}>Video Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: 0 }}>Domain</p>
                    <p style={{ fontWeight: '500', margin: '0.25rem 0 0 0' }}>{video.domain || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: 0 }}>Processed At</p>
                    <p style={{ fontWeight: '500', margin: '0.25rem 0 0 0' }}>{formatDate(video.processed_at || video.completedAt)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: 0 }}>Duration</p>
                    <p style={{ fontWeight: '500', margin: '0.25rem 0 0 0' }}>
                      {extraction.video_info?.duration?.toFixed(1) || 'N/A'}s
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: 0 }}>Resolution</p>
                    <p style={{ fontWeight: '500', margin: '0.25rem 0 0 0' }}>
                      {extraction.video_info?.width || '?'} × {extraction.video_info?.height || '?'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recognition Statistics */}
              <div>
                <h3>Recognition Statistics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: 0 }}>Total Frames</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0.5rem 0 0 0' }}>
                      {stats.total_frames || 0}
                    </p>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: 0 }}>Recognized</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0.5rem 0 0 0', color: '#10b981' }}>
                      {stats.recognized_frames || 0}
                    </p>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: 0 }}>Recognition Rate</p>
                    <p
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        margin: '0.5rem 0 0 0',
                        color: getRecognitionRateColor(stats.recognition_rate || 0)
                      }}
                    >
                      {stats.recognition_rate?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: 0 }}>Unique Persons</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0.5rem 0 0 0' }}>
                      {stats.unique_persons || 0}
                    </p>
                  </div>
                </div>

                {stats.persons_list && stats.persons_list.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Detected Persons:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {stats.persons_list.map((person, index) => (
                        <span
                          key={index}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            borderRadius: '20px',
                            fontSize: '0.9rem'
                          }}
                        >
                          {person}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Performance Metrics */}
              <div>
                <h3>Performance Metrics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: 0 }}>Processing Time</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0.5rem 0 0 0' }}>
                      {perf.processing_time_seconds?.toFixed(1) || 'N/A'}s
                    </p>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: 0 }}>Frames Per Second</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0.5rem 0 0 0' }}>
                      {perf.frames_per_second?.toFixed(2) || 'N/A'}
                    </p>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: 0 }}>Avg CPU Usage</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0.5rem 0 0 0' }}>
                      {perf.avg_cpu_percent?.toFixed(1) || 'N/A'}%
                    </p>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: 0 }}>Memory Used</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0.5rem 0 0 0' }}>
                      {perf.memory_used_mb?.toFixed(0) || 'N/A'} MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voting' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Primary Person */}
              <div>
                <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Primary Person Detected
                  <Tooltip text="The person most frequently and confidently detected across all frames" />
                </h3>
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: '#eff6ff',
                  borderRadius: '8px',
                  border: '2px solid #3b82f6'
                }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0, color: '#1e40af' }}>
                    {multiFrameVoting.primary_person || 'None detected'}
                  </p>
                  {multiFrameVoting.primary_person && multiFrameVoting.filtered_persons &&
                   multiFrameVoting.filtered_persons[multiFrameVoting.primary_person] && (
                    <div style={{ marginTop: '0.5rem', color: '#475569', fontSize: '0.9rem' }}>
                      <div>
                        Weighted Score: <strong>{multiFrameVoting.filtered_persons[multiFrameVoting.primary_person].weighted_score?.toFixed(1)}</strong>
                      </div>
                      <div>
                        Frames: <strong>{multiFrameVoting.filtered_persons[multiFrameVoting.primary_person].frame_count}</strong> / {stats.total_frames || 0}
                        {' '}({((multiFrameVoting.filtered_persons[multiFrameVoting.primary_person].frame_count / (stats.total_frames || 1)) * 100).toFixed(1)}%)
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Voting Configuration */}
              <div>
                <h3>Voting Configuration</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: 0 }}>
                      Min Frame Occurrence
                      <Tooltip text="Minimum number of frames a person must appear in to be included in results" />
                    </p>
                    <p style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0.5rem 0 0 0' }}>
                      {multiFrameVoting.min_frame_occurrence || 'N/A'}
                    </p>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: 0 }}>
                      Weighted Voting
                      <Tooltip text="Uses squared confidence values to weight matches - prioritizes quality over quantity" />
                    </p>
                    <p style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0.5rem 0 0 0' }}>
                      {video.use_weighted_voting !== false ? '✓ Enabled' : '✗ Disabled'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Confirmed Persons - Detailed Table */}
              {multiFrameVoting.filtered_persons && Object.keys(multiFrameVoting.filtered_persons).length > 0 && (
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    All Confirmed Persons
                    <Tooltip text="Persons who passed the minimum frame occurrence threshold and confidence requirements" />
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Person</th>
                          <th>
                            Frames
                            <Tooltip text="Number of frames where this person was detected" />
                          </th>
                          <th>
                            Weighted Score
                            <Tooltip text="Sum of squared confidence values - indicates detection quality" />
                          </th>
                          <th>
                            Avg Confidence
                            <Tooltip text="Average confidence across all detected frames" />
                          </th>
                          <th>
                            Best Confidence
                            <Tooltip text="Highest confidence value from any single frame" />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(multiFrameVoting.filtered_persons)
                          .sort((a, b) => (b[1].weighted_score || 0) - (a[1].weighted_score || 0))
                          .map(([person, data], index) => (
                            <tr key={index} style={{
                              backgroundColor: person === multiFrameVoting.primary_person ? '#eff6ff' : 'transparent'
                            }}>
                              <td>
                                <strong>{person}</strong>
                                {person === multiFrameVoting.primary_person && (
                                  <span style={{
                                    marginLeft: '0.5rem',
                                    fontSize: '0.75rem',
                                    color: '#3b82f6',
                                    fontWeight: '600'
                                  }}>
                                    PRIMARY
                                  </span>
                                )}
                              </td>
                              <td>{data.frame_count}</td>
                              <td>
                                <strong>{data.weighted_score?.toFixed(1)}</strong>
                              </td>
                              <td>{data.avg_confidence?.toFixed(1)}%</td>
                              <td>
                                <span style={{
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: data.best_confidence >= 70 ? '#10b981' :
                                                   data.best_confidence >= 60 ? '#f59e0b' : '#ef4444',
                                  color: 'white',
                                  borderRadius: '4px',
                                  fontSize: '0.85rem',
                                  fontWeight: '500'
                                }}>
                                  {data.best_confidence?.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Filtered Out Persons */}
              {multiFrameVoting.persons_filtered_out && multiFrameVoting.persons_filtered_out.length > 0 && (
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Filtered Out (Did Not Pass Threshold)
                    <Tooltip text="Persons detected but did not appear in enough frames or with sufficient confidence" />
                  </h3>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#fef2f2',
                    borderRadius: '8px',
                    border: '1px solid #fecaca'
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {multiFrameVoting.persons_filtered_out.map((person, index) => {
                        const personData = multiFrameVoting.all_detected_persons?.[person]
                        return (
                          <span
                            key={index}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#fee2e2',
                              color: '#991b1b',
                              borderRadius: '20px',
                              fontSize: '0.85rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            {person}
                            {personData && (
                              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                ({personData.frame_count} frames)
                              </span>
                            )}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Blacklisted Persons */}
              {multiFrameVoting.blacklisted_persons && multiFrameVoting.blacklisted_persons.length > 0 && (
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
                    🚫 Blacklisted Historical Persons
                    <Tooltip text="Historical figures removed from results as they cannot appear in modern videos" />
                  </h3>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#fef3c7',
                    borderRadius: '8px',
                    border: '2px solid #fbbf24'
                  }}>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#78350f', fontSize: '0.9rem' }}>
                      These persons were detected but removed because they are historical figures who died before modern video era:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {multiFrameVoting.blacklisted_persons.map((person, index) => {
                        const personData = multiFrameVoting.all_detected_persons?.[person]
                        return (
                          <span
                            key={index}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#fde68a',
                              color: '#78350f',
                              borderRadius: '20px',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            {person}
                            {personData && (
                              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                ({personData.frame_count} frames, {personData.weighted_score?.toFixed(1)} weighted score)
                              </span>
                            )}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'frames' && (
            <div>
              <h3 style={{ marginTop: 0 }}>Frame-by-Frame Results</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Frame #</th>
                      <th>Timestamp</th>
                      <th>Person</th>
                      <th>Confidence</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((frame, index) => (
                      <tr key={index}>
                        <td>{frame.frame_number}</td>
                        <td>{frame.timestamp?.toFixed(2)}s</td>
                        <td>{frame.recognized && frame.person ? frame.person : <em>Unknown</em>}</td>
                        <td>{frame.recognized && frame.confidence ? `${frame.confidence.toFixed(1)}%` : '-'}</td>
                        <td>
                          <span
                            style={{
                              padding: '0.25rem 0.75rem',
                              backgroundColor: frame.recognized ? '#10b981' : '#718096',
                              color: 'white',
                              borderRadius: '12px',
                              fontSize: '0.85rem',
                              fontWeight: '500'
                            }}
                          >
                            {frame.recognized ? 'Recognized' : 'Unknown'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #3a3a3a', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
