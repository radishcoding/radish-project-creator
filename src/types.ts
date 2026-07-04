/** 项目支持的包管理器. */
export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

/** 目标目录存在冲突时的处理方式. */
export type DirConflictAction = "overwrite" | "rename" | "cancel";

/** 模板的元数据描述. */
export interface TemplateMeta {
  /** 模板显示名称. */
  name: string;
  /** 模板功能简介. */
  description: string;
  /** 可选的展示图标. */
  emoji?: string;
  /** 用于分类或检索的标签列表. */
  tags?: string[];
}

/** 单个项目模板的完整描述. */
export interface Template {
  /** 模板所用的编程语言. */
  language: string;
  /** 模板唯一标识符. */
  id: string;
  /** URL 友好的短标识. */
  slug: string;
  /** 模板文件所在目录路径. */
  dir: string;
  /** 模板元数据. */
  meta: TemplateMeta;
}

/** 从命令行解析出的选项. */
export interface CliOptions {
  /** 指定模板 id 或 slug. */
  template?: string;
  /** 指定包管理器. */
  pm?: PackageManager;
  /** 是否安装依赖. */
  install?: boolean;
  /** 目录冲突时强制覆盖. */
  force?: boolean;
  /** 是否显示欢迎横幅. */
  banner?: boolean;
  /** 跳过所有交互式提问, 使用默认值. */
  yes?: boolean;
}

/** 脚手架执行所需的完整项目上下文. */
export interface ProjectContext {
  /** 用户输入的项目名称. */
  projectName: string;
  /** 项目将被创建的目标目录. */
  targetDir: string;
  /** 所选模板. */
  template: Template;
  /** 所选包管理器. */
  packageManager: PackageManager;
  /** 是否在创建后安装依赖. */
  installDeps: boolean;
}

/** 封装所有交互式提问操作的接口. */
export interface Prompter {
  /**
   * 询问用户输入项目名称.
   * @param initial 预填的初始值.
   * @returns 用户确认的项目名称.
   */
  askProjectName(initial?: string): Promise<string>;
  /**
   * 让用户从列表中选择编程语言.
   * @param languages 可选语言列表.
   * @returns 用户选择的语言.
   */
  selectLanguage(languages: string[]): Promise<string>;
  /**
   * 让用户从列表中选择模板.
   * @param templates 可选模板列表.
   * @returns 用户选择的模板.
   */
  selectTemplate(templates: Template[]): Promise<Template>;
  /**
   * 询问用户如何处理已存在的目录冲突.
   * @param dir 发生冲突的目录路径.
   * @returns 用户选择的处理方式.
   */
  resolveDirConflict(dir: string): Promise<DirConflictAction>;
  /**
   * 询问用户是否安装依赖.
   * @param pm 将使用的包管理器.
   * @returns 用户确认安装则返回 true.
   */
  confirmInstall(pm: PackageManager): Promise<boolean>;
}
