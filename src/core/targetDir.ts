import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

/**
 * 解析目标项目目录的绝对路径.
 * @param projectName 项目名称
 * @param cwd 基础工作目录, 默认为 process.cwd()
 * @returns 目标目录绝对路径
 */
export function resolveTargetDir(projectName: string, cwd: string = process.cwd()): string {
  return path.resolve(cwd, projectName);
}

/**
 * 判定目录是否可用 (不存在或为空).
 * @param dir 要检查的目录路径
 * @returns true 表示目录不存在或为空, 可用于创建项目; false 表示目录存在且非空
 */
export async function isDirUsable(dir: string): Promise<boolean> {
  if (!existsSync(dir)) {
    return true;
  }
  const entries = await readdir(dir);
  return entries.length === 0;
}
