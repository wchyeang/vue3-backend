import { fileURLToPath, URL } from 'node:url'
import { existsSync, unlinkSync } from 'node:fs'

import { defineConfig, type Plugin, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

/** 非 Mock 模式下，构建完成后从产物中移除 MSW 的 Service Worker 脚本 */
function removeMockWorkerFromBuild(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    name: 'remove-mock-worker',
    apply: 'build',
    closeBundle() {
      if (env.VITE_USE_MOCK === 'true') return
      const target = fileURLToPath(new URL('./dist/mockServiceWorker.js', import.meta.url))
      if (existsSync(target)) {
        unlinkSync(target)
        console.log('[remove-mock-worker] 已删除 dist/mockServiceWorker.js')
      }
    },
  }
}

/** 非 Mock 模式下，Cloudflare 专用的 _redirects 文件也从产物中移除 */
function removeRedirectsFromBuild(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    name: 'remove-redirects',
    apply: 'build',
    closeBundle() {
      if (env.VITE_USE_MOCK === 'true') return
      const target = fileURLToPath(new URL('./dist/_redirects', import.meta.url))
      if (existsSync(target)) {
        unlinkSync(target)
        console.log('[remove-redirects] 已删除 dist/_redirects')
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    removeMockWorkerFromBuild(mode),
    removeRedirectsFromBuild(mode),
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
}))
