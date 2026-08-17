import type {
  DaemonClient,
  DaemonSessionListPage,
  DaemonSessionListPageOptions,
  DaemonSessionSummary,
} from '@qwen-code/sdk/daemon';
export type SessionCatalogRouteKind = 'legacy' | 'qualified';
export interface SessionCatalogQuery {
  routeKind: SessionCatalogRouteKind;
  workspaceCwd: string;
  options: DaemonSessionListPageOptions;
}
export interface SessionCatalogSnapshot {
  page?: DaemonSessionListPage;
  loading: boolean;
  stale: boolean;
  error?: Error;
  updatedAt?: number;
}
export interface SessionCatalogSubscriptionOptions {
  autoLoad?: boolean;
  maxAgeMs?: number;
  pollIntervalMs?: number;
}
export declare const SESSION_CATALOG_ERROR_RETRY_MS = 30000;
export declare const SESSION_CATALOG_RETENTION_MS = 30000;
export declare const SESSION_CATALOG_TRAILING_REFRESH_MS = 2000;
export declare function getSessionCatalogQueryKey(
  query: SessionCatalogQuery,
): string;
export declare class SessionCatalogStore {
  private readonly client;
  private readonly entries;
  private readonly queue;
  private readonly trailingRefreshTimers;
  private activeRequests;
  private activeBackgroundRequests;
  private queueSequence;
  private visibilityListening;
  constructor(client: DaemonClient);
  getSnapshot(query: SessionCatalogQuery): SessionCatalogSnapshot;
  getEmptySnapshot(): SessionCatalogSnapshot;
  subscribe(
    query: SessionCatalogQuery,
    listener: () => void,
    options?: SessionCatalogSubscriptionOptions,
  ): () => void;
  refresh(query: SessionCatalogQuery): Promise<DaemonSessionListPage>;
  loadOnce(
    query: SessionCatalogQuery,
    options?: {
      fresh?: boolean;
    },
  ): Promise<DaemonSessionListPage>;
  invalidateWorkspace(
    workspaceCwd: string,
    options?: {
      background?: boolean;
    },
  ): void;
  patchSession(
    workspaceCwd: string,
    sessionId: string,
    patch: Partial<Omit<DaemonSessionSummary, 'sessionId' | 'workspaceCwd'>>,
  ): void;
  scheduleWorkspaceRefresh(workspaceCwd: string, delayMs?: number): void;
  dispose(): void;
  private getOrCreateEntry;
  private requestFresh;
  private createWaiter;
  private requestBackground;
  private ensureScheduled;
  private sortQueue;
  private drainQueue;
  private startJob;
  private fetchPage;
  private resolveWaiters;
  private rejectWaiters;
  private setSnapshot;
  private resetPollSchedule;
  private schedulePollFromNow;
  private scheduleEntryTimer;
  private clearPollTimer;
  private removeQueuedJob;
  private scheduleCleanup;
  private isHidden;
  private updateVisibilityListener;
  private removeVisibilityListener;
  private readonly onVisibilityChange;
}
export declare function getSessionCatalogStore(
  client: DaemonClient,
): SessionCatalogStore;
export declare function loadSessionCatalogOnce(
  client: DaemonClient,
  query: SessionCatalogQuery,
  options?: {
    fresh?: boolean;
  },
): Promise<DaemonSessionListPage>;
