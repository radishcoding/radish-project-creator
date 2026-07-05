/** localStorage 中主题偏好的键名, 须与 index.html 的防闪脚本保持一致. */
export const THEME_STORAGE_KEY = "theme"

/** 应用支持的语言标签, 顺序即优先级. */
export const SUPPORTED_LANGUAGES = ["zh-CN", "en-US"] as const

/** 支持的语言标签联合类型. */
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

/** 默认语言. */
export const DEFAULT_LANGUAGE: SupportedLanguage = "zh-CN"

/** localStorage 中令牌的键名 (仅当选用 localStorage 存储策略时使用). */
export const TOKEN_STORAGE_KEY = "auth.access-token"
