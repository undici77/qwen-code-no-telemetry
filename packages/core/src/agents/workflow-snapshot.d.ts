/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { WorkflowMeta } from './runtime/workflow-sandbox.js';
import {
  type WorkflowTask,
  type WorkflowTerminalStatus,
} from './workflow-run-registry.js';
/** Cap on snapshots retained on disk; oldest are pruned on write. */
export declare const MAX_RETAINED_SNAPSHOTS = 30;
/** JSON-serializable projection of a terminal workflow run. */
export interface WorkflowSnapshot {
  runId: string;
  meta: WorkflowMeta | null;
  status: WorkflowTerminalStatus;
  script: string;
  scriptPath?: string;
  phases: string[];
  agentsDispatched: number;
  agentsCompleted: number;
  tokensSpent: number;
  tokenBudgetTotal: number | null;
  /** `perPhaseTokens` flattened to `[phaseOrNull, tokens]` pairs. */
  perPhaseTokens: Array<[string | null, number]>;
  recentLogs: string[];
  startTime: number;
  endTime?: number;
  result?: unknown;
  error?: string;
}
/** Project a (terminal) registry entry into a serializable snapshot. */
export declare function toSnapshot(task: WorkflowTask): WorkflowSnapshot;
/**
 * Write a run snapshot to `<projectDir>/workflows/<runId>.json`, then prune
 * the oldest snapshots beyond `MAX_RETAINED_SNAPSHOTS`. Best-effort: a write
 * failure is logged, not thrown (persistence is a convenience, not a
 * correctness requirement).
 */
export declare function writeWorkflowSnapshot(
  config: Config,
  task: WorkflowTask,
): Promise<void>;
/**
 * Load all persisted snapshots, newest-first by `startTime`. Tolerates a
 * missing directory and skips unparseable files.
 */
export declare function listWorkflowSnapshots(
  config: Config,
): Promise<WorkflowSnapshot[]>;
