import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getVersion, resolveTemplatesRoot } from "../src/constants.js";

describe("constants", () => {
  it("resolveTemplatesRoot 指向存在的 templates 目录", () => {
    const root = resolveTemplatesRoot();
    expect(path.basename(root)).toBe("templates");
    expect(existsSync(root)).toBe(true);
  });

  it("getVersion 返回 semver 形式的版本号", () => {
    expect(getVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});
