/** 后端统一响应包裹. */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
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
 * @returns 具备 code/message/data 三字段返回 true.
 */
export function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "message" in value &&
    "data" in value
  )
}
