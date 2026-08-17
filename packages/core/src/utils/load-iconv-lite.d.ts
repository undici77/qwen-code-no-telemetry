/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface IconvLite {
  decode(buffer: Buffer, encoding: string): string;
  encode(content: string, encoding: string): Buffer;
  encodingExists(encoding: string): boolean;
}
export declare function loadIconvLite(): Promise<IconvLite>;
