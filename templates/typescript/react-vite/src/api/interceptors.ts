import {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  isAxiosError,
} from "axios"

import { AppError, type ErrorCode, isApiResponse } from "@/api/types"
import { refreshAccessToken } from "@/auth/refresh"
import { emitLogout } from "@/auth/session"
import { tokenStore } from "@/auth/token-store"
import { env } from "@/config/env"
import { createLogger } from "@/lib/logger"

/** 后端约定的成功业务码. */
const SUCCESS_CODES: ReadonlySet<number> = new Set([0, 200])

const logger = createLogger("http")

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

function statusToCode(status: number | undefined): ErrorCode {
  switch (status) {
    case 401:
      return "unauthorized"
    case 403:
      return "forbidden"
    case 404:
      return "notFound"
    default:
      if (status !== undefined && status >= 500) {
        return "server"
      }
      return "unknown"
  }
}

function extractMessage(data: unknown): string | undefined {
  if (isApiResponse(data) && typeof data.message === "string") {
    return data.message
  }
  return undefined
}

/**
 * 把任意错误规范化为 AppError.
 * @param error 原始错误.
 * @returns 规范化后的 AppError.
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }
  if (isAxiosError(error)) {
    const status = error.response?.status
    if (error.code === "ECONNABORTED") {
      return new AppError("timeout", "请求超时", { status, cause: error })
    }
    if (error.response === undefined) {
      return new AppError("network", "网络异常, 请检查连接", { cause: error })
    }
    const message = extractMessage(error.response.data) ?? error.message
    return new AppError(statusToCode(status), message, { status, cause: error })
  }
  return new AppError(
    "unknown",
    error instanceof Error ? error.message : "未知错误",
    { cause: error }
  )
}

/**
 * 为 axios 实例挂载请求/响应拦截器: 注入令牌与 traceId, 解包响应, 规范化错误, 401 静默刷新.
 * @param instance 目标 axios 实例.
 */
export function attachInterceptors(instance: AxiosInstance): void {
  instance.interceptors.request.use((config) => {
    const token = tokenStore.getAccessToken()
    if (token !== undefined) {
      config.headers.set("Authorization", `Bearer ${token}`)
    }
    config.headers.set("X-Trace-Id", crypto.randomUUID())
    return config
  })

  instance.interceptors.response.use(
    (response) => {
      const body: unknown = response.data
      if (isApiResponse(body)) {
        if (!SUCCESS_CODES.has(body.code)) {
          throw new AppError("business", body.message, {
            status: response.status,
          })
        }
        response.data = body.data
      }
      return response
    },
    async (error: unknown) => {
      if (isAxiosError(error)) {
        const original = error.config as RetriableConfig | undefined
        if (
          error.response?.status === 401 &&
          original !== undefined &&
          original._retry !== true
        ) {
          original._retry = true
          try {
            const token = await refreshAccessToken()
            original.headers.set("Authorization", `Bearer ${token}`)
            return await instance(original)
          } catch (refreshError) {
            tokenStore.clear()
            emitLogout()
            logger.warn("令牌刷新失败, 已登出")
            return Promise.reject(normalizeError(refreshError))
          }
        }
      }
      return Promise.reject(normalizeError(error))
    }
  )

  logger.debug("已挂载 HTTP 拦截器", env.VITE_APP_ENV)
}
