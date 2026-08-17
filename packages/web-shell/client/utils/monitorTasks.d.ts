import type {
  DaemonSessionMonitorTaskStatus,
  DaemonSessionTaskStatus,
} from '@qwen-code/sdk/daemon';
import type { ACPToolCall } from '../adapters/types';
export declare function findMonitorTaskForTool(
  tasks: readonly DaemonSessionTaskStatus[],
  tool: ACPToolCall,
): DaemonSessionMonitorTaskStatus | undefined;
