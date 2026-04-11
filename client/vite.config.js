import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {      
    port: 5173,         // Forces Vite to use exactly 5173
    strictPort: true,   // Will throw an error if 5173 is already in use (prevents silent port switching) 
    allowedHosts: true
  }
})