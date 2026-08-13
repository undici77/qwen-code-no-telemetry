import type { DaemonClient, DaemonSessionArchiveState } from '@qwen-code/sdk/daemon';
import { type SessionCatalogQuery, type SessionCatalogSnapshot } from './session-catalog-store';
interface SessionCatalogHookOptions {
    autoLoad?: boolean;
    enabled?: boolean;
    maxAgeMs?: number;
    pollIntervalMs?: number;
}
export interface WebShellSessionsOptions extends SessionCatalogHookOptions {
    pageSize?: number;
    cursor?: string;
    archiveState?: DaemonSessionArchiveState;
    view?: 'organized';
    group?: string;
    sourceType?: string;
    sourceId?: string;
    parentSessionId?: string;
}
export declare function useSessionCatalogQuery(client: DaemonClient, query: SessionCatalogQuery | undefined, options?: SessionCatalogHookOptions): any;
export declare function useSessionCatalogQueries(client: DaemonClient, queries: readonly SessionCatalogQuery[], options?: SessionCatalogHookOptions): readonly SessionCatalogSnapshot[];
export declare function useSessionCatalogPolling(client: DaemonClient, query: SessionCatalogQuery | undefined, pollIntervalMs: number | undefined): void;
export declare function useSessionCatalogController(client: DaemonClient): {
    refreshQueries(queries: readonly SessionCatalogQuery[]): void;
    invalidateWorkspace(workspaceCwd: string): void;
    sessionCreated(workspaceCwd: string, _sessionId: string): void;
    promptAdmitted(workspaceCwd: string, sessionId: string): void;
    promptAdmissionUncertain(workspaceCwd: string): void;
    renamed(workspaceCwd: string, sessionId: string, displayName: string): void;
    turnCompleted(workspaceCwd: string): void;
};
export declare function useWebShellSessions(options?: WebShellSessionsOptions): {
    data: any;
    sessions: any;
    loading: any;
    error: any;
    reload: () => Promise<any>;
    nextCursor: any;
    liveMergeFailed: boolean;
    truncated: boolean;
    loadSession: any;
    resumeSession: any;
    newSession: any;
    releaseSession: ((sessionId: string) => Promise<any>) | undefined;
    releaseSessionAction: any;
    deleteSession: (sessionId: string) => Promise<any>;
    deleteSessions: (sessionIds: string[]) => Promise<any>;
    exportSession: any;
    archiveSession: (sessionId: string) => Promise<any>;
    unarchiveSession: (sessionId: string) => Promise<any>;
    catalogQuery: any;
};
export {};
