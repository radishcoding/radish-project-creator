import pc from "picocolors";

/** 品牌名称. */
export const BRAND = "radish";

/**
 * 品牌渐变色序列, 从青色经紫色至红色.
 */
export const GRADIENT_COLORS: readonly string[] = ["#12c2e9", "#c471ed", "#f64f59"];

/**
 * 常用 emoji 映射表, key 为语义名称.
 */
export const emoji = {
  rocket: "🚀",
  package: "📦",
  sparkles: "✨",
  folder: "📁",
  warn: "⚠️",
  wave: "👋",
  check: "✅",
  cross: "❌",
} as const;

/**
 * picocolors 实例, 用于着色终端输出.
 */
export const c = pc;

/**
 * 已知语言目录名到菜单显示名的映射 (规范大小写).
 */
export const LANGUAGE_LABELS: Record<string, string> = {
  go: "Go",
  typescript: "TypeScript",
  javascript: "JavaScript",
  python: "Python",
  rust: "Rust",
  java: "Java",
};

/**
 * 将语言目录名格式化为菜单显示名.
 * @param language 语言目录名 (通常小写).
 * @returns 已知语言返回规范大小写, 否则返回首字母大写形式.
 */
export function formatLanguage(language: string): string {
  return LANGUAGE_LABELS[language] ?? language.charAt(0).toUpperCase() + language.slice(1);
}
