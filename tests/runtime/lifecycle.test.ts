import { existsSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { registerCleanup, registerTempDir, runCleanups } from "../../src/runtime/lifecycle.js";

afterEach(() => {
  runCleanups();
});

describe("lifecycle 清理注册表", () => {
  it("runCleanups 执行已注册函数并清空", () => {
    let count = 0;
    registerCleanup(() => {
      count += 1;
    });
    runCleanups();
    expect(count).toBe(1);
    runCleanups();
    expect(count).toBe(1);
  });

  it("反注册函数可移除清理项", () => {
    let count = 0;
    const off = registerCleanup(() => {
      count += 1;
    });
    off();
    runCleanups();
    expect(count).toBe(0);
  });

  it("registerTempDir 在清理时删除目录", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "radish-life-"));
    registerTempDir(dir);
    runCleanups();
    expect(existsSync(dir)).toBe(false);
  });
});
