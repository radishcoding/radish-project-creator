import { setupServer } from "msw/node"

import { handlers } from "@/mocks/handlers"

/** Node/测试环境的 mock 服务器. */
export const server = setupServer(...handlers)
