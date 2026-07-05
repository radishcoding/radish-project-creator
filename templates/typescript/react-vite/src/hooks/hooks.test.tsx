import { act, renderHook } from "@testing-library/react"

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useIsMounted } from "@/hooks/use-is-mounted"
import { useMediaQuery } from "@/hooks/use-media-query"

describe("useMediaQuery", () => {
  it("反映 matchMedia 的 matches", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }))
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"))
    expect(result.current).toBe(true)
    vi.unstubAllGlobals()
  })
})

describe("useDebouncedValue", () => {
  it("延迟后才更新值", () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: "a" } }
    )
    expect(result.current).toBe("a")
    rerender({ value: "b" })
    expect(result.current).toBe("a")
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe("b")
    vi.useRealTimers()
  })
})

describe("useIsMounted", () => {
  it("挂载后返回 true, 卸载后返回 false", () => {
    const { result, unmount } = renderHook(() => useIsMounted())
    expect(result.current()).toBe(true)
    unmount()
    expect(result.current()).toBe(false)
  })
})

describe("useCopyToClipboard", () => {
  it("复制文本并置 copied 为 true", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    })
    const { result } = renderHook(() => useCopyToClipboard())
    let ok = false
    await act(async () => {
      ok = await result.current[1]("hello")
    })
    expect(ok).toBe(true)
    expect(writeText).toHaveBeenCalledWith("hello")
    expect(result.current[0]).toBe(true)
  })
})
