import { describe, expect, it } from "vitest";
import { resolveTemplatesRoot } from "../src/constants.js";
import { findTemplate, loadTemplates } from "../src/core/templateRegistry.js";

describe("内置模板", () => {
  it("包含 typescript/node-basic 且 meta 完整", async () => {
    const templates = await loadTemplates(resolveTemplatesRoot());
    const tpl = findTemplate(templates, "typescript/node-basic");
    expect(tpl).toBeDefined();
    expect(tpl?.meta.name.length).toBeGreaterThan(0);
    expect(tpl?.meta.description.length).toBeGreaterThan(0);
  });

  it("按模板是否含 package.json 标注 hasPackageJson", async () => {
    const templates = await loadTemplates(resolveTemplatesRoot());
    expect(findTemplate(templates, "typescript/node-basic")?.hasPackageJson).toBe(true);
    expect(findTemplate(templates, "go/gin-api")?.hasPackageJson).toBe(false);
  });

  it("包含 typescript/react-vite 且为 Node 模板, replacements 指向模板名", async () => {
    const templates = await loadTemplates(resolveTemplatesRoot());
    const tpl = findTemplate(templates, "typescript/react-vite");
    expect(tpl).toBeDefined();
    expect(tpl?.meta.name.length).toBeGreaterThan(0);
    expect(tpl?.meta.description.length).toBeGreaterThan(0);
    expect(tpl?.hasPackageJson).toBe(true);
    expect(tpl?.meta.replacements).toContain("radish-frontend-template");
  });

  it("go/gin-api 声明 gofmt 生成后任务 (修复替换模块路径后的 import 顺序)", async () => {
    const templates = await loadTemplates(resolveTemplatesRoot());
    const tpl = findTemplate(templates, "go/gin-api");
    const commands = (tpl?.meta.postGenerate ?? []).map((task) => task.command.join(" "));
    expect(commands).toContain("gofmt -w .");
  });
});
