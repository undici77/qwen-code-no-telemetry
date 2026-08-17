/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { EventEmitter } from 'node:events';
import type {
  ContentGenerator,
  ContentGeneratorConfig,
  InputModalities,
} from '../core/contentGenerator.js';
import type { ContentGeneratorConfigSources } from '../core/contentGenerator.js';
import type { ReasoningEffort } from '../core/reasoning-effort.js';
import type { MCPOAuthConfig } from '../mcp/oauth-provider.js';
import type { ShellExecutionConfig } from '../services/shellExecutionService.js';
import type { VisionBridgeModelSelection } from '../services/visionBridge/vision-bridge-service.js';
import type { AnyToolInvocation } from '../tools/tools.js';
import type { ArenaManager } from '../agents/arena/ArenaManager.js';
import { ArenaAgentClient } from '../agents/arena/ArenaAgentClient.js';
import type { TeamManager } from '../agents/team/TeamManager.js';
import type { TeamContext } from '../agents/team/types.js';
import { BaseLlmClient } from '../core/baseLlmClient.js';
import { GeminiClient } from '../core/client.js';
import { AuthType } from '../core/contentGenerator.js';
import { FileDiscoveryService } from '../services/fileDiscoveryService.js';
import { FileHistoryService } from '../services/fileHistoryService.js';
import {
  type FileSystemService,
  type FileEncodingType,
} from '../services/fileSystemService.js';
import { CronScheduler } from '../services/cronScheduler.js';
import { MemoryPressureMonitor } from '../services/memoryPressureMonitor.js';
import { type SendSdkMcpMessage } from '../tools/mcp-client.js';
import { ToolRegistry } from '../tools/tool-registry.js';
import type { McpBudgetEvent } from '../tools/mcp-client-manager.js';
import type {
  ArtifactHostConfig,
  ArtifactOssConfig,
} from '../tools/artifact/publisher.js';
import type {
  LspClient,
  LspServiceReinitializeResult,
  LspStatusSnapshot,
} from '../lsp/types.js';
import type { InstructionLoadReason } from '../hooks/types.js';
import { ApprovalMode } from './approval-mode.js';
import { InputFormat, OutputFormat } from '../output/types.js';
import { PromptRegistry } from '../prompts/prompt-registry.js';
import { ResourceRegistry } from '../resources/resource-registry.js';
import { SkillManager } from '../skills/skill-manager.js';
import type { SkillLevel } from '../skills/types.js';
import { PermissionManager } from '../permissions/permission-manager.js';
import { type AutoModeDenialState } from '../permissions/denialTracking.js';
import { SubagentManager } from '../subagents/subagent-manager.js';
import type { SubagentConfig } from '../subagents/types.js';
import { BackgroundTaskRegistry } from '../agents/background-tasks.js';
import { MonitorRegistry } from '../services/monitorRegistry.js';
import { BackgroundAgentResumeService } from '../agents/background-agent-resume.js';
import { BackgroundShellRegistry } from '../services/backgroundShellRegistry.js';
import { WorkflowRunRegistry } from '../agents/workflow-run-registry.js';
import { FileReadCache } from '../services/fileReadCache.js';
import { type TelemetryTarget } from '../telemetry/index.js';
import {
  ExtensionManager,
  type Extension,
} from '../extension/extensionManager.js';
import { HookSystem } from '../hooks/index.js';
import { MessageBus } from '../confirmation-bus/message-bus.js';
import { type HookEventName, type HookDefinition } from '../hooks/types.js';
import { type GoalRuntime, type GoalTurnHost } from '../goals/goal-runtime.js';
import type { ToolInvocationGuard } from '../core/tool-invocation-guard.js';
import { FileExclusions } from '../utils/ignorePatterns.js';
import { WorkspaceContext } from '../utils/workspaceContext.js';
import type { FileFilteringOptions } from './constants.js';
import {
  DEFAULT_FILE_FILTERING_OPTIONS,
  DEFAULT_MEMORY_FILE_FILTERING_OPTIONS,
} from './constants.js';
import { Storage } from './storage.js';
import {
  ChatRecordingService,
  type ChatRecordingFailureListener,
} from '../services/chatRecordingService.js';
import {
  SessionService,
  type ResumedSessionData,
} from '../services/sessionService.js';
import { ConditionalRulesRegistry } from '../utils/rulesDiscovery.js';
import { type DebugLogger } from '../utils/debugLogger.js';
import { MemoryManager } from '../memory/manager.js';
import {
  ModelsConfig,
  type ModelProvidersConfig,
  type ProviderProtocolConfig,
  type AvailableModel,
  type ResolvedModelConfig,
  type RuntimeModelSnapshot,
} from '../models/index.js';
import type { WebSearchSettings } from '../tools/web-search.js';
import type { ClaudeMarketplaceConfig } from '../extension/claude-converter.js';
export declare function parseVisionModelSetting(setting: string | undefined):
  | {
      selector: string;
      baseUrl?: string;
    }
  | undefined;
export type { AnyToolInvocation, FileFilteringOptions, MCPOAuthConfig };
export {
  DEFAULT_FILE_FILTERING_OPTIONS,
  DEFAULT_MEMORY_FILE_FILTERING_OPTIONS,
};
export type ModelInvocableCommandExecutorResult =
  | string
  | {
      error: string;
    };
export { ApprovalMode, APPROVAL_MODES } from './approval-mode.js';
/**
 * Thrown by `Config.setApprovalMode` when the requested mode would grant
 * privileged tool autonomy in a folder the user has not marked as trusted.
 *
 * Why: the daemon mutation route at `POST /session/:id/approval-mode` needs
 * to recognize this specific class of rejection and translate it into a
 * structured `errorKind: 'auth_env_error'` rather than a generic 500.
 * Using a named subclass lets the bridge match by `err.name` without
 * depending on the message text (which would drift across i18n).
 */
export declare class TrustGateError extends Error {
  constructor(message: string);
}
/**
 * Information about an approval mode including display name and description.
 */
export interface ApprovalModeInfo {
  id: ApprovalMode;
  name: string;
  description: string;
}
export interface ManualPlanExitNotice {
  version: number;
  currentMode: ApprovalMode;
}
/**
 * Detailed information about each approval mode.
 * Used for UI display and protocol responses.
 */
export declare const APPROVAL_MODE_INFO: Record<ApprovalMode, ApprovalModeInfo>;
/**
 * Settings for the AUTO approval mode classifier.
 *
 * `hints` and `environment` are natural-language strings injected additively
 * into the classifier's system prompt; they do NOT use rule-matching syntax.
 * Use `permissions.allow / ask / deny` for hard rules.
 */
export interface AutoModeSettings {
  classifier?: {
    timeouts?: {
      /** Stage-1 fast classifier timeout in milliseconds. */
      stage1Ms?: number;
      /** Stage-2 review classifier timeout in milliseconds. */
      stage2Ms?: number;
    };
    thinking?: {
      /** Whether stage 2 may use provider/API-level thinking. */
      stage2Enabled?: boolean;
    };
  };
  hints?: {
    /** Natural-language descriptions of actions the user wants AUTO mode to allow. */
    allow?: string[];
    /**
     * Natural-language descriptions of destructive / irreversible actions the
     * user wants AUTO mode to soft-block. Soft-block means the classifier
     * blocks the action unless the user's most recent explicit request
     * authorised that exact action and scope.
     */
    softDeny?: string[];
    /**
     * Natural-language descriptions of security-boundary actions the user
     * wants the AUTO classifier to hard-block. Hard-block applies inside the
     * classifier even when an autoMode allow hint or recent user request would
     * normally authorise the action. This does not override
     * `permissions.allow`; use `permissions.deny` for deterministic hard
     * permission rules.
     */
    hardDeny?: string[];
    /**
     * @deprecated Use `softDeny`. Kept as a backward-compatible alias —
     * entries here are merged into the SOFT BLOCK user section.
     */
    deny?: string[];
  };
  /** Environment / context lines injected into the classifier's system prompt. */
  environment?: string[];
  /**
   * When true, ALL shell commands are routed through the auto-mode
   * classifier, including read-only commands that would otherwise be
   * auto-approved. Default false.
   */
  classifyAllShell?: boolean;
}
export interface AccessibilitySettings {
  enableLoadingPhrases?: boolean;
  screenReader?: boolean;
}
export interface BugCommandSettings {
  urlTemplate: string;
}
export interface ChatCompressionSettings {
  /**
   * Estimated tokens for a single inline image / document part when
   * apportioning chars across history during compression size estimation.
   * Also used as the placeholder budget when stripping inline media
   * out of the side-query compaction prompt. Default 1600.
   * Env override: `QWEN_IMAGE_TOKEN_ESTIMATE`.
   */
  imageTokenEstimate?: number;
  /**
   * Number of most-recently-touched files whose current content is
   * restored (embedded or referenced) after auto-compaction. Default 5.
   * Env override: `QWEN_COMPACT_MAX_RECENT_FILES`.
   */
  maxRecentFilesToRetain?: number;
  /**
   * Number of most-recent images (tool screenshots / user pastes)
   * restored after auto-compaction. Default 3.
   * Env override: `QWEN_COMPACT_MAX_RECENT_IMAGES`.
   */
  maxRecentImagesToRetain?: number;
  /**
   * When true, auto-compaction also fires once the number of
   * tool-returned images accumulated in history reaches
   * `screenshotTriggerThreshold`, independent of token usage. Aimed at
   * computer-use sessions where frequent screenshots dilute model
   * attention without necessarily exceeding the token budget. Default true.
   * Env override: `QWEN_COMPACT_SCREENSHOT_TRIGGER` (`1`/`true`/`0`/`false`).
   */
  enableScreenshotTrigger?: boolean;
  /**
   * Tool-returned image count at or above which the screenshot trigger
   * fires (only when `enableScreenshotTrigger`). Default 20.
   * Env override: `QWEN_COMPACT_SCREENSHOT_THRESHOLD`.
   */
  screenshotTriggerThreshold?: number;
  /**
   * Inline image count at or above which historical image payloads are
   * replaced with text references and only recent images are reattached.
   * Below this threshold images stay in-place untouched. Default 20.
   * Env override: `QWEN_IMAGE_PAYLOAD_THRESHOLD`.
   */
  imagePayloadThreshold?: number;
}
export { DEFAULT_TOOL_RESULTS_TOTAL_CHARS_THRESHOLD } from './clearContextDefaults.js';
/**
 * Settings for clearing stale or oversized tool-result context.
 * Threshold values of -1 mean "never clear" (disabled).
 */
export interface ClearContextOnIdleSettings {
  /** Minutes idle before clearing old tool results. Default 60. Use -1 to disable. */
  toolResultsThresholdMinutes?: number;
  /** Number of most-recent tool results to preserve. Default 5. */
  toolResultsNumToKeep?: number;
  /**
   * Total compactable tool result output chars before clearing old results.
   * Default 500000. Use -1 to disable.
   */
  toolResultsTotalCharsThreshold?: number;
}
export interface TelemetrySettings {
  enabled?: boolean;
  target?: TelemetryTarget;
  otlpEndpoint?: string;
  otlpProtocol?: 'grpc' | 'http';
  /** Per-signal endpoint override for traces (HTTP only). Used as-is without path appending. */
  otlpTracesEndpoint?: string;
  /** Per-signal endpoint override for logs (HTTP only). Used as-is without path appending. */
  otlpLogsEndpoint?: string;
  /** Per-signal endpoint override for metrics (HTTP only). Used as-is without path appending. */
  otlpMetricsEndpoint?: string;
  logPrompts?: boolean;
  /**
   * Stable end-user identifier written to GenAI spans as `gen_ai.user.id`.
   * This is an ARMS extension and may contain linkable personal data.
   */
  userId?: string;
  includeSensitiveSpanAttributes?: boolean;
  sensitiveSpanAttributeMaxLength?: number;
  outfile?: string;
  /**
   * Static resource attributes attached to every span/log/metric the SDK
   * exports (OTLP or file outfile — they share the same Resource).
   * Merged with `OTEL_RESOURCE_ATTRIBUTES`; settings win on key conflict.
   * Reserved keys (`service.version`, `session.id`) are dropped with a
   * `diag.warn`.
   */
  resourceAttributes?: Record<string, string>;
  /** Per-signal cardinality controls. */
  metrics?: TelemetryMetricsSettings;
  /**
   * Human-readable diagnostics produced while resolving
   * `resourceAttributes` (drops, coercions, reserved-key strips).
   * Populated by `resolveTelemetrySettings()`; the SDK emits a one-time
   * console summary at startup when this is non-empty so users notice
   * silent drops without scanning the OTel debug log.
   *
   * Not a user-settable field — operators should leave it unset.
   */
  resourceAttributeWarnings?: string[];
}
export type ResolvedTelemetrySettings = TelemetrySettings & {
  sensitiveSpanAttributeMaxLength: number;
};
export interface TelemetryMetricsSettings {
  /**
   * Include `session.id` on every metric data point. Default: false.
   *
   * WARNING: each CLI session creates a new value, causing unbounded
   * metric time-series fan-out at the backend. Only enable for
   * short-term debugging — spans and logs still carry session.id.
   */
  includeSessionId?: boolean;
}
/**
 * Security-relevant settings controlling what client-side correlation
 * data qwen-code writes into outbound LLM API requests.
 *
 * **Why this is a separate namespace from `telemetry.*`:** telemetry
 * controls data flow into the user's OWN observability backend (OTLP
 * collector / file outfile). The settings here control data flow OUT of
 * the qwen-code process and INTO third-party LLM provider request
 * streams (DashScope, OpenAI, Anthropic, etc.). Different recipients =
 * different consent decision, so a different settings tree.
 *
 * All values default to off / no propagation. Operators who want to
 * propagate trace context for server-side trace stitching (e.g. ARMS
 * Tracing + DashScope) opt in explicitly.
 */
export interface OutboundCorrelationSettings {
  /**
   * Inject W3C `traceparent` header on outbound HTTP requests
   * originated by undici / global `fetch` (LLM SDK calls, MCP
   * StreamableHTTP clients, WebFetch tool, etc.). Default: `false`.
   *
   * When `false`, the SDK is configured with a no-op
   * `TextMapPropagator` so trace context stays internal to the user's
   * OTLP collector (operator still gets client HTTP spans, but the
   * trace id is not written onto third-party request streams).
   *
   * When `true`, the OTel default W3C composite propagator
   * (`tracecontext` + `baggage`) is installed and `traceparent` is
   * written on every outbound `fetch`. Useful when the LLM provider
   * also reports into the operator's OTel collector — e.g. ARMS
   * Tracing + DashScope — for cross-process trace stitching.
   */
  propagateTraceContext?: boolean;
}
export interface OutputSettings {
  format?: OutputFormat;
}
export interface GitCoAuthorSettings {
  commit: boolean;
  pr: boolean;
  name?: string;
  email?: string;
}
/**
 * Shape accepted by the Config constructor for the `gitCoAuthor` param.
 *
 * A plain `boolean` is accepted for backward compatibility: older settings
 * (shipped before commit and PR attribution were split) stored this field as
 * a single boolean, and we treat that as applying to both sub-toggles so
 * nobody's stored preference silently flips.
 */
export type GitCoAuthorParam =
  | boolean
  | {
      commit?: boolean;
      pr?: boolean;
    };
