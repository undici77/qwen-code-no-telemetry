/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const SERVE_PROTOCOL_VERSION: "v1";
export declare const SUPPORTED_SERVE_PROTOCOL_VERSIONS: readonly ["v1"];
export type ServeProtocolVersion = (typeof SUPPORTED_SERVE_PROTOCOL_VERSIONS)[number];
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
     *
     * Introduced for `mcp_guardrails` (issue #4175 PR 14) where the
     * tag advertises `['warn', 'enforce']` so clients can pre-flight
     * whether the daemon supports refusal-on-budget-exhausted before
     * relying on `mcp_child_refused_batch` semantics.
     */
    modes?: readonly string[];
}
export declare const SERVE_CAPABILITY_REGISTRY: {
    readonly health: {
        readonly since: "v1";
    };
    readonly capabilities: {
        readonly since: "v1";
    };
    readonly session_create: {
        readonly since: "v1";
    };
    readonly session_scope_override: {
        readonly since: "v1";
    };
    readonly session_load: {
        readonly since: "v1";
    };
    readonly unstable_session_resume: {
        readonly since: "v1";
    };
    readonly session_list: {
        readonly since: "v1";
    };
    readonly session_prompt: {
        readonly since: "v1";
    };
    readonly session_cancel: {
        readonly since: "v1";
    };
    readonly session_events: {
        readonly since: "v1";
    };
    readonly slow_client_warning: {
        readonly since: "v1";
    };
    readonly typed_event_schema: {
        readonly since: "v1";
    };
    readonly session_set_model: {
        readonly since: "v1";
    };
    readonly client_identity: {
        readonly since: "v1";
    };
    readonly client_heartbeat: {
        readonly since: "v1";
    };
    readonly session_permission_vote: {
        readonly since: "v1";
    };
    readonly permission_vote: {
        readonly since: "v1";
    };
    readonly workspace_mcp: {
        readonly since: "v1";
    };
    readonly workspace_skills: {
        readonly since: "v1";
    };
    readonly workspace_providers: {
        readonly since: "v1";
    };
    readonly workspace_memory: {
        readonly since: "v1";
    };
    readonly workspace_agents: {
        readonly since: "v1";
    };
    readonly workspace_env: {
        readonly since: "v1";
    };
    readonly workspace_preflight: {
        readonly since: "v1";
    };
    readonly session_context: {
        readonly since: "v1";
    };
    readonly session_supported_commands: {
        readonly since: "v1";
    };
    readonly session_close: {
        readonly since: "v1";
    };
    readonly session_metadata: {
        readonly since: "v1";
    };
    readonly mcp_guardrails: {
        readonly since: "v1";
        readonly modes: readonly ["warn", "enforce"];
    };
    readonly mcp_guardrail_events: {
        readonly since: "v1";
    };
    readonly workspace_file_read: {
        readonly since: "v1";
    };
    readonly workspace_file_bytes: {
        readonly since: "v1";
    };
    readonly workspace_file_write: {
        readonly since: "v1";
    };
    readonly session_approval_mode_control: {
        readonly since: "v1";
    };
    readonly workspace_tool_toggle: {
        readonly since: "v1";
    };
    readonly workspace_init: {
        readonly since: "v1";
    };
    readonly workspace_mcp_restart: {
        readonly since: "v1";
    };
    readonly require_auth: {
        readonly since: "v1";
    };
    readonly auth_device_flow: {
        readonly since: "v1";
    };
};
export type ServeFeature = keyof typeof SERVE_CAPABILITY_REGISTRY;
/**
 * Per-deployment feature toggles surfaced through `/capabilities`.
 *
 * `requireAuth` controls whether the conditional `require_auth` tag is
 * advertised. Other Wave 4 follow-ups can extend this object as more
 * deployment-shape capability tags appear (e.g. `redact_errors`).
 */
export interface AdvertiseFeatureToggles {
    requireAuth?: boolean;
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
export declare const CONDITIONAL_SERVE_FEATURES: ReadonlyMap<ServeFeature, (toggles: AdvertiseFeatureToggles) => boolean>;
export declare const SERVE_FEATURES: readonly ("slow_client_warning" | "health" | "capabilities" | "session_create" | "session_scope_override" | "session_load" | "unstable_session_resume" | "session_list" | "session_prompt" | "session_cancel" | "session_events" | "typed_event_schema" | "session_set_model" | "client_identity" | "client_heartbeat" | "session_permission_vote" | "permission_vote" | "workspace_mcp" | "workspace_skills" | "workspace_providers" | "workspace_memory" | "workspace_agents" | "workspace_env" | "workspace_preflight" | "session_context" | "session_supported_commands" | "session_close" | "session_metadata" | "mcp_guardrails" | "mcp_guardrail_events" | "workspace_file_read" | "workspace_file_bytes" | "workspace_file_write" | "session_approval_mode_control" | "workspace_tool_toggle" | "workspace_init" | "workspace_mcp_restart" | "auth_device_flow" | "require_auth")[];
export declare function getRegisteredServeFeatures(): ServeFeature[];
export declare function getAdvertisedServeFeatures(protocolVersion?: ServeProtocolVersion, toggles?: AdvertiseFeatureToggles): ServeFeature[];
export declare function getServeFeatures(): ServeFeature[];
export declare function getServeProtocolVersions(): ServeProtocolVersions;
