import { spawn } from "node:child_process";
import { FileSystemError } from "../runtime/errors.js";
import type { PostGenerateTask } from "../types.js";

/**
 * 在指定目录内执行一条生成后任务.
 * 以 argv 数组直接调用, 不经 shell, 从而避免参数转义与命令注入.
 * @param task 待执行的任务, command[0] 为可执行文件, 其余为参数.
 * @param cwd 命令的工作目录, 通常为生成的项目根目录.
 * @returns 命令以退出码 0 结束时 resolve; 否则 reject 并抛出 FileSystemError.
 */
export function runPostGenerateTask(task: PostGenerateTask, cwd: string): Promise<void> {
  const [command, ...args] = task.command;
  if (command === undefined) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "ignore" });
    child.on("error", (error) => {
      reject(new FileSystemError(`生成后任务无法启动: ${error.message}`, { cause: error }));
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new FileSystemError(`生成后任务以退出码 ${code ?? "null"} 结束`));
      }
    });
  });
}
