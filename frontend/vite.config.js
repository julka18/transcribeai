import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration for React app
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Server configuration for development
  server: {
    port: 5173, // Development server port
    host: true, // Listen on all network interfaces (allows mobile testing)
    
    // Proxy API requests to backend during development
    // This avoids CORS issues when testing locally
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  
  // Build configuration for production
  build: {
    outDir: 'dist', // Output directory for production build
    sourcemap: false, // Disable source maps in production
    
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['axios'],
        },
      },
    },
  },
})