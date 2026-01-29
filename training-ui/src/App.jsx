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
import Dashboard from './pages/Dashboard'
import TrainingWorkflow from './pages/TrainingWorkflow'
import QueueManagement from './pages/QueueManagement'
import GenerateNames from './pages/GenerateNames'
import QueueManager from './pages/QueueManager'
import ProgressMonitor from './pages/ProgressMonitor'
import Testing from './pages/Testing'
import ImageGallery from './pages/ImageGallery'

// Automated Training Pages
import GenerateCandidates from './pages/automated-training/GenerateCandidates'
import BatchProgress from './pages/automated-training/BatchProgress'
import ReviewDeploy from './pages/automated-training/ReviewDeploy'
import BatchProcessing from './pages/automated-training/BatchProcessing'

// Video Recognition
import VideoRecognition from './pages/VideoRecognition'
import VideoRecognitionUpload from './pages/VideoRecognitionUpload'
import VideoRecognitionResults from './pages/VideoRecognitionResults'

// Storage Management
import StorageManagement from './pages/StorageManagement'

// Smart Training Pages
import SmartDashboard from './pages/smart-training/SmartDashboard'
import SmartQueue from './pages/smart-training/SmartQueue'
import BenchmarkResults from './pages/smart-training/BenchmarkResults'
import CelebrityDiscovery from './pages/smart-training/CelebrityDiscovery'
import TrainingHistory from './pages/smart-training/TrainingHistory'

// Rejected Faces Gallery
import RejectedFacesGallery from './pages/RejectedFacesGallery'

// Merge Candidates
import MergeCandidates from './pages/MergeCandidates'
import ManualMerge from './pages/ManualMerge'

// Batch Training
import BatchTraining from './pages/BatchTraining'

// Failed Queue
import FailedQueue from './pages/FailedQueue'

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
              {/* Protected routes with layout */}
              <Route
                element={
                  <AuthGuard>
                    <Layout />
                  </AuthGuard>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Unified Training Workflow */}
                <Route path="/workflow" element={<TrainingWorkflow />} />

                {/* Queue Management */}
                <Route path="/queue-management" element={<QueueManagement />} />

                {/* Redirect old individual pages to unified workflow */}
                <Route path="/generate" element={<Navigate to="/workflow" replace />} />
                <Route path="/queue" element={<Navigate to="/workflow" replace />} />
                <Route path="/progress" element={<Navigate to="/workflow" replace />} />

                <Route path="/gallery" element={<ImageGallery />} />
                <Route path="/test" element={<Testing />} />

                {/* Unified Training Routes */}
                <Route path="/training" element={<SmartDashboard />} />
                <Route path="/training/generate" element={<GenerateCandidates />} />
                <Route path="/training/queue" element={<SmartQueue />} />
                <Route path="/training/batches" element={<BatchProcessing />} />
                <Route path="/training/batch/:batchId" element={<BatchProgress />} />
                <Route path="/training/review" element={<ReviewDeploy />} />
                <Route path="/training/benchmarks" element={<BenchmarkResults />} />
                <Route path="/training/merge-candidates" element={<MergeCandidates />} />
                <Route path="/training/manual-merge" element={<ManualMerge />} />
                <Route path="/training/batch" element={<BatchTraining />} />
                <Route path="/training/discovery" element={<CelebrityDiscovery />} />
                <Route path="/training/history" element={<TrainingHistory />} />

                {/* Backward compatibility redirects for old routes */}
                <Route path="/training/automated/generate" element={<Navigate to="/training/generate" replace />} />
                <Route path="/training/automated/batch/:batchId" element={<BatchProgress />} />
                <Route path="/training/automated/review" element={<Navigate to="/training/review" replace />} />
                <Route path="/training/automated/batches" element={<Navigate to="/training/batches" replace />} />
                <Route path="/smart-training" element={<Navigate to="/training" replace />} />
                <Route path="/smart-training/queue" element={<Navigate to="/training/queue" replace />} />
                <Route path="/smart-training/benchmarks" element={<Navigate to="/training/benchmarks" replace />} />
                <Route path="/smart-training/discovery" element={<Navigate to="/training/discovery" replace />} />
                <Route path="/smart-training/history" element={<Navigate to="/training/history" replace />} />

                {/* Video Recognition */}
                <Route path="/video-recognition" element={<VideoRecognition />} />
                <Route path="/video-recognition/upload" element={<VideoRecognitionUpload />} />
                <Route path="/video-recognition/results" element={<VideoRecognitionResults />} />

                {/* Storage Management */}
                <Route path="/storage-management" element={<StorageManagement />} />

                {/* Rejected Faces Gallery */}
                <Route path="/rejected-faces" element={<RejectedFacesGallery />} />

                {/* Failed Queue */}
                <Route path="/training/failed" element={<FailedQueue />} />

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
