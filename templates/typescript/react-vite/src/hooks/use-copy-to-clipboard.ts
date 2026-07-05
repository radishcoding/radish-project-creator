import * as React from "react"

/**
 * 复制文本到剪贴板, 返回复制状态与复制函数.
 * @returns 元组 [是否已复制, 复制函数 (成功返回 true)].
 */
export function useCopyToClipboard(): readonly [
  boolean,
  (text: string) => Promise<boolean>,
] {
  const [copied, setCopied] = React.useState(false)

  const copy = React.useCallback(async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      return true
    } catch {
      setCopied(false)
      return false
    }
  }, [])

  return [copied, copy]
}
