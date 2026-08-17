/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Workspace-wide `/goal` listing — the daemon-side surface behind the Web Shell
 * "Goals" page.
 *
 * The canonical Goal runtime is session scoped and owned by each `qwen --acp`
 * child. The serve process holds no mutable copy, so this route fans out one
 * `sessionGoalGet` ext-method call per live session and collects the answers.
 *
 * A session whose child is wedged or dying rejects; those are dropped (and
 * logged) rather than failing the whole list, so one bad session can't hide the
 * others. The per-call timeout is the bridge's, and the calls run concurrently
 * (up to `PROBE_CONCURRENCY`), so a wedged child costs one timeout rather than
 * one per session.
 *
 * Read-only: clearing a goal stays on `POST /session/:id/goal/clear`, and
 * setting one stays a prompt (`/goal <objective>` updates the owning runtime,
 * which schedules the first Goal turn).
 */
import type { Application } from 'express';
import type {
  BridgeSessionGoal,
  BridgeSessionSummary,
} from '@qwen-code/acp-bridge';
/**
 * The slice of the session bridge this route needs. Narrowed to a structural
 * type so tests can stub it without the full bridge.
 */
export interface GoalsSessionBridge {
  listWorkspaceSessions(workspaceCwd: string): BridgeSessionSummary[];
  getSessionGoal(sessionId: string): Promise<BridgeSessionGoal>;
}
export interface RegisterGoalsRoutesDeps {
  boundWorkspace: string;
  bridge: GoalsSessionBridge;
  isWorkspaceTrusted?: () => boolean;
  captureGenerationAssertion?: () => (() => void) | undefined;
}
export declare function registerGoalsRoutes(
  app: Application,
  deps: RegisterGoalsRoutesDeps,
): void;
