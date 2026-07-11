import { http, HttpResponse } from "msw"

import type { ApiResponse } from "@/api/types"

/**
 * 构造与后端 response.Envelope 对齐的成功信封.
 * @param data 业务数据.
 * @returns code 为 "ok" 的统一响应包裹.
 */
function ok<T>(data: T): ApiResponse<T> {
  return { code: "ok", message: "success", data, requestId: "mock-request-id" }
}

/** 示例请求处理器; 按需在此扩展 mock 端点. */
export const handlers = [
  http.get("*/livez", () => HttpResponse.json(ok({ status: "alive" }))),
]
