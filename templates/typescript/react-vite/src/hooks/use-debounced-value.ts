import * as React from "react"

/**
 * 对快速变化的值做防抖.
 * @param value 原始值.
 * @param delayMs 防抖延迟毫秒数.
 * @returns 延迟稳定后的值.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState<T>(value)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value)
    }, delayMs)
    return () => {
      clearTimeout(timer)
    }
  }, [value, delayMs])

  return debounced
}
