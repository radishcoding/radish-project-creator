import figlet from "figlet";
import gradient from "gradient-string";
import { BRAND, GRADIENT_COLORS } from "./theme.js";

/**
 * 将文本转换为 figlet Standard 字体的 ASCII 艺术字.
 * @param text 输入文本.
 * @returns 多行 ASCII 艺术字字符串.
 */
export function asciiArt(text: string): string {
  return figlet.textSync(text, { font: "Standard" });
}

/**
 * 生成带品牌渐变色的 ASCII 艺术字 banner.
 * @param text 渲染文本, 默认使用品牌名.
 * @returns 带 ANSI 颜色转义的渐变 ASCII 艺术字字符串.
 */
export function buildBanner(text: string = BRAND): string {
  return gradient([...GRADIENT_COLORS]).multiline(asciiArt(text));
}
