import { registerGlobalErrorHandlers } from "@/lib/global-errors"
import { type LogLevel, registerSink } from "@/lib/logger"

describe("registerGlobalErrorHandlers", () => {
  it("将 window error 事件记录为 error 级并可取消注册", () => {
    const levels: LogLevel[] = []
    const offSink = registerSink({ write: (level) => levels.push(level) })
    const offHandlers = registerGlobalErrorHandlers()

    window.dispatchEvent(
      new ErrorEvent("error", { error: new Error("boom"), message: "boom" })
    )
    expect(levels.filter((l) => l === "error").length).toBeGreaterThan(0)

    offHandlers()
    offSink()
  })
})
