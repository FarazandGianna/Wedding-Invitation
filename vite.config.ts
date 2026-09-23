import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages project sites serve the app under /<repo-name>/ — CI sets
  // BASE_PATH accordingly; unset BASE_PATH keeps '/' for root deployments.
  base: process.env.BASE_PATH || '/',
  build: {
    target: 'es2019',
    sourcemap: false
  }
})
