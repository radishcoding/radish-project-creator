import "@testing-library/jest-dom/vitest"

import { server } from "@/mocks/node"

beforeAll(() => {
  server.listen({ onUnhandledRequest: "bypass" })
})
afterEach(() => {
  server.resetHandlers()
})
afterAll(() => {
  server.close()
})

// jsdom 未实现 matchMedia; 提供默认 stub 以便渲染依赖它的组件 (如 ThemeProvider).
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}
