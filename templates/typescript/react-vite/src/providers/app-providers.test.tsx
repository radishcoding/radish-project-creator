import { render, screen } from "@testing-library/react"

import { AppProviders } from "@/providers/app-providers"

describe("AppProviders", () => {
  it("在所有 Provider 下渲染子内容", () => {
    render(
      <AppProviders>
        <div>子内容</div>
      </AppProviders>
    )
    expect(screen.getByText("子内容")).toBeInTheDocument()
  })
})
