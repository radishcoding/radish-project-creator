/** 脚手架操作失败时抛出的基础错误类. */
export class ScaffoldError extends Error {
  readonly exitCode: number;
  readonly code: string;

  /**
   * @param message 错误描述信息.
   * @param code 机器可读的错误代码.
   * @param exitCode 进程退出码, 默认为 1.
   * @param options 标准 ErrorOptions, 可通过 cause 字段传入原始错误以保留错误链.
   */
  constructor(message: string, code: string, exitCode = 1, options?: ErrorOptions) {
    super(message, options);
    this.name = "ScaffoldError";
    this.code = code;
    this.exitCode = exitCode;
  }
}

/** 用户主动取消操作时抛出的错误, 退出码为 0. */
export class UserCancelledError extends ScaffoldError {
  constructor(message = "操作已取消") {
    super(message, "USER_CANCELLED", 0);
    this.name = "UserCancelledError";
  }
}

/** 输入参数未通过校验时抛出的错误. */
export class ValidationError extends ScaffoldError {
  constructor(message: string) {
    super(message, "VALIDATION", 1);
    this.name = "ValidationError";
  }
}

/** 模板查找或加载失败时抛出的错误. */
export class TemplateError extends ScaffoldError {
  constructor(message: string) {
    super(message, "TEMPLATE", 1);
    this.name = "TemplateError";
  }
}

/** 文件系统操作失败时抛出的错误. */
export class FileSystemError extends ScaffoldError {
  /**
   * @param message 错误描述信息.
   * @param options 标准 ErrorOptions, 可通过 cause 字段传入原始错误以保留错误链.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, "FILESYSTEM", 1, options);
    this.name = "FileSystemError";
  }
}
