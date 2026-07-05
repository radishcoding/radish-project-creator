import { TOKEN_STORAGE_KEY } from "@/config/constants"
import { createStorage } from "@/lib/storage"

/** 令牌存储适配器, 抽象读写与变更订阅. */
export interface TokenStore {
  /** 读取当前 access token. */
  getAccessToken(): string | undefined
  /** 写入 access token; 传 undefined 等同清除. */
  setAccessToken(token: string | undefined): void
  /** 清除令牌. */
  clear(): void
  /** 订阅令牌变更, 返回取消订阅函数. */
  subscribe(listener: () => void): () => void
}

function createStore(
  read: () => string | undefined,
  write: (token: string | undefined) => void
): TokenStore {
  const listeners = new Set<() => void>()
  const notify = (): void => {
    for (const listener of listeners) {
      listener()
    }
  }

  return {
    getAccessToken: read,
    setAccessToken(token) {
      write(token)
      notify()
    },
    clear() {
      write(undefined)
      notify()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

/** 创建内存令牌存储 (默认, 抗 XSS, 刷新页面丢失). */
export function createMemoryTokenStore(): TokenStore {
  let token: string | undefined
  return createStore(
    () => token,
    (next) => {
      token = next
    }
  )
}

/** 创建 localStorage 令牌存储 (跨标签持久, 但有 XSS 暴露风险). */
export function createLocalStorageTokenStore(
  key: string = TOKEN_STORAGE_KEY
): TokenStore {
  const storage = createStorage("local")
  return createStore(
    () => storage.get<string>(key),
    (next) => {
      if (next === undefined) {
        storage.remove(key)
      } else {
        storage.set(key, next)
      }
    }
  )
}

/** 应用级令牌存储单例, 默认内存; 如需持久化改为 createLocalStorageTokenStore(). */
export const tokenStore: TokenStore = createMemoryTokenStore()
