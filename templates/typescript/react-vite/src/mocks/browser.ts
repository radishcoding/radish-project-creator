import { setupWorker } from "msw/browser"

import { handlers } from "@/mocks/handlers"

/** 浏览器/开发环境的 mock worker. */
export const worker = setupWorker(...handlers)
