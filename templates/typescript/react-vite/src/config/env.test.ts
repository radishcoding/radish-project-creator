import { parseEnv } from "@/config/env"

describe("parseEnv", () => {
  it("缺省时应用默认值", () => {
    const env = parseEnv({})
    expect(env.VITE_API_BASE_URL).toBe("/api/v1")
    expect(env.VITE_APP_ENV).toBe("development")
    expect(env.VITE_ENABLE_MSW).toBe(false)
  })

  it("解析并转换已提供的值", () => {
    const env = parseEnv({
      VITE_API_BASE_URL: "https://api.example.com",
      VITE_APP_ENV: "production",
      VITE_ENABLE_MSW: "true",
    })
    expect(env.VITE_API_BASE_URL).toBe("https://api.example.com")
    expect(env.VITE_APP_ENV).toBe("production")
    expect(env.VITE_ENABLE_MSW).toBe(true)
  })

  it("非法 URL 抛出中文错误", () => {
    expect(() => parseEnv({ VITE_API_BASE_URL: "not-a-url" })).toThrow(
      /环境变量校验失败/
    )
  })

  it("非法枚举值抛出错误", () => {
    expect(() => parseEnv({ VITE_APP_ENV: "prod" })).toThrow(/环境变量校验失败/)
  })
})
