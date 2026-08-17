/**
 * DingTalk media download helpers.
 *
 * Two-step flow:
 * 1. POST downloadCode to DingTalk API → get a temporary downloadUrl
 * 2. GET the downloadUrl → arraybuffer
 */
export interface MediaFile {
  buffer: Buffer;
  mimeType: string;
}
/**
 * Download a media file from DingTalk using a downloadCode.
 *
 * @param downloadCode - The code from incoming message richText/content
 * @param robotCode - The bot's clientId (appKey)
 * @param accessToken - A valid DingTalk access token
 * @returns MediaFile with buffer and mimeType, or null on failure
 */
export declare function downloadMedia(
  downloadCode: string,
  robotCode: string,
  accessToken: string,
): Promise<MediaFile | null>;
