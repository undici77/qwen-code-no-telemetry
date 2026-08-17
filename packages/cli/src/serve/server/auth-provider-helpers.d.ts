/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  ServeAuthProviderCatalog,
  ServeAuthProviderInstallRequest,
} from '../types.js';
export declare function buildAuthProviderCatalog(
  workspaceCwd: string,
): ServeAuthProviderCatalog;
export declare function isBlockedAuthProviderHost(hostname: string): boolean;
type AuthProviderParseResult =
  | {
      ok: true;
      value: ServeAuthProviderInstallRequest;
    }
  | {
      ok: false;
      code: string;
      error: string;
    };
export declare function parseAuthProviderInstallRequest(
  body: Record<string, unknown>,
  options?: {
    allowPrivateBaseUrl?: boolean;
  },
): AuthProviderParseResult;
export {};
