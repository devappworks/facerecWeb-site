import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import TrainingWorkflow from '../pages/TrainingWorkflow'
import { trainingService } from '../services/training'

// Mock services
vi.mock('../services/training')

// Mock HelpButton
vi.mock('../components/HelpButton', () => ({
  default: () => <div data-testid="help-button">Help</div>,
}))

// Mock usePolling with functional implementation
const mockUsePolling = vi.fn()
vi.mock('../hooks/usePolling', () => ({
  usePolling: (...args) => mockUsePolling(...args),
}))

describe('TrainingWorkflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    trainingService.generateNames = vi.fn()
    trainingService.processNext = vi.fn()
    trainingService.processAll = vi.fn()
    trainingService.getTrainingProgress = vi.fn()

    // Default usePolling mock
    mockUsePolling.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
      isPolling: true,
      startPolling: vi.fn(),
      stopPolling: vi.fn(),
    })
  })

  const renderWorkflow = () => {
    return render(
      <BrowserRouter>
        <TrainingWorkflow />
      </BrowserRouter>
    )
  }

  describe('Complete Workflow Integration', () => {
    it('should complete full workflow: generate → process → monitor', async () => {
      const mockRefetch = vi.fn()

      // Mock successful generation
      trainingService.generateNames.mockResolvedValue({
        success: true,
        message: 'Names generated',
      })

      // Mock successful processing
      trainingService.processNext.mockResolvedValue({
        success: true,
        data: {
          person: 'Test Celebrity',
          images_downloaded: 25,
          status: 'completed',
        },
      })

      // Mock progress data
      mockUsePolling.mockReturnValue({
        data: [
          { name: 'Test Celebrity', imageCount: 25, lastModified: new Date().toISOString() },
        ],
        loading: false,
        error: null,
        refetch: mockRefetch,
        isPolling: true,
        startPolling: vi.fn(),
        stopPolling: vi.fn(),
      })

      renderWorkflow()

      // Step 1: Generate names
      const generateButton = screen.getByRole('button', { name: /Generate ~50 Names/i })
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(trainingService.generateNames).toHaveBeenCalledWith('Serbia')
      })

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/Successfully generated names for Serbia!/i)).toBeInTheDocument()
      })

      // Step 2: Process queue
      const processButton = screen.getByRole('button', { name: /Process Next/i })
      fireEvent.click(processButton)

      await waitFor(() => {
        expect(trainingService.processNext).toHaveBeenCalled()
      })

      // Verify processed person is displayed
      await waitFor(() => {
        expect(screen.getAllByText('Test Celebrity').length).toBeGreaterThan(0)
        expect(screen.getAllByText('25').length).toBeGreaterThan(0)
      })

      // Step 3: Progress monitor should show the data
      expect(screen.getAllByText('Test Celebrity').length).toBeGreaterThan(0)
    })

    it('should handle errors gracefully in the workflow', async () => {
      // Mock generation error
      trainingService.generateNames.mockResolvedValue({
        success: false,
        message: 'Generation failed - API error',
      })

      renderWorkflow()

      const generateButton = screen.getByRole('button', { name: /Generate ~50 Names/i })
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Generation failed - API error')).toBeInTheDocument()
      })

      // Verify that processing buttons are still enabled
      const processButton = screen.getByRole('button', { name: /Process Next/i })
      expect(processButton).not.toBeDisabled()
    })

    it('should update progress monitor after processing', async () => {
      let folderData = []
      const mockRefetch = vi.fn(() => {
        folderData = [
          { name: 'New Person', imageCount: 30, lastModified: new Date().toISOString() },
        ]
      })

      trainingService.processNext.mockResolvedValue({
        success: true,
        data: {
          person: 'New Person',
          images_downloaded: 30,
        },
      })

      // Initial state: empty
      mockUsePolling.mockReturnValueOnce({
        data: folderData,
        loading: false,
        error: null,
        refetch: mockRefetch,
        isPolling: true,
        startPolling: vi.fn(),
        stopPolling: vi.fn(),
      })

      renderWorkflow()

      const processButton = screen.getByRole('button', { name: /Process Next/i })
      fireEvent.click(processButton)

      await waitFor(() => {
        expect(trainingService.processNext).toHaveBeenCalled()
      })

      // Verify refetch was called
      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled()
      })
    })
  })

  describe('Progress Monitor with Data', () => {
    it('should display folder statistics correctly', () => {
      mockUsePolling.mockReturnValue({
        data: [
          { name: 'Person 1', imageCount: 45, lastModified: '2024-01-01' },
          { name: 'Person 2', imageCount: 22, lastModified: '2024-01-02' },
          { name: 'Person 3', imageCount: 10, lastModified: '2024-01-03' },
        ],
        loading: false,
        error: null,
        refetch: vi.fn(),
        isPolling: true,
        startPolling: vi.fn(),
        stopPolling: vi.fn(),
      })

      const { container } = renderWorkflow()

      // Check statistics summary - use more specific queries
      const summarySection = container.querySelector('.stats-summary-compact')
      expect(summarySection).toBeInTheDocument()

      // Verify the stats are displayed (look for specific patterns)
      expect(summarySection.textContent).toContain('3') // 3 folders
      expect(summarySection.textContent).toContain('77') // Total images (45 + 22 + 10)
      expect(summarySection.textContent).toContain('2') // 2 ready (>= 20 images)

      // Check folder names
      expect(screen.getByText('Person 1')).toBeInTheDocument()
      expect(screen.getByText('Person 2')).toBeInTheDocument()
      expect(screen.getByText('Person 3')).toBeInTheDocument()
    })

    it('should show correct status badges', () => {
      mockUsePolling.mockReturnValue({
        data: [
          { name: 'Empty Person', imageCount: 0 },
          { name: 'Insufficient Person', imageCount: 15 },
          { name: 'Adequate Person', imageCount: 25 },
          { name: 'Ready Person', imageCount: 45 },
        ],
        loading: false,
        error: null,
        refetch: vi.fn(),
        isPolling: true,
        startPolling: vi.fn(),
        stopPolling: vi.fn(),
      })

      const { container } = renderWorkflow()

      // Check that status badges exist - some may appear multiple times (e.g., Ready in info box too)
      const foldersList = container.querySelector('.folders-list')
      expect(foldersList.textContent).toContain('Empty')
      expect(foldersList.textContent).toContain('Insufficient')
      expect(foldersList.textContent).toContain('Adequate')
      expect(foldersList.textContent).toContain('Ready')
    })

    it('should limit display to 10 folders with overflow message', () => {
      const manyFolders = Array.from({ length: 15 }, (_, i) => ({
        name: `Person ${i + 1}`,
        imageCount: 20 + i,
        lastModified: '2024-01-01',
      }))

      mockUsePolling.mockReturnValue({
        data: manyFolders,
        loading: false,
        error: null,
        refetch: vi.fn(),
        isPolling: true,
        startPolling: vi.fn(),
        stopPolling: vi.fn(),
      })

      renderWorkflow()

      // Should show "+5 more folders" message
      expect(screen.getByText('+5 more folders')).toBeInTheDocument()
    })
  })

  describe('Polling Controls', () => {
    it('should toggle polling when pause button is clicked', () => {
      const mockStopPolling = vi.fn()
      const mockStartPolling = vi.fn()

      mockUsePolling.mockReturnValue({
        data: [],
        loading: false,
        error: null,
        refetch: vi.fn(),
        isPolling: true,
        startPolling: mockStartPolling,
        stopPolling: mockStopPolling,
      })

      renderWorkflow()

      const pauseButton = screen.getByRole('button', { name: /⏸️/i })
      fireEvent.click(pauseButton)

      expect(mockStopPolling).toHaveBeenCalled()
    })

    it('should manually refresh when refresh button is clicked', () => {
      const mockRefetch = vi.fn()

      mockUsePolling.mockReturnValue({
        data: [],
        loading: false,
        error: null,
        refetch: mockRefetch,
        isPolling: true,
        startPolling: vi.fn(),
        stopPolling: vi.fn(),
      })

      renderWorkflow()

      const refreshButton = screen.getByRole('button', { name: /🔄/i })
      fireEvent.click(refreshButton)

      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  describe('Process All Functionality', () => {
    it('should start batch processing when Process All is clicked', async () => {
      renderWorkflow()

      const processAllButton = screen.getByRole('button', { name: /Process All/i })
      fireEvent.click(processAllButton)

      await waitFor(() => {
        expect(
          screen.getByText('Batch processing started. Check progress monitor for updates.')
        ).toBeInTheDocument()
      })
    })
  })

  describe('Route Redirects', () => {
    const renderWithRoutes = (initialPath) => {
      window.history.pushState({}, '', initialPath)

      return render(
        <BrowserRouter>
          <Routes>
            <Route path="/workflow" element={<TrainingWorkflow />} />
            <Route path="/generate" element={<Navigate to="/workflow" replace />} />
            <Route path="/queue" element={<Navigate to="/workflow" replace />} />
            <Route path="/progress" element={<Navigate to="/workflow" replace />} />
          </Routes>
        </BrowserRouter>
      )
    }

    it('should redirect /generate to /workflow', () => {
      renderWithRoutes('/generate')

      // Should see workflow page content
      expect(screen.getByText('Training Workflow')).toBeInTheDocument()
      expect(screen.getByText('Complete pipeline: Generate → Process → Monitor')).toBeInTheDocument()
    })

    it('should redirect /queue to /workflow', () => {
      renderWithRoutes('/queue')

      expect(screen.getByText('Training Workflow')).toBeInTheDocument()
    })

    it('should redirect /progress to /workflow', () => {
      renderWithRoutes('/progress')

      expect(screen.getByText('Training Workflow')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display progress monitor error', () => {
      mockUsePolling.mockReturnValue({
        data: null,
        loading: false,
        error: 'Failed to fetch progress data',
        refetch: vi.fn(),
        isPolling: false,
        startPolling: vi.fn(),
        stopPolling: vi.fn(),
      })

      renderWorkflow()

      expect(screen.getByText('Failed to fetch progress data')).toBeInTheDocument()
    })

    it('should show loading state in progress monitor', () => {
      mockUsePolling.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        refetch: vi.fn(),
        isPolling: true,
        startPolling: vi.fn(),
        stopPolling: vi.fn(),
      })

      renderWorkflow()

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })
})
