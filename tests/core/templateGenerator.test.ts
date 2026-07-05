import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { generateProject } from "../../src/core/templateGenerator.js";
import type { ProjectContext, Template } from "../../src/types.js";

let workspace: string;
let templateDir: string;

async function buildFixtureTemplate(): Promise<void> {
  templateDir = path.join(workspace, "tpl");
  await mkdir(path.join(templateDir, "src"), { recursive: true });
  await mkdir(path.join(templateDir, "_github"), { recursive: true });
  await writeFile(
    path.join(templateDir, "package.json"),
    JSON.stringify({ name: "PLACEHOLDER", version: "0.1.0" }),
  );
  await writeFile(path.join(templateDir, "_npmrc"), "save-exact=true\n");
  await writeFile(path.join(templateDir, "meta.json"), '{"name":"x","description":"y"}');
  await writeFile(path.join(templateDir, "src", "index.ts"), "export {};");
  await writeFile(path.join(templateDir, "_github", "keep.txt"), "# placeholder\n");
}

function makeContext(targetDir: string): ProjectContext {
  const template: Template = {
    language: "typescript",
    id: "node-basic",
    slug: "typescript/node-basic",
    dir: templateDir,
    hasPackageJson: true,
    meta: { name: "x", description: "y" },
  };
  return {
    projectName: "demo-app",
    targetDir,
    template,
    packageManager: "npm",
    installDeps: false,
  };
}

beforeEach(async () => {
  workspace = await mkdtemp(path.join(os.tmpdir(), "radish-gen-"));
  await buildFixtureTemplate();
});

afterEach(async () => {
  await rm(workspace, { recursive: true, force: true });
});

describe("generateProject", () => {
  it("生成产物: 替换 name, 改点文件名, 删 meta, 保留源码", async () => {
    const targetDir = path.join(workspace, "out");
    const temps: string[] = [];
    await generateProject(makeContext(targetDir), {
      onTempCreated: (d) => {
        temps.push(d);
      },
    });

    const pkg = JSON.parse(await readFile(path.join(targetDir, "package.json"), "utf8"));
    expect(pkg.name).toBe("demo-app");
    expect(existsSync(path.join(targetDir, ".npmrc"))).toBe(true);
    expect(existsSync(path.join(targetDir, "_npmrc"))).toBe(false);
    expect(existsSync(path.join(targetDir, "meta.json"))).toBe(false);
    expect(existsSync(path.join(targetDir, "src", "index.ts"))).toBe(true);
    expect(existsSync(path.join(targetDir, ".github"))).toBe(true);
    expect(existsSync(path.join(targetDir, "_github"))).toBe(false);
    expect(existsSync(path.join(targetDir, ".github", "keep.txt"))).toBe(true);
    expect(temps.length).toBe(1);
    expect(existsSync(temps[0] as string)).toBe(false);
  });

  it("模板不存在时抛 FileSystemError 且不留下目标目录", async () => {
    const ctx = makeContext(path.join(workspace, "out2"));
    ctx.template.dir = path.join(workspace, "does-not-exist");
    await expect(generateProject(ctx)).rejects.toThrow();
    expect(existsSync(ctx.targetDir)).toBe(false);
  });

  it("按 meta.replacements 将字符串替换为项目名 (先长后短), 跳过二进制文件", async () => {
    const tpl = path.join(workspace, "tpl-go");
    await mkdir(tpl, { recursive: true });
    await writeFile(path.join(tpl, "go.mod"), "module github.com/x/go-template\n");
    await writeFile(
      path.join(tpl, "main.go"),
      'import "github.com/x/go-template/internal/a"\n// image: go-template:latest\n',
    );
    const binContent = Buffer.concat([Buffer.from("go-template"), Buffer.from([0x00])]);
    await writeFile(path.join(tpl, "bin.dat"), binContent);

    const template: Template = {
      language: "go",
      id: "api",
      slug: "go/api",
      dir: tpl,
      hasPackageJson: false,
      meta: {
        name: "x",
        description: "y",
        replacements: ["github.com/x/go-template", "go-template"],
      },
    };
    const target = path.join(workspace, "out-go");
    await generateProject({
      projectName: "my-api",
      targetDir: target,
      template,
      packageManager: "npm",
      installDeps: false,
    });

    expect(await readFile(path.join(target, "go.mod"), "utf8")).toBe("module my-api\n");
    const mainGo = await readFile(path.join(target, "main.go"), "utf8");
    expect(mainGo).toContain('import "my-api/internal/a"');
    expect(mainGo).toContain("image: my-api:latest");
    expect(mainGo).not.toContain("go-template");
    const bin = await readFile(path.join(target, "bin.dat"));
    expect(bin.equals(binContent)).toBe(true);
  });
});
