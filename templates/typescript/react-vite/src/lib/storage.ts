/** 键值存储的类型安全封装, 屏蔽序列化细节与存储不可用异常. */
export interface TypedStorage {
  /** 读取并反序列化; 不存在或解析失败返回 undefined. */
  get<T>(key: string): T | undefined
  /** 序列化并写入; 存储不可用时静默失败. */
  set<T>(key: string, value: T): void
  /** 删除指定键. */
  remove(key: string): void
}

function resolveBackend(driver: "local" | "session"): Storage | undefined {
  try {
    return driver === "local" ? window.localStorage : window.sessionStorage
  } catch {
    // 隐私模式或禁用存储时不可访问
    return undefined
  }
}

/**
 * 创建一个类型安全的存储封装.
 * @param driver 底层驱动, "local" 用 localStorage, "session" 用 sessionStorage.
 * @returns 存储封装实例.
 */
export function createStorage(driver: "local" | "session"): TypedStorage {
  const backend = resolveBackend(driver)

  return {
    get<T>(key: string): T | undefined {
      if (backend === undefined) {
        return undefined
      }
      try {
        const raw = backend.getItem(key)
        return raw === null ? undefined : (JSON.parse(raw) as T)
      } catch {
        return undefined
      }
    },
    set<T>(key: string, value: T): void {
      if (backend === undefined) {
        return
      }
      try {
        backend.setItem(key, JSON.stringify(value))
      } catch {
        // 配额超限或不可写时静默降级
      }
    },
    remove(key: string): void {
      if (backend === undefined) {
        return
      }
      try {
        backend.removeItem(key)
      } catch {
        // 忽略删除异常
      }
    },
  }
}

/** 基于 localStorage 的默认存储实例. */
export const localStore: TypedStorage = createStorage("local")

/** 基于 sessionStorage 的默认存储实例. */
export const sessionStore: TypedStorage = createStorage("session")
