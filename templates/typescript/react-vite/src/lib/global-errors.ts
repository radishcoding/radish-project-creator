import { createLogger } from "@/lib/logger"

const logger = createLogger("global")

/**
 * 注册全局未捕获错误与未处理 Promise 拒绝的监听, 统一记入日志.
 * @returns 取消注册的函数.
 */
export function registerGlobalErrorHandlers(): () => void {
  const onError = (event: ErrorEvent): void => {
    logger.error("未捕获错误", event.error ?? event.message)
  }
  const onRejection = (event: PromiseRejectionEvent): void => {
    logger.error("未处理的 Promise 拒绝", event.reason)
  }

  window.addEventListener("error", onError)
  window.addEventListener("unhandledrejection", onRejection)

  return () => {
    window.removeEventListener("error", onError)
    window.removeEventListener("unhandledrejection", onRejection)
  }
}
