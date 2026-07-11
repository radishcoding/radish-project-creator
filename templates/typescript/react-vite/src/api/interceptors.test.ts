import axios from "axios"
import AxiosMockAdapter from "axios-mock-adapter"

import { bareClient } from "@/api/client"
import { attachInterceptors, normalizeError } from "@/api/interceptors"
import { AppError } from "@/api/types"
import { tokenStore } from "@/auth/token-store"

function makeInstance() {
  const instance = axios.create({ baseURL: "http://test.local" })
  attachInterceptors(instance)
  return instance
}

describe("normalizeError", () => {
  it("原样返回 AppError", () => {
    const app = new AppError("business", "x")
    expect(normalizeError(app)).toBe(app)
  })

  it("无响应归类为网络错误", () => {
    const error = {
      isAxiosError: true,
      response: undefined,
      message: "Network Error",
    }
    expect(normalizeError(error).code).toBe("network")
  })
})

describe("attachInterceptors", () => {
  beforeEach(() => {
    tokenStore.clear()
  })

  it("有令牌时注入 Authorization 头", async () => {
    const instance = makeInstance()
    const mock = new AxiosMockAdapter(instance)
    tokenStore.setAccessToken("tkn")
    let seen: string | undefined
    mock.onGet("/ping").reply((config) => {
      seen = config.headers?.Authorization as string | undefined
      return [200, { code: "ok", message: "success", data: "pong" }]
    })
    const res = await instance.get("/ping")
    expect(seen).toBe("Bearer tkn")
    expect(res.data).toBe("pong")
    mock.restore()
  })

  it("解包 ApiResponse 的 data 字段", async () => {
    const instance = makeInstance()
    const mock = new AxiosMockAdapter(instance)
    mock
      .onGet("/u")
      .reply(200, { code: "ok", message: "success", data: { id: 7 } })
    const res = await instance.get("/u")
    expect(res.data).toEqual({ id: 7 })
    mock.restore()
  })

  it("业务错误码抛出 AppError(business)", async () => {
    const instance = makeInstance()
    const mock = new AxiosMockAdapter(instance)
    mock
      .onGet("/b")
      .reply(200, { code: "invalid_argument", message: "余额不足", data: null })
    await expect(instance.get("/b")).rejects.toMatchObject({
      name: "AppError",
      code: "business",
      message: "余额不足",
    })
    mock.restore()
  })

  it("401 触发刷新并重放原请求", async () => {
    const instance = makeInstance()
    const mock = new AxiosMockAdapter(instance)
    const bareMock = new AxiosMockAdapter(bareClient) // refreshAccessToken 走 bareClient
    mock.onGet("/secure").replyOnce(401)
    bareMock.onPost("/auth/refresh").reply(200, {
      code: "ok",
      message: "success",
      data: { accessToken: "new-token" },
    })
    mock.onGet("/secure").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer new-token")
      return [200, { code: "ok", message: "success", data: "secret" }]
    })
    const res = await instance.get("/secure")
    expect(res.data).toBe("secret")
    expect(tokenStore.getAccessToken()).toBe("new-token")
    mock.restore()
    bareMock.restore()
  })

  it("HTTP 500 归一化为 AppError(server)", async () => {
    const instance = makeInstance()
    const mock = new AxiosMockAdapter(instance)
    mock
      .onGet("/e")
      .reply(500, { code: "internal_error", message: "boom", data: null })
    await expect(instance.get("/e")).rejects.toMatchObject({
      code: "server",
      status: 500,
    })
    mock.restore()
  })
})
