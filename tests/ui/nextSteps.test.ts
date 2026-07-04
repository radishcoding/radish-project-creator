import path from "node:path";
import { describe, expect, it } from "vitest";
import type { ProjectContext, Template } from "../../src/types.js";
import { buildNextSteps } from "../../src/ui/nextSteps.js";

function ctx(installDeps: boolean): ProjectContext {
  const template: Template = {
    language: "typescript",
    id: "node-basic",
    slug: "typescript/node-basic",
    dir: "/tpl",
    meta: { name: "x", description: "y" },
  };
  return {
    projectName: "demo-app",
    targetDir: path.resolve("/base", "demo-app"),
    template,
    packageManager: "pnpm",
    installDeps,
  };
}

describe("buildNextSteps", () => {
  it("未安装依赖时包含安装命令", () => {
    const steps = buildNextSteps(ctx(false), "/base");
    expect(steps).toContain("cd demo-app");
    expect(steps).toContain("pnpm install");
    expect(steps).toContain("pnpm dev");
  });

  it("已安装依赖时不含安装命令", () => {
    const steps = buildNextSteps(ctx(true), "/base");
    expect(steps.some((s) => s.includes("install"))).toBe(false);
    expect(steps).toContain("pnpm dev");
  });
});
