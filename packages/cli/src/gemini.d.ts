/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '@qwen-code/qwen-code-core';
import type { DnsResolutionOrder } from './config/settings.js';
export declare function validateDnsResolutionOrder(
  order: string | undefined,
): DnsResolutionOrder;
export declare function setupUncaughtExceptionHandler(config: Config): void;
export declare function setupUnhandledRejectionHandler(): void;
export declare function main(): Promise<void>;
export declare function createNonInteractivePromptId(sessionId: string): string;
/**
 * Watches `.lsp.json` for changes and reconciles running LSP servers
 * (add / remove / restart) without requiring a session restart.
 *
 * Silently no-ops when LSP is disabled or the active client does not
 * support runtime reinitialization.
 *
 * Emits {@link AppEvent.LspStatusChanged} after every successful reload
 * so the UI can reflect the new server state.
 */
export declare function registerLspHotReload(
  config: Config,
  registerCleanup: (fn: () => void | Promise<void>) => void,
): void;
