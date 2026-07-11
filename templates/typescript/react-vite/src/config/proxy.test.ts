import type { ProxyOptions, UserConfig } from "vite"

import { parseEnv } from "@/config/env"

import viteConfig from "../../vite.config"

describe("单源 dev 代理配置", () => {
  it("proxy 前缀覆盖 client 默认 baseURL 并转发到后端 8000", () => {
    const proxy = (viteConfig as UserConfig).server?.proxy ?? {}
    const baseURL = parseEnv({}).VITE_API_BASE_URL

    // client 默认 baseURL 必须被某条 proxy 规则前缀覆盖, 否则 dev 下请求不会被转发.
    expect(Object.keys(proxy)).toContain(baseURL)

    const rule = proxy[baseURL] as string | ProxyOptions
    const target = typeof rule === "string" ? rule : rule.target
    expect(target).toBe("http://localhost:8000")
  })
})
