import { render, screen } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"

import { RequireAuth } from "@/auth/guard"
import { tokenStore } from "@/auth/token-store"

/** 构造未签名的未来过期 JWT. */
function makeToken(): string {
  const future = Math.floor(Date.now() / 1000) + 600
  const encode = (obj: unknown): string =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({ sub: "u1", exp: future })}.`
}

function renderGuard() {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: (
          <RequireAuth>
            <div>受保护内容</div>
          </RequireAuth>
        ),
      },
      { path: "/login", element: <div>登录页</div> },
    ],
    { initialEntries: ["/"] }
  )
  return render(<RouterProvider router={router} />)
}

describe("RequireAuth", () => {
  beforeEach(() => {
    tokenStore.clear()
  })

  it("未认证时重定向到登录页", () => {
    renderGuard()
    expect(screen.getByText("登录页")).toBeInTheDocument()
  })

  it("已认证时渲染子内容", () => {
    tokenStore.setAccessToken(makeToken())
    renderGuard()
    expect(screen.getByText("受保护内容")).toBeInTheDocument()
  })
})
