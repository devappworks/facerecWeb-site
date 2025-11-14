import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import VideoRecognition from '../pages/VideoRecognition'
import { videoRecognitionService } from '../services/videoRecognition'

// Mock the service
vi.mock('../services/videoRecognition')

// Mock HelpButton and Tooltip
vi.mock('../components/HelpButton', () => ({
  default: () => <div data-testid="help-button">Help</div>,
}))

vi.mock('../components/Tooltip', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

describe('VideoRecognition Integration Tests', () => {
  const mockApiInfo = {
    success: true,
    supported_formats: ['mp4', 'avi', 'mov'],
    max_file_size_mb: 100,
    default_interval_seconds: 3.0,
  }

  const mockUploadAsyncResponse = {
    success: true,
    video_id: 'test-video-123',
    status_endpoint: '/api/video/status/test-video-123',
  }

  const mockStatusProcessing = {
    success: false,
    video_id: 'test-video-123',
    status: 'processing',
    message: 'Video is still being processed',
  }

  const mockStatusCompleted = {
    success: true,
    video_id: 'test-video-123',
    status: 'completed',
    statistics: {
      total_frames: 30,
      recognized_frames: 18,
      failed_frames: 0,
      recognition_rate: 60.0,
      unique_persons: 3,
      persons_list: ['Person A', 'Person B', 'Person C'],
    },
    performance: {
      processing_time_seconds: 45.3,
      frames_per_second: 0.66,
      avg_cpu_percent: 78.5,
      memory_used_mb: 1250.4,
      final_memory_mb: 2100.8,
    },
    extraction_info: {
      total_frames: 900,
      extracted_count: 30,
      extraction_time: 5.2,
      video_info: {
        fps: 30.0,
        duration: 30.5,
        width: 1920,
        height: 1080,
      },
    },
    results: [
      {
        frame_number: 0,
        timestamp: 0.0,
        filename: 'frame_000000_t0.00s.jpg',
        recognized: true,
        person: 'Person A',
        confidence: 99.2,
      },
      {
        frame_number: 90,
        timestamp: 3.0,
        filename: 'frame_000090_t3.00s.jpg',
        recognized: true,
        person: 'Person B',
        confidence: 98.5,
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()

    videoRecognitionService.getInfo.mockResolvedValue(mockApiInfo)
    videoRecognitionService.validateFile.mockReturnValue({
      valid: true,
      errors: [],
    })
    videoRecognitionService.validateInterval.mockReturnValue({
      valid: true,
    })
  })

  it('should render upload section', async () => {
    render(
      <BrowserRouter>
        <VideoRecognition />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Video Face Recognition')).toBeInTheDocument()
      expect(screen.getByText(/Click to upload/i)).toBeInTheDocument()
    })
  })

  it('should handle file selection', async () => {
    render(
      <BrowserRouter>
        <VideoRecognition />
      </BrowserRouter>
    )

    const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
    const input = screen.getByRole('button', { hidden: true }).closest('div').querySelector('input[type="file"]')

    await waitFor(() => {
      fireEvent.change(input, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(screen.getByText('test.mp4')).toBeInTheDocument()
    })
  })

  it('should complete full upload and processing workflow', async () => {
    let statusCallCount = 0
    videoRecognitionService.uploadAsync.mockResolvedValue(mockUploadAsyncResponse)
    videoRecognitionService.getStatus.mockImplementation(async () => {
      statusCallCount++
      // Return processing for first 2 calls, then completed
      if (statusCallCount >= 3) {
        return mockStatusCompleted
      }
      return mockStatusProcessing
    })

    render(
      <BrowserRouter>
        <VideoRecognition />
      </BrowserRouter>
    )

    // Select file
    const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
    const input = screen.getByRole('button', { hidden: true }).closest('div').querySelector('input[type="file"]')

    await waitFor(() => {
      fireEvent.change(input, { target: { files: [file] } })
    })

    // Wait for file to be selected
    await waitFor(() => {
      expect(screen.getByText('test.mp4')).toBeInTheDocument()
    })

    // Click upload button
    const uploadButton = screen.getByText('Upload and Process Video')
    fireEvent.click(uploadButton)

    // Wait for upload to complete and polling to start
    await waitFor(() => {
      expect(videoRecognitionService.uploadAsync).toHaveBeenCalled()
    })

    // Wait for processing indicator
    await waitFor(() => {
      expect(screen.getByText(/Processing Video/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Wait for results to appear (polling will eventually return completed)
    await waitFor(() => {
      expect(screen.getByText('Recognition Statistics')).toBeInTheDocument()
    }, { timeout: 10000 })

    // Verify results are displayed
    expect(screen.getByText('Person A')).toBeInTheDocument()
    expect(screen.getByText('Person B')).toBeInTheDocument()
    expect(screen.getByText('Person C')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument() // total frames
    expect(screen.getByText('18')).toBeInTheDocument() // recognized frames
  })

  it('should handle file validation errors', async () => {
    videoRecognitionService.validateFile.mockReturnValue({
      valid: false,
      errors: ['File too large. Maximum size: 100 MB'],
    })

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(
      <BrowserRouter>
        <VideoRecognition />
      </BrowserRouter>
    )

    const file = new File(['video content'], 'huge.mp4', { type: 'video/mp4' })
    Object.defineProperty(file, 'size', { value: 150 * 1024 * 1024 })

    const input = screen.getByRole('button', { hidden: true }).closest('div').querySelector('input[type="file"]')

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('too large'))
    })

    alertSpy.mockRestore()
  })

  it('should handle upload errors', async () => {
    videoRecognitionService.uploadAsync.mockResolvedValue({
      success: false,
      message: 'Upload failed: Server error',
    })

    render(
      <BrowserRouter>
        <VideoRecognition />
      </BrowserRouter>
    )

    // Select file
    const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
    const input = screen.getByRole('button', { hidden: true }).closest('div').querySelector('input[type="file"]')

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('test.mp4')).toBeInTheDocument()
    })

    // Click upload
    const uploadButton = screen.getByText('Upload and Process Video')
    fireEvent.click(uploadButton)

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Upload failed/i)).toBeInTheDocument()
    })
  })

  it('should allow changing interval settings', async () => {
    render(
      <BrowserRouter>
        <VideoRecognition />
      </BrowserRouter>
    )

    // Select file
    const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
    const input = screen.getByRole('button', { hidden: true }).closest('div').querySelector('input[type="file"]')

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('test.mp4')).toBeInTheDocument()
    })

    // Find and change interval input
    const intervalInput = screen.getByDisplayValue('3')
    fireEvent.change(intervalInput, { target: { value: '5' } })

    expect(intervalInput.value).toBe('5')
    expect(screen.getByText('1 frame every 5s')).toBeInTheDocument()
  })

  it('should allow clearing selected file', async () => {
    render(
      <BrowserRouter>
        <VideoRecognition />
      </BrowserRouter>
    )

    // Select file
    const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
    const input = screen.getByRole('button', { hidden: true }).closest('div').querySelector('input[type="file"]')

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('test.mp4')).toBeInTheDocument()
    })

    // Click clear button
    const clearButton = screen.getByText('Choose Different Video')
    fireEvent.click(clearButton)

    // Upload section should be visible again
    await waitFor(() => {
      expect(screen.getByText(/Click to upload/i)).toBeInTheDocument()
    })
  })
})
