import { apiClient } from "@/api"

/** 当前用户信息. */
export interface CurrentUser {
  id: number
  name: string
}

/** 登录请求体. */
export interface LoginBody {
  username: string
  password: string
}

/** 登录返回结果. */
export interface LoginResult {
  accessToken: string
  user: CurrentUser
}

/**
 * 登录.
 * @param body 用户名与密码.
 * @returns 令牌与用户信息 (响应已由拦截器解包).
 */
export async function login(body: LoginBody): Promise<LoginResult> {
  const response = await apiClient.post<LoginResult>("/auth/login", body)
  return response.data
}

/**
 * 获取当前登录用户.
 * @returns 当前用户信息.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await apiClient.get<CurrentUser>("/auth/me")
  return response.data
}
