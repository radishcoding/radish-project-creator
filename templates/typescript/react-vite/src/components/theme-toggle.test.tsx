import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { I18nextProvider } from "react-i18next"

import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import i18n from "@/i18n"

function renderToggle() {
  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    </I18nextProvider>
  )
}

describe("ThemeToggle", () => {
  it("渲染带无障碍标签的触发按钮", () => {
    renderToggle()
    expect(
      screen.getByRole("button", { name: /切换主题|Toggle theme/ })
    ).toBeInTheDocument()
  })

  it("打开后显示亮/暗/系统三个选项", async () => {
    const user = userEvent.setup()
    renderToggle()
    await user.click(
      screen.getByRole("button", { name: /切换主题|Toggle theme/ })
    )
    expect(
      await screen.findByRole("menuitemradio", { name: /亮色|Light/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("menuitemradio", { name: /暗色|Dark/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("menuitemradio", { name: /跟随系统|System/ })
    ).toBeInTheDocument()
  })

  it("选中选项后关闭菜单", async () => {
    const user = userEvent.setup()
    renderToggle()
    await user.click(
      screen.getByRole("button", { name: /切换主题|Toggle theme/ })
    )
    await user.click(
      await screen.findByRole("menuitemradio", { name: /暗色|Dark/ })
    )
    await waitFor(() => {
      expect(screen.queryByRole("menuitemradio")).not.toBeInTheDocument()
    })
  })
})
