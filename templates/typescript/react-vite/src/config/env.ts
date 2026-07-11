import { z } from "zod"

const envSchema = z.object({
  // baseURL 全环境统一为相对路径, 走单源架构 (dev 经 Vite proxy, prod 经反向代理);
  // 允许以 / 开头的相对路径, 或用于跨源部署的 http(s):// 绝对地址.
  VITE_API_BASE_URL: z
    .string()
    .default("/api/v1")
    .refine(
      (value) => value.startsWith("/") || /^https?:\/\//.test(value),
      "必须是以 / 开头的相对路径或 http(s):// 绝对地址"
    ),
  VITE_APP_ENV: z
    .enum(["development", "staging", "production"])
    .default("development"),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_ENABLE_MSW: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
})

/** 校验后的环境变量类型. */
export type Env = z.infer<typeof envSchema>

/**
 * 校验并解析一组环境变量来源.
 * @param source 原始键值来源 (通常是 import.meta.env).
 * @returns 只读的类型安全环境变量.
 * @throws Error 当任一变量不满足 schema 时.
 */
export function parseEnv(source: Record<string, unknown>): Readonly<Env> {
  const result = envSchema.safeParse(source)
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ")
    throw new Error(`环境变量校验失败: ${detail}`)
  }
  return result.data
}

/** 应用级只读环境变量, 模块加载即校验, 失败立即抛错. */
export const env: Readonly<Env> = parseEnv(import.meta.env)
