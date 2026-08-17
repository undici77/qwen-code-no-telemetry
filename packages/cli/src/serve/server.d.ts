/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application } from 'express';
import type { DaemonStatusProvider } from '@qwen-code/acp-bridge';
import type { DaemonLogger } from './daemon-logger.js';
import type { DaemonTrustPolicySnapshot } from '../config/daemon-trust-policy.js';
import type {
  DaemonMetricsBucket,
  DaemonPerfSnapshot,
  DaemonStartupSnapshot,
} from './daemon-status.js';
import type {
  ChannelWorkerSnapshot,
  ChannelWorkerSupervisor,
} from './channel-worker-supervisor.js';
import type { ChannelWorkerGroupSnapshot } from './channel-worker-group.js';
import type {
  ChannelWorkerControlState,
  ChannelWorkerSetResult,
  ChannelWorkerStopResult,
} from './channel-worker-manager.js';
import type {
  DeviceFlowProvider,
  DeviceFlowRegistry,
} from './auth/device-flow.js';
import { ClientMcpSenderRegistry } from './acp-http/client-mcp-sender-registry.js';
import { type AcpSessionBridge } from './acp-session-bridge.js';
import {
  type ServeAuthProviderInstallRequest,
  type ServeAuthProviderInstallResult,
  type ServeChannelSelection,
  type ChannelWebhookConfigSource,
  type ServeOptions,
} from './types.js';
import type { WorkspaceFileSystemFactory } from './fs/index.js';
import {
  type DaemonWorkspaceService,
  type DaemonWorkspaceServiceDeps,
} from './workspace-service/index.js';
import { type WorkspaceVoiceRouteDeps } from './routes/workspace-voice.js';
import { WorkspaceVoiceCoordinator } from './voice/workspace-voice-coordinator.js';
import { type TotalSessionAdmissionSnapshot } from './total-session-admission.js';
import {
  type WorkspaceRegistry,
  type WorkspaceRuntime,
  type WorkspaceRuntimeEnvMetadata,
} from './workspace-registry.js';
import {
  type ManagedScratchRoot,
  type WorkspaceRuntimeProvenance,
} from './managed-scratch-workspace.js';
import { type WorkspaceRuntimeRemovalController } from './routes/workspace-management.js';
import type { WorkspaceRegistrationStore } from './workspace-registration-store.js';
import type { ChannelManagementService } from './channel-management-service.js';
import type {
  ChannelDeliveryAccepted,
  ChannelDeliveryRequest,
} from '../runtime/channel-delivery-ipc.js';
import type { ChannelDeliveryAuthorizationStore } from './channel-delivery-authorization.js';
import { LiveHostCoordinator } from './live/live-host-coordinator.js';
import { LiveHostInstaller } from './live/live-host-installer.js';
import { LiveSessionCoordinator } from './live/live-session-coordinator.js';
import type { LiveConversationWorkspace } from './live/conversation-workspace.js';
import { type LiveProviderCredential } from './live/provider-credentials.js';
import type { ChildHeapPolicySnapshot } from '@qwen-code/acp-bridge/childHeapPolicy';
export {
  createDefaultFsAuditEmit,
  resolveBoundWorkspacesFromIdeEnv,
  resolveBridgeFsFactory,
} from './server/fs-factory.js';
export { PromptDeadlineExceededError } from './acp-session-bridge.js';
export { resolvePromptDeadlineMs } from './server/prompt-deadline.js';
export { detectFromLoopback } from './server/request-helpers.js';
export {
  InvalidCursorError,
  getWorkspaceSessionInfoForResponse,
  invalidateWorkspaceSessionListCache,
  listWorkspaceSessionsForResponse,
} from './server/session-list.js';
export type {
  ListWorkspaceSessionsOptions,
  ListWorkspaceSessionsReadOptions,
  ListWorkspaceSessionsResult,
  WorkspaceSessionInfoResult,
} from './server/session-list.js';
export { getActiveSseCount } from './routes/sse-events.js';
export interface ServeAppDeps {
  /** Bridge instance; tests inject a fake. Defaults to a fresh real one. */
  bridge?: AcpSessionBridge;
  /**
   * Enables resident management of scheduled-task-owned sessions: a periodic
   * keepalive (so their schedulers aren't idle-reaped) and a boot-time
   * rehydration (so they re-arm after a restart). Opt-in — only the real
   * long-running daemon (`runQwenServe`) sets it. Tests and direct embeds
   * leave it off so `createServeApp` neither spawns sessions on boot nor holds
   * a heartbeat timer.
   */
  manageScheduledTaskSessions?: boolean;
  /**
   * Directory of the built Web Shell SPA (`index.html` + `assets/`). When
   * set (and `opts.serveWebShell !== false`), `createServeApp` mounts the
   * UI at the daemon root before `bearerAuth`. Production `runQwenServe`
   * resolves this via `resolveWebShellDir()` and injects it here; direct
   * embeds / tests opt in by passing a fixture dir, so the default
   * `createServeApp` (no injection) stays API-only and existing route tests
   * are unaffected.
   */
  webShellDir?: string;
  /**
   * Qwen Code version advertised to web/SDK clients. Production passes the
   * resolved CLI package version; tests/direct embeds may omit it.
   */
  qwenCodeVersion?: string;
  /**
   * Pre-canonicalized workspace path. When supplied, `createServeApp`
   * skips its own `canonicalizeWorkspace` call (which would issue a
   * redundant `realpathSync.native` syscall — idempotent, but a hot
   * boot-time stat we can avoid). `runQwenServe` passes this after
   * its own boot-time canonicalize so the value used by
   * `/capabilities`, the `POST /session` cwd fallback, and the
   * bridge are all the SAME canonical form. Callers that haven't
   * canonicalized yet (tests, direct embeds) omit this and
   * `createServeApp` falls back to canonicalizing `opts.workspace ??
   * process.cwd()` itself.
   */
  boundWorkspace?: string;
  /**
   * Workspace filesystem boundary factory. When supplied, file routes
   * pull a per-request `WorkspaceFileSystem` off it; when omitted,
   * `createServeApp` builds a strict default (`trusted: false`,
   * warn-once no-op `emit`) so an upstream refactor that forgets to
   * inject `fsFactory` never silently allows writes against an
   * untrusted workspace.
   */
  fsFactory?: WorkspaceFileSystemFactory;
  /**
   * Device-flow auth registry. Tests inject a fake; production callers
   * omit this and `createServeApp` constructs a default wired to the
   * shipped Qwen provider, the bridge's `publishWorkspaceEvent`,
   * and a stderr audit sink.
   */
  deviceFlowRegistry?: DeviceFlowRegistry;
  maxExtensionOperationHistory?: number;
  /**
   * Extra device-flow providers for tests / future extensions.
   * Production builds register only `QwenOAuthDeviceFlowProvider`;
   * passing extra entries here registers them in addition.
   */
  deviceFlowProviders?: DeviceFlowProvider[];
  /**
   * Installs an LLM auth provider by applying the same provider install plan
   * used by interactive `/auth`. Production `runQwenServe` injects a
   * settings-backed implementation; tests/direct embeds may omit it, in which
   * case the route reports `not_implemented`.
   */
  installAuthProvider?: (
    req: ServeAuthProviderInstallRequest,
    assertGenerationOpen?: () => void,
  ) => Promise<ServeAuthProviderInstallResult>;
  /**
   * Optional daemon logger. When provided, `sendBridgeError` routes
   * each 5xx error through `daemonLog.error(...)` (which tees to stderr +
   * the daemon log file). When omitted, falls back to existing
   * stderr-only behavior.
   */
  daemonLog?: DaemonLogger;
  startup?: DaemonStartupSnapshot;
  getChannelWorkerSnapshot?: () => ChannelWorkerSnapshot;
  getChannelWorkerSnapshots?: () => ChannelWorkerGroupSnapshot[];
  getChannelWorkerControl?: () => ChannelWorkerControlState;
  isChannelControlDraining?: () => boolean;
  isChannelControlInitializing?: () => boolean;
  setChannelWorkerSelection?: (
    selection: ServeChannelSelection,
  ) => Promise<ChannelWorkerSetResult>;
  stopChannelWorker?: () => Promise<ChannelWorkerStopResult>;
  enqueueChannelWebhookTask?: ChannelWorkerSupervisor['enqueueWebhookTask'];
  deliverChannelMessage?: (
    workspaceCwd: string,
    request: ChannelDeliveryRequest,
  ) => Promise<ChannelDeliveryAccepted>;
  channelDeliveryAuthorizations?: ChannelDeliveryAuthorizationStore;
  channelWebhookConfigSources?: readonly ChannelWebhookConfigSource[];
  getChannelWebhookConfigSources?: () => readonly ChannelWebhookConfigSource[];
  getChannelWebhookConfigVersion?: () => number;
  registerChannelWebhookConfigRefresh?: (refresh: () => void) => void;
  /**
   * Stop and relaunch the daemon-managed channel worker so it re-reads
   * settings.json. Its presence mounts the compatibility reload route;
   * `channel_reload` is advertised only while the control state is enabled.
   */
  reloadChannelWorker?: () => Promise<ChannelWorkerSnapshot>;
  channelManagementService?: (
    runtime: WorkspaceRuntime,
  ) =>
    | ChannelManagementService
    | undefined
    | Promise<ChannelManagementService | undefined>;
  getPerfSnapshot?: () => DaemonPerfSnapshot;
  /** Rolling metrics series for the Daemon Status charts (oldest→newest). */
  getMetricsSeries?: () => DaemonMetricsBucket[];
  getTotalSessionAdmissionSnapshot?: () => TotalSessionAdmissionSnapshot;
  getChildHeapPolicySnapshot?: () => ChildHeapPolicySnapshot | undefined;
  /**
   * Sink fed one (durationMs, statusCode) per matched daemon HTTP request, so
   * the metrics ring can bucket request rate and latency for the charts.
   */
  recordDaemonRequest?: (durationMs: number, statusCode: number) => void;
  workspace?: DaemonWorkspaceService;
  statusProvider?: DaemonStatusProvider;
  persistDisabledTools?: (
    workspace: string,
    toolName: string,
    enabled: boolean,
  ) => Promise<void>;
  persistDisabledSkills?: DaemonWorkspaceServiceDeps['persistDisabledSkills'];
  persistDisabledSkillsBatch?: DaemonWorkspaceServiceDeps['persistDisabledSkillsBatch'];
  contextFilename?: string;
  persistSetting?: (
    workspace: string,
    scope: import('../config/settings.js').SettingScope,
    key: string,
    value: unknown,
    assertGenerationOpen?: () => void,
  ) => Promise<void | import('../config/settings.js').LoadedSettings>;
  persistSettings?: (
    workspace: string,
    writes: Array<{
      scope: import('../config/settings.js').SettingScope;
      key: string;
      value: unknown;
    }>,
    assertGenerationOpen?: () => void,
  ) => Promise<void>;
  sessionArtifactsPersistenceAvailable?: boolean;
  /**
   * Reverse tool channel (issue #5626, Phase 2). Shared sender registry that
   * bridges the daemon WS (per-connection `ClientMcpRegistrar`) and the ACP
   * child's `client_mcp/message` ext-method. `runQwenServe` constructs ONE and
   * passes the SAME instance here AND to its `createAcpSessionBridge` call (as
   * `clientMcpSender: registry.lookup`) so the bridge that answers the child
   * and the WS provider that registers senders agree. When omitted (the
   * standalone `createServeApp` path with no injected bridge), `createServeApp`
   * builds its own registry and wires it into the bridge it creates.
   */
  clientMcpSenderRegistry?: ClientMcpSenderRegistry;
  workspaceRegistry?: WorkspaceRegistry;
  /**
   * Returns every bridge generation that is still alive, including draining
   * generations no longer exposed by the workspace registry.
   */
  getSessionBridges?: () => readonly AcpSessionBridge[];
  workspaceTrustHotReloadAvailable?: boolean;
  getWorkspaceTrustPolicySnapshot?: () =>
    | DaemonTrustPolicySnapshot
    | Promise<DaemonTrustPolicySnapshot>;
  createWorkspaceRuntime?: (
    cwd: string,
    options: {
      provenance: WorkspaceRuntimeProvenance;
    },
  ) => Promise<WorkspaceRuntime>;
  managedScratchRoot?: ManagedScratchRoot;
  validateWorkspaceRuntimeForPublication?: (
    runtime: WorkspaceRuntime,
  ) => Promise<WorkspaceRuntime>;
  runWorkspaceTrustOperation?: <T>(operation: () => Promise<T>) => Promise<T>;
  workspaceRegistrationStore?: WorkspaceRegistrationStore;
  workspaceRuntimeRemoval?: WorkspaceRuntimeRemovalController;
  primaryWorkspaceTrusted?: boolean;
  primaryRuntimeEnv?: WorkspaceRuntimeEnvMetadata;
  daemonEnv?: Readonly<NodeJS.ProcessEnv>;
  runtimePlatform?: NodeJS.Platform;
  voiceTranscriber?: WorkspaceVoiceRouteDeps['transcribe'];
  voiceCoordinator?: WorkspaceVoiceCoordinator;
  liveCoordinator?: LiveHostCoordinator;
  liveHostInstaller?: LiveHostInstaller;
  liveSessionCoordinator?: LiveSessionCoordinator;
  liveConversationWorkspace?: LiveConversationWorkspace;
  validateLiveProviderCredential?: (
    credential: LiveProviderCredential,
  ) => Promise<void>;
}
/**
 * Sizes the keepalive heartbeat interval so a resident task session is beaten
 * BEFORE the idle reaper closes it. Targets a third of the reaper window, but
 * never exceeds HALF of it — so at least one heartbeat lands in time even for a
 * small custom timeout, where the 30s floor would otherwise overshoot the whole
 * window and let the session be reaped before the first beat. When the reaper is
 * disabled (idle timeout ≤ 0) sessions are never reaped, so heartbeats aren't
 * needed — the loop still runs (to revive re-enabled bound sessions) but at the
 * relaxed max cadence.
 */
export declare function computeKeepaliveIntervalMs(
  idleTimeoutMs: number,
): number;
export declare function createServeApp(
  opts: ServeOptions,
  getPort?: () => number,
  deps?: ServeAppDeps,
): Application;
