import { bareClient } from "@/api/client"
import { tokenStore } from "@/auth/token-store"

/** 刷新端点返回的令牌载荷. */
interface RefreshResult {
  accessToken: string
}

let pending: Promise<string> | null = null

async function doRefresh(): Promise<string> {
  // 后端凭 httpOnly cookie 换发新 access token, 无需在请求体携带 refresh token.
  const response = await bareClient.post<RefreshResult>("/auth/refresh")
  const accessToken = response.data.accessToken
  tokenStore.setAccessToken(accessToken)
  return accessToken
}

/**
 * 静默刷新 access token; 并发调用共享同一次在途请求.
 * @returns 刷新后的 access token.
 */
export function refreshAccessToken(): Promise<string> {
  if (pending !== null) {
    return pending
  }
  pending = doRefresh().finally(() => {
    pending = null
  })
  return pending
}
