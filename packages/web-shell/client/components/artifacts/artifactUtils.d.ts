import type { DaemonSessionArtifact, DaemonWorkspaceFileBytes } from '@qwen-code/sdk/daemon';
import type { DaemonWorkspaceActions } from '@qwen-code/webui/daemon-react-sdk';
export declare function artifactKindLabel(kind: string): string;
export declare function getArtifactTypeLabel(artifact: DaemonSessionArtifact): string;
export declare function formatArtifactSize(sizeBytes: number | undefined): string;
export declare function getArtifactImageMimeType(artifact: DaemonSessionArtifact): string | undefined;
export declare function getImageMimeTypeFromPath(path: string): string | undefined;
export declare function getReviewDownloadMimeType(value: string): string;
export declare function readWorkspaceFileAsBlob(readFileBytes: (filePath: string, opts?: {
    offset?: number;
    maxBytes?: number;
}) => Promise<Pick<DaemonWorkspaceFileBytes, 'contentBase64' | 'offset' | 'returnedBytes' | 'sizeBytes'>>, filePath: string, mimeType: string, options: {
    statFile: (filePath: string) => Promise<{
        sizeBytes: number;
        modifiedMs: number;
    }>;
    isCancelled?: () => boolean;
    maxBytes?: number;
}): Promise<Blob>;
export declare function downloadWorkspaceFile(workspaceActions: Pick<DaemonWorkspaceActions, 'readFileBytes' | 'stat'>, workspacePath: string, mimeType?: string, isCancelled?: () => boolean): Promise<void>;
export declare function getArtifactLocation(artifact: DaemonSessionArtifact): string;
export declare function normalizePath(value: string | undefined): string;
export declare function stripWorkspacePath(path: string, workspaceCwd?: string): string;
export declare function isSamePath(left: string | undefined, right: string | undefined, workspaceCwd?: string): boolean;
export declare function withArtifactPreviewCsp(html: string): string;
