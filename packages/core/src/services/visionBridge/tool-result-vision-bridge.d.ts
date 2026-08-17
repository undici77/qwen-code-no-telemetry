/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Part } from '@google/genai';
import type { Config } from '../../config/config.js';
export interface BridgeToolResultImagesParams {
  config: Config;
  responseParts: Part[];
  signal: AbortSignal;
  onFullTurnModel?: (model: string) => boolean;
  onVisionBridgeNotice?: (notice: string) => void;
}
/** Remove tool-result images from speculative work without making a side query. */
export declare function stripToolResultImages(responseParts: Part[]): Part[];
/**
 * Route or convert images nested in normalized tool responses before the next
 * model request. The active runtime model view is resolved by the caller's
 * config.
 */
export declare function bridgeToolResultImages({
  config,
  responseParts,
  signal,
  onFullTurnModel,
  onVisionBridgeNotice,
}: BridgeToolResultImagesParams): Promise<Part[]>;
