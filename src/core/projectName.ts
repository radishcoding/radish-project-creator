import validateNpmPackageName from "validate-npm-package-name";

/** 项目名称校验结果. */
export interface NameValidation {
  /** 校验是否通过. */
  valid: boolean;
  /** 校验不通过时的问题描述列表. */
  problems: string[];
}

/**
 * 校验项目名称是否符合 npm 包名规范.
 * @param name 待校验的项目名称 (允许首尾有空白, 内部会自动修剪).
 * @returns 包含校验结果与问题列表的对象.
 */
export function validateProjectName(name: string): NameValidation {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, problems: ["项目名不能为空"] };
  }

  const result = validateNpmPackageName(trimmed);
  if (result.validForNewPackages) {
    return { valid: true, problems: [] };
  }

  const problems = [...(result.errors ?? []), ...(result.warnings ?? [])];
  return {
    valid: false,
    problems: problems.length > 0 ? problems : ["项目名不符合 npm 包名规范"],
  };
}
