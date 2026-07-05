import { existsSync } from "node:fs";
import { cp, mkdir, mkdtemp, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { FileSystemError } from "../runtime/errors.js";
import type { ProjectContext } from "../types.js";

const UNDERSCORE = "_";

/**
 * 模板生成过程中的生命周期钩子.
 */
export interface GenerateHooks {
  /**
   * 临时目录创建后触发, 参数为临时目录路径.
   * 可返回一个反注册函数, 生成结束 (成功或失败清理后) 会被调用以解除该临时目录的清理登记.
   */
  onTempCreated?: (dir: string) => (() => void) | undefined;
  /** 生成步骤推进时触发, 参数为进度描述文本. */
  onProgress?: (message: string) => void;
}

/**
 * 将模板拷贝并修补后原子写入目标目录.
 * @param ctx 包含项目名, 目标路径与所选模板的完整上下文.
 * @param hooks 可选的生命周期钩子, 用于监听进度与临时目录创建事件.
 * @returns 成功时解析为 void; 失败时清理临时目录并抛出 FileSystemError.
 */
export async function generateProject(
  ctx: ProjectContext,
  hooks: GenerateHooks = {},
): Promise<void> {
  const parent = path.dirname(ctx.targetDir);
  await mkdir(parent, { recursive: true });
  const tempDir = await mkdtemp(path.join(parent, ".radish-tmp-"));
  let unregisterTemp: (() => void) | undefined;

  try {
    unregisterTemp = hooks.onTempCreated?.(tempDir) ?? undefined;
    hooks.onProgress?.("拷贝模板文件");
    await cp(ctx.template.dir, tempDir, { recursive: true });

    hooks.onProgress?.("应用项目配置");
    await removeMetaFile(tempDir);
    await renameDotfiles(tempDir);
    await patchPackageJson(tempDir, ctx.projectName);
    await applyReplacements(tempDir, ctx.template.meta.replacements ?? [], ctx.projectName);

    hooks.onProgress?.("写入目标目录");
    await moveIntoPlace(tempDir, ctx.targetDir);
    unregisterTemp?.();
  } catch (error) {
    await rm(tempDir, { recursive: true, force: true });
    unregisterTemp?.();
    if (error instanceof FileSystemError) {
      throw error;
    }
    throw new FileSystemError(`生成失败: ${(error as Error).message}`, { cause: error });
  }
}

async function removeMetaFile(dir: string): Promise<void> {
  const metaPath = path.join(dir, "meta.json");
  if (existsSync(metaPath)) {
    await rm(metaPath);
  }
}

async function renameDotfiles(dir: string): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await renameDotfiles(full);
      if (entry.name.startsWith(UNDERSCORE)) {
        await rename(full, path.join(dir, `.${entry.name.slice(UNDERSCORE.length)}`));
      }
    } else if (entry.name.startsWith(UNDERSCORE)) {
      await rename(full, path.join(dir, `.${entry.name.slice(UNDERSCORE.length)}`));
    }
  }
}

async function patchPackageJson(dir: string, projectName: string): Promise<void> {
  const pkgPath = path.join(dir, "package.json");
  if (!existsSync(pkgPath)) {
    return;
  }
  const pkg = JSON.parse(await readFile(pkgPath, "utf8")) as Record<string, unknown>;
  pkg.name = projectName;
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

async function applyReplacements(
  dir: string,
  replacements: readonly string[],
  projectName: string,
): Promise<void> {
  if (replacements.length === 0) {
    return;
  }
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await applyReplacements(full, replacements, projectName);
    } else if (entry.isFile()) {
      await replaceInFile(full, replacements, projectName);
    }
  }
}

async function replaceInFile(
  file: string,
  replacements: readonly string[],
  projectName: string,
): Promise<void> {
  const buffer = await readFile(file);
  // 含 NUL 字节的文件视为二进制, 不做文本替换
  if (buffer.includes(0)) {
    return;
  }
  let content = buffer.toString("utf8");
  let changed = false;
  for (const from of replacements) {
    if (from.length > 0 && content.includes(from)) {
      content = content.split(from).join(projectName);
      changed = true;
    }
  }
  if (changed) {
    await writeFile(file, content);
  }
}

async function moveIntoPlace(tempDir: string, targetDir: string): Promise<void> {
  if (existsSync(targetDir)) {
    await rm(targetDir, { recursive: true, force: true });
  }
  try {
    await rename(tempDir, targetDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EXDEV") {
      await cp(tempDir, targetDir, { recursive: true });
      await rm(tempDir, { recursive: true, force: true });
    } else {
      throw error;
    }
  }
}
