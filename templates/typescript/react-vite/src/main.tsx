import "./index.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import App from "@/App.tsx"
import { env } from "@/config/env"
import { registerGlobalErrorHandlers } from "@/lib/global-errors"
import { AppProviders } from "@/providers/app-providers"

registerGlobalErrorHandlers()

async function enableMocking(): Promise<void> {
  if (!env.VITE_ENABLE_MSW) {
    return
  }
  const { worker } = await import("@/mocks/browser")
  await worker.start({ onUnhandledRequest: "bypass" })
}

void enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>
  )
})
