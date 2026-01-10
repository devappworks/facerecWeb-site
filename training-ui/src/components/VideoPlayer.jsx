import { useState, useRef, useEffect } from 'react'
import { authService } from '../services/auth'

export default function VideoPlayer({ videoId, results, extractionInfo }) {
  const videoRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPerson, setCurrentPerson] = useState(null)
  const [personDisplayTime, setPersonDisplayTime] = useState(0)

  // Get auth token for video streaming
  const token = authService.getToken()

  // Extract frame-to-person mapping from results
  const frameData = results?.map(frame => {
    // Handle different data structures
    if (frame.faces && Array.isArray(frame.faces)) {
      // New structure with faces array
      return {
        frameNumber: frame.frame_number,
        timestamp: frame.timestamp,
        persons: frame.faces.map(face => ({
          name: face.identity,
          confidence: face.confidence
        }))
      }
    } else if (frame.recognized && frame.person) {
      // Current structure with single person
      return {
        frameNumber: frame.frame_number,
        timestamp: frame.timestamp,
        persons: [{
          name: frame.person,
          confidence: frame.confidence
        }]
      }
    } else {
      // No recognition
      return {
        frameNumber: frame.frame_number,
        timestamp: frame.timestamp,
        persons: []
      }
    }
  }) || []

  // Get video info with safe defaults
  const videoInfo = extractionInfo?.video_info || {}
  const fps = videoInfo.fps || 25
  const intervalSeconds = videoInfo.interval_seconds || 3.0
  const duration = videoInfo.duration || 1 // Avoid division by zero

  // Find current person based on video time
  useEffect(() => {
    if (!videoRef.current || frameData.length === 0) return

    // Find the frame that corresponds to current time
    const currentFrameIndex = Math.floor(currentTime / intervalSeconds)
    const currentFrameData = frameData.find(f =>
      Math.floor(f.frameNumber / (intervalSeconds * fps)) === currentFrameIndex
    )

    if (currentFrameData && currentFrameData.persons.length > 0) {
      // Get the person with highest confidence in this frame
      const topPerson = currentFrameData.persons.reduce((prev, current) =>
        (current.confidence > prev.confidence) ? current : prev
      )

      // Only update if it's a different person or if we need to reset the timer
      if (!currentPerson || currentPerson.name !== topPerson.name) {
        setCurrentPerson(topPerson)
        setPersonDisplayTime(Date.now())
      }
    }
  }, [currentTime, frameData, intervalSeconds, fps, currentPerson])

  // Keep person displayed for minimum 1 second
  const shouldDisplayPerson = () => {
    if (!currentPerson) return false
    const elapsed = Date.now() - personDisplayTime
    return elapsed < 1000 // Keep for at least 1 second
  }

  const displayedPerson = shouldDisplayPerson() ? currentPerson : null

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const jumpToFrame = (frameNumber) => {
    if (videoRef.current) {
      const timestamp = (frameNumber / fps)
      videoRef.current.currentTime = timestamp
    }
  }

  // Create timeline markers for recognized persons
  const getTimelineMarkers = () => {
    const markers = []
    const personColors = {}
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
    let colorIndex = 0

    frameData.forEach(frame => {
      if (frame.persons.length > 0) {
        const person = frame.persons[0] // Top person
        if (!personColors[person.name]) {
          personColors[person.name] = colors[colorIndex % colors.length]
          colorIndex++
        }

        const timestamp = frame.frameNumber / fps
        const percentage = (timestamp / duration) * 100

        markers.push({
          name: person.name,
          timestamp,
          percentage,
          color: personColors[person.name],
          confidence: person.confidence
        })
      }
    })

    return markers
  }

  const timelineMarkers = getTimelineMarkers()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Video Container */}
      <div style={{ position: 'relative', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', minHeight: '400px' }}>
        <video
          ref={videoRef}
          style={{ width: '100%', display: 'block', maxHeight: '500px' }}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          controls
        >
          <source src={`/api/storage/videos/${videoId}/stream?token=${encodeURIComponent(token)}`} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Person Name Overlay */}
        {displayedPerson && (
          <div
            style={{
              position: 'absolute',
              bottom: '60px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '500',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
              zIndex: 10,
              animation: 'fadeIn 0.3s ease-in'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <span>{displayedPerson.name.replace(/_/g, ' ')}</span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                {displayedPerson.confidence.toFixed(1)}% confidence
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Timeline with Markers */}
      <div>
        <h4 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#718096' }}>
          Recognition Timeline
        </h4>
        <div style={{ position: 'relative', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
          {timelineMarkers.map((marker, index) => (
            <div
              key={index}
              onClick={() => jumpToFrame(marker.timestamp * fps)}
              style={{
                position: 'absolute',
                left: `${marker.percentage}%`,
                top: 0,
                width: '3px',
                height: '100%',
                backgroundColor: marker.color,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                zIndex: 1
              }}
              title={`${marker.name.replace(/_/g, ' ')} (${marker.confidence.toFixed(1)}%)`}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scaleY(1.2)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scaleY(1)'}
            />
          ))}

          {/* Current time indicator */}
          <div
            style={{
              position: 'absolute',
              left: `${(currentTime / duration) * 100}%`,
              top: 0,
              width: '2px',
              height: '100%',
              backgroundColor: '#ef4444',
              zIndex: 2
            }}
          />
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
          {Object.entries(
            timelineMarkers.reduce((acc, marker) => {
              if (!acc[marker.name]) {
                acc[marker.name] = { color: marker.color, count: 0 }
              }
              acc[marker.name].count++
              return acc
            }, {})
          ).map(([name, data]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: data.color, borderRadius: '2px' }} />
              <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                {name.replace(/_/g, ' ')} ({data.count})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls Info */}
      <div style={{ fontSize: '0.85rem', color: '#718096', fontStyle: 'italic' }}>
        💡 Tip: Click on timeline markers to jump to when each person appears. Names stay visible for at least 1 second.
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}
