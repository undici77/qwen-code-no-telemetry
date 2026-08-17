/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
type UserTranscriptRecord = {
  type?: unknown;
  message?: {
    parts?: readonly unknown[];
  };
  systemPayload?: unknown;
};
/**
 * Returns a user record's clean text projection. `undefined` means the record
 * is not a Qwen user record and the caller should use its other format parser.
 */
export declare function getUserTranscriptDisplayText(
  record: UserTranscriptRecord,
): string | undefined;
export {};
