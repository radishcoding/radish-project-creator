import i18n from "@/i18n"

describe("i18n", () => {
  it("提供中文翻译", async () => {
    await i18n.changeLanguage("zh-CN")
    expect(i18n.t("confirm")).toBe("确认")
    expect(i18n.t("cancel")).toBe("取消")
  })

  it("提供英文翻译", async () => {
    await i18n.changeLanguage("en-US")
    expect(i18n.t("confirm")).toBe("Confirm")
    await i18n.changeLanguage("zh-CN")
  })
})
