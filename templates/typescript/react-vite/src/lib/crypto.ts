import * as CryptoJS from "crypto-js"

/**
 * 用口令对明文做 AES 加密.
 * @param plain 待加密明文.
 * @param secret 加密口令.
 * @returns OpenSSL 格式的 base64 密文 (内含随机盐).
 */
export function encryptAes(plain: string, secret: string): string {
  return CryptoJS.AES.encrypt(plain, secret).toString()
}

/**
 * 解密由 encryptAes 生成的密文.
 * @param cipher base64 密文.
 * @param secret 加密口令.
 * @returns 解密后的明文; 口令错误时返回空串.
 */
export function decryptAes(cipher: string, secret: string): string {
  return CryptoJS.AES.decrypt(cipher, secret).toString(CryptoJS.enc.Utf8)
}

/**
 * 计算字符串的 SHA-256 摘要.
 * @param input 输入字符串.
 * @returns 十六进制摘要.
 */
export function sha256(input: string): string {
  return CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex)
}

/**
 * 计算 HMAC-SHA256 签名.
 * @param input 输入字符串.
 * @param secret 密钥.
 * @returns 十六进制签名.
 */
export function hmacSha256(input: string, secret: string): string {
  return CryptoJS.HmacSHA256(input, secret).toString(CryptoJS.enc.Hex)
}

/**
 * 计算字符串的 MD5 摘要.
 * @param input 输入字符串.
 * @returns 十六进制摘要.
 */
export function md5(input: string): string {
  return CryptoJS.MD5(input).toString(CryptoJS.enc.Hex)
}

/**
 * 将字符串按 UTF-8 编码为 base64.
 * @param input 输入字符串.
 * @returns base64 字符串.
 */
export function base64Encode(input: string): string {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(input))
}

/**
 * 解码 base64 字符串为 UTF-8 文本.
 * @param input base64 字符串.
 * @returns 解码后的字符串.
 */
export function base64Decode(input: string): string {
  return CryptoJS.enc.Base64.parse(input).toString(CryptoJS.enc.Utf8)
}
