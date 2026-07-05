import AxiosMockAdapter from "axios-mock-adapter"

import { apiClient } from "@/api"
import { getCurrentUser, login } from "@/api/endpoints/auth"
import { tokenStore } from "@/auth/token-store"

describe("auth endpoints", () => {
  let mock: AxiosMockAdapter

  beforeEach(() => {
    mock = new AxiosMockAdapter(apiClient)
    tokenStore.clear()
  })

  afterEach(() => {
    mock.restore()
  })

  it("login 命中 /auth/login 并返回解包后的数据", async () => {
    mock.onPost("/auth/login").reply(200, {
      code: 0,
      message: "ok",
      data: { accessToken: "a", user: { id: 1, name: "萝卜" } },
    })
    const result = await login({ username: "u", password: "p" })
    expect(result.accessToken).toBe("a")
    expect(result.user.name).toBe("萝卜")
  })

  it("getCurrentUser 命中 /auth/me", async () => {
    mock.onGet("/auth/me").reply(200, {
      code: 0,
      message: "ok",
      data: { id: 2, name: "阿卜" },
    })
    const user = await getCurrentUser()
    expect(user.id).toBe(2)
  })
})
