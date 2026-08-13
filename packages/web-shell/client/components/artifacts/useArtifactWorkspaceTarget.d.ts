import type { DaemonCapabilities } from '@qwen-code/sdk/daemon';
import { type DaemonWorkspaceActions } from '@qwen-code/webui/daemon-react-sdk';
export type ArtifactWorkspaceActions = Pick<DaemonWorkspaceActions, 'readWorkspaceFile' | 'readFileBytes' | 'stat' | 'listScheduledTasks' | 'updateScheduledTask' | 'deleteScheduledTask'>;
interface ArtifactWorkspaceOwner {
    cwd: string;
    id?: string;
    primary: boolean;
}
export interface ArtifactWorkspaceTarget {
    workspaceCwd: string;
    workspaceId?: string;
    actions: ArtifactWorkspaceActions;
}
export declare function resolveArtifactWorkspaceOwner(capabilities: DaemonCapabilities | undefined, workspaceCwd: string | undefined): ArtifactWorkspaceOwner | undefined;
export declare function useArtifactWorkspaceTarget(workspaceCwd: string | undefined): ArtifactWorkspaceTarget | undefined;
export {};
