import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/training/',  // Serve at /training/* path
  build: {
    outDir: '../training-dist',  // Build to parent directory
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls to backend during development
      '/api': {
        target: 'https://facerecognition.mpanel.app',
        changeOrigin: true,
      },
      '/recognize': {
        target: 'https://facerecognition.mpanel.app',
        changeOrigin: true,
      },
      '/sync-faces': {
        target: 'https://facerecognition.mpanel.app',
        changeOrigin: true,
      },
    },
  },
})
