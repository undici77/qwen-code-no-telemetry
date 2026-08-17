/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type ReactNode } from 'react';
import { type DaemonSessionActions } from '@qwen-code/webui/daemon-react-sdk';
import {
  type DaemonSessionArtifact,
  type DaemonSessionMonitorTaskStatus,
  type DaemonWorkspaceCapability,
} from '@qwen-code/sdk/daemon';
import type { WebShellSlashCommandHandler } from '../App';
import type {
  TurnOutputKind,
  TurnOutputOpenRequest,
} from './artifacts/TurnOutputs';
export interface PaneHeaderActionsInfo {
  sessionId: string;
  workspaceCwd?: string;
}
export type PaneHeaderActionsRenderer = (
  info: PaneHeaderActionsInfo,
) => ReactNode;
export interface ChatPaneProps {
  /** Header label; falls back to the session's own display name / id. */
  title?: string;
  /**
   * The workspace this pane's session lives in. Passed explicitly by the split
   * view (which knows it per session) and shown as a composer-toolbar chip on a
   * multi-workspace daemon; falls back to the connection's own workspace.
   */
  workspaceCwd?: string;
  /**
   * Extra actions rendered in the pane header, before the built-in
   * maximize/close buttons. Receives this pane's session id (and workspace
   * when known) so the host can scope each control to the right session. When
   * the actions no longer fit beside the title they collapse into a `…`
   * overflow menu.
   *
   * Each child should be a single interactive element (button or link). When
   * collapsed, the overflow menu lists the actions and proxies a click to that
   * element, labelling each item from its accessible name (decorative
   * `aria-hidden` glyphs are ignored). The action instance stays mounted in a
   * hidden, off-pane slot across collapse so its state survives; because that
   * slot is `visibility: hidden`, an action that opens a popover anchored to
   * itself must render the popover through a portal — one rendered as a
   * descendant of the action (or anchored to its bounding box) would be
   * invisible or mispositioned while collapsed.
   */
  renderHeaderActions?: PaneHeaderActionsRenderer;
  onClose?: () => void;
  /**
   * Toggle this pane between maximized (solo, filling the whole split) and the
   * tiled layout. Omitted when only one pane is open — there's nothing to
   * maximize against.
   */
  onToggleMaximize?: () => void;
  /** Whether this pane is currently the maximized (solo) one. */
  isMaximized?: boolean;
  onError?: (error: unknown, fallback: string) => void;
  onImageIngestionNotice?: (tone: 'warning' | 'error', message: string) => void;
  /** Host slash-command callback shared with the main chat composer. */
  onSlashCommand?: WebShellSlashCommandHandler;
  onRightPanelOpen?: (request: TurnOutputOpenRequest) => void;
  onOpenMonitor?: (
    task: DaemonSessionMonitorTaskStatus,
    sessionId: string,
    sessionActions: DaemonSessionActions,
  ) => void;
  onPaneArtifactsChange?: (
    sessionId: string,
    artifacts: readonly DaemonSessionArtifact[],
  ) => void;
  messageTurnOutputs?: readonly TurnOutputKind[];
  /** Allow prompt admission to recover a disconnected SSE stream. */
  restartSseOnPrompt?: boolean;
  /** Render inside a parent surface that already provides its own frame. */
  embedded?: boolean;
  onFirstPromptAdmitted?: (text: string) => void;
  /** Whether this pane owns Session Catalog turn-completion reconciliation. */
  reportCatalogTurnCompletion?: boolean;
  hidden?: boolean;
  voiceUserRevision?: number;
  voiceWorkspaceRevisions?: Readonly<Record<string, number>>;
  voiceWorkspaces?: readonly DaemonWorkspaceCapability[];
  /** Enable the app-scoped experimental Session Workflow presentation. */
  sessionWorkflowEnabled?: boolean;
}
/**
 * A self-contained interactive chat, scoped to whichever `DaemonSessionProvider`
 * it is nested under. Rendering N of these (each under its own provider) inside
 * one window is the split view: every pane has its own transcript, streaming
 * state, approvals, and composer, and the browser scopes keyboard focus to the
 * pane the user clicks into — so there is no cross-pane approval arbitration.
 */
export declare function ChatPane({
  title,
  workspaceCwd,
  renderHeaderActions,
  onClose,
  onToggleMaximize,
  isMaximized,
  onError,
  onImageIngestionNotice,
  onSlashCommand,
  onRightPanelOpen,
  onOpenMonitor,
  onPaneArtifactsChange,
  messageTurnOutputs,
  restartSseOnPrompt,
  embedded,
  onFirstPromptAdmitted,
  reportCatalogTurnCompletion,
  hidden,
  voiceUserRevision,
  voiceWorkspaceRevisions,
  voiceWorkspaces,
  sessionWorkflowEnabled,
}: ChatPaneProps): import('react/jsx-runtime').JSX.Element;
