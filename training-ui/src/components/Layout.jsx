import { useState } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import '../styles/layout.css'

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [abTestingOpen, setAbTestingOpen] = useState(false)
  const [automatedTrainingOpen, setAutomatedTrainingOpen] = useState(false)

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
            <Link to="/generate" className="nav-link">
              <span className="nav-icon">✨</span>
              Generate Names
            </Link>
          </li>
          <li>
            <Link to="/queue" className="nav-link">
              <span className="nav-icon">📋</span>
              Queue Manager
            </Link>
          </li>
          <li>
            <Link to="/progress" className="nav-link">
              <span className="nav-icon">📈</span>
              Progress Monitor
            </Link>
          </li>
          <li>
            <Link to="/gallery" className="nav-link">
              <span className="nav-icon">🖼️</span>
              Image Gallery
            </Link>
          </li>
          <li>
            <Link to="/sync" className="nav-link">
              <span className="nav-icon">🔄</span>
              Sync Manager
            </Link>
          </li>
          <li>
            <Link to="/test" className="nav-link">
              <span className="nav-icon">🧪</span>
              Testing
            </Link>
          </li>
          <li>
            <Link to="/video-recognition" className="nav-link">
              <span className="nav-icon">🎬</span>
              Video Recognition
            </Link>
          </li>

          {/* A/B Testing Section */}
          <li>
            <div
              className="nav-link nav-section-toggle"
              onClick={() => setAbTestingOpen(!abTestingOpen)}
              style={{ cursor: 'pointer' }}
            >
              <span className="nav-icon">⚖️</span>
              A/B Testing
              <span style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>
                {abTestingOpen ? '▼' : '▶'}
              </span>
            </div>
            {abTestingOpen && (
              <ul className="nav-submenu">
                <li>
                  <Link to="/ab-testing/live" className="nav-link nav-sublink">
                    <span className="nav-icon">🔬</span>
                    Live Comparison
                  </Link>
                </li>
                <li>
                  <Link to="/ab-testing/metrics" className="nav-link nav-sublink">
                    <span className="nav-icon">📊</span>
                    Metrics
                  </Link>
                </li>
                <li>
                  <Link to="/ab-testing/decision" className="nav-link nav-sublink">
                    <span className="nav-icon">🎯</span>
                    Decision Support
                  </Link>
                </li>
                <li>
                  <Link to="/ab-testing/history" className="nav-link nav-sublink">
                    <span className="nav-icon">📜</span>
                    History
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* Automated Training Section */}
          <li>
            <div
              className="nav-link nav-section-toggle"
              onClick={() => setAutomatedTrainingOpen(!automatedTrainingOpen)}
              style={{ cursor: 'pointer' }}
            >
              <span className="nav-icon">🤖</span>
              Automated Training
              <span style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>
                {automatedTrainingOpen ? '▼' : '▶'}
              </span>
            </div>
            {automatedTrainingOpen && (
              <ul className="nav-submenu">
                <li>
                  <Link to="/training/automated/generate" className="nav-link nav-sublink">
                    <span className="nav-icon">✨</span>
                    Generate Candidates
                  </Link>
                </li>
                <li>
                  <Link to="/training/automated/review" className="nav-link nav-sublink">
                    <span className="nav-icon">📋</span>
                    Review & Deploy
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
          <button
            onClick={toggleTheme}
            className="btn btn-theme-toggle"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <span className="nav-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
          <button onClick={handleLogout} className="btn btn-logout">
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
