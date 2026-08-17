import type {
  DaemonSessionArtifact,
  DaemonSessionMonitorTaskStatus,
  DaemonSessionShellTaskStatus,
} from '@qwen-code/sdk/daemon';
import type { ACPToolCall } from '../../adapters/types';
import type { WebShellRightPanelItem } from '../../customization';
import { type DaemonSessionActions } from '@qwen-code/webui/daemon-react-sdk';
import {
  type TurnOutputFileChange,
  type TurnOutputOpenRequest,
  type TurnOutputScheduledTask,
} from './TurnOutputs';
export type ArtifactPanelTab =
  | {
      id: string;
      kind: 'review';
      title: string;
      workspaceCwd?: string;
      workspaceId?: string;
      changes?: readonly TurnOutputFileChange[];
      selectedPath?: string;
    }
  | {
      id: string;
      kind: 'file';
      title: string;
      workspacePath: string;
      workspaceCwd?: string;
      workspaceId?: string;
      previewContent?: string;
    }
  | {
      id: string;
      kind: 'artifact';
      title: string;
      artifactId: string;
      workspaceCwd?: string;
      workspaceId?: string;
      sourceSessionId?: string;
      previewContent?: string;
    }
  | {
      id: string;
      kind: 'scheduled_task';
      title: string;
      task: TurnOutputScheduledTask;
      workspaceCwd?: string;
      workspaceId?: string;
    }
  | {
      id: string;
      kind: 'image';
      title: string;
      src: string;
      alt?: string;
    }
  | {
      id: string;
      kind: 'subagent';
      title: string;
      sessionId: string;
      rootToolCallId: string;
      rootTool: ACPToolCall;
      workspaceCwd?: string;
    }
  | {
      id: string;
      kind: 'monitor';
      title: string;
      task: DaemonSessionMonitorTaskStatus;
      sessionId?: string;
      sessionActions?: DaemonSessionActions;
    }
  | {
      id: string;
      kind: 'shell';
      title: string;
      task: DaemonSessionShellTaskStatus;
      sessionId?: string;
      sessionActions?: DaemonSessionActions;
    }
  | {
      id: string;
      kind: 'side_task';
      title: string;
      sessionId?: string;
      parentSessionId: string;
      workspaceCwd?: string;
      nameFromFirstPrompt?: boolean;
      initialPrompt?: string;
    };
export interface SideTaskListItem {
  sessionId: string;
  title: string;
  workspaceCwd?: string;
  updatedAt?: string;
}
interface ArtifactPanelProps {
  artifacts: readonly DaemonSessionArtifact[];
  tabs: readonly ArtifactPanelTab[];
  activeTabId: string | null;
  reviewChanges: readonly TurnOutputFileChange[];
  selectedReviewPath: string | null;
  panelWidth?: number;
  workspaceCwd?: string;
  loading?: boolean;
  error?: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onOpenFilePreview: (
    change: TurnOutputFileChange,
    workspaceCwd?: string,
    workspaceId?: string,
  ) => void;
  latestReviewAvailable?: boolean;
  onOpenLatestReview?: () => void;
  items?: readonly WebShellRightPanelItem[];
  sideTaskAvailable?: boolean;
  sideTasks?: readonly SideTaskListItem[];
  sideTasksLoading?: boolean;
  onCreateSideTask?: () => void;
  onOpenSideTask?: (sideTask: SideTaskListItem) => void;
  onCreateSideTaskSession?: (
    tabId: string,
    parentSessionId: string,
    title: string,
  ) => Promise<{
    sessionId: string;
    displayName?: string;
  }>;
  onSideTaskCreated?: (tabId: string, sessionId: string) => void;
  onSideTaskTitleChange?: (
    tabId: string,
    title: string,
    fromFirstPrompt?: boolean,
  ) => void;
  onNestedRightPanelOpen?: (request: TurnOutputOpenRequest) => void;
  onNestedArtifactsChange?: (
    sessionId: string,
    artifacts: readonly DaemonSessionArtifact[],
  ) => void;
  onError?: (error: unknown, fallback: string) => void;
  sessionWorkflowEnabled?: boolean;
  onImageIngestionNotice?: (tone: 'warning' | 'error', message: string) => void;
  deferSubagentMount?: boolean;
  onClose: () => void;
  variant?: 'docked' | 'drawer';
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
}
export declare function ArtifactPanel({
  artifacts,
  tabs,
  activeTabId,
  reviewChanges,
  selectedReviewPath,
  panelWidth,
  workspaceCwd,
  loading,
  error,
  onSelectTab,
  onCloseTab,
  onOpenFilePreview,
  latestReviewAvailable,
  onOpenLatestReview,
  items,
  sideTaskAvailable,
  sideTasks,
  sideTasksLoading,
  onCreateSideTask,
  onOpenSideTask,
  onCreateSideTaskSession,
  onSideTaskCreated,
  onSideTaskTitleChange,
  onNestedRightPanelOpen,
  onNestedArtifactsChange,
  onError,
  sessionWorkflowEnabled,
  onImageIngestionNotice,
  deferSubagentMount,
  onClose,
  variant,
  fullscreen,
  onToggleFullscreen,
}: ArtifactPanelProps): import('react/jsx-runtime').JSX.Element;
export {};
