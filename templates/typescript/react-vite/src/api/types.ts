/** 后端统一响应包裹, 与 Go 端 response.Envelope 对齐 (code 为语义字符串, 成功恒为 "ok"). */
export interface ApiResponse<T> {
  code: string
  message: string
  data: T
  /** 链路追踪 ID, 由后端注入 (对应 Envelope.requestId). */
  requestId?: string
}

/** 分页数据结构. */
export interface Paginated<T> {
  items: readonly T[]
  total: number
  page: number
  pageSize: number
}

/** 规范化的错误分类. */
export type ErrorCode =
  | "network"
  | "timeout"
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "server"
  | "business"
  | "unknown"

/** 应用层统一错误, 承载错误分类与 HTTP 状态码. */
export class AppError extends Error {
  readonly code: ErrorCode
  readonly status?: number

  constructor(
    code: ErrorCode,
    message: string,
    options?: { status?: number; cause?: unknown }
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : undefined
    )
    this.name = "AppError"
    this.code = code
    this.status = options?.status
  }
}

/**
 * 判断值是否符合 ApiResponse 形状.
 * @param value 待判断的值.
 * @returns code 与 message 均为字符串且含 data 字段时返回 true.
 */
export function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const record = value as Record<string, unknown>
  return (
    typeof record.code === "string" &&
    typeof record.message === "string" &&
    "data" in record
  )
}
