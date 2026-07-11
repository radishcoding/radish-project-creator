import { TemplateError, UserCancelledError, ValidationError } from "../runtime/errors.js";
import type { CliOptions, PostGenerateTask, ProjectContext, Prompter, Template } from "../types.js";
import { resolvePackageManager } from "./packageManager.js";
import { runPostGenerateTask } from "./postGenerate.js";
import { validateProjectName } from "./projectName.js";
import { isDirUsable, resolveTargetDir } from "./targetDir.js";
import { generateProject } from "./templateGenerator.js";
import {
  findTemplate,
  listLanguages,
  loadTemplates,
  templatesByLanguage,
} from "./templateRegistry.js";

/**
 * createProject 所需的外部依赖注入集合.
 * 通过接口注入以支持测试中的替换与 mock.
 */
export interface CreateProjectDeps {
  /** 用于交互提问的 prompter 实现. */
  prompter: Prompter;
  /** 内置模板根目录的绝对路径. */
  templatesRoot: string;
  /** 创建项目的工作目录, 默认为 process.cwd(). */
  cwd?: string;
  /** 命令行传入的项目名称参数; 未提供则通过 prompter 询问. */
  nameArg?: string;
  /** 生成进度回调, 每个步骤触发一次. */
  onProgress?: (msg: string) => void;
  /** 临时目录创建后的注册回调, 用于崩溃清理; 可返回反注册函数, 生成结束后调用以解除登记. */
  registerTempDir?: (dir: string) => (() => void) | undefined;
  /** 依赖安装函数; 传入时 installDeps 为真才调用. */
  install?: (ctx: ProjectContext) => Promise<void>;
  /** 执行单条生成后任务的函数; 注入以便测试替换, 缺省使用真实 spawn 实现. */
  runPostGenerate?: (task: PostGenerateTask, cwd: string) => Promise<void>;
  /** 非致命告警回调 (如生成后任务失败); 用于向用户提示但不中断流程. */
  onWarn?: (message: string) => void;
}

/**
 * 串联脚手架全流程: 加载模板 -> 定名 (含目录冲突循环) -> 选模板 -> 定包管理器与安装决策 -> 生成 -> 可选安装.
 * @param options 从 CLI 解析的选项.
 * @param deps 外部依赖注入集合.
 * @returns 完整的项目上下文, 包含已落盘的目录信息.
 */
export async function createProject(
  options: CliOptions,
  deps: CreateProjectDeps,
): Promise<ProjectContext> {
  const cwd = deps.cwd ?? process.cwd();

  const templates = await loadTemplates(deps.templatesRoot);
  if (templates.length === 0) {
    throw new TemplateError("没有可用的模板");
  }

  let nameArg = deps.nameArg;
  let projectName = "";
  let targetDir = "";
  for (;;) {
    projectName = await resolveProjectName(deps.prompter, nameArg);
    targetDir = resolveTargetDir(projectName, cwd);
    if (options.force || (await isDirUsable(targetDir))) {
      break;
    }
    const action = await deps.prompter.resolveDirConflict(targetDir);
    if (action === "cancel") {
      throw new UserCancelledError();
    }
    if (action === "overwrite") {
      break;
    }
    // rename: 下一轮重新询问名称
    nameArg = undefined;
  }

  const template = await resolveTemplate(options, templates, deps.prompter);
  const packageManager = resolvePackageManager(options.pm);
  // 非 Node 项目 (无 package.json) 没有 npm 依赖可装, 跳过安装决策与相应提问, 恒不安装.
  const installDeps = template.hasPackageJson
    ? (options.install ?? (options.yes ? true : await deps.prompter.confirmInstall(packageManager)))
    : false;

  const ctx: ProjectContext = {
    projectName,
    targetDir,
    template,
    packageManager,
    installDeps,
  };

  await generateProject(ctx, {
    onTempCreated: (dir) => deps.registerTempDir?.(dir),
    onProgress: (msg) => deps.onProgress?.(msg),
  });

  await runPostGenerateTasks(ctx, deps);

  if (installDeps && deps.install) {
    await deps.install(ctx);
  }

  return ctx;
}

/**
 * 按序执行模板声明的生成后任务 (如格式化).
 * 尽力而为: 项目在此前已原子写入且有效, 任一任务失败仅告警, 不回滚也不中断.
 * @param ctx 已落盘的项目上下文.
 * @param deps 依赖注入集合.
 */
async function runPostGenerateTasks(ctx: ProjectContext, deps: CreateProjectDeps): Promise<void> {
  const tasks = ctx.template.meta.postGenerate ?? [];
  const run = deps.runPostGenerate ?? runPostGenerateTask;
  for (const task of tasks) {
    const label = task.description ?? task.command.join(" ");
    deps.onProgress?.(`执行生成后任务: ${label}`);
    try {
      await run(task, ctx.targetDir);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      deps.onWarn?.(`生成后任务失败, 已跳过 (${label}): ${reason}`);
    }
  }
}

async function resolveProjectName(
  prompter: Prompter,
  argName: string | undefined,
): Promise<string> {
  if (argName !== undefined) {
    const result = validateProjectName(argName);
    if (!result.valid) {
      throw new ValidationError(`项目名 "${argName}" 不合法: ${result.problems.join("; ")}`);
    }
    return argName.trim();
  }
  return prompter.askProjectName();
}

async function resolveTemplate(
  options: CliOptions,
  templates: Template[],
  prompter: Prompter,
): Promise<Template> {
  if (options.template) {
    const found = findTemplate(templates, options.template);
    if (!found) {
      throw new TemplateError(`未找到模板: ${options.template}`);
    }
    return found;
  }

  // 始终呈现两级选择 (语言 -> 模板), 即使某一级只有一个选项也不自动跳过,
  // 以保证交互流程中语言与模板两级层级始终可见.
  const languages = listLanguages(templates);
  const language = await prompter.selectLanguage(languages);
  const inLanguage = templatesByLanguage(templates, language);
  return prompter.selectTemplate(inLanguage);
}