export type ExtensionOriginSource =
  | 'QwenCode'
  | 'Claude'
  | 'Gemini'
  | 'Qoder'
  | 'AgentPlugins';
export type ExtensionNetworkPolicy = 'public';
export interface ExtensionInstallMetadata {
  source: string;
  type: 'git' | 'local' | 'link' | 'github-release' | 'npm' | 'archive-url';
  originSource?: ExtensionOriginSource;
  releaseTag?: string;
  gitCommit?: string;
  externalContent?: boolean;
  registryUrl?: string;
  ref?: string;
  autoUpdate?: boolean;
  allowPreRelease?: boolean;
  marketplaceConfig?: ClaudeMarketplaceConfig;
  pluginName?: string;
  networkPolicy?: ExtensionNetworkPolicy;
}
export declare const DEFAULT_TRUNCATE_TOOL_OUTPUT_THRESHOLD = 25000;
export declare const DEFAULT_TRUNCATE_TOOL_OUTPUT_LINES = 1000;
/**
 * Per-message budget (chars) for the combined model-facing output of one
 * batch of tool calls. When a batch's total output exceeds this, the largest
 * results are offloaded to disk (with a recoverable pointer). `<= 0` disables.
 */
export declare const DEFAULT_TOOL_OUTPUT_BATCH_BUDGET = 200000;
/**
 * Provenance of an MCP server config. Two purposes (see issue #4615):
 *
 * - **Approval gating**: `'project'` (a workspace `.mcp.json`) and `'workspace'`
 *   (a workspace `.qwen/settings.json`) are checked-in / shareable and therefore
 *   untrusted — both are held behind the pending-approval gate. See
 *   {@link isGatedMcpScope}.
 * - **Precedence**: `'workspace'` and `'system'` rank ABOVE a `.mcp.json`
 *   server, while user/default-scoped servers (left `scope` unset) rank below it
 *   — so `.mcp.json` overrides user settings but never enterprise-enforced
 *   `'system'` settings.
 *
 * Configs from user/default settings, extensions, and `--mcp-config` leave
 * `scope` unset.
 */
export type McpServerScope = 'project' | 'workspace' | 'system';
/**
 * Why an MCP server's tools are currently unavailable, used to give the model a
 * precise tool-not-found recovery action. See
 * {@link Config.getMcpServerUnavailableReason}.
 * - `removed`: deleted from config this session.
 * - `not_allowed`: filtered out by the `mcp.allowed` allow-list.
 * - `excluded`: present in the `mcp.excluded` list.
 * - `pending_approval`: a gated server awaiting approval (#4615).
 */
export type McpServerUnavailableReason =
  | 'removed'
  | 'not_allowed'
  | 'excluded'
  | 'pending_approval';
/**
 * Scopes whose servers are checked-in / shareable and therefore untrusted: they
 * must be approved before the discovery layer connects them. `'system'`
 * (enterprise-enforced) and unset (user/default/CLI/extension) scopes are
 * trusted and never gated. See issue #4615.
 */
export declare function isGatedMcpScope(
  scope: McpServerScope | undefined,
): boolean;
/**
 * Test whether a server name matches a single pattern. Patterns use simple
 * glob semantics: `*` matches any sequence of characters (including empty),
 * `?` matches exactly one character. A pattern without glob characters is
 * compared as an exact string (no behavior change for existing configs).
 * Uses an iterative two-pointer algorithm — O(n×m) worst case, no regex,
 * no backtracking vulnerability.
 */
export declare function matchesServerPattern(
  name: string,
  pattern: string,
): boolean;
/**
 * Test whether a server name matches any pattern in the given list.
 * Returns false for an empty or undefined list.
 */
export declare function matchesAnyServerPattern(
  name: string,
  patterns: string[] | undefined,
): boolean;
export declare class MCPServerConfig {
  readonly command?: string | undefined;
  readonly args?: string[] | undefined;
  readonly env?: Record<string, string> | undefined;
  readonly cwd?: string | undefined;
  readonly url?: string | undefined;
  readonly httpUrl?: string | undefined;
  readonly headers?: Record<string, string> | undefined;
  readonly tcp?: string | undefined;
  readonly timeout?: number | undefined;
  readonly trust?: boolean | undefined;
  readonly description?: string | undefined;
  readonly includeTools?: string[] | undefined;
  readonly excludeTools?: string[] | undefined;
  readonly extensionName?: string | undefined;
  readonly oauth?: MCPOAuthConfig | undefined;
  readonly authProviderType?: AuthProviderType | undefined;
  readonly targetAudience?: string | undefined;
  readonly targetServiceAccount?: string | undefined;
  readonly type?: 'sdk' | undefined;
  /**
   * Per-server cap on the discovery handshake (`connect` + `tools/list` +
   * `prompts/list` + `resources/list`). Defaults: 30s for stdio servers,
   * 5s for remote HTTP/SSE. Tool-call timeout (`timeout` above) is
   * unaffected — a long-running tool invocation is not a startup
   * pathology. Appended at the end of the parameter list to avoid
   * shifting positional arguments at the many `new MCPServerConfig(...)`
   * call sites.
   */
  readonly discoveryTimeoutMs?: number | undefined;
  /**
   * Provenance of this server config (see {@link McpServerScope}). Gated
   * scopes (`'project'`, `'workspace'`) are held behind the pending-approval
   * gate; `'system'` and unset scopes connect as before. Also drives
   * precedence in `assembleMcpServers`. Appended at the end of the parameter
   * list to avoid shifting positional arguments at the many
   * `new MCPServerConfig(...)` call sites. See issue #4615.
   */
  readonly scope?: McpServerScope | undefined;
  readonly alwaysLoadTools?: boolean | undefined;
  readonly agentPluginV1?: boolean | undefined;
  constructor(
    command?: string | undefined,
    args?: string[] | undefined,
    env?: Record<string, string> | undefined,
    cwd?: string | undefined,
    url?: string | undefined,
    httpUrl?: string | undefined,
    headers?: Record<string, string> | undefined,
    tcp?: string | undefined,
    timeout?: number | undefined,
    trust?: boolean | undefined,
    description?: string | undefined,
    includeTools?: string[] | undefined,
    excludeTools?: string[] | undefined,
    extensionName?: string | undefined,
    oauth?: MCPOAuthConfig | undefined,
    authProviderType?: AuthProviderType | undefined,
    targetAudience?: string | undefined,
    targetServiceAccount?: string | undefined,
    type?: 'sdk' | undefined,
    /**
     * Per-server cap on the discovery handshake (`connect` + `tools/list` +
     * `prompts/list` + `resources/list`). Defaults: 30s for stdio servers,
     * 5s for remote HTTP/SSE. Tool-call timeout (`timeout` above) is
     * unaffected — a long-running tool invocation is not a startup
     * pathology. Appended at the end of the parameter list to avoid
     * shifting positional arguments at the many `new MCPServerConfig(...)`
     * call sites.
     */
    discoveryTimeoutMs?: number | undefined,
    /**
     * Provenance of this server config (see {@link McpServerScope}). Gated
     * scopes (`'project'`, `'workspace'`) are held behind the pending-approval
     * gate; `'system'` and unset scopes connect as before. Also drives
     * precedence in `assembleMcpServers`. Appended at the end of the parameter
     * list to avoid shifting positional arguments at the many
     * `new MCPServerConfig(...)` call sites. See issue #4615.
     */
    scope?: McpServerScope | undefined,
    alwaysLoadTools?: boolean | undefined,
    agentPluginV1?: boolean | undefined,
  );
}
/**
 * Check if an MCP server config represents an SDK server
 */
export declare function isSdkMcpServerConfig(config: MCPServerConfig): boolean;
export declare enum AuthProviderType {
  DYNAMIC_DISCOVERY = 'dynamic_discovery',
  GOOGLE_CREDENTIALS = 'google_credentials',
  SERVICE_ACCOUNT_IMPERSONATION = 'service_account_impersonation',
}
export interface SandboxConfig {
  command: 'docker' | 'podman' | 'sandbox-exec';
  image: string;
}
/**
 * General-purpose worktree settings (Phase D-2). Distinct from
 * {@link AgentsCollabSettings.arena.worktreeBaseDir}, which only governs
 * Arena multi-model worktrees.
 */
