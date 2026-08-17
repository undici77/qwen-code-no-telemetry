/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const SERVE_PROTOCOL_VERSION: 'v1';
export declare const SUPPORTED_SERVE_PROTOCOL_VERSIONS: readonly ['v1'];
export type ServeProtocolVersion =
  (typeof SUPPORTED_SERVE_PROTOCOL_VERSIONS)[number];
export interface ServeProtocolVersions {
  current: ServeProtocolVersion;
  supported: ServeProtocolVersion[];
}
export interface ServeCapabilityDescriptor {
  since: ServeProtocolVersion;
  /**
   * Sub-mode names supported by this capability, when the feature has
   * more than one operating mode and clients benefit from feature-
   * detecting the active set. Optional — baseline tags (always-on,
   * single behavior) omit this field.
   */
  modes?: readonly string[];
}
export declare const SERVE_CAPABILITY_REGISTRY: {
  readonly health: {
    readonly since: 'v1';
  };
  readonly daemon_status: {
    readonly since: 'v1';
  };
  readonly capabilities: {
    readonly since: 'v1';
  };
  readonly session_create: {
    readonly since: 'v1';
  };
  readonly session_id_override: {
    readonly since: 'v1';
  };
  readonly session_scope_override: {
    readonly since: 'v1';
  };
  readonly session_load: {
    readonly since: 'v1';
  };
  readonly session_resume: {
    readonly since: 'v1';
  };
  readonly unstable_session_resume: {
    readonly since: 'v1';
  };
  readonly session_list: {
    readonly since: 'v1';
  };
  readonly session_info: {
    readonly since: 'v1';
  };
  readonly session_source_metadata: {
    readonly since: 'v1';
  };
  readonly session_side_task: {
    readonly since: 'v1';
  };
  readonly session_prompt: {
    readonly since: 'v1';
  };
  readonly session_mid_turn_message_mutation: {
    readonly since: 'v1';
  };
  readonly session_mid_turn_message_query: {
    readonly since: 'v1';
  };
  readonly session_cancel: {
    readonly since: 'v1';
  };
  readonly session_events: {
    readonly since: 'v1';
  };
  readonly session_artifacts: {
    readonly since: 'v1';
  };
  readonly session_artifacts_persistence: {
    readonly since: 'v1';
  };
  readonly slow_client_warning: {
    readonly since: 'v1';
  };
  readonly typed_event_schema: {
    readonly since: 'v1';
  };
  readonly session_set_model: {
    readonly since: 'v1';
  };
  readonly client_identity: {
    readonly since: 'v1';
  };
  readonly client_heartbeat: {
    readonly since: 'v1';
  };
  readonly session_permission_vote: {
    readonly since: 'v1';
  };
  readonly permission_vote: {
    readonly since: 'v1';
  };
  readonly workspace_mcp: {
    readonly since: 'v1';
  };
  readonly workspace_skills: {
    readonly since: 'v1';
  };
  readonly workspace_providers: {
    readonly since: 'v1';
  };
  readonly workspace_acp_preheat: {
    readonly since: 'v1';
  };
  readonly workspace_acp_status: {
    readonly since: 'v1';
  };
  readonly auth_provider_install: {
    readonly since: 'v1';
  };
  readonly workspace_memory: {
    readonly since: 'v1';
  };
  readonly workspace_memory_remember: {
    readonly since: 'v1';
    readonly modes: readonly ['workspace', 'clean'];
  };
  readonly workspace_memory_forget: {
    readonly since: 'v1';
  };
  readonly workspace_memory_dream: {
    readonly since: 'v1';
  };
  readonly workspace_agents: {
    readonly since: 'v1';
  };
  readonly workspace_agent_generate: {
    readonly since: 'v1';
  };
  readonly workspace_env: {
    readonly since: 'v1';
  };
  readonly workspace_preflight: {
    readonly since: 'v1';
  };
  readonly session_context: {
    readonly since: 'v1';
  };
  readonly session_context_usage: {
    readonly since: 'v1';
  };
  readonly session_supported_commands: {
    readonly since: 'v1';
  };
  readonly session_tasks: {
    readonly since: 'v1';
  };
  readonly session_monitor_tool_correlation: {
    readonly since: 'v1';
  };
  readonly session_stats: {
    readonly since: 'v1';
  };
  readonly session_lsp: {
    readonly since: 'v1';
  };
  readonly session_status: {
    readonly since: 'v1';
  };
  readonly session_close: {
    readonly since: 'v1';
  };
  readonly session_archive: {
    readonly since: 'v1';
  };
  readonly session_metadata: {
    readonly since: 'v1';
  };
  readonly session_organization: {
    readonly since: 'v1';
  };
  readonly session_export: {
    readonly since: 'v1';
  };
  readonly session_transcript: {
    readonly since: 'v1';
  };
  readonly session_transcript_pagination: {
    readonly since: 'v1';
  };
  readonly mcp_guardrails: {
    readonly since: 'v1';
    readonly modes: readonly ['warn', 'enforce'];
  };
  readonly workspace_mcp_manage: {
    readonly since: 'v1';
  };
  readonly mcp_guardrail_events: {
    readonly since: 'v1';
  };
  readonly external_tool_guard: {
    readonly since: 'v1';
    readonly modes: readonly ['required'];
  };
  readonly mcp_server_runtime_mutation: {
    readonly since: 'v1';
  };
  readonly workspace_file_read: {
    readonly since: 'v1';
  };
  readonly workspace_file_bytes: {
    readonly since: 'v1';
  };
  readonly workspace_file_read_cursor: {
    readonly since: 'v1';
  };
  readonly workspace_file_write: {
    readonly since: 'v1';
  };
  readonly workspace_file_upload: {
    readonly since: 'v1';
  };
  readonly session_approval_mode_control: {
    readonly since: 'v1';
  };
  readonly workspace_tool_toggle: {
    readonly since: 'v1';
  };
  readonly workspace_skill_toggle: {
    readonly since: 'v1';
  };
  readonly workspace_skill_batch_toggle: {
    readonly since: 'v1';
  };
  readonly workspace_skill_manage: {
    readonly since: 'v1';
  };
  readonly workspace_settings: {
    readonly since: 'v1';
  };
  readonly workspace_permissions: {
    readonly since: 'v1';
  };
  readonly workspace_voice: {
    readonly since: 'v1';
  };
  readonly workspace_voice_transcription: {
    readonly since: 'v1';
    readonly modes: readonly ['batch'];
  };
  readonly workspace_trust: {
    readonly since: 'v1';
  };
  readonly workspace_trust_hot_reload: {
    readonly since: 'v1';
  };
  readonly workspace_init: {
    readonly since: 'v1';
  };
  readonly workspace_github_setup: {
    readonly since: 'v1';
  };
  readonly workspace_github_prs: {
    readonly since: 'v1';
  };
  readonly workspace_mcp_restart: {
    readonly since: 'v1';
  };
  readonly session_recap: {
    readonly since: 'v1';
  };
  readonly session_generation: {
    readonly since: 'v1';
  };
  readonly workspace_generation: {
    readonly since: 'v1';
  };
  readonly session_btw: {
    readonly since: 'v1';
  };
  readonly session_shell_command: {
    readonly since: 'v1';
  };
  readonly mcp_workspace_pool: {
    readonly since: 'v1';
  };
  readonly mcp_pool_restart: {
    readonly since: 'v1';
  };
  readonly require_auth: {
    readonly since: 'v1';
  };
  readonly allow_origin: {
    readonly since: 'v1';
  };
  readonly auth_device_flow: {
    readonly since: 'v1';
  };
  readonly permission_mediation: {
    readonly since: 'v1';
    readonly modes: readonly [
      'first-responder',
      'designated',
      'consensus',
      'local-only',
    ];
  };
  readonly prompt_absolute_deadline: {
    readonly since: 'v1';
  };
  readonly writer_idle_timeout: {
    readonly since: 'v1';
  };
  readonly non_blocking_prompt: {
    readonly since: 'v1';
  };
  readonly session_language: {
    readonly since: 'v1';
  };
  readonly session_rewind: {
    readonly since: 'v1';
  };
  readonly workspace_hooks: {
    readonly since: 'v1';
  };
  readonly session_hooks: {
    readonly since: 'v1';
  };
  readonly workspace_extensions: {
    readonly since: 'v1';
  };
  readonly session_branch: {
    readonly since: 'v1';
  };
  readonly rate_limit: {
    readonly since: 'v1';
  };
  readonly workspace_reload: {
    readonly since: 'v1';
  };
  readonly channel_delivery: {
    readonly since: 'v1';
  };
  readonly channel_reload: {
    readonly since: 'v1';
  };
  readonly channel_control: {
    readonly since: 'v1';
  };
  readonly channel_management: {
    readonly since: 'v1';
  };
  readonly workspace_channel_observed_contacts: {
    readonly since: 'v1';
  };
  readonly multi_workspace_sessions: {
    readonly since: 'v1';
  };
  readonly multi_workspace_session_rewind: {
    readonly since: 'v1';
  };
  readonly multi_workspace_session_shell: {
    readonly since: 'v1';
  };
  readonly dynamic_workspace_registration: {
    readonly since: 'v1';
  };
  readonly persistent_workspace_registration: {
    readonly since: 'v1';
  };
  readonly workspace_display_name: {
    readonly since: 'v1';
  };
  readonly scratch_workspace_registration: {
    readonly since: 'v1';
  };
  readonly workspace_runtime_removal: {
    readonly since: 'v1';
  };
  readonly workspace_qualified_rest_core: {
    readonly since: 'v1';
  };
  readonly workspace_qualified_voice: {
    readonly since: 'v1';
  };
  readonly workspace_qualified_memory: {
    readonly since: 'v1';
  };
  readonly extension_management_v2: {
    readonly since: 'v1';
  };
  readonly workspace_persisted_transcript: {
    readonly since: 'v1';
  };
  readonly workspace_session_export: {
    readonly since: 'v1';
  };
  readonly workspace_archived_session_export: {
    readonly since: 'v1';
  };
  readonly workspace_qualified_acp: {
    readonly since: 'v1';
  };
  readonly client_mcp_over_ws: {
    readonly since: 'v1';
  };
  readonly cdp_tunnel_over_ws: {
    readonly since: 'v1';
  };
  readonly browser_automation_mcp: {
    readonly since: 'v1';
  };
  readonly voice_transcribe: {
    readonly since: 'v1';
    readonly modes: readonly ['streaming', 'batch'];
  };
  readonly realtime_voice: {
    readonly since: 'v1';
  };
};
export type ServeFeature = keyof typeof SERVE_CAPABILITY_REGISTRY;
/**
 * Per-deployment feature toggles surfaced through `/capabilities`.
 *
 * advertised.
 */
