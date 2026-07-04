import { describe, expect, it } from "vitest";
import { validateProjectName } from "../../src/core/projectName.js";

describe("validateProjectName", () => {
  it("接受合法的短横线小写名", () => {
    expect(validateProjectName("my-app").valid).toBe(true);
  });

  it("拒绝空字符串并给出问题描述", () => {
    const r = validateProjectName("   ");
    expect(r.valid).toBe(false);
    expect(r.problems.length).toBeGreaterThan(0);
  });

  it("拒绝含大写字母的名称", () => {
    expect(validateProjectName("My-App").valid).toBe(false);
  });

  it("拒绝含空格的名称", () => {
    expect(validateProjectName("my app").valid).toBe(false);
  });
});
