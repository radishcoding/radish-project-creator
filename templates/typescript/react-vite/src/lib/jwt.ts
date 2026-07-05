import { decodeJwt, type JWTPayload } from "jose"

/**
 * 解码 JWT 载荷, 不验证签名 (验签属服务端职责).
 * @param token JWT 字符串.
 * @returns 解码后的声明; 格式非法时返回 undefined.
 */
export function decodeToken<TClaims extends JWTPayload = JWTPayload>(
  token: string
): TClaims | undefined {
  try {
    return decodeJwt(token) as TClaims
  } catch {
    return undefined
  }
}

/**
 * 读取 JWT 的过期时间.
 * @param token JWT 字符串.
 * @returns 过期时间; 无 exp 或非法时返回 undefined.
 */
export function getExpiration(token: string): Date | undefined {
  const claims = decodeToken(token)
  if (claims?.exp === undefined) {
    return undefined
  }
  return new Date(claims.exp * 1000)
}

/**
 * 判断 JWT 是否已过期.
 * @param token JWT 字符串.
 * @param skewSeconds 容忍的时钟偏移秒数, 默认 0.
 * @returns 已过期或无法解析出 exp 时返回 true.
 */
export function isExpired(token: string, skewSeconds = 0): boolean {
  const expiration = getExpiration(token)
  if (expiration === undefined) {
    return true
  }
  return expiration.getTime() - skewSeconds * 1000 <= Date.now()
}
