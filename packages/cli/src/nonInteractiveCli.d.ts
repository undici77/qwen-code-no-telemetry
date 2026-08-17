/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config, CronJob, CronScheduler } from '@qwen-code/qwen-code-core';
import type { LoadedSettings } from './config/settings.js';
import { SendMessageType } from '@qwen-code/qwen-code-core';
import type { CLIUserMessage } from './nonInteractive/types.js';
import type { JsonOutputAdapterInterface } from './nonInteractive/io/BaseJsonOutputAdapter.js';
import type { ControlService } from './nonInteractive/control/ControlService.js';
export declare class TurnInterruptedError extends Error {
  constructor();
}
/**
 * Headless handling for fired loop sentinels. loop.md and autonomous sentinel
 * expansion is interactive-only for now, so a bare sentinel can't be turned into
 * a real prompt here — the tick is skipped (no-op) rather than sent to the model
 * as empty content. Returns true when `job` was a sentinel so the caller skips
 * enqueuing it.
 *
 * A recurring SESSION (non-durable) loop.md job would otherwise stay in
 * `scheduler.sessionSize` and re-fire every interval, pinning the headless run
 * open forever (the hold-open resolves only when sessionSize hits zero); delete
 * it so the run can terminate. Durable jobs are left untouched here — they
 * persist for a future owning session and never count toward sessionSize — and
 * a one-shot job is already removed before it fires.
 *
 * Note: a DURABLE loop.md sentinel never even reaches this callback in headless,
 * because `setSkipDurableFire` filters it at the scheduler before any fire or
 * lastFiredAt persist (otherwise the tick would be marked fired while the work
 * is skipped — silent loss). This guard's durable branch is kept defensive.
 */
export declare function skipHeadlessLoopSentinel(
  scheduler: CronScheduler,
  job: CronJob,
): boolean;
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
  onResultEmitted?: () => void;
  /**
   * Emit a terminal result and return from this turn when its controller is
   * aborted with {@link TurnInterruptedError}, instead of exiting the process.
   * Reusable stream-json sessions use this so a protocol interrupt does not
   * tear down the session; one-shot callers retain the process-level default.
   */
  recoverableCancellation?: boolean;
  /**
   * Continue the most recent unfinished turn from chat history instead of
   * submitting `input` (which is ignored). No new user message enters the
   * transcript: an orphaned trailing user entry is re-submitted with Retry
   * semantics, and dangling tool calls are closed with synthesized error
   * functionResponses sent as a ToolResult. When the last turn ended
   * cleanly the run emits a no-op result and exits 0.
   */
  continueInterrupted?: boolean;
}
/**
 * Executes the non-interactive CLI flow for a single request.
 */
export declare function runNonInteractive(
  config: Config,
  settings: LoadedSettings,
  input: string,
  prompt_id: string,
  options?: RunNonInteractiveOptions,
): Promise<number>;