export interface WorktreeSettings {
  /**
   * Directories under the main repository to symlink into every
   * general-purpose worktree on creation (the `enter_worktree` tool,
   * `agent isolation: "worktree"`, and the `--worktree` startup flag).
   *
   * Paths must be relative to the repo root; absolute paths and any
   * entry containing `..` are rejected by the service. Entries that
   * resolve to git-internal paths (`.git`, `.qwen`) are also rejected
   * — symlinking those would either break git inside the worktree or
   * create a worktrees-inside-worktrees loop. Missing source dirs and
   * pre-existing destinations are silently skipped.
   */
  symlinkDirectories?: readonly string[];
}
/** Settings shared across agents and multi-agent collaboration features. */
export interface AgentsCollabSettings {
  /** Built-in subagent settings */
  builtin?: {
    /** Model selector for the built-in Explore subagent (default: inherit). */
    exploreModel?: string;
  };
  /** Maps model grade names exposed to the Agent tool to model selectors. */
  modelGrades?: Record<string, string>;
  /** Optional whitelist of model grades exposed to the Agent tool. */
  allowedGrades?: string[];
  /**
   * Global maximum number of background sub-agents running concurrently.
   * When the cap is reached, additional launches wait for a slot.
   */
  maxParallelAgents?: number;
  /**
   * Per-model maximum number of background sub-agents running concurrently,
   * keyed by concrete model ID. Overrides the global `maxParallelAgents` for
   * the matched model; models not listed here fall back to the global limit.
   * Useful when a model has a lower concurrency capacity than the rest.
   */
  maxParallelAgentsByModel?: Record<string, number>;
  /** Display mode for multi-agent sessions ('in-process' | 'tmux' | 'iterm2') */
  displayMode?: string;
  /** Arena-specific settings */
  arena?: {
    /** Custom base directory for Arena worktrees (default: ~/.qwen/arena) */
    worktreeBaseDir?: string;
    /** Preserve worktrees and state files after session ends */
    preserveArtifacts?: boolean;
    /** Maximum rounds (turns) per agent. No limit if unset. */
    maxRoundsPerAgent?: number;
    /** Total timeout in seconds for the Arena session. No limit if unset. */
    timeoutSeconds?: number;
  };
  /** Team-specific settings */
  team?: {
    /** Maximum number of teammates (default: 10). */
    maxTeammates?: number;
  };
}
export interface ConfigParameters {
  sessionId?: string;
  sessionData?: ResumedSessionData;
  embeddingModel?: string;
  sandbox?: SandboxConfig;
  targetDir: string;
  debugMode: boolean;
  includePartialMessages?: boolean;
  question?: string;
  systemPrompt?: string;
  appendSystemPrompt?: string;
  coreTools?: string[];
  allowedTools?: string[];
  excludeTools?: string[];
  /**
   * Pre-merged list of slash command names that should be hidden from the
   * CLI surface. Matched case-insensitively on the final (post-rename)
   * command name. Sourced from settings (`slashCommands.disabled`, UNION
   * merged across scopes), the `--disabled-slash-commands` CLI flag, and
   * the `QWEN_DISABLED_SLASH_COMMANDS` environment variable.
   */
  disabledSlashCommands?: string[];
  /**
   * Live-read provider for the set of skill names that should be hidden
   * from `<available_skills>` and the `/<skill-name>` slash-command
   * surface. Unlike `disabledSlashCommands` (which is a frozen snapshot),
   * this is a function so the CLI layer can close over `LoadedSettings`
   * and have post-`setValue` toggles take effect without restart.
   *
   * Must be attached at construction time — `Config.initialize()` calls
   * `toolRegistry.warmAll()` which instantiates `SkillTool`, and that
   * tool's constructor immediately calls `refreshSkills()`. A late-attach
   * provider would let persisted disabled skills leak into the first
   * `<available_skills>` build.
   *
   * Names returned must be lower-cased; consumers compare case-insensitively.
   */
  disabledSkillNamesProvider?: () => ReadonlySet<string>;
  terminalImageRenderSupportProvider?: () => Promise<TerminalImageRenderSupport>;
  /**
   * Skill discovery levels that should not be loaded. Sourced from
   * `settings.skills.disabledLevels`.
   */
  disabledSkillLevels?: readonly SkillLevel[];
  /**
   * Additional directories to scan for skills (SKILL.md files).
   * Sourced from `settings.skills.directories`. Paths are raw
   * (unexpanded); `SkillManager.getSkillsBaseDirs` handles `~` expansion.
   */
  customSkillDirs?: readonly string[];
  /**
   * Tool names hidden from the registry at construction time. Unlike
   * `permissions.deny` (which keeps the tool registered and rejects
   * invocation), tools listed here are not registered at all and never
   * appear in `/tools`, `getAllTools()`, or function-call discovery.
   * Sourced from `settings.tools.disabled` and the daemon mutation route
   * `POST /workspace/tools/:name/enable {enabled:false}`. Active sessions retain already-registered tools — the disabled
   * set is consulted at register time, so toggling takes effect on the
   * next ACP child spawn or `ToolRegistry.refresh()`.
   */
  disabledTools?: string[];
  /**
   * Deferred tool names that bypass the `shouldDefer` behaviour and
   * are made visible in function declarations from session start,
   * without requiring the model to call `tool_search`.
   * Sourced from `settings.tools.visible`. Non-existent names are
   * silently ignored (they don't cause config errors).
   */
  visibleTools?: string[];
  /**
   * Percentage of the model's context window used as the session-start
   * budget for preloading deferred tools. When the combined estimated
   * schema size of every deferred tool — bundled built-ins and MCP alike
   * — fits within the budget, they are all revealed upfront instead of
   * loaded on demand via `tool_search`, keeping the declaration list
   * stable for the whole session (prefix-cache friendly). `0` disables
   * preloading. Sourced from `settings.tools.toolSearch.threshold`.
   */
  toolSearchThreshold?: number;
  /** Merged permission rules from all sources (settings + CLI args). */
  permissions?: {
    allow?: string[];
    ask?: string[];
    deny?: string[];
    /** Settings consumed by the AUTO approval mode classifier. */
    autoMode?: AutoModeSettings;
  };
  /**
   * Optional host policy evaluated with final tool arguments immediately
   * before execution. A configured guard fails closed.
   */
  toolInvocationGuard?: ToolInvocationGuard;
  toolDiscoveryCommand?: string;
  toolCallCommand?: string;
  mcpServerCommand?: string;
  mcpServers?: Record<string, MCPServerConfig>;
  /**
   * Session-injected (ACP/IDE) + `--mcp-config` servers that sit above the
   * settings layer and `.mcp.json` and are never gated (#4615). Retained so the
   * hot-reload subscriber (sub-task 3) can re-assemble the effective map the
   * same way boot did. See `assembleMcpServers`.
   */
  topTierMcpServers?: Record<string, MCPServerConfig>;
  lsp?: {
    enabled?: boolean;
  };
  lspClient?: LspClient;
  userMemory?: string;
  geminiMdFileCount?: number;
  approvalMode?: ApprovalMode;
  contextFileName?: string | string[];
  accessibility?: AccessibilitySettings;
  showResponseTokensPerSecond?: boolean;
  telemetry?: TelemetrySettings;
  /**
   * Delay SDK startup for interactive render paths. Telemetry settings still
   * remain readable from Config; only the global SDK side effect is deferred.
   */
  deferTelemetryInitialization?: boolean;
  outboundCorrelation?: OutboundCorrelationSettings;
  gitCoAuthor?: GitCoAuthorParam;
  usageStatisticsEnabled?: boolean;
  /**
   * If true, disables the per-session FileReadCache short-circuit
   * (file_unchanged placeholder). Useful for sessions that may undergo
   * context compaction or transcript transformation, where the model
   * cannot reliably retrieve a previously-emitted full file content
   * from prior tool results. Defaults to false (cache active).
   */
  fileReadCacheDisabled?: boolean;
  fileFiltering?: {
    respectGitIgnore?: boolean;
    respectQwenIgnore?: boolean;
    customIgnoreFiles?: string[];
    enableRecursiveFileSearch?: boolean;
    enableFuzzySearch?: boolean;
  };
  fileCheckpointingEnabled?: boolean;
  /** Directory where approved plan files are stored. Must resolve inside targetDir. */
  plansDirectory?: string;
  proxy?: string;
  cwd: string;
  fileDiscoveryService?: FileDiscoveryService;
  includeDirectories?: string[];
  bugCommand?: BugCommandSettings;
  model?: string;
  outputLanguageFilePath?: string;
  maxSessionTurns?: number;
  /**
   * Maximum number of nested sub-agent levels (1-based). `1` reproduces the
   * pre-nesting behavior — level-1 sub-agents exist but cannot themselves
   * spawn sub-agents. The default `5` lets a sub-agent spawn sub-agents up to
   * five levels deep. Values `< 1` are clamped to `1`. This governs *nesting*
   * only; it never disables sub-agents. Teammates, forks, and
   * workflow-spawned agents are excluded from nesting in v1.
   */
  maxSubagentDepth?: number;
  /**
   * Wall-clock budget for an unattended run, in seconds. `-1` (default)
   * means no limit. Enforced by the CLI's non-interactive run loop
   * see `RunBudgetEnforcer` in `packages/cli/src/utils/runBudget.ts`.
   * Issue: QwenLM/qwen-code#4103.
   */
  maxWallTimeSeconds?: number;
  /**
   * Cumulative tool-call budget across the entire run. `-1` means no
   * limit. Counts every `executeToolCall` invocation (incl. failed
   * tools, since the model is still consuming tokens reading the error).
   */
  maxToolCalls?: number;
  clearContextOnIdle?: ClearContextOnIdleSettings;
  sessionTokenLimit?: number;
  experimentalZedIntegration?: boolean;
  sessionWriterLeaseEnabled?: boolean;
  cronEnabled?: boolean;
  /**
   * Days a recurring cron job lives before auto-expiring. `0` disables
   * expiry. Unset or invalid falls back to the 7-day default.
   */
  cronRecurringMaxAgeDays?: number;
  agentTeamEnabled?: boolean;
  workflowsEnabled?: boolean;
  artifactEnabled?: boolean;
  artifactAutoOpen?: boolean;
  artifactPublisher?: 'local' | 'host' | 'oss';
  artifactHost?: ArtifactHostConfig;
  artifactOss?: ArtifactOssConfig;
  /** Image generation model selected through `/model --image`. */
  imageModel?: string;
  /**
   * P5 T7: suppress the one-time `Workflow` tool usage-warning banner.
   * When `true`, the registry-side warning latch is bypassed and the
   * banner is not prepended to the run's display payload. Defaults to
   * `false`. The banner itself is per-session (registry-scoped), so
   * even when unset it fires at most once per process.
   */
  skipWorkflowUsageWarning?: boolean;
  computerUseEnabled?: boolean;
  computerUseMaxImageDimension?: number;
  computerUseIdleTimeoutMs?: number;
  emitToolUseSummaries?: boolean;
  listExtensions?: boolean;
  overrideExtensions?: string[];
  /** Locale code for resolving localizable extension fields (e.g., 'en', 'zh'). */
  locale?: string;
  allowedMcpServers?: string[];
  /**
   * The startup `--allowed-mcp-server-names` CLI flag value, if passed (the
   * flag only — NOT the settings-derived allow-list). When present it is an
   * immutable upper bound on MCP admission: a hot-reload may narrow within it
   * but never widen beyond it. Undefined when the flag was not passed (then
   * settings fully drive admission). See issue #3696 sub-task 3.
   */
  cliAllowedMcpServerNames?: string[];
  excludedMcpServers?: string[];
  /**
   * Idle timeout in milliseconds for MCP tool calls. If the MCP server does
   * not produce any response or progress update within this time, the call
   * is aborted. Default: 300000 (5 minutes). Can be overridden via
   * QWEN_CODE_MCP_TOOL_IDLE_TIMEOUT_MS environment variable.
   */
  mcpToolIdleTimeoutMs?: number;
  /**
   * Names of project-scoped (`.mcp.json`) servers that are NOT yet approved
   * (pending or rejected). These are loaded so they can be listed, but the
   * discovery layer must not connect them. See issue #4615.
   */
  pendingMcpServers?: string[];
  noBrowser?: boolean;
  folderTrustFeature?: boolean;
  folderTrust?: boolean;
  ideMode?: boolean;
  authType?: AuthType;
  generationConfig?: Partial<ContentGeneratorConfig>;
  /** Exact initial model registry baseUrl; null selects an implicit route. */
  initialModelRegistryBaseUrl?: string | null;
  /**
   * Optional source map for generationConfig fields (e.g. CLI/env/settings attribution).
   * This is used to produce per-field source badges in the UI.
   */
  generationConfigSources?: ContentGeneratorConfigSources;
  cliVersion?: string;
  loadMemoryFromIncludeDirectories?: boolean;
  importFormat?: 'tree' | 'flat';
  chatRecording?: boolean;
  chatCompression?: ChatCompressionSettings;
  autoCompactThreshold?: number;
  interactive?: boolean;
  trustedFolder?: boolean;
  defaultFileEncoding?: FileEncodingType;
  useRipgrep?: boolean;
  useBuiltinRipgrep?: boolean;
  shouldUseNodePtyShell?: boolean;
  /** Prevent the system from sleeping while model or tool work is in flight. */
  preventSystemSleep?: boolean;
  skipNextSpeakerCheck?: boolean;
  shellExecutionConfig?: ShellExecutionConfig;
  skipLoopDetection?: boolean;
  /** Per-turn tool-call cap; <= 0 disables. See getMaxToolCallsPerTurn. */
  maxToolCallsPerTurn?: number;
  truncateToolOutputThreshold?: number;
  truncateToolOutputLines?: number;
  toolOutputBatchBudget?: number;
  /**
   * Default timeout, in ms, for foreground shell commands. A per-call
   * timeout on the shell tool takes precedence; when both are unset the
   * shell tool falls back to its built-in default. See
   * getShellDefaultTimeoutMs.
   */
  shellDefaultTimeoutMs?: number;
  /**
   * Interval, in ms, between liveness heartbeats emitted while a foreground
   * shell command produces no output. 0 disables heartbeats; unset falls
   * back to the shell tool's built-in default. See
   * getShellHeartbeatIntervalMs.
   */
  shellHeartbeatIntervalMs?: number;
  eventEmitter?: EventEmitter;
  output?: OutputSettings;
  inputFormat?: InputFormat;
  outputFormat?: OutputFormat;
  skipStartupContext?: boolean;
  bareMode?: boolean;
  sdkMode?: boolean;
  sessionSubagents?: SubagentConfig[];
  channel?: string;
  /**
   * File descriptor number for structured JSON event output (dual output mode).
   * When set, Qwen Code outputs structured JSON events to this fd while
   * continuing to render the TUI on stdout. The caller must provide this fd
   * via spawn stdio configuration.
   * Mutually exclusive with jsonFile.
   */
  jsonFd?: number;
  /**
   * File path for structured JSON event output (dual output mode).
   * Can be a regular file, FIFO (named pipe), or /dev/fd/N.
   * Mutually exclusive with jsonFd.
   */
  jsonFile?: string;
  /**
   * JSON Schema that the model's final output must conform to. When set, a
   * synthetic `structured_output` tool is registered and the non-interactive
   * CLI ends the session the first time the model calls it with valid args.
   * Only meaningful in headless mode (`qwen -p`).
   */
  jsonSchema?: Record<string, unknown>;
  /**
   * File path for receiving remote input commands (bidirectional sync mode).
   * An external process writes JSONL commands to this file, and the TUI
   * watches it to process messages as if the user typed them.
   */
  inputFile?: string;
  /** Model providers configuration grouped by provider id */
  modelProvidersConfig?: ModelProvidersConfig;
  /** Maps custom provider ids to their SDK protocol (AuthType) */
  providerProtocolConfig?: ProviderProtocolConfig;
  /** Agent and multi-agent collaboration settings */
  agents?: AgentsCollabSettings;
  /** General-purpose worktree settings (Phase D-2). */
  worktree?: WorktreeSettings;
  /** Enable managed auto-memory background extraction and dream. Defaults to true. */
  enableManagedAutoMemory?: boolean;
  /** Enable managed auto-dream consolidation separately from extraction. Defaults to true. */
  enableManagedAutoDream?: boolean;
  /**
   * Enable the git-shared team memory tier. Defaults to false (opt-in).
   * Overridable at runtime by `QWEN_CODE_MEMORY_TEAM` ('0'/'1') via
   * {@link Config.getTeamMemoryEnabled}.
   */
  enableTeamMemory?: boolean;
  enableTeamMemorySync?: boolean;
  /** Enable automatic project skill review after tool-heavy sessions. Defaults to false. */
  enableAutoSkill?: boolean;
  /** Require user confirmation before persisting an auto-activated skill. Defaults to true. */
  autoSkillConfirm?: boolean;
  /**
   * Max runtime in minutes for background memory agents (extraction, dream,
   * remember, skill review). Unset → per-agent defaults; 0 → no time limit.
   */
  memoryAgentTimeoutMinutes?: number;
  /**
   * Max turns for background memory agents (extraction, dream, remember, and
   * skill review). Unset means each agent uses its built-in default; 0
   * disables the turn limit.
   */
  memoryAgentMaxTurns?: number;
  /**
   * Lightweight model for background tasks (memory extraction, dream, /btw side questions).
   * When set and valid for the current auth type, forked agents use this model instead of
   * the main session model, reducing latency and cost.
   * Corresponds to the `fastModel` setting (configurable via `/model --fast`).
   */
  fastModel?: string;
  /**
   * Built-in WebSearch tool settings (`tools.webSearch` / ENABLE_WEB_SEARCH +
   * WEB_SEARCH_MODEL env overrides). The tool registers only when `enabled`
   * is true and `model` resolves to a DashScope-compatible modelProviders
   * entry carrying a direct API key — or, for environments that cannot write
   * settings.json, when an env-declared backend is supplied (`baseUrl` from
   * WEB_SEARCH_BASE_URL, `apiKeyEnv` naming the key variable), which takes
   * precedence over modelProviders resolution.
   */
  webSearch?: WebSearchSettings;
  /**
   * Safe mode: disables all user customizations (context files, hooks,
   * extensions, skills, MCP servers, rules) for troubleshooting.
   * Activated via `--safe-mode` CLI flag or `QWEN_CODE_SAFE_MODE=true` env var.
   */
  safeMode?: boolean;
  /**
   * Explicit vision model for the vision bridge. When a text-only primary model
   * receives an image, the bridge transcribes it through this model instead of
   * auto-picking a same-provider one. Corresponds to the `visionModel` setting
   * (configurable via `/model --vision`).
   */
  visionModel?: string;
  /**
   * Dedicated model for chat compression (auto-compaction). Falls back to
   * the main model. Corresponds to the `compactionModel` setting
   * (configurable via `/model --compaction`).
   */
  compactionModel?: string;
  /**
   * Per-attempt timeout in milliseconds for the vision bridge transcription
   * call. Unset → built-in 30s. Corresponds to the `visionBridgeTimeoutMs`
   * setting; useful for slow or proxied vision endpoints.
   */
  visionBridgeTimeoutMs?: number;
  /**
   * Ordered list of fallback model IDs to try when the primary model hits
   * capacity errors (429/503/529). At most 3 entries; duplicate fallback
   * entries are filtered during normalization, and primary/current model
   * matches are skipped at runtime.
   * Configurable via the `modelFallbacks` setting or `--fallback-model` CLI flag.
   */
  modelFallbacks?: string[];
  /**
   * Disable all hooks (default: false, hooks enabled).
   * Migration note: This replaces the deprecated hooksConfig.enabled setting.
   * Users with old settings.json containing hooksConfig.enabled should migrate
   * to use disableAllHooks instead (note: inverted logic - enabled:true → disableAllHooks:false).
   */
  disableAllHooks?: boolean;
  /**
   * Maximum consecutive blocking Stop/SubagentStop hook decisions before the
   * runtime overrides the hook loop and allows the turn to end.
   */
  stopHookBlockingCap?: number;
  /**
   * User-level hooks configuration (from user settings).
   * These hooks are always loaded regardless of folder trust status.
   */
  userHooks?: Record<string, unknown>;
  /**
   * Project-level hooks configuration (from workspace settings).
   * These hooks are only loaded in trusted folders.
   * When undefined or the folder is untrusted, project hooks are skipped.
   */
  projectHooks?: Record<string, unknown>;
  hooks?: Record<string, unknown>;
  /** Glob patterns to exclude from .qwen/rules/ loading. */
  contextRuleExcludes?: string[];
  /** Warnings generated during configuration resolution */
  warnings?: string[];
  /** Allowed HTTP hook URLs whitelist (from security.allowedHttpHookUrls) */
  allowedHttpHookUrls?: string[];
  /**
   * When true, HTTP hooks may target private/link-local IP ranges
   * (from security.allowPrivateNetworkHooks; trusted scopes only).
   */
  allowPrivateNetworkHooks?: boolean;
  /**
   * Callback for persisting a permission rule to settings.
   * Injected by the CLI layer; core uses this to write allow/ask/deny rules
   * to project or user settings when the user clicks "Always Allow".
   *
   * @param scope - 'project' for workspace settings, 'user' for user settings.
   * @param ruleType - 'allow' | 'ask' | 'deny'.
   * @param rule - The raw rule string, e.g. "Bash(git *)" or "Edit".
   */
  onPersistPermissionRule?: (
    scope: 'project' | 'user',
    ruleType: 'allow' | 'ask' | 'deny',
    rule: string,
  ) => Promise<void>;
  /** Lifecycle handle for an external settings file watcher. Stopped during shutdown. */
  settingsWatcher?: {
    stopWatching(): void;
  };
}
export type TerminalImageRenderSupport =
  | {
      available: true;
    }
  | {
      available: false;
      reason: string;
    };
export interface ImageGenerationConfig {
  model: string;
  baseUrl: string;
  apiKeyEnv: string;
}
/** Default sub-agent nesting cap (1-based levels). */
export declare const DEFAULT_MAX_SUBAGENT_DEPTH = 5;
/** Ceiling for the nesting cap — catches typos the way maxToolCalls' does. */
export declare const MAX_SUBAGENT_DEPTH_LIMIT = 100;
/**
 * Normalizes a maxSubagentDepth value: absent or non-finite values fall back
 * to the default (NaN would silently block all nesting, Infinity — e.g.
 * JSON `1e309` — would unbound the recursion cap), and finite values floor
 * and clamp to the 1–{@link MAX_SUBAGENT_DEPTH_LIMIT} range. Values below 1
 * clamp up so the knob never disables sub-agents outright — it only bounds
 * nesting.
 *
 * Shared by the Config constructor and the resume path that restores
 * persisted launch flags, so a malformed or tampered agent sidecar cannot
 * bypass the nesting cap.
 */
