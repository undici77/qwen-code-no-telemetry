/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type DaemonSessionActions } from '@qwen-code/webui/daemon-react-sdk';
import type { DaemonSessionArtifact, DaemonSessionMonitorTaskStatus, DaemonWorkspaceCapability } from '@qwen-code/sdk/daemon';
import type { WebShellSlashCommandHandler } from '../App';
import { type PaneHeaderActionsRenderer } from './ChatPane';
import type { TurnOutputKind, TurnOutputOpenRequest } from './artifacts/TurnOutputs';
export interface SplitViewProps {
    /** Sessions to show in the split view. */
    sessionIds?: string[];
    /**
     * Report the live pane set (after every add / remove) up to the parent so it
     * survives this view unmounting. Switching away from the split and back must
     * restore exactly the panes the user had, not reseed from a stale selection.
     * Must be referentially stable (e.g. a `useState` setter) — a fresh callback
     * each render would re-fire the reporting effect and loop.
     */
    onPanesChange?: (sessionIds: string[]) => void;
    /** Leave the split view (back to the single-session chat). */
    onExit: () => void;
    onError?: (error: unknown, fallback: string) => void;
    onImageIngestionNotice?: (tone: 'warning' | 'error', message: string) => void;
    onSlashCommand?: WebShellSlashCommandHandler;
    onRightPanelOpen?: (request: TurnOutputOpenRequest) => void;
    onOpenMonitor?: (task: DaemonSessionMonitorTaskStatus, sessionId: string, sessionActions: DaemonSessionActions) => void;
    onPaneArtifactsChange?: (sessionId: string, artifacts: readonly DaemonSessionArtifact[]) => void;
    messageTurnOutputs?: readonly TurnOutputKind[];
    /**
     * Extra actions rendered in each pane header, before the built-in close
     * button. See `ChatPaneProps.renderHeaderActions`.
     */
    renderPaneHeaderActions?: PaneHeaderActionsRenderer;
    /** Include active sessions from every trusted registered workspace. */
    includeOtherWorkspaces?: boolean;
    /** Limit session discovery and pane attachment to this workspace. */
    workspaceCwd?: string;
    /** Restart each pane's SSE event stream after an accepted prompt. */
    restartSseOnPrompt?: boolean;
    /** Persisted transcript records requested per page by each pane. */
    historyPageSize?: number;
    voiceUserRevision?: number;
    voiceWorkspaceRevisions?: Readonly<Record<string, number>>;
    voiceWorkspaces?: readonly DaemonWorkspaceCapability[];
    sessionWorkflowEnabled?: boolean;
}
/**
 * Shows 2+ independent interactive chats side by side in one window. Each pane
 * is its own `DaemonSessionProvider` (own session, SSE, transcript, approvals),
 * all sharing the one `DaemonWorkspaceProvider` above the app. Browser focus
 * naturally scopes the keyboard to the pane the user clicks into, so panes never
 * fight over which session an approval or Enter belongs to.
 */
export declare function SplitView({ sessionIds, onPanesChange, onExit, onError, onImageIngestionNotice, onSlashCommand, onRightPanelOpen, onOpenMonitor, onPaneArtifactsChange, messageTurnOutputs, renderPaneHeaderActions, includeOtherWorkspaces, workspaceCwd, restartSseOnPrompt, historyPageSize, voiceUserRevision, voiceWorkspaceRevisions, voiceWorkspaces, sessionWorkflowEnabled, }: SplitViewProps): import("react/jsx-runtime").JSX.Element;
