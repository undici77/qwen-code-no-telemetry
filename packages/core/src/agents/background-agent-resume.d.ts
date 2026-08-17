/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import { type AgentTask } from './background-tasks.js';
export declare const DEFAULT_BACKGROUND_AGENT_CONTINUATION_MESSAGE =
  'Continue working on the current task from the last completed step.';
export declare class BackgroundAgentResumeService {
  private readonly config;
  private readonly resumeOperations;
  constructor(config: Config);
  loadPausedBackgroundAgents(sessionId: string): Promise<readonly AgentTask[]>;
  resumeBackgroundAgent(
    agentId: string,
    initialMessage?: string,
  ): Promise<AgentTask | undefined>;
  /**
   * Revive a *completed* background sub-agent so the model can keep iterating
   * on it via `send_message`. The resume engine only accepts `paused` entries,
   * so flip the finished entry back to a resumable `paused` state (this clears
   * its result/stats and resets `notified` so the revived run emits its own
   * terminal notification) and hand it to `resumeBackgroundAgent`.
   *
   * Returns `undefined` (and logs why) when the agent can't be revived: not an
   * in-registry, finished background agent with a persisted transcript, or the
   * background-agent concurrency cap is full. Completed agents restored from
   * the same parent session use this path after process restart.
   */
  reviveCompletedBackgroundAgent(
    agentId: string,
    initialMessage?: string,
  ): Promise<AgentTask | undefined>;
  private resumeBackgroundAgentInternal;
  abandonBackgroundAgent(agentId: string): boolean;
  buildRecoveredBackgroundAgentsNotice(count: number): string;
  buildRecoveredBackgroundAgentsModelNotice(count: number): string;
  private resolveResumeTarget;
  private restorePausedEntry;
  private restoreCompletedEntry;
  private resolveCurrentForkRuntime;
  private buildForkResumeCapabilityReminder;
  private createResumedForkSubagent;
  private applySubagentStartHook;
  private runSubagentStopHookLoop;
}
