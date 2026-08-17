/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const REDACTED_MCP_SECRET = '__redacted__';
type SecretRecord = Record<string, string>;
type SecretBearingMcpServer = {
  env?: SecretRecord;
  headers?: SecretRecord;
  oauth?: {
    clientSecret?: string;
    [key: string]: unknown;
  };
};
export declare function redactMcpServerSecrets<
  T extends SecretBearingMcpServer,
>(server: T): T;
export declare function restoreRedactedMcpSecrets<
  T extends SecretBearingMcpServer,
>(server: T, existing: Record<string, unknown>): T;
export declare function redactMcpServersSetting(value: unknown): unknown;
export declare function restoreRedactedMcpServersSetting(
  value: unknown,
  existing: unknown,
): unknown;
export {};
