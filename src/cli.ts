import { Command } from "commander";
import { getVersion, resolveTemplatesRoot } from "./constants.js";
import { createProject } from "./core/createProject.js";
import { installDependencies } from "./core/installer.js";
import { ScaffoldError, UserCancelledError, ValidationError } from "./runtime/errors.js";
import { installLifecycle, registerTempDir } from "./runtime/lifecycle.js";
import type { CliOptions, PackageManager } from "./types.js";
import { buildBanner } from "./ui/banner.js";
import { buildNextSteps } from "./ui/nextSteps.js";
import { ClackPrompter } from "./ui/prompts.js";
import { intro, note, withSpinner } from "./ui/reporter.js";
import { c, emoji } from "./ui/theme.js";

const PACKAGE_MANAGERS: readonly PackageManager[] = ["npm", "pnpm", "yarn", "bun"];

/**
 * 构建并返回配置好的 commander 程序实例, 含全部选项与参数声明.
 * @returns 配置完毕的 Command 实例, 尚未解析 argv.
 */
export function buildProgram(): Command {
  const program = new Command();
  program
    .name("radish-creator")
    .description("交互式项目脚手架: 输入名称, 选语言, 选模板, 一键生成")
    .version(getVersion(), "-v, --version", "输出版本号")
    .argument("[project-name]", "项目名称")
    .option("-t, --template <lang/id>", "指定模板, 如 typescript/node-basic")
    .option("--pm <manager>", "包管理器 npm|pnpm|yarn|bun")
    .option("--install", "生成后安装依赖")
    .option("--no-install", "生成后不安装依赖")
    .option("--force", "目标目录非空时强制覆盖")
    .option("--no-banner", "跳过启动 banner")
    .option("-y, --yes", "接受默认值, 尽量非交互");
  return program;
}

/**
 * 将 commander 解析出的原始选项对象转换为强类型的 CliOptions.
 * @param raw commander opts() 的原始返回值.
 * @returns 强类型 CliOptions; install 未指定时为 undefined.
 * @throws ValidationError 当 pm 值不在支持的包管理器列表中时.
 */
export function toCliOptions(raw: Record<string, unknown>): CliOptions {
  const options: CliOptions = {};
  if (typeof raw.template === "string") {
    options.template = raw.template;
  }
  if (typeof raw.pm === "string") {
    if ((PACKAGE_MANAGERS as readonly string[]).includes(raw.pm)) {
      options.pm = raw.pm as PackageManager;
    } else {
      throw new ValidationError(`未知的包管理器: ${raw.pm} (可选 npm|pnpm|yarn|bun)`);
    }
  }
  if (typeof raw.install === "boolean") {
    options.install = raw.install;
  }
  if (raw.force === true) {
    options.force = true;
  }
  if (raw.banner === false) {
    options.banner = false;
  }
  if (raw.yes === true) {
    options.yes = true;
  }
  return options;
}

/**
 * CLI 主入口: 解析 argv, 装配生命周期钩子, 编排脚手架流程并处理错误.
 * @param argv 传入的命令行参数数组, 通常为 process.argv.slice(2).
 * @returns 流程完成后 resolve 的 Promise.
 */
export async function runCli(argv: string[]): Promise<void> {
  installLifecycle({ onFatal: (error) => reportFatal(error) });

  const program = buildProgram();
  program.exitOverride();
  program.configureOutput({
    outputError: (str, write) => write(c.red(str)),
  });

  let options: CliOptions;
  let nameArg: string | undefined;
  try {
    program.parse(argv, { from: "user" });
    options = toCliOptions(program.opts());
    nameArg = program.args[0];
  } catch (error) {
    if (error instanceof ScaffoldError) {
      handleRunError(error);
      return;
    }
    handleCommanderExit(error);
    return;
  }

  try {
    if (options.banner !== false) {
      console.log(buildBanner());
    }
    intro(`${emoji.rocket} radish-creator v${getVersion()}`);

    const ctx = await createProject(options, {
      prompter: new ClackPrompter(),
      templatesRoot: resolveTemplatesRoot(),
      cwd: process.cwd(),
      ...(nameArg !== undefined ? { nameArg } : {}),
      registerTempDir: (dir) => registerTempDir(dir),
      onProgress: () => {
        // 进度细节由生成阶段的 spinner 呈现
      },
      onWarn: (message) => console.warn(c.yellow(`${emoji.wave} ${message}`)),
      install: (context) =>
        withSpinner(
          `用 ${context.packageManager} 安装依赖`,
          () => installDependencies(context),
          "依赖安装完成",
        ),
    });

    const steps = buildNextSteps(ctx, process.cwd());
    note(steps.map((s) => c.cyan(s)).join("\n"), `${emoji.sparkles} 后续步骤`);
    console.log(c.green(`${emoji.check} 项目 ${ctx.projectName} 创建完成`));
  } catch (error) {
    handleRunError(error);
  }
}

function handleRunError(error: unknown): void {
  if (error instanceof UserCancelledError) {
    console.log(c.yellow(`${emoji.wave} ${error.message}`));
    process.exit(0);
  }
  if (error instanceof ScaffoldError) {
    console.error(c.red(`${emoji.cross} ${error.message}`));
    process.exit(error.exitCode);
  }
  reportFatal(error);
  process.exit(1);
}

function handleCommanderExit(error: unknown): void {
  const exitCode = (error as { exitCode?: number }).exitCode ?? 0;
  process.exit(exitCode);
}

function reportFatal(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(c.red(`${emoji.cross} 发生错误: ${message}`));
  if (process.env.DEBUG && error instanceof Error) {
    console.error(error.stack);
  }
}
