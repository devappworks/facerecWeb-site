import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ThemeProvider } from './hooks/useTheme'
import { HelpProvider } from './contexts/HelpContext'
import AuthGuard from './components/AuthGuard'
import Layout from './components/Layout'
import HelpModal from './components/HelpModal'
import Tutorial from './components/Tutorial'
import TutorialTrigger from './components/TutorialTrigger'

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

// Automated Training Pages
import GenerateCandidates from './pages/automated-training/GenerateCandidates'
import BatchProgress from './pages/automated-training/BatchProgress'
import ReviewDeploy from './pages/automated-training/ReviewDeploy'

// Video Recognition
import VideoRecognition from './pages/VideoRecognition'

import './styles/global.css'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HelpProvider>
          <BrowserRouter basename="/training">
            <TutorialTrigger />
            <HelpModal />
            <Tutorial />
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

                {/* Automated Training Routes */}
                <Route path="/training/automated/generate" element={<GenerateCandidates />} />
                <Route path="/training/automated/batch/:batchId" element={<BatchProgress />} />
                <Route path="/training/automated/review" element={<ReviewDeploy />} />

                {/* Video Recognition */}
                <Route path="/video-recognition" element={<VideoRecognition />} />

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </HelpProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
