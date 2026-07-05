import type { JWTPayload } from "jose"
import * as React from "react"

import { tokenStore } from "@/auth/token-store"
import { decodeToken, isExpired } from "@/lib/jwt"

const logoutListeners = new Set<() => void>()

/** 广播登出事件 (令牌刷新失败时由拦截器调用). */
export function emitLogout(): void {
  for (const listener of logoutListeners) {
    listener()
  }
}

/**
 * 订阅登出事件.
 * @param listener 登出时的回调.
 * @returns 取消订阅函数.
 */
export function onLogout(listener: () => void): () => void {
  logoutListeners.add(listener)
  return () => {
    logoutListeners.delete(listener)
  }
}

/** 主动登出: 清除令牌并广播事件. */
export function logout(): void {
  tokenStore.clear()
  emitLogout()
}

/** 会话快照. */
export interface Session {
  isAuthenticated: boolean
  claims: JWTPayload | undefined
  logout: () => void
}

function toSession(token: string | undefined): Session {
  const claims = token !== undefined ? decodeToken(token) : undefined
  return {
    isAuthenticated: token !== undefined && !isExpired(token),
    claims,
    logout,
  }
}

/**
 * 读取当前会话快照 (基于内存令牌解码, 不发请求).
 * @returns 当前会话.
 */
export function getSession(): Session {
  return toSession(tokenStore.getAccessToken())
}

/**
 * 订阅令牌变化的响应式会话 hook.
 * @returns 随令牌变化更新的会话.
 */
export function useSession(): Session {
  const subscribe = React.useCallback(
    (onChange: () => void) => tokenStore.subscribe(onChange),
    []
  )
  const getSnapshot = React.useCallback(() => tokenStore.getAccessToken(), [])
  const token = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return React.useMemo(() => toSession(token), [token])
}
