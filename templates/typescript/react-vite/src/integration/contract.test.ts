// 前后端契约集成测试: 用 client 的真实 axios 拦截器栈, 打真实运行的 server (go/gin-api),
// 校验两者在响应信封、错误映射与 404 上的紧耦合面是否一致.
//
// 由独立配置 vitest.integration.config.ts 驱动 (node 环境, 不加载 MSW), 故请求真正落到 server.
// server 未在线时整套自动跳过, 普通 `npm test` 不含本目录.
//   npm run test:integration
/// <reference types="node" />
import axios, { isAxiosError } from "axios"
import { describe, expect, it } from "vitest"

import { createClient } from "@/api/client"
import { attachInterceptors } from "@/api/interceptors"
import { type ApiResponse, AppError } from "@/api/types"

/** 真实后端基地址; 集成测试直连 server 的 8000 端口 (应用运行时 baseURL 为相对 /api/v1, 经 Vite proxy 转发). */
const BASE_URL = process.env.INTEGRATION_API_URL ?? "http://localhost:8000"

/** 探测 server 是否在线: 拿到任意 HTTP 响应 (含 4xx/5xx) 即视为在线. */
async function probe(): Promise<boolean> {
  try {
    await axios.get(`${BASE_URL}/livez`, { timeout: 1500 })
    return true
  } catch (error) {
    return isAxiosError(error) && error.response !== undefined
  }
}

const online = await probe()

if (!online) {
  // 明确告知为何跳过, 避免误以为通过.
  console.warn(
    `[integration] 跳过契约测试: ${BASE_URL} 未就绪. 先起 server 再 npm run test:integration.`
  )
}

/** 挂了完整拦截器的 client, 指向真实 server. */
function makeClient() {
  const client = createClient({ baseURL: BASE_URL })
  attachInterceptors(client)
  return client
}

describe.skipIf(!online)("契约: client 拦截器 x 真实 server 信封", () => {
  it("原始 /livez 响应即后端统一信封 (code=ok, 带 requestId)", async () => {
    // 用无拦截器的裸 axios 看未解包的原始信封, 显式锁定契约字段.
    const raw = axios.create({ baseURL: BASE_URL })
    const res = await raw.get<ApiResponse<{ status: string }>>("/livez")
    expect(res.status).toBe(200)
    expect(res.data.code).toBe("ok")
    expect(typeof res.data.message).toBe("string")
    expect(res.data.data).toEqual({ status: "alive" })
    expect(typeof res.data.requestId).toBe("string")
    expect((res.data.requestId ?? "").length).toBeGreaterThan(0)
  })

  it("拦截器把 /livez 信封解包为内层 data", async () => {
    const client = makeClient()
    const res = await client.get<{ status: string }>("/livez")
    // 成功码 ok -> 拦截器剥壳, res.data 直接是业务数据.
    expect(res.data).toEqual({ status: "alive" })
  })

  it("/readyz 依赖就绪时解包, 未就绪时映射为 AppError(503)", async () => {
    const client = makeClient()
    try {
      const res = await client.get<Record<string, unknown>>("/readyz")
      // 200: 依赖健康, data 为各依赖明细 (非空对象).
      expect(res.data).toBeTypeOf("object")
      expect(Object.keys(res.data).length).toBeGreaterThan(0)
    } catch (error) {
      // 503: 依赖未就绪, 应被规范化为 AppError, 状态码透传.
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).status).toBe(503)
    }
  })

  it("未匹配路由被规范化为 AppError(notFound, 404)", async () => {
    const client = makeClient()
    await expect(
      client.get("/__definitely_not_a_route__")
    ).rejects.toMatchObject({
      name: "AppError",
      code: "notFound",
      status: 404,
    })
  })
})
