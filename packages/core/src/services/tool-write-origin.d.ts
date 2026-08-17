/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { WriteTextFileRequest } from '@agentclientprotocol/sdk';
export declare const TOOL_WRITE_ORIGIN_META_KEY: 'qwen-code/tool-write-origin';
export declare const TOOL_WRITE_ORIGINS: readonly [
  'write_file',
  'edit',
  'notebook_edit',
  'shell_sed_edit',
];
export type ToolWriteOrigin = (typeof TOOL_WRITE_ORIGINS)[number];
export declare function buildToolWriteOriginMeta(
  meta: WriteTextFileRequest['_meta'],
  source: ToolWriteOrigin | undefined,
): WriteTextFileRequest['_meta'];
export declare function parseToolWriteOriginMeta(
  meta: WriteTextFileRequest['_meta'],
): ToolWriteOrigin | undefined;
