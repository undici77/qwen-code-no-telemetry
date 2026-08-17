import type { ChannelLoop, ChannelLoopStore } from './ChannelLoopStore.js';
export interface ChannelLoopRunner {
  runLoopPrompt(
    job: ChannelLoop,
    options?: {
      timeoutMs?: number;
      shouldContinue?: () => Promise<boolean>;
    },
  ): Promise<string | undefined>;
}
export interface ChannelLoopSchedulerOptions {
  store: Pick<ChannelLoopStore, 'list' | 'update' | 'disable'>;
  channels: ReadonlyMap<string, ChannelLoopRunner>;
  nextFireTime: (cron: string, after: Date) => Date;
  now?: () => Date;
  maxConsecutiveFailures?: number;
  intervalMs?: number;
  loopTimeoutMs?: number;
}
/** Why a loop run was skipped; carried as data so reporting never depends on message wording. */
export type ChannelLoopSkipReason = 'cancel_command' | 'clear' | 'dropped';
export declare class ChannelLoopSkippedError extends Error {
  readonly reason: ChannelLoopSkipReason;
  constructor(message: string, reason?: ChannelLoopSkipReason);
}
export declare class ChannelLoopScheduler {
  private readonly store;
  private readonly channels;
  private readonly nextFireTime;
  private readonly now;
  private readonly maxConsecutiveFailures;
  private readonly intervalMs;
  private readonly loopTimeoutMs;
  private timer;
  private runningTick;
  private readonly inFlightJobs;
  private generation;
  private recoveryEpoch;
  constructor(options: ChannelLoopSchedulerOptions);
  start(): void;
  stop(): void;
  /**
   * Mark that a bridge recovery started. Loop prompts already in flight that
   * the bridge replacement aborts are cleared instead of counted as agent
   * failures, so a crash-restart cannot auto-disable a loop.
   */
  markBridgeRecovery(): void;
  private reconcileStartupState;
  tick(): Promise<void>;
  private runTick;
  private isDue;
  private fireOnce;
  private fire;
  private findJob;
  private clearRunningSince;
  private recordSkipped;
  private recordFailure;
}
