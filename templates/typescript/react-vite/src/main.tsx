import "./index.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import App from "@/App.tsx"
import { env } from "@/config/env"
import { registerGlobalErrorHandlers } from "@/lib/global-errors"
import { logger } from "@/lib/logger"
import { AppProviders } from "@/providers/app-providers"

registerGlobalErrorHandlers()

async function enableMocking(): Promise<void> {
  if (!env.VITE_ENABLE_MSW) {
    return
  }
  const { worker } = await import("@/mocks/browser")
  await worker.start({ onUnhandledRequest: "bypass" })
}

async function bootstrap(): Promise<void> {
  try {
    await enableMocking()
  } catch (error) {
    // MSW 启动失败不应阻塞应用渲染 (仅开发态可能发生), 记录后照常挂载.
    logger.error("MSW 启动失败, 继续渲染应用", error)
  }
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>
  )
}

void bootstrap()
