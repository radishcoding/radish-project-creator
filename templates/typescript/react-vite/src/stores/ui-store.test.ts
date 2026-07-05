import { useUiStore } from "@/stores/ui-store"

describe("useUiStore", () => {
  beforeEach(() => {
    useUiStore.setState({ sidebarOpen: false })
  })

  it("初始 sidebarOpen 为 false", () => {
    expect(useUiStore.getState().sidebarOpen).toBe(false)
  })

  it("toggleSidebar 翻转状态", () => {
    useUiStore.getState().toggleSidebar()
    expect(useUiStore.getState().sidebarOpen).toBe(true)
    useUiStore.getState().toggleSidebar()
    expect(useUiStore.getState().sidebarOpen).toBe(false)
  })

  it("setSidebar 显式设置状态", () => {
    useUiStore.getState().setSidebar(true)
    expect(useUiStore.getState().sidebarOpen).toBe(true)
  })
})
