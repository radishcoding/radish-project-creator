import { describe, expect, it } from "vitest";
import { formatLanguage } from "../../src/ui/theme.js";

describe("formatLanguage", () => {
  it("已知语言返回规范大小写", () => {
    expect(formatLanguage("go")).toBe("Go");
    expect(formatLanguage("typescript")).toBe("TypeScript");
    expect(formatLanguage("javascript")).toBe("JavaScript");
  });

  it("未知语言返回首字母大写形式", () => {
    expect(formatLanguage("elixir")).toBe("Elixir");
  });
});
