import { type ReactNode } from 'react';
import type { DaemonWorkspaceCapability } from '@qwen-code/sdk/daemon';
import { type WebShellTheme } from '../../themeContext';
export type WebShellSidebarFooterItem =
  | 'settings'
  | 'version'
  | 'theme'
  | 'sessionsOverview'
  | 'splitView'
  | 'daemonStatus'
  | 'collapse';
export interface WebShellSidebarBranding {
  /** Replace the complete top branding row. */
  render?: () => ReactNode;
  /** Hide the branding row in the compact drawer. Defaults to true. */
  hideWhenCompact?: boolean;
}
export interface WebShellSidebarLockedWorkspace {
  /** Replace the locked workspace row content while preserving its built-in behavior. */
  render?: (
    workspace: DaemonWorkspaceCapability,
    state: {
      expanded: boolean;
    },
  ) => ReactNode;
}
export type WebShellSidebarPrimaryNavItem =
  | 'newTask'
  | 'plugins'
  | 'channels'
  | 'scheduledTasks'
  | 'goals';
export interface WebShellSidebarPrimaryNavOptions {
  /** Built-in primary nav entries to show. Defaults to all. */
  items?: readonly WebShellSidebarPrimaryNavItem[];
  /** Additional custom content rendered after the built-in nav buttons. */
  render?: () => ReactNode;
}
export interface WebShellSidebarFooterOptions {
  /** Built-in footer entries to expose. Entries use the canonical footer order. */
  items?: readonly WebShellSidebarFooterItem[];
  /** Additional custom content rendered before the built-in footer items (left side). */
  render?: () => ReactNode;
}
export type WebShellSidebarSessionActionItem =
  | 'details'
  | 'rename'
  | 'group'
  | 'export'
  | 'delete'
  | 'pin'
  | 'archive';
/** Subset of action items that have working inline (hover-button) handlers. */
export type WebShellSidebarSessionInlineActionItem =
  | 'pin'
  | 'archive'
  | 'rename'
  | 'export'
  | 'delete';
export interface WebShellSidebarSessionActionsOptions {
  /** Session action items to show. Defaults to all. */
  items?: readonly WebShellSidebarSessionActionItem[];
  /**
   * Which items appear as inline buttons (on hover). Defaults to ['pin', 'archive'].
   * Only items that also pass their built-in visibility condition are rendered.
   * Only items with working inline handlers are accepted (details/group are dropdown-only).
   */
  inlineItems?: readonly WebShellSidebarSessionInlineActionItem[];
}
interface WebShellSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onOpenSettings: () => void;
  onOpenPlugins: () => void;
  onOpenChannels: () => void;
  onOpenDaemonStatus: () => void;
  onOpenScheduledTasks: () => void;
  onOpenGoals: () => void;
  onOpenSessions: () => void;
  /**
   * Whether to offer the Session Overview entry point. Gated to large screens
   * by the app: below that there is no room to make managing several sessions
   * side by side worthwhile.
   */
  canOpenSessionsOverview?: boolean;
  onOpenSplitView: () => void;
  /** Whether to offer the in-window split view (large screens only). */
  canOpenSplitView?: boolean;
  onNewSession: (workspaceCwd?: string) => Promise<boolean> | boolean;
  onLoadSession: (
    sessionId: string,
    workspaceCwd?: string,
  ) => Promise<void> | void;
  onSelectCurrentSession?: () => void;
  onSessionRenameConfirmed?: (
    workspaceCwd: string,
    sessionId: string,
    displayName: string,
  ) => void;
  onError: (error: unknown, fallback: string) => void;
  theme: WebShellTheme;
  onThemeChange: (theme: WebShellTheme) => void;
  mobileOpen?: boolean;
  /**
   * Phase 4: workspace cwd picked for the next new session (undefined =
   * primary). Only meaningful on multi-workspace daemons.
   */
  selectedWorkspaceCwd?: string;
  onSelectWorkspace?: (workspaceCwd: string | undefined) => void;
  /**
   * Open the working-tree Changes dialog for a workspace. Forwarded to each
   * trusted workspace's folder header, where a live git chip fires it on click.
   */
  onOpenGitDiff?: (workspaceCwd: string) => void;
  onOpenCommit?: (workspaceCwd: string) => void;
  /**
   * Opens the shared App-owned Add Workspace dialog. Omit this callback when
   * registration is unavailable; locked workspaces hide the action separately.
   */
  onOpenAddWorkspace?: () => void;
  workspaces?: DaemonWorkspaceCapability[];
  lockedWorkspaceCwd?: string;
  lockedWorkspace?: WebShellSidebarLockedWorkspace;
  branding?: false | WebShellSidebarBranding;
  primaryNav?: WebShellSidebarPrimaryNavOptions;
  /** Whether to hide the "Projects" header row (with search and add workspace). Defaults to false (shown). */
  hideProjectHeader?: boolean;
  /** Customize which action buttons appear on session rows. */
  sessionActions?: WebShellSidebarSessionActionsOptions;
  footer?: false | WebShellSidebarFooterOptions;
}
export declare function WebShellSidebar({
  collapsed,
  onCollapsedChange,
  onOpenSettings,
  onOpenPlugins,
  onOpenChannels,
  onOpenDaemonStatus,
  onOpenScheduledTasks,
  onOpenGoals,
  onOpenSessions,
  canOpenSessionsOverview,
  onOpenSplitView,
  canOpenSplitView,
  onNewSession,
  onLoadSession,
  onSelectCurrentSession,
  onSessionRenameConfirmed,
  onError,
  theme,
  onThemeChange,
  mobileOpen,
  selectedWorkspaceCwd,
  onSelectWorkspace,
  onOpenGitDiff,
  onOpenCommit,
  onOpenAddWorkspace,
  workspaces: providedWorkspaces,
  lockedWorkspaceCwd,
  lockedWorkspace: lockedWorkspaceOptions,
  branding,
  primaryNav: primaryNavOptions,
  hideProjectHeader,
  sessionActions: sessionActionsOptions,
  footer,
}: WebShellSidebarProps): import('react/jsx-runtime').JSX.Element;
export {};
