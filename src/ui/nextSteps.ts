import path from "node:path";
import { installCommand, runCommand } from "../core/packageManager.js";
import type { ProjectContext } from "../types.js";

/**
 * 根据项目上下文生成创建完成后的后续操作步骤列表.
 * @param ctx 项目上下文, 包含目标目录, 包管理器及是否已安装依赖等信息.
 * @param cwd 当前工作目录, 用于计算相对路径, 默认为进程工作目录.
 * @returns 按顺序排列的终端命令字符串数组.
 */
export function buildNextSteps(ctx: ProjectContext, cwd: string = process.cwd()): string[] {
  const rel = path.relative(cwd, ctx.targetDir) || ".";
  const steps: string[] = [`cd ${rel}`];
  if (!ctx.installDeps) {
    steps.push(installCommand(ctx.packageManager));
  }
  steps.push(runCommand(ctx.packageManager, "dev"));
  return steps;
}
