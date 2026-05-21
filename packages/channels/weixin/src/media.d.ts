/**
 * CDN download with AES-128-ECB decryption.
 * Ported from cc-weixin/plugins/weixin/src/media.ts (download path only).
 */
/**
 * Parse aes_key from CDNMedia into a raw 16-byte Buffer.
 * Two encodings exist:
 *   - base64(raw 16 bytes) → images
 *   - base64(hex string of 16 bytes) → file/voice/video
 */
export declare function parseAesKey(aesKeyBase64: string): Buffer;
/** Download encrypted media from CDN and decrypt it. */
export declare function downloadAndDecrypt(encryptQueryParam: string, aesKey: string): Promise<Buffer>;
/** AES-128-ECB encryption for CDN upload. */
export declare function encryptAesEcb(plaintext: Buffer, key: Buffer): Buffer;
/** Compute MD5 hash of a buffer, returning hex string. */
export declare function computeMd5(data: Buffer): string;
