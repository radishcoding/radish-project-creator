import * as React from "react"

/**
 * 订阅媒体查询匹配状态.
 * @param query 媒体查询字符串, 如 "(min-width: 768px)".
 * @returns 当前是否匹配.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", onChange)
      return () => {
        mql.removeEventListener("change", onChange)
      }
    },
    [query]
  )
  const getSnapshot = (): boolean => window.matchMedia(query).matches
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false)
}
