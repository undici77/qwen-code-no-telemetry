import type { DaemonSessionAgentTaskStatus, DaemonSessionTaskStatus } from '@qwen-code/sdk/daemon';
import type { ACPToolCall, TodoItem } from '../../adapters/types';
export type PlanNodeStatus = 'running' | 'paused' | 'completed' | 'blocked' | 'in_progress' | 'ready';
export declare function layerPlanTodos(todos: readonly TodoItem[]): TodoItem[][];
export declare function nestedTasksForTool(tool: ACPToolCall, tasks: readonly DaemonSessionTaskStatus[]): Array<{
    task: DaemonSessionAgentTaskStatus;
    depth: number;
}>;
export declare function nestedAgentToolsForTool(tool: ACPToolCall): Array<{
    tool: ACPToolCall;
    depth: number;
}>;
export declare function getPlanNodeState(todo: TodoItem, todosById: ReadonlyMap<string, TodoItem>, tools: readonly ACPToolCall[], tasks: readonly DaemonSessionTaskStatus[]): {
    status: PlanNodeStatus;
    attention: boolean;
};
export declare function PlanExecutionView({ todos, tools, tasks, onOpenSubagent, }: {
    todos: readonly TodoItem[];
    tools: readonly ACPToolCall[];
    tasks: readonly DaemonSessionTaskStatus[];
    onOpenSubagent?: (tool: ACPToolCall) => void;
}): import("react/jsx-runtime").JSX.Element | null;
