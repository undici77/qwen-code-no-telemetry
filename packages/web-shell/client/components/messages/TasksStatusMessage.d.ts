import type {
  DaemonSessionMonitorTaskStatus,
  DaemonSessionShellTaskStatus,
  DaemonSessionTasksStatus,
} from '@qwen-code/sdk/daemon';
import { type DaemonSessionActions } from '@qwen-code/webui/daemon-react-sdk';
import type { ACPToolCall, TodoItem } from '../../adapters/types';
declare const ACTIVE_EVENT = 'web-shell:tasks-panel-active';
export interface SerializedTasksMessage {
  snapshot: DaemonSessionTasksStatus;
}
declare const serializeTasksStatusMessage: any;
declare function parseTasksStatusMessage(
  content: string,
): SerializedTasksMessage | null;
export { serializeTasksStatusMessage, parseTasksStatusMessage };
export declare function TasksStatusMessage({
  message,
  embedded,
  manageActiveEvent,
  onClose,
  planTodos,
  agentTools,
  onOpenSubagent,
  onOpenMonitor,
}: {
  message: SerializedTasksMessage;
  embedded?: boolean;
  manageActiveEvent?: boolean;
  onClose?: () => void;
  planTodos?: readonly TodoItem[];
  agentTools?: readonly ACPToolCall[];
  onOpenSubagent?: (tool: ACPToolCall) => void;
  onOpenMonitor?: (task: DaemonSessionMonitorTaskStatus) => void;
}): import('react/jsx-runtime').JSX.Element | null;
export declare function MonitorTaskDetail({
  task,
  actions: providedActions,
}: {
  task: DaemonSessionMonitorTaskStatus;
  actions?: DaemonSessionActions;
}): import('react/jsx-runtime').JSX.Element;
export declare function ShellTaskDetail({
  task,
  actions: providedActions,
}: {
  task: DaemonSessionShellTaskStatus;
  actions?: DaemonSessionActions;
}): import('react/jsx-runtime').JSX.Element;
export { ACTIVE_EVENT as TASKS_STATUS_ACTIVE_EVENT };
