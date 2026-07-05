import { createStorage } from "@/lib/storage"

describe("createStorage", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("写入后可读回同结构值", () => {
    const store = createStorage("local")
    store.set("user", { id: 1, name: "小萝卜" })
    expect(store.get<{ id: number; name: string }>("user")).toEqual({
      id: 1,
      name: "小萝卜",
    })
  })

  it("不存在的键返回 undefined", () => {
    expect(createStorage("local").get("missing")).toBeUndefined()
  })

  it("损坏的 JSON 返回 undefined 而非抛错", () => {
    localStorage.setItem("broken", "{not json}")
    expect(createStorage("local").get("broken")).toBeUndefined()
  })

  it("remove 后读取为 undefined", () => {
    const store = createStorage("local")
    store.set("temp", 42)
    store.remove("temp")
    expect(store.get("temp")).toBeUndefined()
  })
})
