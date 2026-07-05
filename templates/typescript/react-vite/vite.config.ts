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
    exclude: [...configDefaults.exclude, "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["**/*.test.{ts,tsx}", "src/test/**", "**/*.config.*"],
    },
  },
})
