import {
  create,
  type Mutate,
  type StateCreator,
  type StoreApi,
  type UseBoundStore,
} from "zustand"
import { devtools } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"

/** 集成 devtools 与 immer 中间件后的状态初始化器类型. */
export type StoreInitializer<T> = StateCreator<
  T,
  [["zustand/devtools", never], ["zustand/immer", never]]
>

/** createStore 返回的 store 类型. */
export type BoundStore<T> = UseBoundStore<
  Mutate<StoreApi<T>, [["zustand/devtools", never], ["zustand/immer", never]]>
>

/**
 * 创建集成 devtools 与 immer 的 Zustand store, 消除中间件样板.
 * @param name devtools 中显示的 store 名称.
 * @param initializer 状态初始化器, set 支持 immer 草稿式变更.
 * @returns 绑定的 store hook.
 */
export function createStore<T>(
  name: string,
  initializer: StoreInitializer<T>
): BoundStore<T> {
  return create<T>()(devtools(immer(initializer), { name }))
}
