import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  root: 'src/renderer',
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': resolve('src/shared'),
      '@renderer': resolve('src/renderer'),
      '@components': resolve('src/renderer/components'),
      '@pages': resolve('src/renderer/pages'),
      '@stores': resolve('src/renderer/stores'),
      '@hooks': resolve('src/renderer/hooks'),
      '@lib': resolve('src/renderer/lib')
    }
  },
  server: { host: '0.0.0.0' },
  build: {
    outDir: '../../dist',
    emptyOutDir: true
  }
})