export interface AdvertiseFeatureToggles {
  requireAuth?: boolean;
  mcpPoolActive?: boolean;
  externalToolGuardActive?: boolean;
  allowOriginActive?: boolean;
  promptDeadlineMs?: number;
  writerIdleTimeoutMs?: number;
  persistSettingAvailable?: boolean;
  voiceTranscriptionAvailable?: boolean;
  sessionShellCommandEnabled?: boolean;
  sessionArtifactsPersistenceAvailable?: boolean;
  sessionGenerationAvailable?: boolean;
  workspaceGenerationAvailable?: boolean;
  rateLimit?: boolean;
  reloadAvailable?: boolean;
  /**
   * Whether the daemon exposes the channel worker reload route
   * (`channel_reload`). Set while the runtime manager is enabled.
   */
  channelReloadAvailable?: boolean;
  channelControlAvailable?: boolean;
  channelManagementAvailable?: boolean;
  /**
   * Whether the daemon will accept client-hosted MCP servers over the WS
   * (`client_mcp_over_ws`, issue #5626).
   */
  clientMcpOverWsEnabled?: boolean;
  /**
   * Whether the daemon exposes the Plan C `/cdp` tunnel endpoint
   * (`cdp_tunnel_over_ws`, issue #5626).
   */
  cdpTunnelOverWsEnabled?: boolean;
  /**
   * Whether the daemon can register browser automation MCP tools for the CDP
   * tunnel (`browser_automation_mcp`, issue #5626).
   */
  browserAutomationMcpAvailable?: boolean;
  voiceWsAvailable?: boolean;
  multiWorkspaceSessionsEnabled?: boolean;
  dynamicWorkspaceRegistrationAvailable?: boolean;
  persistentWorkspaceRegistrationAvailable?: boolean;
  scratchWorkspaceRegistrationAvailable?: boolean;
  workspaceRuntimeRemovalAvailable?: boolean;
  /**
   * Whether the HTTP ACP surface is enabled (default on; opts out via
   * QWEN_SERVE_ACP_HTTP=0). Workspace-qualified ACP is only advertised when on.
   */
  acpHttpEnabled?: boolean;
  realtimeVoiceEnabled?: boolean;
  workspaceTrustHotReloadAvailable?: boolean;
}
/**
 * Subset of `ServeFeature` whose advertisement depends on runtime config
 * (currently just `require_auth`, which is announced only when the
 * daemon was started with `--require-auth`). Each entry pairs the
 * feature key with a predicate over `AdvertiseFeatureToggles` — the
 * toggle decision lives next to the feature key, so adding a new
 * conditional tag is **two coordinated changes** instead of four:
 *
 * 1. Register the tag in `SERVE_CAPABILITY_REGISTRY` above with its
 *    `since` protocol version (just like baseline tags).
 * 2. Add an entry to THIS Map mapping the tag to a toggle predicate
 *    (extend `AdvertiseFeatureToggles` first if the predicate needs a
 *    new field to read).
 *
 * The previous `Set` + per-feature `if`-branch shape needed FOUR
 * coordinated changes (registry, set, toggles interface, predicate
 * branch) and silently fail-CLOSED when the branch was missed —
 * fail-CLOSED is good, but invisible to the contributor adding the
 * tag. The Map shape collapses the predicate-decision and the
 * set-membership into one entry, so a future contributor either
 * registers the predicate (advertised when toggle on) or doesn't
 * register the tag in the Map at all (advertised unconditionally
 * like baseline tags) — both are intentional, neither is a silent
 * miss.
 *
 * Reviewed-through-failure: the
 * `every conditional tag advertises when its toggle is on` test in
 * `server.test.ts` iterates this Map's keys, so a future tag added
 * here whose predicate isn't honored by `getAdvertisedServeFeatures`
 * fails the suite — adoption-of-record for the Map shape rather than
 * relying on a hand-maintained invariant.
 */
