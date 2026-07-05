import axios, { type AxiosInstance, type CreateAxiosDefaults } from "axios"

import { env } from "@/config/env"

/** 默认请求超时, 单位毫秒. */
const DEFAULT_TIMEOUT = 15_000

/**
 * 创建一个 axios 实例, 统一基地址, 超时与凭据.
 * @param config 覆盖用的额外配置.
 * @returns 新的 axios 实例.
 */
export function createClient(config?: CreateAxiosDefaults): AxiosInstance {
  return axios.create({
    baseURL: env.VITE_API_BASE_URL,
    timeout: DEFAULT_TIMEOUT,
    withCredentials: true,
    ...config,
  })
}

/** 无拦截器的裸客户端, 供令牌刷新使用, 避免拦截器递归. */
export const bareClient: AxiosInstance = createClient()

/** 主客户端; 拦截器由 api/interceptors.ts 挂载, 经 api/index.ts 组装导出. */
export const apiClient: AxiosInstance = createClient()
