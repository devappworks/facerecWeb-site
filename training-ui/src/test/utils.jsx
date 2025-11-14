import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Custom render function with providers
export function renderWithRouter(ui, options = {}) {
  return render(ui, {
    wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    ...options,
  })
}

// Mock file helper
export function createMockFile(name = 'test.jpg', size = 1024, type = 'image/jpeg') {
  const file = new File(['test'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

// Mock API response helpers
export const mockApiResponse = {
  success: (data) => ({
    success: true,
    ...data,
  }),
  error: (message) => ({
    success: false,
    message,
  }),
}