export declare function normalizeMaxSubagentDepth(
  value: number | null | undefined,
): number;
/**
 * Validates the session-turn limit at config and persisted-agent boundaries.
 */
export declare function validateMaxSessionTurns(
  value: number | undefined,
): number;
/**
 * Options for Config.initialize()
 */
export interface ConfigInitializeOptions {
  /**
   * Callback for sending MCP messages to SDK servers via control plane.
   * Required for SDK MCP server support in SDK mode.
   */
  sendSdkMcpMessage?: SendSdkMcpMessage;
  /**
   * Skip Gemini client chat initialization. Useful for bootstrap paths that
   * need config services (hooks, tools, MCP) before a real session exists.
   */
  skipGeminiInitialization?: boolean;
  /**
   * skip MCP
   * discovery entirely (both inline tool-registry-time discovery AND
   * the post-`createToolRegistry` background `startMcpDiscoveryInBackground`).
   * The bootstrap config in ACP daemon mode uses this to AVOID spawning
   * MCP servers under the bootstrap's pool-less McpClientManager.
   * Pre-fix every stdio MCP server was spawned twice — once by the
   * bootstrap (legacy per-server path, invisible to pool / budget /
   * drainAll / pid-sweep) and once by each session's pool-routed
   * discovery — silently violating the workspace budget contract.
   * The bootstrap's MCP clients were never actually used to serve a
   * session (each session builds its own per-session Config and runs
   * its own discovery), so skipping at the bootstrap layer is safe
   * AND closes the 2N subprocess leak.
   */
  skipMcpDiscovery?: boolean;
  /**
   * Skip hook system and hook MessageBus initialization. Read-only replay
   * helpers use this to avoid loading or subscribing user/workspace hooks.
   */
  skipHooks?: boolean;
  /**
   * Skip SkillManager creation and file watching. Read-only replay helpers do
   * not need skill discovery and must not start long-lived watchers.
   */
  skipSkillManager?: boolean;
  /**
   * Force file checkpointing off for read-only replay helpers, even when the
   * Config was constructed with checkpointing enabled.
   */
  skipFileCheckpointing?: boolean;
  /**
   * Warm the tool registry in best-effort (non-strict) mode. Read-only replay
   * Configs set this so a tool whose constructor requires a subsystem this
   * Config deliberately skipped (e.g. `SkillTool` needs the `SkillManager` that
   * `skipSkillManager` omits) is logged and skipped instead of aborting
   * `initialize()`. Replay only needs optional tool_call metadata, and
   * `ToolCallEmitter` already falls back to the recorded tool name when a tool
   * is absent from the registry.
   */
  lenientToolWarmup?: boolean;
}
/** Request from the `create_sub_session` tool to spawn a fresh top-level
 * sub-session and run a prompt in it. */
export interface SubSessionSpawnRequest {
  prompt: string;
  /** `'sent'` = resolve as soon as the prompt is dispatched; `'first-turn'` =
   * resolve after the sub-session's first turn finishes (result returned). */
  completion: 'sent' | 'first-turn';
  /** Optional model service id for the sub-session. */
  model?: string;
  /** Optional display name for the sub-session in the session list. */
  name?: string;
}
/** Result returned to the `create_sub_session` tool. `result` (the sub-session's
 * first-turn output) is present only for `completion: 'first-turn'`. */
export interface SubSessionSpawnResult {
  sessionId: string;
  result?: string;
  stopReason?: string;
  /** Whether the parent lineage was durably persisted to the sub-session's
   * transcript. `false` = live-only (the parent link disappears from the
   * persisted session list after a daemon restart). Absent when unknown. */
  parentSessionPersisted?: boolean;
}
/**
 * Injected capability that spawns a sub-session. Used by the `create_sub_session`
 * tool. Wired ONLY by the daemon/ACP session layer (`Session.ts` →
 * `this.client.extMethod`); absent in interactive TUI / headless (no bridge),
 * which is precisely the tool's daemon-only gate.
 */
export type SubSessionSpawner = (
  req: SubSessionSpawnRequest,
) => Promise<SubSessionSpawnResult>;
/**
 * A higher-priority static DashScope thinking knob that shadows the global
 * reasoning-effort tier on the wire (see getReasoningEffortOverride).
 */
