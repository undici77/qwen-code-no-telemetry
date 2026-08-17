import type {
  DaemonSessionAgentTaskStatus,
  DaemonSessionTaskStatus,
  DaemonWorkspaceGitStatus,
} from '@qwen-code/sdk/daemon';
import type { WebShellEnvironmentPanelItem } from '../../customization';
interface EnvironmentPanelProps {
  floating?: boolean;
  hidden?: boolean;
  workspaceCwd?: string;
  gitWorkspaceCwd?: string;
  gitCwd?: string;
  branch?: string;
  gitStatus?: DaemonWorkspaceGitStatus;
  tasks: readonly DaemonSessionTaskStatus[];
  agentTasks?: readonly EnvironmentAgentTask[];
  items?: readonly WebShellEnvironmentPanelItem[];
  onOpenGitDiff?: () => void;
  onOpenGitCommit?: () => void;
  onOpenAgent?: (task: DaemonSessionAgentTaskStatus) => void;
  onOpenTask: (task: DaemonSessionTaskStatus) => void;
  onDismiss?: () => void;
}
export type EnvironmentAgentTask = DaemonSessionAgentTaskStatus & {
  color?: string;
};
export declare function EnvironmentPanel({
  floating,
  hidden,
  workspaceCwd,
  gitWorkspaceCwd,
  gitCwd,
  branch,
  gitStatus,
  tasks,
  agentTasks,
  items,
  onOpenGitDiff,
  onOpenGitCommit,
  onOpenAgent,
  onOpenTask,
  onDismiss,
}: EnvironmentPanelProps): import('react/jsx-runtime').JSX.Element;
export {};
