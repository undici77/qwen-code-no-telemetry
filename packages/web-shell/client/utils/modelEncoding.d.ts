/**
 * Encodes a model ID from ACP format (modelId(authType)) to storage format
 * (authType:modelId). Core's resolveVisionModelSelection() expects this format.
 * If the input is not in ACP format, returns it unchanged.
 */
export declare function encodeVisionModelForSetting(modelId: string): string;
export declare function extractBareModelId(modelId: string): string;
/**
 * Decodes a stored model ID from authType:modelId format back to ACP format
 * (modelId(authType)). Used for picker comparison where model IDs are in ACP
 * format. Splits on the first colon — safe for colon-bearing model IDs
 * (e.g., 'openai:gpt-4o:online' → 'gpt-4o:online(openai)').
 * If the input has no colon, returns it unchanged.
 */
export declare function decodeVisionModelForPicker(storedValue: string): string;
