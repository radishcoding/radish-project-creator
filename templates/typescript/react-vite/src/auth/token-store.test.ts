import {
  createLocalStorageTokenStore,
  createMemoryTokenStore,
} from "@/auth/token-store"

describe("createMemoryTokenStore", () => {
  it("set 后 get 返回同值, clear 后为 undefined", () => {
    const store = createMemoryTokenStore()
    store.setAccessToken("abc")
    expect(store.getAccessToken()).toBe("abc")
    store.clear()
    expect(store.getAccessToken()).toBeUndefined()
  })

  it("订阅者在变更时被通知, 取消订阅后不再通知", () => {
    const store = createMemoryTokenStore()
    let count = 0
    const unsubscribe = store.subscribe(() => {
      count += 1
    })
    store.setAccessToken("a")
    store.clear()
    expect(count).toBe(2)
    unsubscribe()
    store.setAccessToken("b")
    expect(count).toBe(2)
  })
})

describe("createLocalStorageTokenStore", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("持久化到 localStorage 并可读回", () => {
    const store = createLocalStorageTokenStore("t.key")
    store.setAccessToken("xyz")
    expect(localStorage.getItem("t.key")).toContain("xyz")
    expect(store.getAccessToken()).toBe("xyz")
    store.clear()
    expect(store.getAccessToken()).toBeUndefined()
  })
})
