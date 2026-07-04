import { describe, expect, it } from "vitest";
import { asciiArt, buildBanner } from "../../src/ui/banner.js";

describe("banner", () => {
  it("asciiArt 返回多行非空艺术字", () => {
    const art = asciiArt("radish");
    expect(art.length).toBeGreaterThan(0);
    expect(art).toContain("\n");
  });

  it("buildBanner 返回带颜色的字符串 (长度不短于原始艺术字)", () => {
    const plain = asciiArt("radish");
    const colored = buildBanner("radish");
    expect(colored.length).toBeGreaterThanOrEqual(plain.length);
  });
});
