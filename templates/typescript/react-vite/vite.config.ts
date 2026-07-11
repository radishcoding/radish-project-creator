import babel from "@rolldown/plugin-babel"
import tailwindcss from "@tailwindcss/vite"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import path from "path"
import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // 单源开发: 把 /api/v1 转发到 Go 后端, 浏览器视角同源, 无 CORS.
    // 不 rewrite: 后端业务路由本就挂在 /api/v1 前缀下. 仅 vite dev 生效.
    proxy: {
      "/api/v1": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Rolldown (Vite 8) 仅支持函数形式, 不支持对象字面量.
        manualChunks: (id) => {
          if (
            id.includes("/node_modules/react-dom/") ||
            id.includes("/node_modules/react-router/") ||
            id.includes("/node_modules/react/")
          ) {
            return "react-vendor"
          }
          if (id.includes("/node_modules/motion/")) {
            return "motion-vendor"
          }
          if (
            id.includes("/node_modules/@base-ui/") ||
            id.includes("/node_modules/lucide-react/")
          ) {
            return "ui-vendor"
          }
          if (
            id.includes("/node_modules/@tanstack/") ||
            id.includes("/node_modules/axios/")
          ) {
            return "data-vendor"
          }
          if (
            id.includes("/node_modules/i18next") ||
            id.includes("/node_modules/react-i18next/")
          ) {
            return "intl-vendor"
          }
          return undefined
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    // 集成契约测试需真实 server, 排除出默认单测; 用 `npm run test:integration` 单独跑.
    exclude: [...configDefaults.exclude, "e2e/**", "src/integration/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["**/*.test.{ts,tsx}", "src/test/**", "**/*.config.*"],
    },
  },
})
