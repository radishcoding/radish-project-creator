import { spawn } from "node:child_process";
import { FileSystemError } from "../runtime/errors.js";
import type { PackageManager, ProjectContext } from "../types.js";

/**
 * 返回指定包管理器执行安装时所需的命令行参数列表.
 * @param pm 目标包管理器.
 * @returns yarn 返回空数组, 其余返回 ["install"].
 */
export function installArgs(pm: PackageManager): string[] {
  return pm === "yarn" ? [] : ["install"];
}

/**
 * 在项目目录中执行包管理器安装命令, 安装所有依赖.
 * @param ctx 包含目标目录与包管理器信息的项目上下文.
 * @returns 安装成功时 resolve, 失败时 reject 并抛出 FileSystemError.
 */
export function installDependencies(ctx: ProjectContext): Promise<void> {
  const packageManager = ctx.packageManager;
  const args = installArgs(packageManager);
  return new Promise((resolve, reject) => {
    // Windows 上包管理器是 .cmd 脚本, 必须经 shell 启动; 为规避 Node 的 DEP0190
    // (args 数组与 shell:true 同时使用已废弃), 这里把整条命令拼成字符串交给 shell.
    // 包管理器取值受白名单约束 (npm|pnpm|yarn|bun), 参数为固定值, 无命令注入风险.
    const child =
      process.platform === "win32"
        ? spawn([packageManager, ...args].join(" "), {
            cwd: ctx.targetDir,
            stdio: "ignore",
            shell: true,
          })
        : spawn(packageManager, args, {
            cwd: ctx.targetDir,
            stdio: "ignore",
          });
    child.on("error", (error) => {
      reject(new FileSystemError(`依赖安装失败: ${error.message}`));
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new FileSystemError(`依赖安装以退出码 ${code ?? "null"} 结束`));
      }
    });
  });
}
