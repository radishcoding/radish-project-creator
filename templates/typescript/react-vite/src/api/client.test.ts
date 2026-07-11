import { apiClient, bareClient, createClient } from "@/api/client"

describe("createClient", () => {
  it("使用 env 基地址与凭据, 允许覆盖", () => {
    const client = createClient({ timeout: 1234 })
    expect(client.defaults.baseURL).toBe("/api/v1")
    expect(client.defaults.withCredentials).toBe(true)
    expect(client.defaults.timeout).toBe(1234)
  })

  it("apiClient 与 bareClient 是不同实例", () => {
    expect(apiClient).not.toBe(bareClient)
  })
})
