import { describe, expect, it } from "vitest";
import { buildProgram, toCliOptions } from "../src/cli.js";
import { installArgs } from "../src/core/installer.js";
import { ValidationError } from "../src/runtime/errors.js";

describe("cli 参数解析", () => {
  it("解析位置参数与选项", () => {
    const program = buildProgram();
    program.exitOverride();
    program.parse(["my-app", "--template", "typescript/node-basic", "--no-install", "--force"], {
      from: "user",
    });
    expect(program.args[0]).toBe("my-app");
    const opts = toCliOptions(program.opts());
    expect(opts.template).toBe("typescript/node-basic");
    expect(opts.install).toBe(false);
    expect(opts.force).toBe(true);
  });

  it("未指定 install 相关标志时 install 为 undefined (触发交互)", () => {
    const program = buildProgram();
    program.exitOverride();
    program.parse(["my-app"], { from: "user" });
    const opts = toCliOptions(program.opts());
    expect(opts.install).toBeUndefined();
  });

  it("--install 使 install 为 true", () => {
    const program = buildProgram();
    program.exitOverride();
    program.parse(["my-app", "--install"], { from: "user" });
    expect(toCliOptions(program.opts()).install).toBe(true);
  });

  it("未知包管理器抛 ValidationError", () => {
    expect(() => toCliOptions({ pm: "deno" })).toThrow(ValidationError);
  });
});

describe("installArgs", () => {
  it("npm/pnpm/yarn/bun 安装参数", () => {
    expect(installArgs("npm")).toEqual(["install"]);
    expect(installArgs("pnpm")).toEqual(["install"]);
    expect(installArgs("yarn")).toEqual([]);
    expect(installArgs("bun")).toEqual(["install"]);
  });
});
