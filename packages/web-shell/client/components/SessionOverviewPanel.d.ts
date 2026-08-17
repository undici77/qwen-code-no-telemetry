/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  DaemonSessionGroupPresetColor,
  DaemonSessionSummary,
  DaemonStatusReportSession,
} from '@qwen-code/sdk/daemon';
export type SessionCardStatus = 'needsApproval' | 'running' | 'idle';
export interface SessionCard {
  sessionId: string;
  label: string;
  status: SessionCardStatus;
  clientCount: number;
  model?: string;
  updatedAt?: string;
  color?: DaemonSessionGroupPresetColor | null;
  isCurrent: boolean;
  /** The workspace the session lives in. */
  workspaceCwd: string;
  /** True when the session belongs to a non-primary workspace. */
  isNonPrimary: boolean;
}
/**
 * Merge the (cheap, all-sessions) list with the (richer, loaded-sessions-only)
 * status report into one ranked set of cards. `needsApproval` is derived from
 * the status report's `pendingPermissionCount` and takes precedence over
 * `running` because it is the actionable state — the session is blocked waiting
 * for the user. Cold sessions absent from the status report simply read as
 * idle. Sorted needs-approval → running → idle, then most-recent first, so the
 * sessions that want attention float to the top of a 10+ session grid.
 */
export declare function deriveSessionCards(
  sessions: DaemonSessionSummary[],
  statusSessions: DaemonStatusReportSession[],
  currentSessionId: string | undefined,
  primaryCwd?: string,
): SessionCard[];
/**
 * A malformed daemon payload must not white-screen the shell; contain any
 * render throw to the panel, mirroring DaemonStatusDialog.
 */
export declare function SessionOverviewPanel({
  onOpenSession,
  onOpenSplit,
  includeOtherWorkspaces,
  workspaceCwd,
}: {
  onOpenSession: (sessionId: string) => void;
  onOpenSplit?: (sessionIds: string[]) => void;
  includeOtherWorkspaces?: boolean;
  workspaceCwd?: string;
}): import('react/jsx-runtime').JSX.Element;
