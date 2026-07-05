import type { RouteObject } from "react-router"

import { RootLayout } from "@/router/layouts/root-layout"
import { HomePage } from "@/router/pages/home-page"

/** 应用路由表. */
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [{ index: true, element: <HomePage /> }],
  },
]
