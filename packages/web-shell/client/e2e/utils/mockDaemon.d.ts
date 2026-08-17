import type { Page } from '@playwright/test';
import {
  type DaemonCapabilities,
  type DaemonChannelsSnapshot,
  type DaemonChannelPairingRequest,
  type DaemonChannelTypeCatalog,
  type DaemonEvent,
  type DaemonSessionArtifact,
  type DaemonSessionGroup,
  type DaemonSessionState,
  type DaemonSessionSummary,
  type DaemonWorkspaceExtensionsStatus,
  type DaemonGitHubPullRequestList,
  type DaemonWorkspaceGitStatus,
  type DaemonWorkspaceProvidersStatus,
  type DaemonWorkspaceSettingsStatus,
  type DaemonWorkspaceSkillsStatus,
  type DaemonWorkspaceVoiceStatus,
  type ExtensionActiveOperations,
  type ExtensionUpdateCheckResponse,
} from '@qwen-code/sdk/daemon';
import { type SseTransport } from './sseTransport';
export interface DaemonRequestRecord {
  method: string;
  path: string;
  body: unknown;
  headers: Record<string, string>;
}
export interface WebShellDaemonScenario {
  workspaceCwd: string;
  sessionId: string;
  clientId: string;
  displayName: string;
  currentModel: string;
  currentMode: string;
  capabilities: DaemonCapabilities;
  providers: DaemonWorkspaceProvidersStatus;
  skills: DaemonWorkspaceSkillsStatus;
  settings: DaemonWorkspaceSettingsStatus;
  voice: DaemonWorkspaceVoiceStatus;
  extensions: DaemonWorkspaceExtensionsStatus;
  extensionOperations: ExtensionActiveOperations;
  extensionUpdateCheck: ExtensionUpdateCheckResponse;
  channelTypes: DaemonChannelTypeCatalog;
  channels: DaemonChannelsSnapshot;
  pairingRequests: Record<string, DaemonChannelPairingRequest[]>;
  pairingApprovals: Record<string, string[]>;
  pairingGroupApprovals: Record<string, string[]>;
  sessions: DaemonSessionSummary[];
  sessionGroups: DaemonSessionGroup[];
  events: DaemonEvent[];
  state: DaemonSessionState;
  /** Artifact list returned by `GET /session/:id/artifacts`. */
  artifacts: DaemonSessionArtifact[];
  /** File contents served by `GET /file?path=...`, keyed by requested path. */
  workspaceFiles: Record<string, string>;
  /**
   * Response for `GET /workspaces/:cwd/git`. Defaults to a null-branch status
   * (non-git workspace), matching the real daemon's graceful degradation.
   */
  gitStatus?: DaemonWorkspaceGitStatus;
  /**
   * Response for `GET /workspaces/:cwd/github/prs`. Defaults to an available,
   * empty pull-request list.
   */
  gitHubPrs?: DaemonGitHubPullRequestList;
  /** Response for `GET /workspaces/:cwd/git/branches`. */
  gitBranches?: unknown;
  /** Response for `GET /workspaces/:cwd/git/diff`. */
  gitDiff?: unknown;
  /** Response for `GET /workspaces/:cwd/git/log`. */
  gitLog?: unknown;
  /** Response for `POST /session/:id/btw`. */
  btwAnswer?: string;
}
export interface MockDaemonController {
  scenario: WebShellDaemonScenario;
  sse: SseTransport<DaemonEvent>;
  requests: readonly DaemonRequestRecord[];
  sendEvent(event: DaemonEvent): Promise<void>;
  burstEvents(events: readonly DaemonEvent[]): Promise<void>;
  promptRequests(): DaemonRequestRecord[];
  permissionRequests(): DaemonRequestRecord[];
  modelRequests(): DaemonRequestRecord[];
  configOptionRequests(): DaemonRequestRecord[];
}
type ScenarioOverrides = Partial<
  Omit<
    WebShellDaemonScenario,
    | 'capabilities'
    | 'providers'
    | 'skills'
    | 'settings'
    | 'voice'
    | 'extensions'
    | 'extensionOperations'
    | 'extensionUpdateCheck'
    | 'channelTypes'
    | 'channels'
    | 'pairingRequests'
    | 'pairingApprovals'
    | 'pairingGroupApprovals'
    | 'sessions'
    | 'sessionGroups'
    | 'state'
  >
> & {
  capabilities?: Partial<DaemonCapabilities>;
  providers?: Partial<DaemonWorkspaceProvidersStatus>;
  skills?: Partial<DaemonWorkspaceSkillsStatus>;
  settings?: Partial<DaemonWorkspaceSettingsStatus>;
  voice?: Partial<DaemonWorkspaceVoiceStatus>;
  extensions?: Partial<DaemonWorkspaceExtensionsStatus>;
  extensionOperations?: Partial<ExtensionActiveOperations>;
  extensionUpdateCheck?: Partial<ExtensionUpdateCheckResponse>;
  channelTypes?: DaemonChannelTypeCatalog;
  channels?: DaemonChannelsSnapshot;
  pairingRequests?: Record<string, DaemonChannelPairingRequest[]>;
  pairingApprovals?: Record<string, string[]>;
  pairingGroupApprovals?: Record<string, string[]>;
  sessions?: DaemonSessionSummary[];
  sessionGroups?: DaemonSessionGroup[];
  state?: Partial<DaemonSessionState>;
};
export declare function applyScenarioCurrentModel(
  scenario: WebShellDaemonScenario,
  modelId: string,
): void;
export declare function createWebShellDaemonScenario(
  overrides?: ScenarioOverrides,
): WebShellDaemonScenario;
export declare function installMockDaemon(
  page: Page,
  scenario: WebShellDaemonScenario,
  options?: {
    baseURL?: string;
  },
): Promise<MockDaemonController>;
export declare function userTextEvent(
  text: string,
  options?: {
    id?: number;
    sessionId?: string;
  },
): DaemonEvent;
export declare function assistantTextEvent(
  text: string,
  options?: {
    id?: number;
    sessionId?: string;
  },
): DaemonEvent;
export declare function turnCompleteEvent(
  promptId: string,
  options?: {
    id?: number;
    sessionId?: string;
  },
): DaemonEvent;
export declare function replayCompleteEvent(options?: {
  replayedCount?: number;
  sessionId?: string;
}): DaemonEvent;
export declare function permissionRequestEvent(
  requestId: string,
  options?: {
    id?: number;
    sessionId?: string;
  },
): DaemonEvent;
export {};
