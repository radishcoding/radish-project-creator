import { render } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { createMemoryRouter, RouterProvider } from "react-router"

import { ThemeProvider } from "@/components/theme-provider"
import i18n from "@/i18n"
import { routes } from "@/router/routes"

describe("router", () => {
  it("首页路由在 Provider 下渲染空白主区与主题切换", () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/"] })
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </I18nextProvider>
    )
    expect(container.querySelector("main")).not.toBeNull()
    expect(
      container.querySelector(
        '[aria-label="切换主题"], [aria-label="Toggle theme"]'
      )
    ).not.toBeNull()
  })
})
