import type { ReactElement } from "react"
import type { FallbackProps } from "react-error-boundary"

/**
 * 渲染错误边界的降级 UI.
 * @param props.error 捕获的错误.
 * @param props.resetErrorBoundary 重置边界的回调.
 * @returns 降级界面.
 */
export function ErrorFallback({
  error,
  resetErrorBoundary,
}: FallbackProps): ReactElement {
  return (
    <div
      role="alert"
      className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background text-foreground"
    >
      <p className="text-lg font-medium">出错了</p>
      <p className="text-sm text-muted-foreground">
        {error instanceof Error ? error.message : String(error)}
      </p>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        重试
      </button>
    </div>
  )
}
