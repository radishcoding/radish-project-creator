import type { ReactElement } from "react"
import { RouterProvider } from "react-router/dom"

import { router } from "@/router"

/** 应用根, 渲染路由. */
export function App(): ReactElement {
  return <RouterProvider router={router} />
}

export default App
