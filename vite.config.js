import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/prolific-dashboard-web/',
  server: {
    proxy: {
      '/api/prolific': {
        target: 'https://internal-api.prolific.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/prolific/, '')
      }
    }
  }
})
