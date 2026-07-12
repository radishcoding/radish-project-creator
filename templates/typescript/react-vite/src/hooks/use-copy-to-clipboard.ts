import * as React from "react"

/** copied 状态自动复位的默认延迟 (毫秒). */
const DEFAULT_RESET_DELAY_MS = 2000

/**
 * 复制文本到剪贴板, 返回复制状态与复制函数. 复制成功后 copied 会在 resetDelayMs 后自动复位,
 * 适合做瞬时 "已复制" 提示; 组件卸载或再次复制时会清理待触发的复位定时器.
 * @param resetDelayMs 复制成功后 copied 复位为 false 的延迟毫秒数.
 * @returns 元组 [是否已复制, 复制函数 (成功返回 true)].
 */
export function useCopyToClipboard(
  resetDelayMs: number = DEFAULT_RESET_DELAY_MS
): readonly [boolean, (text: string) => Promise<boolean>] {
  const [copied, setCopied] = React.useState(false)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )

  React.useEffect(() => {
    return () => {
      if (timerRef.current !== undefined) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const copy = React.useCallback(
    async (text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        if (timerRef.current !== undefined) {
          clearTimeout(timerRef.current)
        }
        timerRef.current = setTimeout(() => setCopied(false), resetDelayMs)
        return true
      } catch {
        setCopied(false)
        return false
      }
    },
    [resetDelayMs]
  )

  return [copied, copy]
}
