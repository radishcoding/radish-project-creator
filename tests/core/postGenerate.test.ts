import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runPostGenerateTask } from "../../src/core/postGenerate.js";

let cwd: string;

beforeEach(async () => {
  cwd = await mkdtemp(path.join(os.tmpdir(), "radish-pg-"));
});

afterEach(async () => {
  await rm(cwd, { recursive: true, force: true });
});

describe("runPostGenerateTask", () => {
  it("命令以退出码 0 结束时 resolve", async () => {
    await expect(
      runPostGenerateTask({ command: [process.execPath, "-e", "process.exit(0)"] }, cwd),
    ).resolves.toBeUndefined();
  });

  it("命令非零退出时抛 FileSystemError", async () => {
    await expect(
      runPostGenerateTask({ command: [process.execPath, "-e", "process.exit(3)"] }, cwd),
    ).rejects.toThrow(/退出码 3/);
  });

  it("可执行文件不存在时抛错", async () => {
    await expect(
      runPostGenerateTask({ command: ["radish-nonexistent-cmd-xyz"] }, cwd),
    ).rejects.toThrow();
  });

  it("command 为空时直接 resolve", async () => {
    await expect(runPostGenerateTask({ command: [] }, cwd)).resolves.toBeUndefined();
  });
});
