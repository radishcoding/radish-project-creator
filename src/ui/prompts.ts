import { confirm, isCancel, select, text } from "@clack/prompts";
import { validateProjectName } from "../core/projectName.js";
import { UserCancelledError } from "../runtime/errors.js";
import type { DirConflictAction, PackageManager, Prompter, Template } from "../types.js";
import { emoji } from "./theme.js";

/**
 * 收窄 clack 提示返回值, 若用户取消则抛出 UserCancelledError.
 * @param value clack 返回的值或取消 symbol.
 * @returns 非 symbol 的原始值.
 */
function ensure<T>(value: T | symbol): T {
  if (isCancel(value)) {
    throw new UserCancelledError();
  }
  return value as T;
}

/** 基于 @clack/prompts 的交互式提问实现, 适配 TTY 终端. */
export class ClackPrompter implements Prompter {
  /**
   * 询问用户输入项目名称.
   * @param initial 预填的初始值.
   * @returns 用户确认的项目名称.
   */
  async askProjectName(initial?: string): Promise<string> {
    const value = ensure(
      await text({
        message: "项目名称?",
        placeholder: "my-app",
        ...(initial ? { initialValue: initial } : {}),
        validate: (input) => {
          const result = validateProjectName(input ?? "");
          return result.valid ? undefined : (result.problems[0] ?? "项目名不合法");
        },
      }),
    );
    return value.trim();
  }

  /**
   * 让用户从列表中选择编程语言.
   * @param languages 可选语言列表.
   * @returns 用户选择的语言.
   */
  async selectLanguage(languages: string[]): Promise<string> {
    return ensure(
      await select({
        message: "选择编程语言",
        options: languages.map((language) => ({
          value: language,
          label: language,
        })),
      }),
    );
  }

  /**
   * 让用户从列表中选择模板.
   * @param templates 可选模板列表.
   * @returns 用户选择的模板.
   */
  async selectTemplate(templates: Template[]): Promise<Template> {
    const slug = ensure(
      await select({
        message: "选择模板",
        options: templates.map((tpl) => ({
          value: tpl.slug,
          label: `${tpl.meta.emoji ?? emoji.package} ${tpl.meta.name}`,
          hint: tpl.meta.description,
        })),
      }),
    );
    const found = templates.find((tpl) => tpl.slug === slug);
    if (!found) {
      throw new UserCancelledError();
    }
    return found;
  }

  /**
   * 询问用户如何处理已存在的目录冲突.
   * @param dir 发生冲突的目录路径.
   * @returns 用户选择的处理方式.
   */
  async resolveDirConflict(dir: string): Promise<DirConflictAction> {
    return ensure(
      await select<DirConflictAction>({
        message: `目录 ${dir} 已存在且非空, 如何处理?`,
        options: [
          { value: "overwrite", label: "覆盖", hint: "清空后写入" },
          { value: "rename", label: "换个名字" },
          { value: "cancel", label: "取消" },
        ],
      }),
    );
  }

  /**
   * 询问用户是否安装依赖.
   * @param pm 将使用的包管理器.
   * @returns 用户确认安装则返回 true.
   */
  async confirmInstall(pm: PackageManager): Promise<boolean> {
    return ensure(await confirm({ message: `用 ${pm} 安装依赖?` }));
  }
}
