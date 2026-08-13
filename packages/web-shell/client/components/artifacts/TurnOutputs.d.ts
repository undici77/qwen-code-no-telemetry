import type { DaemonSessionArtifact } from '@qwen-code/sdk/daemon';
import type { ACPToolCall } from '../../adapters/types';
import { type LucideIcon } from 'lucide-react';
export interface TurnOutputFileChange {
    path: string;
    status: 'created' | 'modified';
    toolCallId: string;
    isArtifact: boolean;
    additions?: number;
    deletions?: number;
    diffs: TurnOutputFileDiff[];
}
export interface TurnOutputFileDiff {
    oldText: string;
    newText: string;
    fileDiff?: string;
    fullContent?: boolean;
}
export interface TurnOutputScheduledTask {
    id: string;
    toolCallId: string;
    title: string;
    cron: string;
    prompt: string;
    recurring: boolean;
    durable: boolean;
    workspaceId?: string;
    display?: string;
}
export type TurnOutputKind = 'file' | 'artifact' | 'scheduled_task';
export declare const TURN_OUTPUT_KINDS: readonly TurnOutputKind[];
export type TurnOutputOpenRequest = ({
    id: 'review';
    kind: 'review';
    title: string;
    turnId: string;
    changes: readonly TurnOutputFileChange[];
    selectedPath?: string;
    workspaceCwd?: string;
    workspaceId?: string;
} | {
    id: 'image';
    kind: 'image';
    title: string;
    turnId: string;
    src: string;
    alt?: string;
} | {
    id: string;
    kind: 'artifact';
    title: string;
    turnId: string;
    artifactId: string;
    managedId?: string;
    artifact: DaemonSessionArtifact;
    workspaceCwd?: string;
    workspaceId?: string;
    previewContent?: string;
} | {
    id: string;
    kind: 'scheduled_task';
    title: string;
    turnId: string;
    task: TurnOutputScheduledTask;
    workspaceCwd?: string;
    workspaceId?: string;
} | {
    id: string;
    kind: 'subagent';
    title: string;
    turnId: string;
    tool: ACPToolCall;
    sessionId: string;
    workspaceCwd?: string;
}) & {
    /** Session whose transcript produced this output. */
    sourceSessionId?: string;
};
interface TurnOutputsProps {
    turnId: string;
    changes: readonly TurnOutputFileChange[];
    artifacts: readonly DaemonSessionArtifact[];
    scheduledTasks: readonly TurnOutputScheduledTask[];
    workspaceCwd?: string;
    onOpenRequest?: (request: TurnOutputOpenRequest) => void;
    onReviewChanges: (changes: readonly TurnOutputFileChange[], selectedPath?: string) => void;
    onOpenArtifact: (artifactId: string, previewContent?: string) => void;
    onOpenScheduledTask: (task: TurnOutputScheduledTask) => void;
    onError?: (error: unknown, fallback: string) => void;
}
declare function TurnOutputsComponent({ turnId, changes, artifacts, scheduledTasks, workspaceCwd, onOpenRequest, onReviewChanges, onOpenArtifact, onOpenScheduledTask, onError, }: TurnOutputsProps): import("react/jsx-runtime").JSX.Element | null;
export declare function getArtifactFormatIcon(kind: string): LucideIcon | undefined;
export declare const TurnOutputs: import("react").MemoExoticComponent<typeof TurnOutputsComponent>;
export declare function getArtifactPreviewContent(artifact: DaemonSessionArtifact, changes: readonly TurnOutputFileChange[], workspaceCwd?: string): string | undefined;
export declare function getFileChangePreviewContent(change: TurnOutputFileChange): string | undefined;
export declare function isRenderedFilePath(value: string): boolean;
export declare function isDownloadableReviewFilePath(value: string): boolean;
export declare function displayPath(path: string, workspaceCwd?: string): any;
export {};
