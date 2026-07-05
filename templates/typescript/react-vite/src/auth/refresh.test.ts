import AxiosMockAdapter from "axios-mock-adapter"

import { bareClient } from "@/api/client"
import { refreshAccessToken } from "@/auth/refresh"
import { tokenStore } from "@/auth/token-store"

describe("refreshAccessToken", () => {
  let mock: AxiosMockAdapter

  beforeEach(() => {
    mock = new AxiosMockAdapter(bareClient)
    tokenStore.clear()
  })

  afterEach(() => {
    mock.restore()
  })

  it("请求刷新端点并写回新令牌", async () => {
    mock.onPost("/auth/refresh").reply(200, { accessToken: "fresh" })
    const token = await refreshAccessToken()
    expect(token).toBe("fresh")
    expect(tokenStore.getAccessToken()).toBe("fresh")
  })

  it("并发调用共享同一次刷新请求", async () => {
    let calls = 0
    mock.onPost("/auth/refresh").reply(() => {
      calls += 1
      return [200, { accessToken: "once" }]
    })
    const [a, b] = await Promise.all([
      refreshAccessToken(),
      refreshAccessToken(),
    ])
    expect(a).toBe("once")
    expect(b).toBe("once")
    expect(calls).toBe(1)
  })
})
