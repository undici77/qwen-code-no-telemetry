import { type ReactNode } from 'react';
import type { DaemonClient } from '@qwen-code/sdk/daemon';
import type {
  DaemonSessionGroup,
  DaemonSessionSummary,
  DaemonWorkspaceCapability,
} from '@qwen-code/sdk/daemon';
interface WorkspaceSectionProps {
  workspace: DaemonWorkspaceCapability;
  renderHeader?: (expanded: boolean) => ReactNode;
  client: DaemonClient;
  reloadToken: number;
  untrustedLabel: string;
  readOnlyLabel: string;
  trustToOpenLabel: string;
  noSessionsLabel: string;
  loadErrorLabel: string;
  organizationEnabled: boolean;
  sourceType?: string;
  channelGroupingEnabled?: boolean;
  ungroupedLabel: string;
  formatTime: (iso: string) => string;
  searchQuery?: string;
  expanded?: boolean;
  autoExpandKey?: string;
  onExpandedChange?: (expanded: boolean) => void;
  renderSessions?: boolean;
  /**
   * Render one session row. The sidebar passes its shared `renderSessionRow`
   * so per-workspace sessions match the single-workspace list exactly — same
   * type scale, hover actions (pin, archive, export, more…), and states —
   * instead of a bespoke, feature-poor row.
   */
  renderSession: (session: DaemonSessionSummary) => ReactNode;
  headerActions?: (visible: boolean) => ReactNode;
  onRenameGroup?: (group: DaemonSessionGroup, workspaceCwd: string) => void;
  onDeleteGroup?: (group: DaemonSessionGroup, workspaceCwd: string) => void;
  renameGroupLabel?: string;
  deleteGroupLabel?: string;
  groupActionsDisabled?: boolean;
  excludePinned?: boolean;
  /**
   * Open the working-tree Changes dialog for this workspace. When provided, the
   * folder header shows a live git chip (branch + dirty/ahead-behind state) that
   * fires this on click. Omitted for untrusted workspaces (no git surface).
   */
  onOpenGitDiff?: (workspaceCwd: string) => void;
  onOpenCommit?: (workspaceCwd: string) => void;
}
export declare function WorkspaceSection({
  workspace,
  renderHeader,
  client,
  reloadToken,
  untrustedLabel,
  readOnlyLabel,
  trustToOpenLabel,
  noSessionsLabel,
  loadErrorLabel,
  organizationEnabled,
  sourceType,
  channelGroupingEnabled,
  ungroupedLabel,
  formatTime,
  searchQuery,
  expanded: controlledExpanded,
  autoExpandKey,
  onExpandedChange,
  renderSessions,
  renderSession,
  headerActions,
  onRenameGroup,
  onDeleteGroup,
  renameGroupLabel,
  deleteGroupLabel,
  groupActionsDisabled,
  excludePinned,
  onOpenGitDiff,
  onOpenCommit,
}: WorkspaceSectionProps): import('react/jsx-runtime').JSX.Element;
export {};
