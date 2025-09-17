import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    strictPort: false,
    headers: {
      'Cache-Control': 'no-store'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false
      },
      '/health': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})

