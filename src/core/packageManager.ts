import type { PackageManager } from "../types.js";

const KNOWN: readonly PackageManager[] = ["npm", "pnpm", "yarn", "bun"];

/**
 * 从 npm_config_user_agent 环境变量或指定的 user agent 字符串探测包管理器.
 * @param userAgent 包管理器 user agent 字符串, 默认从环境变量读取.
 * @returns 识别到的包管理器名称, 未识别时默认返回 "npm".
 */
export function detectPackageManager(
  userAgent: string | undefined = process.env.npm_config_user_agent,
): PackageManager {
  if (userAgent) {
    const name = userAgent.split(" ")[0]?.split("/")[0];
    if (name && (KNOWN as readonly string[]).includes(name)) {
      return name as PackageManager;
    }
  }
  return "npm";
}

/**
 * 根据优先级选择包管理器: 优先使用显式指定, 否则自动探测.
 * @param preferred 用户显式指定的包管理器.
 * @returns 最终选定的包管理器.
 */
export function resolvePackageManager(preferred: PackageManager | undefined): PackageManager {
  return preferred ?? detectPackageManager();
}

/**
 * 生成包管理器的安装依赖命令.
 * @param pm 目标包管理器.
 * @returns 完整的安装命令字符串.
 */
export function installCommand(pm: PackageManager): string {
  return pm === "yarn" ? "yarn" : `${pm} install`;
}

/**
 * 生成包管理器的运行脚本命令.
 * @param pm 目标包管理器.
 * @param script 脚本名称.
 * @returns 完整的运行命令字符串.
 */
export function runCommand(pm: PackageManager, script: string): string {
  return pm === "npm" ? `npm run ${script}` : `${pm} ${script}`;
}
