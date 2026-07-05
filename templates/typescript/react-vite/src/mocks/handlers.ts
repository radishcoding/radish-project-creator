import { http, HttpResponse } from "msw"

/** 示例请求处理器; 按需在此扩展 mock 端点. */
export const handlers = [
  http.get("*/health", () => HttpResponse.json({ status: "ok" })),
]
