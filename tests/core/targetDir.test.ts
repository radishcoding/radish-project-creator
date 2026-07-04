import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isDirUsable, resolveTargetDir } from "../../src/core/targetDir.js";

let tmp: string;

beforeEach(async () => {
  tmp = await mkdtemp(path.join(os.tmpdir(), "radish-test-"));
});

afterEach(async () => {
  await rm(tmp, { recursive: true, force: true });
});

describe("targetDir", () => {
  it("resolveTargetDir 基于 cwd 拼出绝对路径", () => {
    expect(resolveTargetDir("my-app", "/base")).toBe(path.resolve("/base", "my-app"));
  });

  it("不存在的目录可用", async () => {
    expect(await isDirUsable(path.join(tmp, "nope"))).toBe(true);
  });

  it("空目录可用", async () => {
    expect(await isDirUsable(tmp)).toBe(true);
  });

  it("非空目录不可用", async () => {
    await writeFile(path.join(tmp, "a.txt"), "x");
    expect(await isDirUsable(tmp)).toBe(false);
  });
});
