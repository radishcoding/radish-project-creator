import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, "..");

/**
 * 解析包根 `templates/` 目录的绝对路径
 * @returns templates 目录的绝对路径, 兼容开发 (src) 与发布 (dist) 运行
 */
export function resolveTemplatesRoot(): string {
  return path.join(packageRoot, "templates");
}

/**
 * 从 package.json 读取项目版本号
 * @returns semver 格式的版本号, 如 "1.0.0"; 若 package.json 无 version 字段则返回 "0.0.0"
 */
export function getVersion(): string {
  const pkgPath = path.join(packageRoot, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version?: string };
  return pkg.version ?? "0.0.0";
}
