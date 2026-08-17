/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  type TerminalImageRenderSupport,
  type TerminalImageDisplay,
} from '@qwen-code/qwen-code-core';
import { type KittyImagePlaceholder } from './mermaidImageRenderer.js';
export declare const MAX_INLINE_IMAGE_PIXELS = 64000000;
export declare const TRANSMITTED_KEY_LIMIT = 256;
export declare function wasKittyImageWritten(key: string): boolean;
export declare function markKittyImageWritten(key: string): void;
export type TerminalImageRenderResult =
  | {
      kind: 'kitty';
      key: string;
      sequence: string;
      placeholder: KittyImagePlaceholder;
    }
  | {
      kind: 'ansi';
      lines: string[];
    }
  | {
      kind: 'unavailable';
      reason: string;
    };
export interface TerminalImageRenderOptions {
  display: TerminalImageDisplay;
  contentWidth: number;
  availableTerminalHeight?: number;
  env?: NodeJS.ProcessEnv;
  stdoutIsTTY?: boolean;
}
export interface InlineTerminalImageRenderOptions {
  data: string;
  mimeType: string;
  contentWidth: number;
  availableTerminalHeight?: number;
  env?: NodeJS.ProcessEnv;
  stdoutIsTTY?: boolean;
  disabled?: boolean;
}
export interface PreparedInlineTerminalImage {
  fallbackText: string;
  result: TerminalImageRenderResult | null;
}
export declare function supportsKittyImageProtocol(
  env?: NodeJS.ProcessEnv,
  stdoutIsTTY?: boolean,
): boolean;
export declare function getTerminalImageRenderSupport(
  env?: NodeJS.ProcessEnv,
  stdoutIsTTY?: boolean,
): TerminalImageRenderSupport;
export declare function containsCmdShellMetacharacters(
  filePath: string,
): boolean;
export declare function prepareInlineTerminalImage({
  data,
  mimeType,
  contentWidth,
  availableTerminalHeight,
  env,
  stdoutIsTTY,
  disabled,
}: InlineTerminalImageRenderOptions): PreparedInlineTerminalImage;
export declare function renderTerminalImage({
  display,
  contentWidth,
  availableTerminalHeight,
  env,
  stdoutIsTTY,
}: TerminalImageRenderOptions): TerminalImageRenderResult;
