import { AppError, isApiResponse } from "@/api/types"

describe("AppError", () => {
  it("携带 code, message, status 与 name", () => {
    const error = new AppError("server", "服务异常", { status: 500 })
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe("AppError")
    expect(error.code).toBe("server")
    expect(error.message).toBe("服务异常")
    expect(error.status).toBe(500)
  })

  it("保留 cause 链", () => {
    const root = new Error("root")
    const error = new AppError("unknown", "包裹", { cause: root })
    expect(error.cause).toBe(root)
  })
})

describe("isApiResponse", () => {
  it("识别包裹结构", () => {
    expect(isApiResponse({ code: 0, message: "ok", data: null })).toBe(true)
  })

  it("拒绝非包裹结构", () => {
    expect(isApiResponse({ foo: 1 })).toBe(false)
    expect(isApiResponse(null)).toBe(false)
    expect(isApiResponse("x")).toBe(false)
  })
})
