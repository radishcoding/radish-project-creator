import path from "path"
import { defineConfig } from "vitest/config"

// 集成契约测试专用配置: node 环境 + 真实网络, 不加载全局 MSW setup,
// 使请求真正落到运行中的 server. 用 `npm run test:integration` 触发.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/integration/**/*.test.ts"],
  },
})
