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
