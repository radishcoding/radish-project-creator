import { act, renderHook } from "@testing-library/react"

import { getSession, onLogout, useSession } from "@/auth/session"
import { tokenStore } from "@/auth/token-store"

/** 构造未签名 JWT, 便于测试解码与过期. */
function makeToken(payload: Record<string, unknown>): string {
  const encode = (obj: unknown): string =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.`
}

describe("session", () => {
  beforeEach(() => {
    tokenStore.clear()
  })

  it("getSession 对未来 token 判为已认证并解出 claims", () => {
    const future = Math.floor(Date.now() / 1000) + 600
    tokenStore.setAccessToken(makeToken({ sub: "u1", exp: future }))
    const session = getSession()
    expect(session.isAuthenticated).toBe(true)
    expect(session.claims?.sub).toBe("u1")
  })

  it("getSession 对无 token 判为未认证", () => {
    expect(getSession().isAuthenticated).toBe(false)
  })

  it("useSession 随令牌变化重新渲染", () => {
    const { result } = renderHook(() => useSession())
    expect(result.current.isAuthenticated).toBe(false)
    const future = Math.floor(Date.now() / 1000) + 600
    act(() => {
      tokenStore.setAccessToken(makeToken({ sub: "u2", exp: future }))
    })
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.claims?.sub).toBe("u2")
  })

  it("logout 清除令牌并触发登出事件", () => {
    const future = Math.floor(Date.now() / 1000) + 600
    tokenStore.setAccessToken(makeToken({ exp: future }))
    let fired = 0
    const off = onLogout(() => {
      fired += 1
    })
    getSession().logout()
    expect(fired).toBe(1)
    expect(getSession().isAuthenticated).toBe(false)
    off()
  })
})
