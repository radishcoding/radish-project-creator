import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"

import { AppError } from "@/api/types"
import { env } from "@/config/env"
import { createLogger } from "@/lib/logger"

const logger = createLogger("query")

/** 全局查询/变更错误处理器, 由 Provider 注入 toast 等副作用. */
export type QueryErrorHandler = (error: AppError) => void

let errorHandler: QueryErrorHandler | undefined

/**
 * 注册全局查询错误处理器.
 * @param handler 处理器, 传 undefined 取消注册.
 */
export function setQueryErrorHandler(
  handler: QueryErrorHandler | undefined
): void {
  errorHandler = handler
}

function handleError(error: unknown): void {
  const appError =
    error instanceof AppError
      ? error
      : new AppError("unknown", "未知错误", { cause: error })
  logger.error(appError.code, appError.message)
  errorHandler?.(appError)
}

/**
 * 创建配置好默认策略与全局错误处理的 QueryClient.
 * @returns 新的 QueryClient.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError: handleError }),
    mutationCache: new MutationCache({ onError: handleError }),
    defaultOptions: {
      queries: {
        retry: env.VITE_APP_ENV === "production" ? 2 : 0,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

/** 应用级 QueryClient 单例. */
export const queryClient: QueryClient = createQueryClient()
