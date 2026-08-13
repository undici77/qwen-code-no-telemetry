import type { DaemonSessionArchiveState } from '@qwen-code/sdk/daemon';
interface ScopedSessionsOptions {
    autoLoad?: boolean;
    enabled?: boolean;
    maxAgeMs?: number;
    pageSize?: number;
    archiveState?: DaemonSessionArchiveState;
    view?: 'organized';
    group?: string;
    pollIntervalMs?: number;
}
export declare function useScopedSessions(workspaceCwd: string | undefined, options?: ScopedSessionsOptions): any;
export {};
