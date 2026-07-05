import { decodeToken, getExpiration, isExpired } from "@/lib/jwt"

/** 构造一个未签名的 JWT (仅用于测试解码, 签名段留空). */
function makeToken(payload: Record<string, unknown>): string {
  const encode = (obj: unknown): string =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.`
}

describe("jwt", () => {
  it("decodeToken 返回声明", () => {
    const token = makeToken({ sub: "u1", role: "admin" })
    expect(decodeToken<{ sub: string; role: string }>(token)).toMatchObject({
      sub: "u1",
      role: "admin",
    })
  })

  it("非法 token 返回 undefined", () => {
    expect(decodeToken("garbage")).toBeUndefined()
  })

  it("getExpiration 把 exp 转为 Date", () => {
    expect(getExpiration(makeToken({ exp: 1_700_000_000 }))?.getTime()).toBe(
      1_700_000_000_000
    )
  })

  it("isExpired 对过去的 exp 返回 true", () => {
    const past = Math.floor(Date.now() / 1000) - 60
    expect(isExpired(makeToken({ exp: past }))).toBe(true)
  })

  it("isExpired 对未来的 exp 返回 false", () => {
    const future = Math.floor(Date.now() / 1000) + 600
    expect(isExpired(makeToken({ exp: future }))).toBe(false)
  })

  it("无 exp 视为已过期", () => {
    expect(isExpired(makeToken({ sub: "u1" }))).toBe(true)
  })
})
