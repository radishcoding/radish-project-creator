import * as React from "react"

/**
 * 返回一个查询组件当前是否仍挂载的函数, 用于异步回调中防止对已卸载组件更新.
 * @returns 查询挂载状态的函数.
 */
export function useIsMounted(): () => boolean {
  const mountedRef = React.useRef(false)

  React.useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  return React.useCallback(() => mountedRef.current, [])
}
