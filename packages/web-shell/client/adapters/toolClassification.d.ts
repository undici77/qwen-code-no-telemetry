import type { ACPToolCall } from './types';
export declare function isActiveToolStatus(
  status: ACPToolCall['status'] | string,
): boolean;
export declare function hasActiveAgents(
  agents: readonly ACPToolCall[],
): boolean;
export declare function isTaskExecutionRaw(raw: unknown): boolean;
export declare function isSubAgentToolCall(tool: ACPToolCall): boolean;
export declare function isBackgroundSubAgentToolCall(
  tool: ACPToolCall,
): boolean;
