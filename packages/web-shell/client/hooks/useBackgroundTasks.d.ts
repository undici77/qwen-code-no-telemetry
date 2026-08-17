import type { DaemonSessionTaskStatus } from '@qwen-code/sdk/daemon';
export declare function useBackgroundTasks(
  sessionId: string | undefined,
  taskActivityKey: string,
  connected: boolean,
  refreshTrigger?: number,
): DaemonSessionTaskStatus[];
