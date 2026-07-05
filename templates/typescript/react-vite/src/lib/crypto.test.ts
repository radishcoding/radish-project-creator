import {
  base64Decode,
  base64Encode,
  decryptAes,
  encryptAes,
  hmacSha256,
  md5,
  sha256,
} from "@/lib/crypto"

describe("crypto", () => {
  it("AES 加解密可往返且密文不等于明文", () => {
    const cipher = encryptAes("敏感数据", "secret-key")
    expect(cipher).not.toBe("敏感数据")
    expect(decryptAes(cipher, "secret-key")).toBe("敏感数据")
  })

  it("SHA-256 匹配已知向量", () => {
    expect(sha256("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    )
  })

  it("MD5 匹配已知向量", () => {
    expect(md5("abc")).toBe("900150983cd24fb0d6963f7d28e17f72")
  })

  it("HMAC-SHA256 稳定且随密钥变化", () => {
    expect(hmacSha256("msg", "k1")).toBe(hmacSha256("msg", "k1"))
    expect(hmacSha256("msg", "k1")).not.toBe(hmacSha256("msg", "k2"))
  })

  it("base64 编解码可往返 (含多字节字符)", () => {
    expect(base64Decode(base64Encode("萝卜"))).toBe("萝卜")
  })
})
