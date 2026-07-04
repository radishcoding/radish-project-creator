import { intro as clackIntro, note as clackNote, spinner } from "@clack/prompts";

/** 输出欢迎横幅, 标记交互流程开始. */
export function intro(text: string): void {
  clackIntro(text);
}

/**
 * 在交互流程中输出一段带标题的提示信息.
 * @param body 正文内容.
 * @param title 可选标题.
 */
export function note(body: string, title?: string): void {
  clackNote(body, title);
}

/**
 * 用 spinner 包裹异步任务, 展示进度并在完成或失败时更新状态.
 * @param startMsg 任务开始时显示的消息.
 * @param run 要执行的异步任务.
 * @param doneMsg 任务成功完成后显示的消息.
 * @returns 任务的返回值.
 */
export async function withSpinner<T>(
  startMsg: string,
  run: () => Promise<T>,
  doneMsg: string,
): Promise<T> {
  const s = spinner();
  s.start(startMsg);
  try {
    const result = await run();
    s.stop(doneMsg);
    return result;
  } catch (error) {
    s.stop("失败");
    throw error;
  }
}
