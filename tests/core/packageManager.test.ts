import { describe, expect, it } from "vitest";
import {
  detectPackageManager,
  installCommand,
  resolvePackageManager,
  runCommand,
} from "../../src/core/packageManager.js";

describe("packageManager", () => {
  it("从 user-agent 识别 pnpm", () => {
    expect(detectPackageManager("pnpm/8.0.0 npm/? node/v20")).toBe("pnpm");
  });

  it("无 user-agent 时回退到 npm", () => {
    expect(detectPackageManager(undefined)).toBe("npm");
  });

  it("未知 user-agent 回退到 npm", () => {
    expect(detectPackageManager("deno/1.0")).toBe("npm");
  });

  it("resolvePackageManager 优先使用显式指定", () => {
    expect(resolvePackageManager("yarn")).toBe("yarn");
  });

  it("拼装安装命令", () => {
    expect(installCommand("npm")).toBe("npm install");
    expect(installCommand("yarn")).toBe("yarn");
    expect(installCommand("pnpm")).toBe("pnpm install");
  });

  it("拼装运行脚本命令", () => {
    expect(runCommand("npm", "dev")).toBe("npm run dev");
    expect(runCommand("pnpm", "dev")).toBe("pnpm dev");
  });

  it("resolvePackageManager(undefined) 回退到自动探测", () => {
    const original = process.env.npm_config_user_agent;
    process.env.npm_config_user_agent = "pnpm/8.0.0 npm/? node/v20";
    try {
      expect(resolvePackageManager(undefined)).toBe("pnpm");
    } finally {
      if (original === undefined) {
        delete process.env.npm_config_user_agent;
      } else {
        process.env.npm_config_user_agent = original;
      }
    }
  });

  it("从 user-agent 识别 yarn 与 bun", () => {
    expect(detectPackageManager("yarn/1.22.19 npm/? node/v20")).toBe("yarn");
    expect(detectPackageManager("bun/1.0.0 npm/? node/v20")).toBe("bun");
  });

  it("bun 的安装与运行命令", () => {
    expect(installCommand("bun")).toBe("bun install");
    expect(runCommand("bun", "dev")).toBe("bun dev");
  });
});
