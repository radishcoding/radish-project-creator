import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { TemplateError } from "../runtime/errors.js";
import type { PostGenerateTask, Template, TemplateMeta } from "../types.js";

async function isDirectory(target: string): Promise<boolean> {
  try {
    return (await stat(target)).isDirectory();
  } catch {
    return false;
  }
}

function parseMeta(raw: string, slug: string): TemplateMeta {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new TemplateError(`模板 ${slug} 的 meta.json 不是合法 JSON`);
  }
  if (typeof data !== "object" || data === null) {
    throw new TemplateError(`模板 ${slug} 的 meta.json 结构无效`);
  }

  const obj = data as Record<string, unknown>;
  const meta: TemplateMeta = {
    name: typeof obj.name === "string" ? obj.name : slug,
    description: typeof obj.description === "string" ? obj.description : "",
  };
  if (typeof obj.emoji === "string") {
    meta.emoji = obj.emoji;
  }
  if (Array.isArray(obj.tags)) {
    meta.tags = obj.tags.filter((t): t is string => typeof t === "string");
  }
  if (Array.isArray(obj.replacements)) {
    meta.replacements = obj.replacements.filter((r): r is string => typeof r === "string");
  }
  const postGenerate = parsePostGenerate(obj.postGenerate);
  if (postGenerate.length > 0) {
    meta.postGenerate = postGenerate;
  }
  return meta;
}

/**
 * 解析 meta.json 的 postGenerate 字段为规范化的任务列表.
 * 仅保留 command 为非空字符串数组的项; 非法项被静默丢弃, 避免坏配置阻断生成.
 * @param raw meta.json 中 postGenerate 字段的原始值.
 * @returns 校验通过的生成后任务列表.
 */
function parsePostGenerate(raw: unknown): PostGenerateTask[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const tasks: PostGenerateTask[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) {
      continue;
    }
    const record = item as Record<string, unknown>;
    if (!Array.isArray(record.command)) {
      continue;
    }
    const command = record.command.filter((part): part is string => typeof part === "string");
    if (command.length === 0) {
      continue;
    }
    const task: PostGenerateTask = { command };
    if (typeof record.description === "string") {
      task.description = record.description;
    }
    tasks.push(task);
  }
  return tasks;
}

/**
 * 从模板根目录加载所有模板.
 * @param root 模板根目录路径.
 * @returns 扫描并解析后的模板列表.
 */
export async function loadTemplates(root: string): Promise<Template[]> {
  if (!(await isDirectory(root))) {
    throw new TemplateError(`模板根目录不存在: ${root}`);
  }

  const templates: Template[] = [];
  const languages = (await readdir(root)).sort();

  for (const language of languages) {
    const langDir = path.join(root, language);
    if (!(await isDirectory(langDir))) {
      continue;
    }

    const ids = (await readdir(langDir)).sort();
    for (const id of ids) {
      const dir = path.join(langDir, id);
      if (!(await isDirectory(dir))) {
        continue;
      }

      const slug = `${language}/${id}`;
      const metaPath = path.join(dir, "meta.json");
      let raw: string;
      try {
        raw = await readFile(metaPath, "utf8");
      } catch {
        throw new TemplateError(`模板 ${slug} 缺少 meta.json`);
      }

      const hasPackageJson = existsSync(path.join(dir, "package.json"));
      templates.push({ language, id, slug, dir, hasPackageJson, meta: parseMeta(raw, slug) });
    }
  }

  return templates;
}

/**
 * 从模板列表中提取所有语言 (去重).
 * @param templates 模板列表.
 * @returns 唯一的语言列表.
 */
export function listLanguages(templates: Template[]): string[] {
  return [...new Set(templates.map((t) => t.language))];
}

/**
 * 按编程语言过滤模板.
 * @param templates 模板列表.
 * @param language 目标编程语言.
 * @returns 匹配该语言的模板.
 */
export function templatesByLanguage(templates: Template[], language: string): Template[] {
  return templates.filter((t) => t.language === language);
}

/**
 * 按 slug 查找单个模板.
 * @param templates 模板列表.
 * @param slug 模板 slug (格式: language/id).
 * @returns 匹配的模板, 或 undefined 若不存在.
 */
export function findTemplate(templates: Template[], slug: string): Template | undefined {
  return templates.find((t) => t.slug === slug);
}
