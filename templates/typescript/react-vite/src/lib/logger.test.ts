import { createLogger, type LogLevel, registerSink } from "@/lib/logger"

describe("logger", () => {
  it("向已注册 sink 分发级别, 作用域与参数", () => {
    const records: Array<{
      level: LogLevel
      scope: string
      args: readonly unknown[]
    }> = []
    const unregister = registerSink({
      write: (level, scope, args) => records.push({ level, scope, args }),
    })

    createLogger("test").error("boom", 42)

    const hit = records.find((r) => r.scope === "test" && r.level === "error")
    expect(hit).toBeDefined()
    expect(hit?.args).toEqual(["boom", 42])

    unregister()
  })

  it("unregister 后不再收到日志", () => {
    const seen: unknown[] = []
    const unregister = registerSink({
      write: (_level, _scope, args) => seen.push(args),
    })
    unregister()
    createLogger("x").error("after")
    expect(seen).toHaveLength(0)
  })
})
