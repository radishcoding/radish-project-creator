import { render, screen } from "@testing-library/react"

import { Button, buttonVariants } from "@/components/ui/button"

describe("Button", () => {
  it("渲染并应用 ghost 变体的暖橙 hover 类", () => {
    render(<Button variant="ghost">点我</Button>)
    const btn = screen.getByRole("button", { name: "点我" })
    expect(btn).toBeInTheDocument()
    expect(btn.className).toContain("hover:bg-accent/10")
  })

  it("buttonVariants 生成 icon 尺寸类", () => {
    expect(buttonVariants({ size: "icon" })).toContain("size-9")
  })

  it("焦点态使用细而可见的 ring", () => {
    render(<Button>确定</Button>)
    expect(screen.getByRole("button", { name: "确定" }).className).toContain(
      "focus-visible:ring-2"
    )
  })
})
