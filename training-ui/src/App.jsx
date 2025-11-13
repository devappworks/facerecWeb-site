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

// A/B Testing Pages
import LiveComparison from './pages/ab-testing/LiveComparison'
import MetricsDashboard from './pages/ab-testing/MetricsDashboard'
import DecisionSupport from './pages/ab-testing/DecisionSupport'
import TestHistory from './pages/ab-testing/TestHistory'

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

              {/* A/B Testing Routes */}
              <Route path="/ab-testing/live" element={<LiveComparison />} />
              <Route path="/ab-testing/metrics" element={<MetricsDashboard />} />
              <Route path="/ab-testing/decision" element={<DecisionSupport />} />
              <Route path="/ab-testing/history" element={<TestHistory />} />

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
