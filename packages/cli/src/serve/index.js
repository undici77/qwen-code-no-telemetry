/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export { createServeApp } from './server.js';
export { runQwenServe, } from './run-qwen-serve.js';
export { CAPABILITIES_SCHEMA_VERSION, STAGE1_FEATURES, } from './types.js';
export { CONDITIONAL_SERVE_FEATURES, SERVE_CAPABILITY_REGISTRY, SERVE_FEATURES, SERVE_PROTOCOL_VERSION, SUPPORTED_SERVE_PROTOCOL_VERSIONS, getAdvertisedServeFeatures, getRegisteredServeFeatures, getServeFeatures, getServeProtocolVersions, } from './capabilities.js';
export { ACP_PREFLIGHT_KINDS, BridgeTimeoutError, SessionRestoreTimeoutError, SERVE_CONTROL_EXT_METHODS, SERVE_ERROR_KINDS, SERVE_STATUS_EXT_METHODS, STATUS_SCHEMA_VERSION, createIdleAcpPreflightCells, createIdleWorkspaceExtensionsStatus, createIdleWorkspaceHooksStatus, createIdleWorkspaceMcpStatus, createIdleWorkspaceProvidersStatus, createIdleWorkspaceSkillsStatus, IDLE_HOOK_EVENTS, mapDomainErrorToErrorKind, } from '@qwen-code/acp-bridge/status';
export { ENV_NONSECRET_VARS, ENV_PROXY_VARS, ENV_SECRET_VARS, buildEnvStatusFromProcess, } from './env-snapshot.js';
export { bearerAuth, createMutationGate, denyBrowserOriginCors, hostAllowlist, } from './auth.js';
export { createAcpSessionBridge, createHttpAcpBridge, defaultSpawnChannelFactory, 
// #4297 fold-in 1 (16:32:44-round S2): export every typed error
// class that `sendBridgeError` matches via `instanceof`. External
// embeds that want to recognize these errors (parallel to how
// they already match `WorkspaceInitConflictError` /
// `SessionNotFoundError`) need them on the public barrel; without
// this they have to deep-import `./acp-session-bridge.js`.
McpServerNotFoundError, McpServerRestartFailedError, SessionNotFoundError, SessionShellClientRequiredError, SessionShellDisabledError, WorkspaceInitConflictError, WorkspaceInitPathEscapeError, WorkspaceInitSymlinkError, WorkspaceInitRaceError, } from './acp-session-bridge.js';
export { EventBus, EVENT_SCHEMA_VERSION, } from '@qwen-code/acp-bridge/eventBus';
export { createInMemoryChannel } from '@qwen-code/acp-bridge/inMemoryChannel';
//# sourceMappingURL=index.js.map