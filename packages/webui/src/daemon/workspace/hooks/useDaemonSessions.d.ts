/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  DaemonSessionArchiveState,
  DaemonSessionExportFormat,
} from '@qwen-code/sdk/daemon';
import type { DaemonResourceOptions } from '../types.js';
export interface DaemonSessionsOptions extends DaemonResourceOptions {
  pageSize?: number;
  cursor?: string;
  /** Which session directory to list. Defaults to the daemon's `active`. */
  archiveState?: DaemonSessionArchiveState;
  view?: 'organized';
  group?: string;
  sourceType?: string;
}
export declare function useDaemonSessions(options?: DaemonSessionsOptions): {
  data: import('@qwen-code/sdk/daemon').DaemonSessionSummary[] | undefined;
  reload: () => Promise<
    import('@qwen-code/sdk/daemon').DaemonSessionSummary[] | undefined
  >;
  sessions: import('@qwen-code/sdk/daemon').DaemonSessionSummary[];
  nextCursor: string | undefined;
  liveMergeFailed: boolean;
  truncated: boolean;
  loadSession:
    | ((
        sessionId: string,
        options?: {
          workspaceCwd?: string;
        },
      ) => Promise<void>)
    | undefined;
  resumeSession:
    | ((
        sessionId: string,
        options?: {
          workspaceCwd?: string;
        },
      ) => Promise<void>)
    | undefined;
  newSession: (() => Promise<void>) | undefined;
  releaseSession: ((sessionId: string) => Promise<void>) | undefined;
  deleteSession: (sessionId: string) => Promise<boolean>;
  deleteSessions: (sessionIds: string[]) => Promise<{
    removed: string[];
    notFound: string[];
    errors: Array<{
      sessionId: string;
      error: string;
    }>;
  }>;
  exportSession: (
    sessionId: string,
    format?: DaemonSessionExportFormat,
  ) => Promise<import('@qwen-code/sdk/daemon').DaemonSessionExportResult>;
  archiveSession: (sessionId: string) => Promise<boolean>;
  unarchiveSession: (sessionId: string) => Promise<boolean>;
  loading: boolean;
  error: Error | undefined;
};
