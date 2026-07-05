import { formatDate, formatRelative } from "@/lib/date"

describe("date", () => {
  it("按默认模式格式化", () => {
    expect(formatDate(new Date(2026, 6, 4, 9, 30, 0))).toBe(
      "2026-07-04 09:30:00"
    )
  })

  it("按自定义模式格式化", () => {
    expect(formatDate(new Date(2026, 0, 1), "yyyy/MM/dd")).toBe("2026/01/01")
  })

  it("相对时间带中文后缀", () => {
    const past = Date.now() - 5 * 60 * 1000
    expect(formatRelative(past)).toMatch(/前$/)
  })
})
