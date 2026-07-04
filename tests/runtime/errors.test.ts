import { describe, expect, it } from "vitest";
import {
  FileSystemError,
  ScaffoldError,
  TemplateError,
  UserCancelledError,
  ValidationError,
} from "../../src/runtime/errors.js";

describe("errors", () => {
  it("UserCancelledError 退出码为 0 且是 ScaffoldError", () => {
    const err = new UserCancelledError();
    expect(err).toBeInstanceOf(ScaffoldError);
    expect(err.exitCode).toBe(0);
    expect(err.code).toBe("USER_CANCELLED");
  });

  it("ValidationError 退出码为 1 且保留消息", () => {
    const err = new ValidationError("名称非法");
    expect(err.exitCode).toBe(1);
    expect(err.message).toBe("名称非法");
    expect(err.name).toBe("ValidationError");
  });

  it("TemplateError / FileSystemError 退出码为 1", () => {
    expect(new TemplateError("x").exitCode).toBe(1);
    expect(new FileSystemError("y").exitCode).toBe(1);
  });
});
