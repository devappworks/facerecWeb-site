import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import TrainingWorkflow from '../TrainingWorkflow'
import { trainingService } from '../../services/training'

// Mock services
vi.mock('../../services/training', () => ({
  trainingService: {
    generateNames: vi.fn(),
    processNext: vi.fn(),
    processAll: vi.fn(),
    getTrainingProgress: vi.fn(),
  },
}))

// Mock HelpButton
vi.mock('../../components/HelpButton', () => ({
  default: () => <div data-testid="help-button">Help</div>,
}))

// Mock usePolling hook
vi.mock('../../hooks/usePolling', () => ({
  usePolling: vi.fn((fetchFn, interval, enabled) => ({
    data: null,
    loading: false,
    error: null,
    refetch: vi.fn(),
    isPolling: enabled,
    startPolling: vi.fn(),
    stopPolling: vi.fn(),
  })),
}))

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <TrainingWorkflow />
    </BrowserRouter>
  )
}

describe('TrainingWorkflow Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the component with all sections', () => {
      renderComponent()

      // Check page title and subtitle
      expect(screen.getByText('Training Workflow')).toBeInTheDocument()
      expect(screen.getByText('Complete pipeline: Generate → Process → Monitor')).toBeInTheDocument()

      // Check step indicator - these appear multiple times (in indicator and in cards)
      expect(screen.getAllByText('Generate Names').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Process Queue').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Monitor Progress').length).toBeGreaterThan(0)
    })

    it('should render step badges with correct numbers', () => {
      renderComponent()

      // Check for numbered step badges
      const stepBadges = screen.getAllByText(/^[1-3]$/)
      expect(stepBadges).toHaveLength(6) // 3 in indicator + 3 in cards
    })

    it('should render help button', () => {
      renderComponent()

      expect(screen.getByTestId('help-button')).toBeInTheDocument()
    })

    it('should render all three workflow cards', () => {
      renderComponent()

      // Check for all three card headings - they appear in both step indicator and cards
      expect(screen.getAllByText('Generate Names').length).toBeGreaterThanOrEqual(2)
      expect(screen.getAllByText('Process Queue').length).toBeGreaterThanOrEqual(2)

      // Training Progress appears in the card header
      expect(screen.getByText('Training Progress')).toBeInTheDocument()
    })
  })

  describe('Generate Names (Step 1)', () => {
    it('should render country dropdown with default value', () => {
      renderComponent()

      const countrySelect = screen.getByLabelText(/Select Country/i)
      expect(countrySelect).toBeInTheDocument()
      expect(countrySelect).toHaveValue('Serbia')
    })

    it('should allow changing country selection', () => {
      renderComponent()

      const countrySelect = screen.getByLabelText(/Select Country/i)
      fireEvent.change(countrySelect, { target: { value: 'United States' } })

      expect(countrySelect).toHaveValue('United States')
    })

    it('should have Generate button enabled by default', () => {
      renderComponent()

      const generateButton = screen.getByRole('button', { name: /Generate ~50 Names/i })
      expect(generateButton).toBeInTheDocument()
      expect(generateButton).not.toBeDisabled()
    })

    it('should call generateNames service when Generate button is clicked', async () => {
      trainingService.generateNames.mockResolvedValue({
        success: true,
        message: 'Names generated successfully',
      })

      renderComponent()

      const generateButton = screen.getByRole('button', { name: /Generate ~50 Names/i })
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(trainingService.generateNames).toHaveBeenCalledWith('Serbia')
      })
    })

    it('should show loading state during generation', async () => {
      trainingService.generateNames.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      renderComponent()

      const generateButton = screen.getByRole('button', { name: /Generate ~50 Names/i })
      fireEvent.click(generateButton)

      // Check for loading state
      await waitFor(() => {
        expect(screen.getByText(/Generating\.\.\. \(30-60s\)/i)).toBeInTheDocument()
      })
    })

    it('should show success message after successful generation', async () => {
      trainingService.generateNames.mockResolvedValue({
        success: true,
        message: 'Names generated successfully',
      })

      renderComponent()

      const generateButton = screen.getByRole('button', { name: /Generate ~50 Names/i })
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText(/Successfully generated names for Serbia!/i)).toBeInTheDocument()
      })
    })

    it('should show error message on generation failure', async () => {
      trainingService.generateNames.mockResolvedValue({
        success: false,
        message: 'Generation failed',
      })

      renderComponent()

      const generateButton = screen.getByRole('button', { name: /Generate ~50 Names/i })
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Generation failed')).toBeInTheDocument()
      })
    })
  })

  describe('Process Queue (Step 2)', () => {
    it('should render Process Next and Process All buttons', () => {
      renderComponent()

      expect(screen.getByRole('button', { name: /Process Next/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Process All/i })).toBeInTheDocument()
    })

    it('should call processNext service when Process Next is clicked', async () => {
      trainingService.processNext.mockResolvedValue({
        success: true,
        data: {
          person: 'John Doe',
          images_downloaded: 35,
          status: 'completed',
        },
      })

      renderComponent()

      const processNextButton = screen.getByRole('button', { name: /Process Next/i })
      fireEvent.click(processNextButton)

      await waitFor(() => {
        expect(trainingService.processNext).toHaveBeenCalled()
      })
    })

    it('should display last processed person details', async () => {
      trainingService.processNext.mockResolvedValue({
        success: true,
        data: {
          person: 'Jane Smith',
          images_downloaded: 42,
          status: 'completed',
        },
      })

      renderComponent()

      const processNextButton = screen.getByRole('button', { name: /Process Next/i })
      fireEvent.click(processNextButton)

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('42')).toBeInTheDocument()
      })
    })

    it('should show success message after processing', async () => {
      trainingService.processNext.mockResolvedValue({
        success: true,
        data: {
          person: 'Test Person',
          images_downloaded: 30,
        },
      })

      renderComponent()

      const processNextButton = screen.getByRole('button', { name: /Process Next/i })
      fireEvent.click(processNextButton)

      await waitFor(() => {
        expect(screen.getByText(/Processed: Test Person/i)).toBeInTheDocument()
      })
    })

    it('should disable buttons during generation', async () => {
      trainingService.generateNames.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      renderComponent()

      const generateButton = screen.getByRole('button', { name: /Generate ~50 Names/i })
      fireEvent.click(generateButton)

      await waitFor(() => {
        const processNextButton = screen.getByRole('button', { name: /▶️ Process Next/i })
        expect(processNextButton).toBeDisabled()
      })
    })
  })

  describe('Progress Monitor (Step 3)', () => {
    it('should show empty state when no folders exist', () => {
      renderComponent()

      expect(screen.getByText('No training data yet')).toBeInTheDocument()
      expect(screen.getByText('Generate names and process queue to start')).toBeInTheDocument()
    })

    it('should render pause and refresh buttons', () => {
      renderComponent()

      // Look for pause/play button (emoji)
      const pauseButton = screen.getByRole('button', { name: /⏸️/i })
      expect(pauseButton).toBeInTheDocument()

      // Look for refresh button
      const refreshButton = screen.getByRole('button', { name: /🔄/i })
      expect(refreshButton).toBeInTheDocument()
    })
  })

  describe('Real-time Updates', () => {
    it('should have auto-updating indicator when polling is enabled', () => {
      renderComponent()

      expect(screen.getByText('Auto-updating')).toBeInTheDocument()
    })
  })

  describe('Info Box', () => {
    it('should render workflow guide info box', () => {
      renderComponent()

      expect(screen.getByText(/Complete Workflow Guide/i)).toBeInTheDocument()
      expect(screen.getByText('Step 1:')).toBeInTheDocument()
      expect(screen.getByText(/AI generates ~50 celebrity names/i)).toBeInTheDocument()
      expect(screen.getByText('Step 2:')).toBeInTheDocument()
      expect(screen.getByText(/Download images \(5-15s each\)/i)).toBeInTheDocument()
      expect(screen.getByText('Step 3:')).toBeInTheDocument()
      expect(screen.getByText(/Monitor progress \(auto-updates every 15s\)/i)).toBeInTheDocument()
    })
  })

  describe('Responsive Layout', () => {
    it('should use two-column grid layout class', () => {
      const { container } = renderComponent()

      const workflowGrid = container.querySelector('.workflow-grid')
      expect(workflowGrid).toBeInTheDocument()
    })

    it('should render workflow-actions and workflow-monitor sections', () => {
      const { container } = renderComponent()

      expect(container.querySelector('.workflow-actions')).toBeInTheDocument()
      expect(container.querySelector('.workflow-monitor')).toBeInTheDocument()
    })
  })
})
