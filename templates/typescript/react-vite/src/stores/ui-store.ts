import { createStore } from "@/stores/create-store"

/** 全局 UI 状态 (示例, 演示 createStore 用法). */
interface UiState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebar: (open: boolean) => void
}

/** 全局 UI store. */
export const useUiStore = createStore<UiState>("ui", (set) => ({
  sidebarOpen: false,
  toggleSidebar: () =>
    set((state) => {
      state.sidebarOpen = !state.sidebarOpen
    }),
  setSidebar: (open) =>
    set((state) => {
      state.sidebarOpen = open
    }),
}))
