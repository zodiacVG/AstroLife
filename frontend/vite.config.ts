import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // SPA路由重定向配置 - 将所有未找到的路由重定向到index.html
    fs: {
      allow: ['..']
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // 确保构建时正确处理SPA路由
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  // 明确指定应用类型为SPA
  appType: 'spa'
})