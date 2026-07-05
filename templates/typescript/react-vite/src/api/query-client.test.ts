import { createQueryClient, setQueryErrorHandler } from "@/api/query-client"
import { AppError } from "@/api/types"

describe("createQueryClient", () => {
  it("配置默认查询策略", () => {
    const client = createQueryClient()
    const defaults = client.getDefaultOptions()
    expect(defaults.queries?.staleTime).toBe(30_000)
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false)
  })

  it("查询失败时调用全局错误处理器", async () => {
    const client = createQueryClient()
    const errors: AppError[] = []
    setQueryErrorHandler((error) => {
      errors.push(error)
    })
    await client
      .fetchQuery({
        queryKey: ["boom"],
        queryFn: () =>
          Promise.reject(new AppError("server", "炸了", { status: 500 })),
        retry: false,
      })
      .catch(() => undefined)
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe("server")
    setQueryErrorHandler(undefined)
  })
})
