import { type WebShellAssistantTurnFooterRenderInfo } from '../../customization';
import type { DaemonSessionGenerationEvent } from '@qwen-code/sdk/daemon';
interface AssistantMessageProps {
    content: string;
    isStreaming?: boolean;
    timestamp?: number;
    onBranchSession?: () => void;
    showFooterActions?: boolean;
    showBranchAction?: boolean;
    isLocateFlashing?: boolean;
    customFooterInfo?: WebShellAssistantTurnFooterRenderInfo;
}
export declare const AssistantMessage: import("react").NamedExoticComponent<AssistantMessageProps>;
interface ThinkingMessageProps {
    messageId: string;
    content: string;
    isStreaming?: boolean;
    timestamp?: number;
    isLocateFlashing?: boolean;
    generateContent?: SessionContentGenerator;
}
export type SessionContentGenerator = (prompt: string, opts?: {
    signal?: AbortSignal;
}) => AsyncGenerator<DaemonSessionGenerationEvent>;
export declare const ThinkingMessage: import("react").NamedExoticComponent<ThinkingMessageProps>;
export declare function getThinkingSummaryKey({ isStreaming, durationMs, }: {
    isStreaming?: boolean;
    durationMs?: number;
}): 'thinking.running' | 'thinking.done' | 'thinking.doneBriefly';
export declare function formatThinkingDuration(ms: number): string;
export {};
