import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import path from 'path'

export default defineConfig(({ mode }) => {
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))

  const config = {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port: 3000,
      host: true
    }
  }

  // 生产模式配置
  if (mode === 'production') {
    return {
      ...config,
      build: {
        rollupOptions: {
          external: ['wailsjs/go/main', 'wailsjs/runtime']
        }
      }
    }
  }

  // 开发模式配置
  return config
})