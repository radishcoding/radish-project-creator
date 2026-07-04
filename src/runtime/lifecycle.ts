import { rmSync } from "node:fs";

type CleanupFn = () => void;

const cleanups = new Set<CleanupFn>();
let installed = false;

/**
 * 注册清理函数, 在清理时执行。返回反注册函数, 调用后可移除该清理项。
 * @param fn - 待注册的清理函数
 * @returns 反注册函数
 */
export function registerCleanup(fn: CleanupFn): () => void {
  cleanups.add(fn);
  return () => {
    cleanups.delete(fn);
  };
}

/**
 * 注册临时目录, 在清理时递归删除。返回反注册函数, 调用后可移除该清理项。
 * @param dir - 临时目录路径
 * @returns 反注册函数
 */
export function registerTempDir(dir: string): () => void {
  return registerCleanup(() => {
    rmSync(dir, { recursive: true, force: true });
  });
}

/**
 * 执行所有已注册的清理函数, 忽略单个清理失败, 清空清理列表。
 */
export function runCleanups(): void {
  for (const fn of cleanups) {
    try {
      fn();
    } catch {
      // 尽力清理, 忽略单个清理失败
    }
  }
  cleanups.clear();
}

/**
 * 挂载进程信号与异常处理器, 实现优雅关闭。执行清理, 恢复光标, 退出进程。
 * 多次调用仅生效一次。
 * @param options - 选项
 * @param options.onFatal - 未捕获异常或 Promise rejection 时的回调
 */
export function installLifecycle(options: { onFatal?: (error: unknown) => void } = {}): void {
  if (installed) {
    return;
  }
  installed = true;

  const showCursor = (): void => {
    process.stdout.write("\x1b[?25h");
  };

  const onSignal = (): void => {
    runCleanups();
    showCursor();
    process.exit(130);
  };

  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);

  const handleFatal = (error: unknown): void => {
    runCleanups();
    showCursor();
    options.onFatal?.(error);
    process.exit(1);
  };

  process.on("uncaughtException", handleFatal);
  process.on("unhandledRejection", handleFatal);
}
