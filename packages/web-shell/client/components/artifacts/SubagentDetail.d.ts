import type { DaemonSessionArtifact } from '@qwen-code/sdk/daemon';
import type { ACPToolCall, Message } from '../../adapters/types';
import type { TurnOutputOpenRequest } from './TurnOutputs';
export declare function findSubagentRootTool(messages: readonly Message[], rootToolCallId: string): ACPToolCall | undefined;
export declare function getSubagentPrompt(messages: readonly Message[], rootTool: ACPToolCall): string;
export declare function SubagentDetail({ sessionId, rootToolCallId, initialRootTool, workspaceCwd, onRightPanelOpen, onArtifactsChange, onError, }: {
    sessionId: string;
    rootToolCallId: string;
    initialRootTool: ACPToolCall;
    workspaceCwd?: string;
    onRightPanelOpen?: (request: TurnOutputOpenRequest) => void;
    onArtifactsChange?: (sessionId: string, artifacts: readonly DaemonSessionArtifact[]) => void;
    onError?: (error: unknown, fallback: string) => void;
}): import("react/jsx-runtime").JSX.Element;
