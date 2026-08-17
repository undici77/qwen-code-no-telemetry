export interface SessionSourceMetadata {
  sourceType?: string;
  sourceId?: string;
}
export declare const SESSION_SOURCE_META_KEY = 'qwen.session.source';
export declare const SESSION_SOURCE_TYPE_PATTERN: RegExp;
export declare const MAX_SESSION_SOURCE_ID_LENGTH = 256;
export declare function parseSessionSource(
  sourceType: unknown,
  sourceId: unknown,
):
  | SessionSourceMetadata
  | {
      error: string;
    };
