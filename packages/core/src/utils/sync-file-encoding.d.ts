/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type FileReadResult } from './fileUtils.js';
import { type ReadTextFileResponse } from '../services/fileSystemService.js';
export declare function decodeBufferWithEncodingInfo(
  full: Buffer,
): FileReadResult;
export declare function encodeTextFileContent(
  filePath: string,
  content: string,
  meta?: ReadTextFileResponse['_meta'] | null,
): Buffer;
