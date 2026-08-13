import type { DaemonSessionArtifact } from '@qwen-code/sdk/daemon';
export interface SessionArtifactsState {
    artifacts: DaemonSessionArtifact[];
    artifactById: ReadonlyMap<string, DaemonSessionArtifact>;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}
export declare function useSessionArtifacts(): SessionArtifactsState;
