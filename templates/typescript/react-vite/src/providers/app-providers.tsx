import { QueryClientProvider } from "@tanstack/react-query"
import { createHead, UnheadProvider } from "@unhead/react/client"
import type { ReactElement, ReactNode } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { I18nextProvider } from "react-i18next"

import { queryClient } from "@/api/query-client"
import { ThemeProvider } from "@/components/theme-provider"
import i18n from "@/i18n"
import { logger } from "@/lib/logger"
import { ErrorFallback } from "@/providers/error-fallback"

const head = createHead()

/**
 * 应用 Providers 组合根.
 * 组合顺序 (外到内): ErrorBoundary > Unhead > Query > I18n > Theme.
 * @param props.children 应用内容 (通常是 RouterProvider).
 * @returns 包裹后的应用树.
 */
export function AppProviders({
  children,
}: {
  children: ReactNode
}): ReactElement {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        logger.error("渲染错误边界捕获", error)
      }}
    >
      <UnheadProvider head={head}>
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <ThemeProvider>{children}</ThemeProvider>
          </I18nextProvider>
        </QueryClientProvider>
      </UnheadProvider>
    </ErrorBoundary>
  )
}
