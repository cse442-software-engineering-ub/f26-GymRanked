import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const base = '/CSE442/2026-Fall/cse-442y/'

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    proxy: {
      [`${base}api`]: {
        target: 'http://localhost:8000',
        rewrite: (path) => path.replace(`${base}api`, ''),
      },
    },
  },
})
