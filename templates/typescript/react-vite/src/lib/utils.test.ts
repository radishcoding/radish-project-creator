import { cn } from "@/lib/utils"

describe("cn", () => {
  it("合并类名并按 tailwind 规则去重冲突", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })

  it("忽略假值参数", () => {
    const hidden = false
    expect(cn("a", hidden && "b", undefined, "c")).toBe("a c")
  })
})