export type ReasoningEffortOverride = {
  source: 'extra_body' | 'samplingParams';
  field: 'enable_thinking' | 'reasoning_effort' | 'thinking_budget';
};
export declare class Config {
  private sessionId;
  private sessionSourceType?;
  private sessionSourceId?;
  private sessionData?;
  private readonly sessionRuntimeBaseDir;
  private sessionProjectDirRegistered;
  private pendingSessionWriterLease?;
  private pendingSessionWriterRelease;
  private sessionWriterReclaimPolicy;
  private sessionWriterTakeoverPolicy;
  private sessionWriterShutdownRequested;
  private sessionWriterHandoffRequested;
  private sessionWriterActivationPromise;
  private sessionWriterClosePromise;
  /**
   * One-shot notice produced by `setupStartupWorktree` (Phase D-1) when the
   * CLI was launched with `--worktree`. The active entry point (TUI XOR
   * headless) reads it via {@link consumePendingStartupWorktreeNotice} on
   * the model's first prompt and skips Phase C's `restoreWorktreeContext`
   * for that turn — startup wins over the resumed-session sidecar. ACP is
   * gated out earlier in `gemini.tsx` (mutex with `--worktree`) so it
   * never reaches this slot.
   *
   * @invariant At most one consumer per process. If a future entry path
   * sets this slot without ever consuming, the string persists until
   * process exit (which dies with the process — no leak).
   */
  private pendingStartupWorktreeNotice;
  private pendingRecoveredAgentsNotice;
  private debugLogger;
  private toolRegistry;
  /**
   * callback stashed BEFORE
   * `initialize()` runs and applied as soon as `toolRegistry` is up,
   * so the manager's `setOnBudgetEvent` is wired before
   * `startMcpDiscoveryInBackground` (or legacy blocking discovery)
   * fires the first pass. Pre-fix the acpAgent registered after
   * `initialize()` returned, missing the first pass entirely under
   * `QWEN_CODE_LEGACY_MCP_BLOCKING=1` and racing against background
   * discovery completion under the default mode.
   */
  private pendingMcpBudgetCallback?;
  private promptRegistry;
  private resourceRegistry;
  private subagentManager;
  private memoryPressureConfig?;
  private memoryPressureMonitor?;
  private readonly backgroundTaskRegistry;
  private readonly monitorRegistry;
  private backgroundAgentResumeService?;
  private readonly backgroundShellRegistry;
  private readonly workflowRunRegistry;
  private fileReadCache;
  private extensionManager;
  private skillManager;
  private permissionManager;
  private readonly toolInvocationGuard;
  private modelInvocableCommandsProvider;
  private modelInvocableCommandsExecutor;
  private pendingInlineAnnouncedSkillKeys;
  private fileSystemService;
  private contentGeneratorConfig;
  private contentGeneratorConfigSources;
  private contentGenerator;
  private readonly embeddingModel;
  private modelsConfig;
  private readonly modelProvidersConfig?;
  private readonly providerProtocolConfig?;
  private readonly sandbox;
  private targetDir;
  private workspaceContext;
  private readonly debugMode;
  private readonly inputFormat;
  private readonly outputFormat;
  private readonly includePartialMessages;
  private readonly question;
  private readonly systemPrompt;
  private readonly appendSystemPrompt;
  private liveAppendSystemPrompt;
  private readonly coreTools;
  private readonly allowedTools;
  private readonly excludeTools;
  private readonly disabledSlashCommands;
  private readonly disabledSkillNamesProvider;
  private readonly terminalImageRenderSupportProvider;
  private readonly disabledSkillLevels;
  private readonly customSkillDirs;
  private disabledTools;
  private readonly visibleTools;
  private readonly toolSearchThreshold;
  private readonly permissionsAllow;
  private readonly permissionsAsk;
  private readonly permissionsDeny;
  private readonly permissionsAutoMode;
  private readonly toolDiscoveryCommand;
  private readonly toolCallCommand;
  private readonly mcpServerCommand;
  private mcpServers;
  /**
   * Names of MCP servers that were present in the effective server map but
   * disappeared after a runtime reconcile (hot-reload / `/reload`). Used only
   * to give a precise "this MCP server was removed this session" message when
   * the model later calls a tool that no longer exists (see
   * `CoreToolScheduler.getToolNotFoundMessage`). Self-heals: a name is dropped
   * from the set the moment the server reappears in the effective map.
   */
  private readonly recentlyRemovedMcpServers;
  private readonly topTierMcpServers;
  private readonly runtimeMcpServers;
  private readonly lspEnabled;
  private lspClient?;
  private lspInitializationError?;
  private allowedMcpServers?;
  /** Immutable upper bound from `--allowed-mcp-server-names`; see ConfigParameters. */
  private readonly cliAllowedMcpServerNames?;
  private excludedMcpServers?;
  private pendingMcpServers?;
  private readonly mcpToolIdleTimeoutMs;
  /**
   * Guards against concurrent MCP reconcile passes (hot-reload watcher vs.
   * `/reload`). `SettingsWatcher` serializes its own listeners, but `/reload`
   * shares no such lock; without this, two `reinitializeMcpServers` calls could
   * interleave their `discoverAllMcpToolsIncremental` passes. See sub-task 3.
   */
  private mcpReconcileInProgress;
  private mcpReconcilePending;
  /**
   * The in-flight reconcile (pass 1 + its coalesced drain loop), exposed so a
   * call arriving mid-flight can await the same work instead of returning
   * before its coalesced change has actually been applied. Cleared when the
   * loop settles.
   */
  private mcpReconcilePromise;
  private sessionSubagents;
  private userMemory;
  /**
   * The cross-session-stable prefix of the main-session system prompt —
   * the stable → context layers `GeminiClient.getMainSessionSystemInstruction()`
   * assembles before the volatile tails (git status, auto-memory). Recorded
   * so the Anthropic converter can place an early cache breakpoint on the
   * stable prefix; consumers match it via `startsWith` and fail open to the
   * single-block layout when it doesn't match the request's system text.
   */
  private staticSystemPrefix;
  /**
   * Volatile system-prompt layer: the managed auto-memory section
   * (instructions + MEMORY.md indexes). Kept separate from `userMemory`
   * (context files, stable in-session) because it is rewritten on every
   * memory save — prompt assembly appends it last so a save invalidates
   * the shortest possible cached prompt prefix.
   */
  private autoMemoryPrompt;
  private sdkMode;
  private geminiMdFileCount;
  private conditionalRulesRegistry;
  private readonly contextRuleExcludes;
  private approvalMode;
  private prePlanMode?;
  private approvalModeRevision;
  private manualPlanExitNoticeEventState;
  private manualPlanExitNoticeCursorState;
  private autoModeDenialState;
  private readonly accessibility;
  private readonly showResponseTokensPerSecond;
  private readonly telemetrySettings;
  private readonly telemetryInitializationDeferred;
  private readonly outboundCorrelationSettings;
  private readonly gitCoAuthor;
  private readonly usageStatisticsEnabled;
  private readonly fileReadCacheDisabled;
  private activeTodoReminders;
  private activeTodoWorkChainOwners;
  private activeTodoReminderTurns;
  private geminiClient;
  private baseLlmClient;
  private cronScheduler;
  private readonly fileFiltering;
  private fileDiscoveryService;
  private sessionService;
  private chatRecordingService;
  private goalRuntime;
  private goalRuntimeReady;
  /**
   * A Goal restore held back because the session writer is not accepting
   * writes yet. Settled by {@link startPendingGoalRestore} once the
   * recorder has its lease, or by {@link settlePendingGoalRestore} when the
   * writer never arrives.
   */
  private pendingGoalRestore;
  private goalTurnHost;
  private goalTurnHostUnbind;
  private goalTurnHostGeneration;
  private readonly chatRecordingFailureListeners;
  private fileCheckpointingEnabled;
  private readonly toolResultBudget;
  private fileHistoryService;
  private readonly proxy;
  private cwd;
  private readonly explicitIncludeDirectories;
  private readonly bugCommand;
  private outputLanguageFilePath?;
  private readonly noBrowser;
  private readonly folderTrustFeature;
  private readonly folderTrust;
  private ideMode;
  private readonly maxSessionTurns;
  private readonly maxSubagentDepth;
  private readonly maxWallTimeSeconds;
  private readonly maxToolCalls;
  private readonly clearContextOnIdle;
  private readonly sessionTokenLimit;
  private readonly listExtensions;
  private readonly overrideExtensions?;
  private readonly cliVersion?;
  private runtimeStatusEnabled;
  private readonly experimentalZedIntegration;
  private readonly sessionWriterLeaseEnabled;
  private readonly cronEnabled;
  /** Recurring cron max age in days, resolved once at construction
   * (the setting declares `requiresRestart`); `Infinity` = no expiry. */
  private readonly cronRecurringMaxAgeDays;
  private readonly agentTeamEnabled;
  private readonly artifactEnabled;
  private readonly artifactAutoOpen;
  private readonly artifactPublisher;
  private readonly artifactHost?;
  private readonly artifactOss?;
  private workflowsEnabled;
  private readonly skipWorkflowUsageWarning;
  private readonly computerUseEnabled;
  private readonly computerUseMaxImageDimension?;
  private readonly computerUseIdleTimeoutMs?;
  private readonly emitToolUseSummaries;
  private readonly chatRecordingEnabled;
  private readonly loadMemoryFromIncludeDirectories;
  private readonly importFormat;
  private readonly chatCompression;
  private readonly autoCompactThreshold;
  private readonly interactive;
  private readonly trustedFolder;
  private readonly useRipgrep;
  private readonly useBuiltinRipgrep;
  private readonly shouldUseNodePtyShell;
  private readonly preventSystemSleep;
  private readonly skipNextSpeakerCheck;
  private shellExecutionConfig;
  private arenaManager;
  private arenaManagerChangeCallback;
  private readonly arenaAgentClient;
  private teamManager;
  private teamManagerChangeCallbacks;
  private teamContext;
  private readonly agentsSettings;
  private readonly worktreeSettings;
  private readonly skipLoopDetection;
  private readonly maxToolCallsPerTurn;
  private readonly maxToolCallsPerTurnExplicit;
  private readonly skipStartupContext;
  private readonly bareMode;
  private readonly safeMode;
  private readonly warnings;
  private readonly allowedHttpHookUrls;
  private readonly allowPrivateNetworkHooks;
  private readonly onPersistPermissionRuleCallback?;
  private initialized;
  private initializationPromise?;
  private initializationSucceeded;
  private initializationSettled;
  private shutdownRequested;
  private resourceShutdownAfterInitializationScheduled;
  private resourceShutdownPromise?;
  private proxyDispatcherReady?;
  storage: Storage;
  private runtimeStatusWrite;
  private readonly fileExclusions;
  private readonly truncateToolOutputThreshold;
  private readonly truncateToolOutputLines;
  private readonly toolOutputBatchBudget;
  private readonly shellDefaultTimeoutMs;
  private readonly shellHeartbeatIntervalMs;
  private readonly eventEmitter?;
  private readonly channel;
  private readonly jsonFd;
  private readonly jsonFile;
  private readonly jsonSchema;
  private readonly inputFile;
  private readonly plansDir;
  private readonly plansDirectoryConfigured;
  private readonly defaultFileEncoding;
  private readonly enableManagedAutoMemory;
  private readonly enableManagedAutoDream;
  private readonly enableTeamMemory;
  private readonly enableTeamMemorySync;
  private readonly teamMemoryShareabilityChecked;
  private enableAutoSkill;
  private readonly autoSkillConfirm;
  private readonly memoryAgentTimeoutMinutes;
  private readonly memoryAgentMaxTurns;
  private fastModel?;
  private readonly webSearchSettings?;
  private webSearchNoticeEmitted;
  private visionModel?;
  private compactionModel?;
  private imageModel?;
  private readonly visionBridgeTimeoutMs;
  private readonly modelFallbacks;
  private readonly disableAllHooks;
  private readonly stopHookBlockingCap;
  /** User-level hooks (always loaded regardless of trust) */
  private readonly userHooks?;
  /** Project-level hooks (only loaded in trusted folders) */
  private readonly projectHooks?;
  /** @deprecated Legacy merged hooks field - use userHooks/projectHooks instead */
  private readonly hooks?;
  private hookSystem?;
  private messageBus?;
  private readonly memoryManager;
  private readonly modelChangeListeners;
  private readonly ownsModelEnvSlot;
  private readonly settingsWatcher?;
  constructor(params: ConfigParameters);
  /**
   * Must only be called once, throws if called again.
   * @param options Optional initialization options including sendSdkMcpMessage callback
   */
  initialize(options?: ConfigInitializeOptions): Promise<void>;
  private initializeOnce;
  private initializeInternal;
  private activateChatRecording;
  /**
   * In-flight background MCP discovery promise. Captured so non-interactive
   * code paths can await it before invoking the model (see
   * {@link waitForMcpReady}). Undefined when MCP discovery was skipped
   * entirely (bare mode, legacy blocking mode, or no MCP servers).
   */
  private mcpDiscoveryPromise?;
  /**
   * Kicks off MCP server discovery in the background after the synchronous
   * portion of {@link initialize} returns. Errors are logged, never thrown:
   * a broken MCP server must not bring down the cli, and per-server
   * connect/discover failures are already surfaced through the
   * `mcp-client-update` event stream the UI subscribes to.
   *
   * Defensive against partially-stubbed `ToolRegistry` in some tests, where
   * the manager getter is unavailable — we'd rather log-and-skip than crash
   * the init path in tests that don't exercise MCP at all.
   */
  private startMcpDiscoveryInBackground;
  /**
   * Resolves when background MCP discovery has settled (all servers ready,
   * failed, or timed out). Non-interactive code paths (`runNonInteractive`,
   * stream-json, ACP) MUST await this before invoking the model so the
   * first model request sees the same tool surface the legacy
   * synchronous-MCP path produced.
   *
   * Interactive code paths should NOT call this — `AppContainer`'s
   * `mcp-client-update` subscriber handles `setTools()` refreshes
   * progressively without blocking the UI.
   *
   * Resolves immediately when:
   * - bare mode is on (no MCP discovery is started),
   * - `QWEN_CODE_LEGACY_MCP_BLOCKING=1` is set (MCP already discovered
   *   synchronously inside {@link initialize}), or
   * - no MCP servers are configured.
   */
  waitForMcpReady(): Promise<void>;
  /**
   * Returns the names of configured (non-disabled) MCP servers whose
   * discovery did NOT end in a CONNECTED state. Intended to be called by
   * non-interactive entry points AFTER {@link waitForMcpReady} resolves,
   * so they can surface a single user-visible warning summarizing which
   * servers failed.
   *
   * The legacy synchronous MCP path surfaced these failures visibly
   * during `config.initialize()` (because they happened on the main
   * thread and per-server errors logged to stderr). Under PR-A's
   * progressive discovery, per-server errors are caught inside
   * `McpClientManager.discoverAllMcpToolsIncremental` and routed to
   * profiler events + `mcp-client-update` notifications — both of which
   * are invisible to a non-interactive run with only built-in stderr.
   * This helper closes that gap WITHOUT re-introducing the blocking
   * behavior.
   *
   * Returns an empty array when MCP discovery was skipped (bare mode /
   * legacy blocking / no servers configured) or when every configured
   * server settled successfully.
   */
  getFailedMcpServerNames(): string[];
  refreshHierarchicalMemory(
    loadReason?: Exclude<InstructionLoadReason, 'include'>,
  ): Promise<void>;
  private recordAutoMemoryIndexRead;
  private buildMemoryContextWarning;
  private getMemoryDiscoveryDirectories;
  getConditionalRulesRegistry(): ConditionalRulesRegistry | undefined;
  /**
   * Update the conditional rules registry. Called after external refresh
   * paths (e.g. /memory refresh or /directory add) that bypass
   * refreshHierarchicalMemory().
   */
  setConditionalRulesRegistry(
    registry: ConditionalRulesRegistry | undefined,
  ): void;
  getContextRuleExcludes(): string[];
  getContentGenerator(): ContentGenerator;
  /**
   * Get the ModelsConfig instance for model-related operations.
   * External code (e.g., CLI) can use this to access model configuration.
   */
  getModelsConfig(): ModelsConfig;
  /**
   * Updates the credentials in the generation config.
   * Exclusive for `OpenAIKeyPrompt` to update credentials via `/auth`
   * Delegates to ModelsConfig.
   */
  updateCredentials(
    credentials: {
      apiKey?: string;
      baseUrl?: string;
      model?: string;
    },
    settingsGenerationConfig?: Partial<ContentGeneratorConfig>,
  ): void;
  /**
   * Reload model providers configuration at runtime.
   * This enables hot-reloading of modelProviders settings without restarting the CLI.
   * Should be called before refreshAuth when settings.json has been updated.
   *
   * @param modelProvidersConfig - The updated model providers configuration
   * @param providerProtocolConfig - Updated provider->protocol map; `undefined`
   *   preserves the existing map (see {@link ModelRegistry.reloadModels}).
   */
  reloadModelProvidersConfig(
    modelProvidersConfig?: ModelProvidersConfig,
    providerProtocolConfig?: ProviderProtocolConfig,
  ): void;
  /**
   * Refresh authentication and rebuild ContentGenerator.
   */
  refreshAuth(authMethod: AuthType, isInitialAuth?: boolean): Promise<void>;
  /**
   * Provides access to the BaseLlmClient for stateless LLM operations.
   */
  getBaseLlmClient(): BaseLlmClient;
  getSessionId(): string;
  setSessionSource(sourceType: string, sourceId?: string): void;
  getSessionSourceType(): string | undefined;
  getSessionSourceId(): string | undefined;
  /**
   * Returns warnings generated during configuration resolution.
   * These warnings are collected from model configuration resolution
   * and should be displayed to the user during startup.
   */
  getWarnings(): string[];
  getDebugLogger(): DebugLogger;
  /**
   * Starts a new session and resets session-scoped services.
   */
  startNewSession(sessionId?: string, sessionData?: ResumedSessionData): string;
  /**
   * Marks this Config as the owner of a runtime.json sidecar for the
   * current PID. Call once after the initial sidecar write succeeds
   * (typically from the interactive UI bootstrap). When set, subsequent
   * startNewSession() calls will refresh the sidecar on session swap;
   * when unset, startNewSession() leaves sibling sidecars alone so a
   * short-lived non-interactive process can't trample a concurrent
   * shell's sidecar that happens to share the outgoing session id.
   */
  markRuntimeStatusEnabled(): void;
  private queueRuntimeStatusWrite;
  private flushRuntimeStatusWrites;
  private refreshCurrentRuntimeStatus;
  /**
   * Returns the resumed session data if this session was resumed from a previous one.
   */
  getResumedSessionData(): ResumedSessionData | undefined;
  shouldLoadMemoryFromIncludeDirectories(): boolean;
  getImportFormat(): 'tree' | 'flat';
  getContentGeneratorConfig(): ContentGeneratorConfig;
  getContentGeneratorConfigSources(): ContentGeneratorConfigSources;
  getModel(): string;
  getCurrentModelRegistryBaseUrl(): string | null | undefined;
  /**
   * Resolve the effective input modalities of the current primary model. The
   * content generator config always carries resolved modalities (name-based
   * detection fills them in, defaulting unknown models to text-only), which is
   * the same source the file reader uses to decide media support. Used to
   * decide whether the vision bridge should run.
   *
   * @returns The resolved input modalities. Unknown models are treated as
   * text-only so bridge features can conservatively adapt image inputs.
   */
  getEffectiveInputModalities(): InputModalities;
  /**
   * Get the human-readable display name for the currently selected model.
   * Resolves the model id to its name from the model registry.
   * Falls back to the raw model id when the model is not found.
   */
  getModelDisplayName(): string;
  onModelChange(listener: (model: string) => void): () => void;
  private notifyModelChangeListeners;
  private publishModelEnv;
  /**
   * Returns the configured fast model selector when it resolves to an available
   * model. Bare selectors stay bare and authType-qualified selectors keep their
   * authType prefix so selector-aware runtime paths can route cross-auth calls.
   */
  getFastModel(): string | undefined;
  /**
   * Settings for the built-in WebSearch tool. Undefined when the feature was
   * never configured.
   */
  getWebSearchSettings(): WebSearchSettings | undefined;
  private resolveFastModelSelector;
  /**
   * Update the fast model at runtime (e.g., when the user runs `/model --fast <model>`).
   * Pass undefined or an empty string to clear the fast model override.
   */
  setFastModel(model: string | undefined): void;
  /**
   * Update the vision bridge model at runtime (e.g. `/model --vision <model>`).
   * Pass undefined or an empty string to clear the override and fall back to
   * same-provider auto-select.
   */
  setVisionModel(model: string | undefined): void;
  /**
   * Resolve the compaction model for chat compression (auto-compaction).
   * Priority: compactionModel (if set) → main model.
   */
  getCompactionModel(): string | undefined;
  private resolveCompactionModelSelector;
  /**
   * Update the compaction model at runtime (e.g. `/model --compaction <model>`).
   * Pass undefined or an empty string to clear the override and fall back to
   * the main model.
   */
  setCompactionModel(model: string | undefined): void;
  /**
   * Update the image generation model and make the tool available immediately
   * when the selected provider route is valid.
   */
  setImageModel(model: string | undefined): Promise<void>;
  /**
   * Return the ordered list of fallback model IDs configured for this session.
   * The list is already normalized (deduplicated, capped at 3, blanks removed).
   * Returns an empty array when no fallbacks are configured.
   */
  getModelFallbacks(): readonly string[];
  /**
   * Read the active reasoning-effort tier from the live content-generator
   * config. Returns undefined when thinking is disabled (`reasoning: false`) or
   * no tier is set (the model/provider default applies).
   */
  getReasoningEffort(): ReasoningEffort | undefined;
  /**
   * Return a higher-priority static DashScope knob that shadows the current
   * global effort on qwen3.8-max, so interactive callers can report the
   * effective outcome instead of confirming a tier that will not reach the
   * wire. The provider resolves extra_body before samplingParams before the
   * unified reasoning setting; same-layer explicit effort still wins budget.
   */
  getReasoningEffortOverride(): ReasoningEffortOverride | undefined;
  /**
   * Update the reasoning-effort tier at runtime (e.g. `/effort high`). The
   * request pipeline reads `reasoning.effort` per request, so mutating the live
   * config in place takes effect on the next turn without an auth refresh.
   * Provider adapters clamp the tier to what the active model supports. Pass
   * undefined to clear the override and fall back to the model/provider default.
   *
   * No-op when thinking is explicitly disabled (`reasoning: false`) so effort
   * cannot silently re-enable it.
   */
  setReasoningEffort(effort: ReasoningEffort | undefined): void;
  /**
   * Whether `model` is the same entry as the current primary model — matched on
   * the provider identity (auth type, and baseUrl when both carry one), not just
   * the bare id. The vision bridge must never route at the primary (it's the
   * text-only model the bridge works around), but a cross-provider namesake —
   * the same bare id on another provider/endpoint, e.g. `anthropic:shared-model`
   * vs an `openai` `shared-model` primary — is a different model and stays
   * eligible. When the primary's auth type is unknown we can't disambiguate, so
   * fall back to a conservative bare-id match (never risk hitting the primary).
   */
  isCurrentPrimaryModel(model: AvailableModel): boolean;
  /**
   * Resolve the user's explicit `visionModel` (set via `/model --vision`) into a
   * bridge selection. The selected id is auth-qualified so `runSideQuery`
   * resolves the exact provider route; the endpoint is looked up for the egress
   * notice. Returns `undefined` (so the caller falls back to
   * same-provider auto-select) when no explicit model is set, the selector can't
   * be parsed, the pinned model isn't actually configured, or it points at the
   * text-only primary itself — those guards keep a stale/typo'd pin from firing
   * the bridge at an unreachable, or non-image-capable, model.
   */
  private resolveVisionModelSelection;
  /**
   * The vision bridge model: the explicit `visionModel` (`/model --vision`) when
   * set, otherwise an auto-picked image-capable model on the SAME provider as
   * the text-only primary (see {@link selectVisionBridgeModel} — auto-select
   * never reaches across providers; an explicit override may). `runSideQuery`
   * resolves the chosen model's credentials by id.
   *
   * @returns The bridge model selection, or `undefined`.
   */
  getDefaultVisionBridgeModel(): VisionBridgeModelSelection | undefined;
  /**
   * Per-attempt timeout in milliseconds for the vision bridge transcription
   * call. Resolves the `visionBridgeTimeoutMs` setting; `undefined` means the
   * bridge's built-in default applies.
   */
  getVisionBridgeTimeoutMs(): number | undefined;
  /**
   * Set model programmatically (e.g., VLM auto-switch, fallback).
   * Delegates to ModelsConfig.
   */
  setModel(
    newModel: string,
    metadata?: {
      reason?: string;
      context?: string;
    },
  ): Promise<void>;
  /**
   * Handle model change from ModelsConfig.
   * This updates the content generator config with the new model settings.
   */
  private handleModelChange;
  /**
   * Get available models for the current authType.
   * Delegates to ModelsConfig.
   */
  getAvailableModels(): AvailableModel[];
  /**
   * Get available models for a specific authType.
   * Delegates to ModelsConfig.
   */
  getAvailableModelsForAuthType(authType: AuthType): AvailableModel[];
  /**
   * Get all configured models across authTypes.
   * Delegates to ModelsConfig.
   */
  getAllConfiguredModels(authTypes?: AuthType[]): AvailableModel[];
  /**
   * Get the fully resolved provider model config (generationConfig defaults
   * applied) for a specific modelProviders entry.
   * Delegates to ModelsConfig.
   */
  getResolvedModelConfig(
    authType: AuthType,
    modelId: string,
    baseUrl?: string,
  ): ResolvedModelConfig | undefined;
  /**
   * Get the currently active runtime model snapshot.
   * Delegates to ModelsConfig.
   */
  getActiveRuntimeModelSnapshot(): RuntimeModelSnapshot | undefined;
  /**
   * Switch authType+model.
   * Supports both registry-backed models and runtime model snapshots.
   *
   * For runtime models, the modelId should be in format `$runtime|${authType}|${modelId}`.
   * This triggers a refresh of the ContentGenerator when required (always on authType changes).
   * For qwen-oauth model switches that are hot-update safe, this may update in place.
   *
   * @param authType - Target authentication type
   * @param modelId - Target model ID (or `$runtime|${authType}|${modelId}` for runtime models)
   * @param options - Additional options like requireCachedCredentials
   */
  switchModel(
    authType: AuthType,
    modelId: string,
    options?: {
      requireCachedCredentials?: boolean;
      baseUrl?: string;
    },
  ): Promise<void>;
  getMaxSessionTurns(): number;
  getMaxSubagentDepth(): number;
  getMaxWallTimeSeconds(): number;
  getMaxToolCalls(): number;
  getClearContextOnIdle(): ClearContextOnIdleSettings;
  getSessionTokenLimit(): number;
  getEmbeddingModel(): string;
  getSandbox(): SandboxConfig | undefined;
  isRestrictiveSandbox(): boolean;
  getTargetDir(): string;
  private getCurrentSessionArtifactMoves;
  private moveFile;
  private moveCurrentSessionArtifacts;
  private prepareSessionArtifactMigration;
  relocateWorkingDirectory(
    newDir: string,
    expectedCanonicalDir?: string,
    opts?: {
      skipProcessChdir?: boolean;
      skipArtifactMigration?: boolean;
    },
  ): Promise<{
    memoryRefreshError?: unknown;
    mcpRefreshError?: unknown;
  }>;
  /**
   * Stashes a one-shot context message that the next user prompt will
   * inject into the model (see {@link pendingStartupWorktreeNotice}). Called
   * from `gemini.tsx` right after `loadCliConfig` when `--worktree` produced
   * a valid worktree. Pass `null` to clear (rarely needed).
   */
  setPendingStartupWorktreeNotice(notice: string | null): void;
  /**
   * Reads and clears the pending startup-worktree notice. Returns `null`
   * when nothing is stashed (the common case). Each entry point (TUI /
   * headless / ACP) calls this on the model's first prompt; a non-null
   * return means the entry point should NOT additionally call
   * `restoreWorktreeContext()` for that prompt — startup overrides resume.
   */
  consumePendingStartupWorktreeNotice(): string | null;
  getProjectRoot(): string;
  getCwd(): string;
  getWorkspaceContext(): WorkspaceContext;
  getToolRegistry(): ToolRegistry;
  /**
   * Shuts down the Config and releases all resources.
   * This method is idempotent and safe to call multiple times.
   * It handles the case where initialization was not completed.
   */
  shutdown(options?: {
    shutdownTelemetry?: boolean;
    skipSessionWriter?: boolean;
    strictResourceCleanup?: boolean;
  }): Promise<void>;
  private shutdownResources;
  private scheduleResourceShutdownAfterInitialization;
  private runResourceShutdown;
  private shutdownResourcesOnce;
  getPromptRegistry(): PromptRegistry;
  getResourceRegistry(): ResourceRegistry;
  getDebugMode(): boolean;
  getQuestion(): string | undefined;
  getSystemPrompt(): string | undefined;
  getAppendSystemPrompt(): string | undefined;
  setLiveAppendSystemPrompt(prompt: string | undefined): void;
  /** @deprecated Use getPermissionsAllow() instead. */
  getCoreTools(): string[] | undefined;
  /**
   * Returns the merged allow-rules for PermissionManager.
   *
   * This merges all sources so that PermissionManager receives a single,
   * authoritative list:
   *   - settings.permissions.allow (persistent rules from all scopes)
   *   - allowedTools param (SDK / argv auto-approve list)
   *
   * Note: coreTools is intentionally excluded here — it has whitelist semantics
   * (only listed tools are registered), not auto-approve semantics. It is
   * handled separately via PermissionManager.coreToolsAllowList.
   *
   * CLI callers (loadCliConfig) already pre-merge argv into permissionsAllow
   * before constructing Config, so those fields will be empty for CLI usage.
   * SDK callers construct Config directly and rely on allowedTools.
   */
  getPermissionsAllow(): string[];
  getPermissionsAsk(): string[];
  /**
   * Returns the merged deny-rules for PermissionManager.
   *
   * Merges:
   *   - settings.permissions.deny (persistent rules from all scopes)
   *   - excludeTools param (SDK / argv blocklist)
   *
   * CLI callers pre-merge argv.excludeTools into permissionsDeny.
   */
  getPermissionsDeny(): string[];
  getToolDiscoveryCommand(): string | undefined;
  /**
   * Returns the pre-merged list of slash command names that should be hidden
   * from the CLI surface. Callers should treat this as a case-insensitive
   * denylist; `CommandService.create` handles the normalization.
   */
  getDisabledSlashCommands(): readonly string[];
  /**
   * Returns the live set of skill names that are currently disabled.
   * Unlike `getDisabledSlashCommands()` (frozen snapshot), this delegates
   * to the provider supplied at construction so the CLI's `LoadedSettings`
   * mutations are visible without restarting the process.
   *
   * Names are lower-cased. Empty set when no provider was supplied.
   */
  getDisabledSkillNames(): ReadonlySet<string>;
  /**
   * Returns skill discovery levels excluded through
   * `settings.skills.disabledLevels`.
   */
  getDisabledSkillLevels(): ReadonlySet<SkillLevel>;
  /**
   * Returns additional skill directories from `settings.skills.directories`.
   * Paths are raw (unexpanded); consumers must handle `~` expansion
   * (see `SkillManager.getSkillsBaseDirs`).
   */
  getCustomSkillDirs(): readonly string[];
  /**
   * Returns the read-only set of tool names hidden from this Config's
   * ToolRegistry. Consulted by `ToolRegistry.registerTool` and
   * `ToolRegistry.registerFactory` to skip registration.
   *
   * Mutability semantics: the snapshot is
   * mutable via `setDisabledTools()` so the daemon's
   * `setWorkspaceToolEnabled` route can re-sync the set after a
   * `tools.disabled` settings write — without that sync, the
   * documented "toggle + restart" workflow would re-register the
   * just-disabled MCP tool against the bootstrap snapshot.
   *
   * Already-registered tools are NOT retroactively unregistered:
   * `ToolRegistry` consults the set at registration time only, so a
   * mid-session disable only takes effect on the next `registerTool`
   * call (next ACP child spawn, MCP rediscover, etc.). This matches
   * the documented "toggling does not unregister live tools"
   * contract.
   *
   * See `disabledTools` in ConfigParameters and `setDisabledTools`
   * for the runtime sync entry point.
   */
  getDisabledTools(): ReadonlySet<string>;
  /**
   * Deferred-tool names that should be visible from session start.
   * Sourced from `settings.tools.visible`.
   *
   * These tools bypass `shouldDefer` in `getFunctionDeclarations()`
   * and are excluded from `getDeferredToolSummary()` so they appear
   * as first-class tools to the model.
   */
  getVisibleTools(): ReadonlySet<string>;
  /**
   * Percentage of the context window used as the session-start budget for
   * preloading deferred tools. See
   * {@link ConfigParameters.toolSearchThreshold}.
   */
  getToolSearchThreshold(): number;
  /**
   * Replace the in-process `disabledTools`
   * snapshot with a fresh set sourced from the workspace settings.
   * Intended for the `qwen serve` mutation surface
   * (`setWorkspaceToolEnabled` → ACP `qwen/control/...` → here): the
   * settings file is the source of truth, and this setter keeps the
   * in-memory Config in sync so a subsequent MCP rediscovery / next
   * tool registration honors the just-toggled value.
   *
   * Already-registered tools are NOT retroactively unregistered
   * `ToolRegistry` consults the set at registration time only, which
   * matches the documented "toggling does not unregister live tools"
   * contract.
   */
  setDisabledTools(disabled: ReadonlySet<string>): void;
  getToolCallCommand(): string | undefined;
  getMcpServerCommand(): string | undefined;
  /**
   * optional workspace-shared MCP transport pool
   * injected by the daemon-mode `QwenAgent`. When set, the wrapping
   * `ToolRegistry` threads it into `McpClientManager`, which delegates
   * non-SDK MCP server discovery to the pool instead of spawning its
   * own per-session `McpClient`. Standalone `qwen` (non-daemon) leaves
   * this `undefined` and the manager keeps its previous behavior.
   *
   * Eagerly instantiated by `QwenAgent` (per Q6 resolved); the
   * pool itself is lazy w.r.t. actual MCP work — it spawns nothing
   * until the first `acquire()` from a session.
   */
  private mcpTransportPool?;
  setMcpTransportPool(
    pool: import('../tools/mcp-transport-pool.js').McpTransportPool | undefined,
  ): void;
  getMcpTransportPool():
    | import('../tools/mcp-transport-pool.js').McpTransportPool
    | undefined;
  /**
   * T2.8: return the raw settings-layer MCP servers map (without the
   * runtime overlay or extension contributions). Used by
   * `McpClientManager.addRuntimeMcpServer` to detect shadow-over-
   * settings (a runtime entry whose name collides with a pre-existing
   * settings entry).
   */
  getSettingsMcpServers(): Record<string, MCPServerConfig> | undefined;
  /**
   * Session-injected + `--mcp-config` ("top-tier") servers captured at boot, so
   * the hot-reload subscriber can re-assemble the effective MCP map exactly the
   * way boot did. See sub-task 3 and `assembleMcpServers`.
   */
  getTopTierMcpServers(): Record<string, MCPServerConfig> | undefined;
  /**
   * The merged MCP server map (settings + extensions + runtime overlay) WITHOUT
   * any admission filtering. `getMcpServers()` is this map with the
   * `allowedMcpServers` filter applied; the unfiltered form is what tells us a
   * server is "configured" regardless of allow-list / excluded / pending gating
   * (used to classify why a server is unavailable — see
   * {@link getMcpServerUnavailableReason}).
   */
  private getMergedMcpServers;
  getMcpServers(): Record<string, MCPServerConfig> | undefined;
  getExcludedMcpServers(): string[] | undefined;
  setExcludedMcpServers(excluded: string[]): void;
  getMcpToolIdleTimeoutMs(): number;
  isMcpServerDisabled(serverName: string): boolean;
  /**
   * True for a project-scoped (`.mcp.json`) server that the user has not
   * approved (pending or rejected). The discovery layer skips these BEFORE any
   * stdio spawn / transport / health check, so inspecting an untrusted
   * `.mcp.json` has no side effects. See issue #4615.
   */
  isMcpServerPendingApproval(serverName: string): boolean;
  /**
   * Drop a project server from the pending-approval set after the user approves
   * it mid-session (via the startup dialog), so a subsequent
   * `discoverToolsForServer` connects it instead of skipping it. See issue
   * #4615. No-op for servers that were never pending.
   */
  approveMcpServerForSession(serverName: string): void;
  addMcpServers(servers: Record<string, MCPServerConfig>): void;
  /**
   * Replace the settings-layer MCP server map at runtime (hot-reload).
   * Unlike {@link addMcpServers}, this bypasses the `initialized` guard and
   * REPLACES (not merges) so removals take effect. The runtime overlay
   * ({@link addRuntimeMcpServer}) and extension contributions are unaffected —
   * {@link getMcpServers} still layers them on top. See sub-task 3.
   */
  setMcpServers(servers: Record<string, MCPServerConfig> | undefined): void;
  /**
   * Replace the allow-list of MCP server names at runtime (hot-reload). When
   * set, {@link getMcpServers} only yields servers whose name is in this list.
   * `allowedMcpServers` is consulted as a filter inside `getMcpServers()`, so
   * without this setter an allow-list edit would silently require a restart.
   */
  setAllowedMcpServers(allowed: string[] | undefined): void;
  getAllowedMcpServers(): string[] | undefined;
  /**
   * The startup `--allowed-mcp-server-names` upper bound (the CLI flag only),
   * or undefined if the flag was not passed. The hot-reload recompute caps the
   * settings-derived allow-list to this so a runtime settings edit can narrow
   * MCP admission but never widen it beyond what the launch flag permitted.
   */
  getCliAllowedMcpServerNames(): string[] | undefined;
  /**
   * Replace the pending-approval set of gated MCP server names at runtime
   * (hot-reload). The discovery layer skips these BEFORE any connection side
   * effect, so a hot-reload must recompute them (#4615) lest it connect a
   * newly-added but unapproved `.mcp.json`/workspace server.
   */
  setPendingMcpServers(pending: string[] | undefined): void;
  /**
   * Snapshot of the three connection-admission lists consulted by discovery,
   * used by the hot-reload subscriber as the pre-image to diff against. Paired
   * with {@link setExcludedMcpServers} / {@link setAllowedMcpServers} /
   * {@link setPendingMcpServers}.
   */
  getMcpGating(): {
    excluded?: string[];
    allowed?: string[];
    pending?: string[];
  };
  /**
   * Names of MCP servers removed from config during this session by a runtime
   * reconcile and not since re-added. "Removed" means gone from the merged map
   * (settings + extensions + runtime), NOT merely filtered out by an admission
   * gate — a server that is still configured but excluded / not-allowed /
   * pending is reported via {@link getMcpServerUnavailableReason} instead.
   * Consumed by the tool-not-found path.
   */
  getRecentlyRemovedMcpServers(): string[];
  /** All configured MCP server names (merged, before admission gating). */
  getMcpServerNames(): string[];
  /**
   * Why a given MCP server is currently unavailable (its tools aren't usable),
   * or `undefined` if it is configured and admitted (so a missing tool is a
   * genuine "not found" / disconnected, not an admission decision). Lets the
   * tool-not-found path explain the right recovery action. Covers every
   * admission gate:
   * - `removed`: deleted from config this session (see
   *   {@link getRecentlyRemovedMcpServers}).
   * - `not_allowed`: filtered out by the `mcp.allowed` allow-list.
   * - `excluded`: in the `mcp.excluded` list.
   * - `pending_approval`: a gated server awaiting approval (#4615).
   */
  getMcpServerUnavailableReason(
    serverName: string,
  ): McpServerUnavailableReason | undefined;
  /**
   * Apply a new settings-layer MCP map and incrementally reconcile live
   * connections (connect added, disconnect removed, restart changed; unchanged
   * servers untouched). Safe no-op before {@link initialize}. A shared
   * "reconcile in progress" guard serializes against a concurrent caller (e.g.
   * `/reload`): a request arriving mid-flight is coalesced into a single
   * follow-up pass so the latest config always wins. See sub-task 3.
   */
  reinitializeMcpServers(
    servers: Record<string, MCPServerConfig> | undefined,
  ): Promise<void>;
  private refreshMcpServers;
  /**
   * Add a runtime-only MCP server. Unlike `addMcpServers`, this does NOT
   * touch `this.mcpServers` (settings layer) and does not enforce the
   * `initialized` guard — the whole point is post-init mutation from the
   * daemon surface. `getMcpServers()` will overlay these entries on top
   * of the settings layer (Task 5).
   */
  addRuntimeMcpServer(name: string, config: MCPServerConfig): void;
  /**
   * Snapshot the runtime-only MCP servers added via `addRuntimeMcpServer`.
   * Returns a shallow copy so callers can't mutate the private map.
   *
   * Reverse tool channel (issue #5626): a per-session Config built by
   * `newSessionConfig` is independent from the bootstrap/workspace Config and
   * never re-reads runtime additions (they live outside the settings layer
   * `loadCliConfig` reloads). The daemon uses this getter to propagate the
   * bootstrap Config's runtime MCP servers into a freshly created session
   * Config so a session created AFTER a client MCP server was registered still
   * discovers the client-hosted tools. Empty when nothing was runtime-added,
   * so the inheritance step is a no-op in the common case.
   */
  getRuntimeMcpServers(): Record<string, MCPServerConfig>;
  /**
   * Remove a runtime-only MCP server previously added via
   * `addRuntimeMcpServer`. Returns `true` if the entry existed and was
   * removed, `false` otherwise.
   */
  removeRuntimeMcpServer(name: string): boolean;
  isLspEnabled(): boolean;
  getLspClient(): LspClient | undefined;
  getLspStatusSnapshot(): LspStatusSnapshot;
  private createLspStatusSnapshot;
  /**
   * Allows wiring an LSP client after Config construction but before initialize().
   */
  setLspClient(client: LspClient | undefined): void;
  setLspInitializationError(error: Error | string | undefined): void;
  private setRuntimeLspInitializationError;
  reinitializeLsp(): Promise<LspServiceReinitializeResult | undefined>;
  getSessionSubagents(): SubagentConfig[];
  setSessionSubagents(subagents: SubagentConfig[]): void;
  getSdkMode(): boolean;
  setSdkMode(value: boolean): void;
  getUserMemory(): string;
  getStaticSystemPrefix(): string | undefined;
  setStaticSystemPrefix(prefix: string | undefined): void;
  /**
   * The managed auto-memory section of the system prompt (volatile layer).
   * Empty when managed memory is unavailable. Callers assembling a system
   * prompt must append this after all stable/context content.
   */
  getAutoMemoryPrompt(): string;
  getOutputLanguageFilePath(): string | undefined;
  setOutputLanguageFilePath(filePath: string): void;
  setUserMemory(newUserMemory: string): void;
  getGeminiMdFileCount(): number;
  setGeminiMdFileCount(count: number): void;
  getArenaManager(): ArenaManager | null;
  setArenaManager(manager: ArenaManager | null): void;
  /**
   * Register a callback invoked whenever the arena manager changes.
   * Pass `null` to unsubscribe. Only one subscriber is supported.
   */
  onArenaManagerChange(
    cb: ((manager: ArenaManager | null) => void) | null,
  ): void;
  getArenaAgentClient(): ArenaAgentClient | null;
  getAgentsSettings(): AgentsCollabSettings;
  getTeamManager(): TeamManager | null;
  setTeamManager(manager: TeamManager | null): void;
  /**
   * Register a callback invoked whenever the team manager changes.
   * Pass `null` to unsubscribe a previously registered callback.
   * Multiple subscribers are supported.
   */
  onTeamManagerChange(
    cb: ((manager: TeamManager | null) => void) | null,
    previous?: (manager: TeamManager | null) => void,
  ): void;
  getTeamContext(): TeamContext | null;
  setTeamContext(ctx: TeamContext | null): void;
  /**
   * Clean up Team runtime — stops all teammates and clears state.
   */
  cleanupTeamRuntime(): Promise<void>;
  /**
   * Convenience accessor for `worktree.symlinkDirectories` — returns an
   * empty array when the setting is unset, so callers can pass the
   * result directly into the GitWorktreeService loop without nullchecks.
   *
   * (No general `getWorktreeSettings()` getter yet — add one when a
   * second field on `WorktreeSettings` justifies the broader API.)
   */
  getWorktreeSymlinkDirectories(): readonly string[];
  /**
   * Clean up Arena runtime. When `force` is true (e.g., /arena select --discard),
   * always removes worktrees regardless of preserveArtifacts.
   */
  cleanupArenaRuntime(force?: boolean): Promise<void>;
  getApprovalMode(): ApprovalMode;
  /**
   * Returns the AUTO approval mode classifier settings (hints + environment).
   * Returns an empty object when no settings are configured.
   */
  getAutoModeSettings(): AutoModeSettings;
  /**
   * Returns the AUTO mode denialTracking state for the current session.
   * Used by the scheduler to decide whether to fall back from classifier
   * evaluation to manual approval. Session-scoped, never persisted.
   */
  getAutoModeDenialState(): AutoModeDenialState;
  /**
   * Replace the AUTO mode denialTracking state. Caller produces the new
   * state via one of the pure transitions in `permissions/denialTracking.ts`
   * (recordAllow / recordBlock / recordUnavailable / recordFallback*).
   */
  setAutoModeDenialState(state: AutoModeDenialState): void;
  /**
   * Returns the approval mode that was active before entering plan mode.
   * Falls back to DEFAULT if no pre-plan mode was recorded.
   */
  getPrePlanMode(): ApprovalMode;
  getApprovalModeRevision(): number;
  private getManualPlanExitNoticeEventState;
  private getOwnManualPlanExitNoticeCursorState;
  setApprovalMode(
    mode: ApprovalMode,
    options?: {
      /** @deprecated Model origin no longer changes plan-exit approval. */
      enteredByModel?: boolean;
      /**
       * Set by ExitPlanModeTool for user/leader-approved plan exits. Every
       * other PLAN → non-PLAN transition (Shift+Tab, /approval-mode, /plan,
       * ACP setSessionMode, confirm-and-switch) is a manual exit the model
       * was never told about, and queues a one-shot system reminder.
       */
      fromApprovedPlanExit?: boolean;
    },
  ): void;
  /**
   * Claims the latest manual plan-exit notice for this conversation.
   */
  takePendingManualPlanExitNotice(): ManualPlanExitNotice | undefined;
  restorePendingManualPlanExitNotice(version: number): void;
  consumePendingManualPlanExitNotice(): boolean;
  /**
   * Returns the directory where this session's plan file is stored.
   */
  getPlansDir(): string;
  private assertPlansDirWithinTargetDir;
  private assertPlanFilePathWithinTargetDir;
  private addLegacyPlanLocationWarning;
  private getPlanFileNames;
  /**
   * Returns the file path for this session's plan file.
   */
  getPlanFilePath(): string;
  /**
   * Saves a plan to disk for the current session.
   */
  savePlan(plan: string): void;
  /**
   * Loads the plan for the current session, or returns undefined if none exists.
   */
  loadPlan(): string | undefined;
  getInputFormat(): 'text' | 'stream-json';
  getIncludePartialMessages(): boolean;
  getAccessibility(): AccessibilitySettings;
  getShowResponseTokensPerSecond(): boolean;
  getTelemetryEnabled(): boolean;
  isTelemetryInitializationDeferred(): boolean;
  getTelemetryLogPromptsEnabled(): boolean;
  getTelemetryUserId(): string | undefined;
  getTelemetryIncludeSensitiveSpanAttributes(): boolean;
  getTelemetrySensitiveSpanAttributeMaxLength(): number;
  getTelemetryOtlpEndpoint(): string | undefined;
  getTelemetryOtlpProtocol(): 'grpc' | 'http';
  getTelemetryOtlpTracesEndpoint(): string | undefined;
  getTelemetryOtlpLogsEndpoint(): string | undefined;
  getTelemetryOtlpMetricsEndpoint(): string | undefined;
  getTelemetryTarget(): TelemetryTarget;
  getTelemetryResourceAttributes(): Record<string, string>;
  getTelemetryMetricsIncludeSessionId(): boolean;
  getTelemetryResourceAttributeWarnings(): readonly string[];
  /**
   * Whether to inject W3C `traceparent` on outbound `fetch` requests
   * (LLM SDKs, MCP, WebFetch, etc.). Default false — see
   * `OutboundCorrelationSettings` for rationale.
   */
  getOutboundCorrelationPropagateTraceContext(): boolean;
  getTelemetryOutfile(): string | undefined;
  getGitCoAuthor(): GitCoAuthorSettings;
  getGeminiClient(): GeminiClient;
  private getOwnActiveTodoReminders;
  private getOwnActiveTodoWorkChainOwners;
  private getOwnActiveTodoReminderTurns;
  getActiveTodoWorkChainOwner(promptId: string, fallbackOwner?: string): string;
  getActiveTodoReminder(promptId: string): string | undefined;
  /**
   * Reads the reminder for injection, re-issuing it only every
   * ACTIVE_TODO_REMINDER_REFRESH_TURNS tool turns: each injected copy lands in
   * chat history permanently, so per-turn injection would grow the context
   * linearly with tool turns. `force` is for turn-start injections (retry /
   * related automatic turns), which always need the context and reset the
   * cadence.
   */
  takeActiveTodoReminder(promptId: string, force?: boolean): string | undefined;
  setActiveTodoReminder(promptId: string, reminder: string | undefined): void;
  startActiveTodoWorkChain(promptId: string, continuedFrom?: string): void;
  startAutomaticActiveTodoWorkChain(
    promptId: string,
    continuedFrom?: string,
  ): void;
  endAutomaticActiveTodoWorkChain(promptId: string): void;
  /**
   * Session-scoped memory pressure monitor. Child Configs created with
   * `Object.create(parent)` inherit the parent's monitor through the prototype
   * chain until this getter installs an own monitor backed by the inherited
   * pressure config snapshot. This mirrors getFileReadCache()'s isolation
   * contract while keeping type-safe direct field assignment inside the class.
   */
  getMemoryPressureMonitor(): MemoryPressureMonitor | undefined;
  getCronScheduler(): CronScheduler;
  /**
   * Days a recurring cron job lives before auto-expiring; `Infinity`
   * means no expiry. Resolved once at construction (see
   * `resolveCronRecurringMaxAgeDays`) so mid-session env changes cannot
   * make the tool description, tool output, and scheduler disagree.
   */
  getCronRecurringMaxAgeDays(): number;
  isCronEnabled(): boolean;
  isAgentTeamEnabled(): boolean;
  isArtifactEnabled(): boolean;
  isRecordArtifactEnabled(): boolean;
  getArtifactPublisherKind(): 'local' | 'host' | 'oss';
  getArtifactHostConfig(): ArtifactHostConfig | undefined;
  getArtifactOssConfig(): ArtifactOssConfig | undefined;
  resolveImageGenerationModel(
    setting: string | undefined,
  ): ImageGenerationConfig | undefined;
  getImageGenerationConfig(): ImageGenerationConfig | undefined;
  isImageGenerationEnabled(): boolean;
  shouldAutoOpenArtifact(): boolean;
  isWorkflowsEnabled(): boolean;
  setWorkflowsEnabled(enabled: boolean): void;
  /**
   * P5 T7: read the `skipWorkflowUsageWarning` setting. When `true`, the
   * `Workflow` tool suppresses the one-time banner that announces the
   * `QWEN_CODE_MAX_TOKENS_PER_WORKFLOW` env knob. The registry-side
   * `shouldShowUsageWarning()` latch is still session-scoped, so even
   * when this returns `false` the banner fires at most once per
   * process.
   */
  getSkipWorkflowUsageWarning(): boolean;
  isComputerUseEnabled(): boolean;
  /**
   * Configured screenshot longest-edge cap for Computer Use, or `undefined`
   * to leave cua-driver's built-in default (1568) in place. Resolved together
   * with the `QWEN_COMPUTER_USE_MAX_IMAGE_DIMENSION` env override at the point
   * the driver connects (see `resolveMaxImageDimension`).
   */
  getComputerUseMaxImageDimension(): number | undefined;
  getComputerUseIdleTimeoutMs(): number | undefined;
  /**
   * Whether the turn loop should fire a fast-model call after each tool batch
   * to emit a `tool_use_summary` message. Mirrors Claude Code's
   * `CLAUDE_CODE_EMIT_TOOL_USE_SUMMARIES` gate, but defaults to on so the
   * compact-mode UI benefits without configuration.
   *
   * Env overrides (either direction): `QWEN_CODE_EMIT_TOOL_USE_SUMMARIES=0`
   * to force off, `=1` to force on.
   */
  getEmitToolUseSummaries(): boolean;
  getEnableRecursiveFileSearch(): boolean;
  getFileFilteringEnableFuzzySearch(): boolean;
  getFileFilteringRespectGitIgnore(): boolean;
  getFileFilteringRespectQwenIgnore(): boolean;
  getFileFilteringOptions(): FileFilteringOptions;
  /**
   * Gets custom file exclusion patterns from configuration.
   * TODO: This is a placeholder implementation. In the future, this could
   * read from settings files, CLI arguments, or environment variables.
   */
  getCustomExcludes(): string[];
  getFileCheckpointingEnabled(): boolean;
  enableFileCheckpointing(): void;
  getFileHistoryService(): FileHistoryService;
  getProxy(): string | undefined;
  getWorkingDir(): string;
  getBugCommand(): BugCommandSettings | undefined;
  getFileService(): FileDiscoveryService;
  getUsageStatisticsEnabled(): boolean;
  getExtensionContextFilePaths(): string[];
  getExperimentalZedIntegration(): boolean;
  isSessionWriterLeaseEnabled(): boolean;
  getListExtensions(): boolean;
  getExtensionManager(): ExtensionManager;
  /**
   * Get the hook system instance if hooks are enabled.
   * Returns undefined if hooks are not enabled.
   */
  getHookSystem(): HookSystem | undefined;
  /**
   * Fast-path check: returns true only when hooks are enabled AND there are
   * registered hooks for the given event name. Callers can use this to skip
   * expensive MessageBus round-trips when no hooks are configured.
   */
  hasHooksForEvent(eventName: string, sessionId?: string): boolean;
  /**
   * Check if all hooks are disabled.
   */
  getDisableAllHooks(): boolean;
  getStopHookBlockingCap(): number;
  getManagedAutoMemoryEnabled(): boolean;
  /**
   * Whether the git-shared team memory tier is active. Opt-in: off unless the
   * `memory.enableTeamMemory` setting is on. `QWEN_CODE_MEMORY_TEAM` overrides
   * for tests / power users ('0' forces off, '1' forces on).
   */
  getTeamMemoryEnabled(): boolean;
  /**
   * Whether the daemon/session should auto-sync team memory with the git
   * remote (pull + commit + push). Resolves the `memory.enableTeamMemorySync`
   * setting, with env `QWEN_CODE_MEMORY_TEAM_SYNC` ('0'/'1') as an override.
   * Off by default since it mutates the repo and pushes. Inert in bare mode.
   */
  getTeamMemorySyncEnabled(): boolean;
  isManagedMemoryAvailable(): boolean;
  getManagedAutoDreamEnabled(): boolean;
  getAutoSkillEnabled(): boolean;
  /**
   * Toggle auto-skill for the running session. The startup value is copied from
   * settings, so persisting a settings change alone would not take effect until
   * the next launch; the skill-review scheduler reads `getAutoSkillEnabled()`
   * live, so flipping this stops (or resumes) reviews immediately.
   *
   * @remarks `getAutoSkillEnabled()` additionally gates on bare/safe mode, so
   * it can still return false after `setAutoSkillEnabled(true)`.
   */
  setAutoSkillEnabled(enabled: boolean): void;
  getAutoSkillConfirmEnabled(): boolean;
  /**
   * Max runtime in minutes for background memory agents (extraction, dream,
   * remember, skill review). Resolves the `memory.agentTimeoutMinutes`
   * setting. Unset → each agent's built-in default; 0 → no time limit.
   */
  getMemoryAgentTimeoutMinutes(): number | undefined;
  /**
   * Max turns for background memory agents. Resolves the
   * `memory.agentMaxTurns` setting. Unset means each agent's built-in default;
   * 0 disables the turn limit.
   */
  getMemoryAgentMaxTurns(): number | undefined;
  getPreventSystemSleepEnabled(): boolean;
  /**
   * Return the MemoryManager instance created for this Config.
   * Use this to share background-task state (registry, drainer) with memory
   * module runtimes (extract, dream) instead of relying on module-level
   * globals.
   */
  getMemoryManager(): MemoryManager;
  /**
   * Get the message bus instance.
   * Returns undefined if not set.
   */
  getMessageBus(): MessageBus | undefined;
  /**
   * Set the message bus instance.
   * This is called by the CLI layer to inject the MessageBus.
   */
  setMessageBus(messageBus: MessageBus): void;
  /**
   * Get project-level hooks configuration.
   * Returns hooks from workspace settings, only in trusted folders.
   * Used by HookRegistry to load project-specific hooks with proper source attribution.
   */
  getProjectHooks():
    | {
        [K in HookEventName]?: HookDefinition[];
      }
    | undefined;
  /**
   * Get user-level hooks configuration.
   * Returns hooks from user settings, always available regardless of folder trust.
   * Used by HookRegistry to load user-specific hooks with proper source attribution.
   */
  getUserHooks():
    | {
        [K in HookEventName]?: HookDefinition[];
      }
    | undefined;
  getExtensions(): Extension[];
  getActiveExtensions(): Extension[];
  getBlockedMcpServers(): Array<{
    name: string;
    extensionName: string;
  }>;
  getNoBrowser(): boolean;
  isBrowserLaunchSuppressed(): boolean;
  getIdeMode(): boolean;
  getFolderTrustFeature(): boolean;
  /**
   * Returns 'true' if the workspace is considered "trusted".
   * 'false' for untrusted.
   */
  getFolderTrust(): boolean;
  /**
   * Returns the whitelist of allowed HTTP hook URL patterns.
   * If empty, all URLs are allowed (subject to SSRF protection).
   */
  getAllowedHttpHookUrls(): string[];
  /**
   * Returns whether HTTP hooks may target private/link-local IP ranges.
   * Only settable from trusted settings scopes (User/System/SystemDefaults).
   */
  getAllowPrivateNetworkHooks(): boolean;
  isTrustedFolder(): boolean;
  setIdeMode(value: boolean): void;
  getAuthType(): AuthType | undefined;
  getCliVersion(): string | undefined;
  getChannel(): string | undefined;
  /**
   * Get the file descriptor for dual output JSON event stream.
   * When set, the TUI mode will also emit structured JSON events to this fd.
   */
  getJsonFd(): number | undefined;
  /**
   * Get the file path for dual output JSON event stream.
   * When set, the TUI mode will also emit structured JSON events to this file.
   */
  getJsonFile(): string | undefined;
  /**
   * Get the JSON Schema the model's final output must conform to.
   * When set, the non-interactive CLI registers a synthetic
   * `structured_output` tool and ends the session on a valid call.
   */
  getJsonSchema(): Record<string, unknown> | undefined;
  /**
   * Get the file path for remote input commands (bidirectional sync).
   * When set, the TUI mode will watch this file for JSONL commands written
   * by an external process and submit them as user messages.
   */
  getInputFile(): string | undefined;
  /**
   * Get the default file encoding for new files.
   * @returns FileEncodingType
   */
  getDefaultFileEncoding(): FileEncodingType | undefined;
  /**
   * Get the current FileSystemService
   */
  getFileSystemService(): FileSystemService;
  /**
   * Set a custom FileSystemService
   */
  setFileSystemService(fileSystemService: FileSystemService): void;
  getChatCompression(): ChatCompressionSettings | undefined;
  getAutoCompactThreshold(): number | undefined;
  isInteractive(): boolean;
  getTerminalImageRenderSupport(): Promise<TerminalImageRenderSupport>;
  getUseRipgrep(): boolean;
  getUseBuiltinRipgrep(): boolean;
  getShouldUseNodePtyShell(): boolean;
  getSkipNextSpeakerCheck(): boolean;
  getShellExecutionConfig(): ShellExecutionConfig;
  setShellExecutionConfig(config: ShellExecutionConfig): void;
  getScreenReader(): boolean;
  getSkipLoopDetection(): boolean;
  /**
   * Effective per-turn tool-call cap. A configured value <= 0 disables the
   * cap and is returned as Infinity so callers can compare unconditionally
   * (mirrors getTruncateToolOutputThreshold).
   */
  getMaxToolCallsPerTurn(): number;
  /**
   * Whether maxToolCallsPerTurn was explicitly configured (vs. the resolved
   * default). An explicit value is treated as a hard cap (the released
   * contract); the default is treated adaptively (see
   * LoopDetectionService.checkTurnToolCallCap).
   */
  isMaxToolCallsPerTurnExplicit(): boolean;
  getSkipStartupContext(): boolean;
  getBareMode(): boolean;
  /**
   * Safe mode disables all user customizations (context files, hooks,
   * extensions, skills, MCP servers, rules) for troubleshooting.
   */
  isSafeMode(): boolean;
  getTruncateToolOutputThreshold(): number;
  getTruncateToolOutputLines(): number;
  /**
   * Configured default timeout (ms) for foreground shell commands, or
   * `undefined` when unset. The shell tool applies the precedence
   * per-call timeout > this setting > its built-in default, so returning
   * `undefined` here preserves the built-in fallback.
   */
  getShellDefaultTimeoutMs(): number | undefined;
  /**
   * Configured interval (ms) between silent-command heartbeats, or
   * `undefined` when unset (the shell tool falls back to its built-in
   * default). 0 disables heartbeats.
   */
  getShellHeartbeatIntervalMs(): number | undefined;
  getToolOutputBatchBudget(): number;
  trackToolResultBytes(n: number): void;
  getToolResultBytesWritten(): number;
  getOutputFormat(): OutputFormat;
  /**
   * Returns the chat recording service.
   */
  getChatRecordingService(): ChatRecordingService | undefined;
  getGoalRuntime(): GoalRuntime;
  getGoalRuntimeReady(): Promise<GoalRuntime>;
  rebaseGoalRuntimeFromActiveTranscript(): Promise<void>;
  bindGoalTurnHost(host: GoalTurnHost): () => void;
  onChatRecordingFailure(listener: ChatRecordingFailureListener): () => void;
  private createChatRecordingService;
  private initializeGoalRuntime;
  /**
   * Run the restore that {@link initializeGoalRuntime} deferred because the
   * session writer was not yet accepting writes.
   *
   * Called once `activateChatRecording()` has handed the recorder its lease.
   * Deliberately re-reads the records from `sessionData`: activation
   * replaces it with the authoritative transcript loaded under the lease, so
   * the deferred restore sees newer records than the constructor did.
   */
  private startPendingGoalRestore;
  /**
   * Fail a deferred restore that can never run — the writer never became
   * available, or the runtime it belonged to was replaced. Without this the
   * promise behind {@link getGoalRuntimeReady} would stay pending forever
   * and every awaiting caller would hang rather than see the failure.
   */
  private settlePendingGoalRestore;
  private notifyChatRecordingFailure;
  /**
   * Returns the transcript file path for the current session.
   * This is the path to the JSONL file where the conversation is recorded.
   * Returns empty string if chat recording is disabled.
   */
  getTranscriptPath(): string;
  assertCanStartTurn(): Promise<void>;
  hasSessionWriteOwnership(): boolean;
  setSessionWriterReclaimPolicy(policy: 'local' | 'never'): void;
  setSessionWriterTakeoverPolicy(policy: 'never' | 'certified'): void;
  closeSessionWriter(options?: { handoff?: boolean }): Promise<void>;
  private closeSessionWriterOnce;
  private startPendingSessionWriterRelease;
  getSessionRuntimeBaseDir(): string;
  /**
   * Gets or creates a SessionService for managing chat sessions.
   */
  getSessionService(): SessionService;
  getFileExclusions(): FileExclusions;
  getSubagentManager(): SubagentManager;
  getBackgroundTaskRegistry(): BackgroundTaskRegistry;
  getMonitorRegistry(): MonitorRegistry;
  getBackgroundAgentResumeService(): BackgroundAgentResumeService;
  loadPausedBackgroundAgents(
    sessionId?: string,
  ): Promise<ReadonlyArray<import('../agents/background-tasks.js').AgentTask>>;
  consumePendingRecoveredAgentsNotice(): string | null;
  resumeBackgroundAgent(
    agentId: string,
    initialMessage?: string,
  ): Promise<import('../agents/background-tasks.js').AgentTask | undefined>;
  reviveCompletedBackgroundAgent(
    agentId: string,
    initialMessage?: string,
  ): Promise<import('../agents/background-tasks.js').AgentTask | undefined>;
  abandonBackgroundAgent(agentId: string): boolean;
  getBackgroundShellRegistry(): BackgroundShellRegistry;
  getWorkflowRunRegistry(): WorkflowRunRegistry;
  /**
   * Session-scoped cache that tracks Read / Edit / WriteFile operations
   * on files. The cache must be **per-Config-instance** so that each
   * subagent (which gets its own Config) does not inherit the parent's
   * recorded reads via the prototype chain.
   *
   * The wrinkle: every subagent / scoped-agent / fork path in this
   * codebase constructs its Config via `Object.create(parent)`. That
   * does **not** run instance field initializers, so the parent's
   * `fileReadCache` field is reachable on the child only by prototype
   * lookup — i.e. child and parent end up sharing the same cache. The
   * own-property check below detects "this instance was made by
   * Object.create" and lazily attaches a fresh cache, ensuring
   * isolation without requiring every Object.create site to remember
   * to override the field.
   */
  getFileReadCache(): FileReadCache;
  /**
   * When true, ReadFile / Edit / WriteFile must bypass the session
   * FileReadCache entirely and behave as if it did not exist (no
   * `file_unchanged` placeholder, no future prior-read enforcement).
   * Intended as an escape hatch for sessions where the cache's "model
   * has already seen this content earlier in the conversation"
   * assumption is unreliable — e.g. after context compaction or
   * transcript transformation.
   */
  getFileReadCacheDisabled(): boolean;
  /**
   * Whether interactive permission prompts should be auto-denied.
   * True for background agents that have no UI to show prompts.
   * PermissionRequest hooks still run and can override the denial.
   */
  getShouldAvoidPermissionPrompts(): boolean;
  getSkillManager(): SkillManager | null;
  /**
   * Registers a provider that returns model-invocable commands (e.g., bundled
   * skills, user/project file commands, MCP prompts). Called by the CLI's
   * CommandService after initialisation so that the startup snapshot and
   * per-turn drain can include these in the `<available_skills>` listing.
   */
  setModelInvocableCommandsProvider(
    provider: () => ReadonlyArray<{
      name: string;
      description: string;
    }>,
  ): void;
  /**
   * Returns the registered model-invocable commands provider, or null if none
   * has been registered (e.g., in SDK mode).
   */
  getModelInvocableCommandsProvider():
    | (() => ReadonlyArray<{
        name: string;
        description: string;
      }>)
    | null;
  /**
   * Registers an executor that can invoke a model-invocable command by name
   * (e.g., MCP prompts). Returns the prompt content as a string, or null if
   * the command cannot be found or executed. Called by the CLI layer.
   */
  setModelInvocableCommandsExecutor(
    executor: (
      name: string,
      args?: string,
    ) => Promise<ModelInvocableCommandExecutorResult | null>,
  ): void;
  /**
   * Returns the registered model-invocable commands executor, or null if none
   * has been registered (e.g., in SDK mode).
   */
  getModelInvocableCommandsExecutor():
    | ((
        name: string,
        args?: string,
      ) => Promise<ModelInvocableCommandExecutorResult | null>)
    | null;
  /**
   * Records skill keys that were announced inline on a tool result by
   * `coreToolScheduler` (e.g. path-activated conditional skills). The
   * client's `drainSkillAndCommandReminders` consumes these to mark them as
   * announced and avoid a duplicate announcement in the same turn's tail
   * reminder. Keys use the `"skill:<name>"` format matching
   * `GeminiClient.skillEntryKey`.
   */
  addInlineAnnouncedSkillKeys(keys: Iterable<string>): void;
  /**
   * Returns and clears the set of skill keys announced inline since the last
   * consumption. Idempotent — a second call returns an empty set until new
   * keys are added.
   */
  consumeInlineAnnouncedSkillKeys(): Set<string>;
  getPermissionManager(): PermissionManager | null;
  getToolInvocationGuard(): ToolInvocationGuard | undefined;
  /**
   * Returns the callback for persisting permission rules to settings files.
   * Returns undefined if no callback was provided (e.g. SDK mode).
   */
  getOnPersistPermissionRule():
    | ((
        scope: 'project' | 'user',
        ruleType: 'allow' | 'ask' | 'deny',
        rule: string,
      ) => Promise<void>)
    | undefined;
  private registerImageGenerationTool;
  createToolRegistry(
    sendSdkMcpMessage?: SendSdkMcpMessage,
    options?: {
      skipDiscovery?: boolean;
      forSubAgent?: boolean;
    },
  ): Promise<ToolRegistry>;
  /**
   * register the MCP guardrail
   * push-event callback. Acceptable to call at any point in the
   * Config lifecycle — before, during, or after `initialize()`.
   *
   * Two paths:
   * - **Pre-init** (no `toolRegistry` yet): stash on
   *   `pendingMcpBudgetCallback`. `createToolRegistry` will apply it
   *   to the freshly-constructed manager and clear the stash (round
   *   6 fix). The stash is the ONLY way to reach a manager that
   *   doesn't exist yet.
   * - **Late** (`toolRegistry` already exists): dispatch directly to
   *   the existing manager. **DO NOT** also stash — that's the
   *   round-7 fix. Pre-fix, both paths assigned to
   *   `pendingMcpBudgetCallback` regardless, so a subsequent
   *   `createToolRegistry` (subagent override via
   *   `createApprovalModeOverride` /
   *   `buildSubagentContextOverride`) would re-apply the parent
   *   session's callback to the subagent's fresh manager — routing
   *   subagent telemetry through the wrong ACP session.
   *
   * `cb: undefined` clears the registration. `off`-mode managers
   * silently drop the callback (their state machine never runs).
   */
  setMcpBudgetEventCallback(
    cb: ((event: McpBudgetEvent) => void) | undefined,
  ): void;
  private subSessionSpawner?;
  /**
   * Wire the sub-session spawner used by the `create_sub_session` tool. Set by
   * the daemon/ACP session layer (which routes it to the bridge over
   * `extMethod`); left unset in interactive TUI / headless — the tool then
   * reports itself as daemon-only. `undefined` clears it on session teardown.
   */
  setSubSessionSpawner(spawner: SubSessionSpawner | undefined): void;
  /** The injected sub-session spawner, or undefined outside daemon mode. */
  getSubSessionSpawner(): SubSessionSpawner | undefined;
}
