import { fileURLToPath, URL } from 'node:url'
import { existsSync, unlinkSync } from 'node:fs'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    {
      name: 'remove-mock-worker-in-prod',
      apply: 'build',
      closeBundle() {
        const target = fileURLToPath(new URL('./dist/mockServiceWorker.js', import.meta.url))
        if (existsSync(target)) {
          unlinkSync(target)
          console.log('[remove-mock-worker-in-prod] 已删除 dist/mockServiceWorker.js')
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: Number(process.env.VITE_DEV_PORT) || 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
