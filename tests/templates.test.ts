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
});
