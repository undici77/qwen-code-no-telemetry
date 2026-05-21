/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '@qwen-code/qwen-code-core';
import type { DnsResolutionOrder, LoadedSettings } from './config/settings.js';
import { type InitializationResult } from './core/initializer.js';
export declare function validateDnsResolutionOrder(order: string | undefined): DnsResolutionOrder;
export declare function setupUnhandledRejectionHandler(): void;
export declare function startInteractiveUI(config: Config, settings: LoadedSettings, startupWarnings: string[], workspaceRoot: string | undefined, initializationResult: InitializationResult): Promise<void>;
export declare function main(): Promise<void>;
export declare function createNonInteractivePromptId(sessionId: string): string;
