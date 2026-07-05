import type { ReactElement, ReactNode } from "react"
import { Navigate, useLocation } from "react-router"

import { useSession } from "@/auth/session"

/**
 * 路由守卫: 未认证时重定向到登录页并携带来源位置.
 * @param props.children 认证通过后渲染的内容.
 * @param props.redirectTo 未认证时的重定向路径, 默认 "/login".
 * @returns 子内容或重定向元素.
 */
export function RequireAuth({
  children,
  redirectTo = "/login",
}: {
  children: ReactNode
  redirectTo?: string
}): ReactElement {
  const { isAuthenticated } = useSession()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  return <>{children}</>
}
