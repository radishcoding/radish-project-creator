import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { TemplateError } from "../runtime/errors.js";
import type { Template, TemplateMeta } from "../types.js";

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
  return meta;
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

      templates.push({ language, id, slug, dir, meta: parseMeta(raw, slug) });
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
