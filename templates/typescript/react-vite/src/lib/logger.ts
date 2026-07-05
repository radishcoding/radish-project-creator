import { env } from "@/config/env"

/** 日志级别, 由低到高. */
export type LogLevel = "debug" | "info" | "warn" | "error"

/** 日志输出目标, 可注册多个 (如控制台, 远程上报). */
export interface LogSink {
  write(level: LogLevel, scope: string, args: readonly unknown[]): void
}

/** 分级日志器. */
export interface Logger {
  debug(...args: readonly unknown[]): void
  info(...args: readonly unknown[]): void
  warn(...args: readonly unknown[]): void
  error(...args: readonly unknown[]): void
}

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const minLevel: LogLevel = env.VITE_APP_ENV === "production" ? "warn" : "debug"

const consoleSink: LogSink = {
  write(level, scope, args) {
    const prefix = `[${scope}]`
    if (level === "error") {
      console.error(prefix, ...args)
    } else if (level === "warn") {
      console.warn(prefix, ...args)
    } else if (level === "info") {
      console.info(prefix, ...args)
    } else {
      console.debug(prefix, ...args)
    }
  },
}

const sinks: LogSink[] = [consoleSink]

/**
 * 注册一个日志输出目标 (如 Sentry sink).
 * @param sink 输出目标.
 * @returns 取消注册的函数.
 */
export function registerSink(sink: LogSink): () => void {
  sinks.push(sink)
  return () => {
    const index = sinks.indexOf(sink)
    if (index >= 0) {
      sinks.splice(index, 1)
    }
  }
}

function emit(level: LogLevel, scope: string, args: readonly unknown[]): void {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[minLevel]) {
    return
  }
  for (const sink of sinks) {
    sink.write(level, scope, args)
  }
}

/**
 * 创建带作用域标签的日志器.
 * @param scope 作用域标签, 出现在每条日志前缀.
 * @returns 日志器实例.
 */
export function createLogger(scope: string): Logger {
  return {
    debug: (...args) => emit("debug", scope, args),
    info: (...args) => emit("info", scope, args),
    warn: (...args) => emit("warn", scope, args),
    error: (...args) => emit("error", scope, args),
  }
}

/** 根日志器. */
export const logger: Logger = createLogger("app")
