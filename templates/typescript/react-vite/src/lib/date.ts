import { format, formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

/** 默认日期格式. */
const DEFAULT_PATTERN = "yyyy-MM-dd HH:mm:ss"

function toDate(value: Date | number | string): Date {
  return value instanceof Date ? value : new Date(value)
}

/**
 * 按指定模式格式化日期.
 * @param value 日期, 时间戳或可解析的日期字符串.
 * @param pattern date-fns 格式模式, 默认 "yyyy-MM-dd HH:mm:ss".
 * @returns 格式化后的字符串.
 */
export function formatDate(
  value: Date | number | string,
  pattern: string = DEFAULT_PATTERN
): string {
  return format(toDate(value), pattern)
}

/**
 * 生成相对当前时间的中文描述.
 * @param value 目标时间.
 * @returns 形如 "5 分钟前" 的字符串.
 */
export function formatRelative(value: Date | number | string): string {
  return formatDistanceToNow(toDate(value), { addSuffix: true, locale: zhCN })
}
