import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import '../styles/layout.css'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

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
            <Link to="/ab-test" className="nav-link">
              <span className="nav-icon">⚖️</span>
              A/B Testing
            </Link>
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
        <Outlet />
      </main>
    </div>
  )
}
