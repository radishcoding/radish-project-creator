import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveTemplatesRoot } from "../../src/constants.js";
import { createProject } from "../../src/core/createProject.js";
import type { Prompter, Template } from "../../src/types.js";

let cwd: string;

const stub: Prompter = {
  askProjectName: async () => "demo-app",
  selectLanguage: async (langs) => langs[0] as string,
  selectTemplate: async (tpls) => tpls[0] as Template,
  resolveDirConflict: async () => "cancel",
  confirmInstall: async () => false,
};

beforeEach(async () => {
  cwd = await mkdtemp(path.join(os.tmpdir(), "radish-cp-"));
});

afterEach(async () => {
  await rm(cwd, { recursive: true, force: true });
});

describe("createProject", () => {
  it("用指定模板与名称参数端到端生成", async () => {
    const ctx = await createProject(
      { template: "typescript/node-basic", install: false },
      {
        prompter: stub,
        templatesRoot: resolveTemplatesRoot(),
        cwd,
        nameArg: "demo-app",
      },
    );

    expect(ctx.projectName).toBe("demo-app");
    expect(ctx.targetDir).toBe(path.resolve(cwd, "demo-app"));

    const pkg = JSON.parse(await readFile(path.join(ctx.targetDir, "package.json"), "utf8"));
    expect(pkg.name).toBe("demo-app");
    expect(existsSync(path.join(ctx.targetDir, ".npmrc"))).toBe(true);
    expect(existsSync(path.join(ctx.targetDir, "meta.json"))).toBe(false);
  });

  it("名称参数非法时抛 ValidationError", async () => {
    await expect(
      createProject(
        { template: "typescript/node-basic" },
        {
          prompter: stub,
          templatesRoot: resolveTemplatesRoot(),
          cwd,
          nameArg: "Bad Name",
        },
      ),
    ).rejects.toThrow(/不合法/);
  });

  it("未知模板抛 TemplateError", async () => {
    await expect(
      createProject(
        { template: "no/such", install: false },
        {
          prompter: stub,
          templatesRoot: resolveTemplatesRoot(),
          cwd,
          nameArg: "demo-app",
        },
      ),
    ).rejects.toThrow(/未找到模板/);
  });

  it("installDeps 为真时调用注入的 install", async () => {
    let installed = false;
    await createProject(
      { template: "typescript/node-basic", install: true },
      {
        prompter: stub,
        templatesRoot: resolveTemplatesRoot(),
        cwd,
        nameArg: "demo-app",
        install: async () => {
          installed = true;
        },
      },
    );
    expect(installed).toBe(true);
  });

  it("无 --template 时始终走选语言与选模板 (即使各只有一个选项)", async () => {
    let languageSelected = false;
    let templateSelected = false;
    const prompter: Prompter = {
      askProjectName: async () => "menu-app",
      selectLanguage: async (langs) => {
        languageSelected = true;
        return langs.includes("typescript") ? "typescript" : (langs[0] as string);
      },
      selectTemplate: async (tpls) => {
        templateSelected = true;
        return tpls[0] as Template;
      },
      resolveDirConflict: async () => "cancel",
      confirmInstall: async () => false,
    };

    const ctx = await createProject(
      { install: false },
      {
        prompter,
        templatesRoot: resolveTemplatesRoot(),
        cwd,
        nameArg: "menu-app",
      },
    );

    expect(languageSelected).toBe(true);
    expect(templateSelected).toBe(true);
    expect(ctx.template.slug).toBe("typescript/node-basic");
  });

  it("目录冲突 overwrite: 非空目录被覆盖, 生成成功", async () => {
    const conflictDir = path.join(cwd, "demo-app");
    await mkdir(conflictDir, { recursive: true });
    await writeFile(path.join(conflictDir, "dummy.txt"), "old content");

    const prompter: Prompter = {
      askProjectName: async () => "demo-app",
      selectLanguage: async (langs) => langs[0] as string,
      selectTemplate: async (tpls) => tpls[0] as Template,
      resolveDirConflict: async () => "overwrite",
      confirmInstall: async () => false,
    };

    const ctx = await createProject(
      { template: "typescript/node-basic", install: false },
      {
        prompter,
        templatesRoot: resolveTemplatesRoot(),
        cwd,
        nameArg: "demo-app",
      },
    );

    const pkg = JSON.parse(await readFile(path.join(ctx.targetDir, "package.json"), "utf8"));
    expect(pkg.name).toBe("demo-app");
    expect(existsSync(path.join(ctx.targetDir, "dummy.txt"))).toBe(false);
  });

  it("目录冲突 rename: 重命名后以新名称生成成功", async () => {
    const conflictDir = path.join(cwd, "taken");
    await mkdir(conflictDir, { recursive: true });
    await writeFile(path.join(conflictDir, "dummy.txt"), "old content");

    const prompter: Prompter = {
      askProjectName: async () => {
        // nameArg 无效后进入 rename 循环, 此处返回新名称
        return "renamed-app";
      },
      selectLanguage: async (langs) => langs[0] as string,
      selectTemplate: async (tpls) => tpls[0] as Template,
      resolveDirConflict: async () => "rename",
      confirmInstall: async () => false,
    };

    const ctx = await createProject(
      { template: "typescript/node-basic", install: false },
      {
        prompter,
        templatesRoot: resolveTemplatesRoot(),
        cwd,
        nameArg: "taken",
      },
    );

    expect(ctx.projectName).toBe("renamed-app");
    const pkg = JSON.parse(await readFile(path.join(cwd, "renamed-app", "package.json"), "utf8"));
    expect(pkg.name).toBe("renamed-app");
  });
});