export declare const CONDITIONAL_SERVE_FEATURES: ReadonlyMap<
  ServeFeature,
  (toggles: AdvertiseFeatureToggles) => boolean
>;
export declare const SERVE_FEATURES: readonly (
  | 'workspace_memory_remember'
  | 'workspace_memory_forget'
  | 'workspace_memory_dream'
  | 'writer_idle_timeout'
  | 'health'
  | 'daemon_status'
  | 'capabilities'
  | 'session_create'
  | 'session_id_override'
  | 'session_scope_override'
  | 'session_load'
  | 'session_resume'
  | 'unstable_session_resume'
  | 'session_list'
  | 'session_info'
  | 'session_source_metadata'
  | 'session_side_task'
  | 'session_prompt'
  | 'session_mid_turn_message_mutation'
  | 'session_mid_turn_message_query'
  | 'session_cancel'
  | 'session_events'
  | 'session_artifacts'
  | 'session_artifacts_persistence'
  | 'slow_client_warning'
  | 'typed_event_schema'
  | 'session_set_model'
  | 'client_identity'
  | 'client_heartbeat'
  | 'session_permission_vote'
  | 'permission_vote'
  | 'workspace_mcp'
  | 'workspace_skills'
  | 'workspace_providers'
  | 'workspace_acp_preheat'
  | 'workspace_acp_status'
  | 'auth_provider_install'
  | 'workspace_memory'
  | 'workspace_agents'
  | 'workspace_agent_generate'
  | 'workspace_env'
  | 'workspace_preflight'
  | 'session_context'
  | 'session_context_usage'
  | 'session_supported_commands'
  | 'session_tasks'
  | 'session_monitor_tool_correlation'
  | 'session_stats'
  | 'session_lsp'
  | 'session_status'
  | 'session_close'
  | 'session_archive'
  | 'session_metadata'
  | 'session_organization'
  | 'session_export'
  | 'session_transcript'
  | 'session_transcript_pagination'
  | 'mcp_guardrails'
  | 'workspace_mcp_manage'
  | 'mcp_guardrail_events'
  | 'external_tool_guard'
  | 'mcp_server_runtime_mutation'
  | 'workspace_file_read'
  | 'workspace_file_bytes'
  | 'workspace_file_read_cursor'
  | 'workspace_file_write'
  | 'workspace_file_upload'
  | 'session_approval_mode_control'
  | 'workspace_tool_toggle'
  | 'workspace_skill_toggle'
  | 'workspace_skill_batch_toggle'
  | 'workspace_skill_manage'
  | 'workspace_settings'
  | 'workspace_permissions'
  | 'workspace_voice'
  | 'workspace_voice_transcription'
  | 'workspace_trust'
  | 'workspace_trust_hot_reload'
  | 'workspace_init'
  | 'workspace_github_setup'
  | 'workspace_github_prs'
  | 'workspace_mcp_restart'
  | 'session_recap'
  | 'session_generation'
  | 'workspace_generation'
  | 'session_btw'
  | 'session_shell_command'
  | 'mcp_workspace_pool'
  | 'mcp_pool_restart'
  | 'require_auth'
  | 'allow_origin'
  | 'auth_device_flow'
  | 'permission_mediation'
  | 'prompt_absolute_deadline'
  | 'non_blocking_prompt'
  | 'session_language'
  | 'session_rewind'
  | 'workspace_hooks'
  | 'session_hooks'
  | 'workspace_extensions'
  | 'session_branch'
  | 'rate_limit'
  | 'workspace_reload'
  | 'channel_delivery'
  | 'channel_reload'
  | 'channel_control'
  | 'channel_management'
  | 'workspace_channel_observed_contacts'
  | 'multi_workspace_sessions'
  | 'multi_workspace_session_rewind'
  | 'multi_workspace_session_shell'
  | 'dynamic_workspace_registration'
  | 'persistent_workspace_registration'
  | 'workspace_display_name'
  | 'scratch_workspace_registration'
  | 'workspace_runtime_removal'
  | 'workspace_qualified_rest_core'
  | 'workspace_qualified_voice'
  | 'workspace_qualified_memory'
  | 'extension_management_v2'
  | 'workspace_persisted_transcript'
  | 'workspace_session_export'
  | 'workspace_archived_session_export'
  | 'workspace_qualified_acp'
  | 'client_mcp_over_ws'
  | 'cdp_tunnel_over_ws'
  | 'browser_automation_mcp'
  | 'voice_transcribe'
  | 'realtime_voice'
)[];
export declare function getRegisteredServeFeatures(): ServeFeature[];
export declare function getAdvertisedServeFeatures(
  protocolVersion?: ServeProtocolVersion,
  toggles?: AdvertiseFeatureToggles,
): ServeFeature[];
export declare function getServeFeatures(): ServeFeature[];
export declare function getServeProtocolVersions(): ServeProtocolVersions;
