import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  findTemplate,
  listLanguages,
  loadTemplates,
  templatesByLanguage,
} from "../../src/core/templateRegistry.js";

let root: string;

async function makeTemplate(lang: string, id: string, meta: object): Promise<void> {
  const dir = path.join(root, lang, id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "meta.json"), JSON.stringify(meta));
  await writeFile(path.join(dir, "package.json"), '{"name":"x"}');
}

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), "radish-reg-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("templateRegistry", () => {
  it("扫描并解析模板 meta", async () => {
    await makeTemplate("typescript", "node-basic", {
      name: "Node 基础",
      description: "最小项目",
      emoji: "📦",
      tags: ["node"],
    });
    const templates = await loadTemplates(root);
    expect(templates).toHaveLength(1);
    expect(templates[0]?.slug).toBe("typescript/node-basic");
    expect(templates[0]?.meta.name).toBe("Node 基础");
    expect(templates[0]?.meta.emoji).toBe("📦");
  });

  it("缺少 meta.json 抛 TemplateError", async () => {
    const dir = path.join(root, "typescript", "broken");
    await mkdir(dir, { recursive: true });
    await expect(loadTemplates(root)).rejects.toThrow(/meta\.json/);
  });

  it("listLanguages 去重", async () => {
    await makeTemplate("typescript", "a", { name: "A", description: "" });
    await makeTemplate("typescript", "b", { name: "B", description: "" });
    await makeTemplate("python", "c", { name: "C", description: "" });
    const templates = await loadTemplates(root);
    expect(listLanguages(templates).sort()).toEqual(["python", "typescript"]);
  });

  it("templatesByLanguage 与 findTemplate 查询", async () => {
    await makeTemplate("typescript", "a", { name: "A", description: "" });
    await makeTemplate("python", "c", { name: "C", description: "" });
    const templates = await loadTemplates(root);
    expect(templatesByLanguage(templates, "python")).toHaveLength(1);
    expect(findTemplate(templates, "typescript/a")?.id).toBe("a");
    expect(findTemplate(templates, "nope/nope")).toBeUndefined();
  });

  it("meta.json 非法 JSON 时抛 TemplateError", async () => {
    const dir = path.join(root, "typescript", "badjson");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "meta.json"), "not-json{{");
    await expect(loadTemplates(root)).rejects.toThrow(/合法 JSON/);
  });

  it("meta.json 顶层非对象时抛 TemplateError", async () => {
    const dir = path.join(root, "typescript", "notobj");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "meta.json"), "42");
    await expect(loadTemplates(root)).rejects.toThrow(/结构无效/);
  });

  it("parseMeta 过滤 tags 中的非字符串元素", async () => {
    await makeTemplate("typescript", "tagfilter", {
      name: "T",
      description: "",
      tags: ["a", 1, "b", null],
    } as object);
    const templates = await loadTemplates(root);
    const found = findTemplate(templates, "typescript/tagfilter");
    expect(found?.meta.tags).toEqual(["a", "b"]);
  });

  it("findTemplate 返回完整对象", async () => {
    await makeTemplate("typescript", "full", {
      name: "全量",
      description: "d",
      emoji: "🚀",
    });
    const templates = await loadTemplates(root);
    const found = findTemplate(templates, "typescript/full");
    expect(found).toMatchObject({
      language: "typescript",
      id: "full",
      slug: "typescript/full",
    });
    expect(found?.meta.name).toBe("全量");
  });

  it("解析 meta 的 replacements 字段并过滤非字符串", async () => {
    await makeTemplate("go", "api", {
      name: "API",
      description: "d",
      replacements: ["github.com/x/go-template", "go-template", 42],
    } as object);
    const templates = await loadTemplates(root);
    const found = findTemplate(templates, "go/api");
    expect(found?.meta.replacements).toEqual(["github.com/x/go-template", "go-template"]);
  });
});
