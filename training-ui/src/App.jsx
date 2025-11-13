import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ThemeProvider } from './hooks/useTheme'
import AuthGuard from './components/AuthGuard'
import Layout from './components/Layout'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import GenerateNames from './pages/GenerateNames'
import QueueManager from './pages/QueueManager'
import ProgressMonitor from './pages/ProgressMonitor'
import SyncManager from './pages/SyncManager'
import Testing from './pages/Testing'
import ABTesting from './pages/ABTesting'
import ImageGallery from './pages/ImageGallery'

import './styles/global.css'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter basename="/training">
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes with layout */}
            <Route
              element={
                <AuthGuard>
                  <Layout />
                </AuthGuard>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/generate" element={<GenerateNames />} />
              <Route path="/queue" element={<QueueManager />} />
              <Route path="/progress" element={<ProgressMonitor />} />
              <Route path="/gallery" element={<ImageGallery />} />
              <Route path="/sync" element={<SyncManager />} />
              <Route path="/test" element={<Testing />} />
              <Route path="/ab-test" element={<ABTesting />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
