/**
 * Send messages to WeChat users.
 */
/** Convert markdown to plain text (WeChat doesn't support markdown) */
export declare function markdownToPlainText(text: string): string;
/** Image magic bytes → MIME type mapping. */
export declare function detectImageMime(data: Buffer): string;
/**
 * Validate and resolve an image path before reading.
 *
 * Security: prevents AI-controlled [IMAGE: ...] markers from reading
 * arbitrary files by enforcing directory allowlist, extension allowlist,
 * size cap, and magic-byte verification.
 *
 * @param imagePath  Raw path from the AI response.
 * @param workspaceDirs  Additional directories to allow (typically the cwd).
 * @returns Resolved absolute realpath if valid.
 */
export declare function validateImagePath(
  imagePath: string,
  workspaceDirs?: string[],
): string;
/** Send a text message */
export declare function sendText(params: {
  to: string;
  text: string;
  baseUrl: string;
  token: string;
  contextToken: string;
}): Promise<void>;
/**
 * Send an image message via the four-step CDN upload flow:
 *   1. Validate path + read file, compute rawsize + MD5; generate AES key + filekey
 *   2. Request upload URL via getuploadurl
 *   3. AES-128-ECB encrypt + POST upload to CDN; extract x-encrypted-param
 *   4. Send message with image_item referencing the CDN media
 */
export declare function sendImage(params: {
  to: string;
  imagePath: string;
  baseUrl: string;
  token: string;
  contextToken: string;
  /** Workspace directories to allow for image paths. */
  workspaceDirs?: string[];
}): Promise<void>;
