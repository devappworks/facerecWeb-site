import { useState } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import '../styles/layout.css'

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [trainingOpen, setTrainingOpen] = useState(false)
  const [videoRecognitionOpen, setVideoRecognitionOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>Training UI</h2>
          <p className="user-email">{user?.email}</p>
        </div>

        <ul className="nav-menu">
          <li>
            <Link to="/dashboard" className="nav-link">
              <span className="nav-icon">📊</span>
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/gallery" className="nav-link">
              <span className="nav-icon">🖼️</span>
              Image Gallery
            </Link>
          </li>
          <li>
            <Link to="/rejected-faces" className="nav-link">
              <span className="nav-icon">🚫</span>
              Rejected Faces
            </Link>
          </li>
          {/* Video Recognition Section */}
          <li>
            <div
              className="nav-link nav-section-toggle"
              onClick={() => setVideoRecognitionOpen(!videoRecognitionOpen)}
              style={{ cursor: 'pointer' }}
            >
              <span className="nav-icon">🎬</span>
              Video Recognition
              <span style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>
                {videoRecognitionOpen ? '▼' : '▶'}
              </span>
            </div>
            {videoRecognitionOpen && (
              <ul className="nav-submenu">
                <li>
                  <Link to="/video-recognition/upload" className="nav-link nav-sublink">
                    <span className="nav-icon">📤</span>
                    Upload Video
                  </Link>
                </li>
                <li>
                  <Link to="/video-recognition/results" className="nav-link nav-sublink">
                    <span className="nav-icon">📋</span>
                    Recognition Results
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li>
            <Link to="/storage-management" className="nav-link">
              <span className="nav-icon">💾</span>
              Storage Management
            </Link>
          </li>

          {/* Unified Training Section */}
          <li>
            <div
              className="nav-link nav-section-toggle"
              onClick={() => setTrainingOpen(!trainingOpen)}
              style={{ cursor: 'pointer' }}
            >
              <span className="nav-icon">🎓</span>
              Training
              <span style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>
                {trainingOpen ? '▼' : '▶'}
              </span>
            </div>
            {trainingOpen && (
              <ul className="nav-submenu">
                <li>
                  <Link to="/training" className="nav-link nav-sublink">
                    <span className="nav-icon">📊</span>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/training/generate" className="nav-link nav-sublink">
                    <span className="nav-icon">✨</span>
                    Discover People
                  </Link>
                </li>
                <li>
                  <Link to="/training/queue" className="nav-link nav-sublink">
                    <span className="nav-icon">📋</span>
                    Training Queue
                  </Link>
                </li>
                <li>
                  <Link to="/training/batch" className="nav-link nav-sublink">
                    <span className="nav-icon">🚀</span>
                    Batch Training
                  </Link>
                </li>
                <li>
                  <Link to="/training/batches" className="nav-link nav-sublink">
                    <span className="nav-icon">⚙️</span>
                    Active Batches
                  </Link>
                </li>
                <li>
                  <Link to="/training/review" className="nav-link nav-sublink">
                    <span className="nav-icon">🚀</span>
                    Review & Deploy
                  </Link>
                </li>
                <li>
                  <Link to="/training/benchmarks" className="nav-link nav-sublink">
                    <span className="nav-icon">🎯</span>
                    Benchmarks
                  </Link>
                </li>
                <li>
                  <Link to="/training/merge-candidates" className="nav-link nav-sublink">
                    <span className="nav-icon">🔗</span>
                    Merge Candidates
                  </Link>
                </li>
                <li>
                  <Link to="/training/manual-merge" className="nav-link nav-sublink">
                    <span className="nav-icon">🔀</span>
                    Manual Merge
                  </Link>
                </li>
                <li>
                  <Link to="/training/discovery" className="nav-link nav-sublink">
                    <span className="nav-icon">🔍</span>
                    Celebrity Discovery
                  </Link>
                </li>
                <li>
                  <Link to="/training/history" className="nav-link nav-sublink">
                    <span className="nav-icon">📜</span>
                    History
                  </Link>
                </li>
                <li>
                  <Link to="/training/failed" className="nav-link nav-sublink">
                    <span className="nav-icon">⚠️</span>
                    Failed Queue
                  </Link>
                </li>
              </ul>
            )}
          </li>
        </ul>

        <div className="sidebar-footer">
          <a href="/" className="nav-link">
            <span className="nav-icon">🏠</span>
            Main App
          </a>
          <button onClick={handleLogout} className="btn btn-logout">
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        <div className="main-page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
