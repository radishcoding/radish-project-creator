import { http, HttpResponse } from "msw"

import { server } from "@/mocks/node"

describe("MSW", () => {
  it("拦截 fetch 请求并返回 mock 响应", async () => {
    server.use(http.get("*/msw-demo", () => HttpResponse.json({ ok: true })))
    const response = await fetch("http://localhost:8080/msw-demo")
    expect(response.ok).toBe(true)
    expect(await response.json()).toEqual({ ok: true })
  })
})
