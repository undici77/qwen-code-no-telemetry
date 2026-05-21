/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '@qwen-code/qwen-code-core';
import type { LoadedSettings } from './config/settings.js';
import { SendMessageType } from '@qwen-code/qwen-code-core';
import type { CLIUserMessage } from './nonInteractive/types.js';
import type { JsonOutputAdapterInterface } from './nonInteractive/io/BaseJsonOutputAdapter.js';
import type { ControlService } from './nonInteractive/control/ControlService.js';
/**
 * Provides optional overrides for `runNonInteractive` execution.
 *
 * @param abortController - Optional abort controller for cancellation.
 * @param adapter - Optional JSON output adapter for structured output formats.
 * @param userMessage - Optional CLI user message payload for preformatted input.
 * @param controlService - Optional control service for future permission handling.
 */
export interface RunNonInteractiveOptions {
    abortController?: AbortController;
    adapter?: JsonOutputAdapterInterface;
    userMessage?: CLIUserMessage;
    controlService?: ControlService;
    sendMessageType?: SendMessageType;
    notificationDisplayText?: string;
    captureMonitorNotifications?: boolean;
    captureMonitorRegistrations?: boolean;
}
/**
 * Executes the non-interactive CLI flow for a single request.
 */
export declare function runNonInteractive(config: Config, settings: LoadedSettings, input: string, prompt_id: string, options?: RunNonInteractiveOptions): Promise<number>;
