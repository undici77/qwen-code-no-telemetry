/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { EventEmitter } from 'node:events';
import type { ContentGenerator, ContentGeneratorConfig } from '../core/contentGenerator.js';
import type { ContentGeneratorConfigSources } from '../core/contentGenerator.js';
import type { MCPOAuthConfig } from '../mcp/oauth-provider.js';
import type { ShellExecutionConfig } from '../services/shellExecutionService.js';
import type { AnyToolInvocation } from '../tools/tools.js';
import type { ArenaManager } from '../agents/arena/ArenaManager.js';
import { ArenaAgentClient } from '../agents/arena/ArenaAgentClient.js';
import { BaseLlmClient } from '../core/baseLlmClient.js';
import { GeminiClient } from '../core/client.js';
import { AuthType } from '../core/authTypes.js';
import { FileDiscoveryService } from '../services/fileDiscoveryService.js';
import { FileHistoryService } from '../services/fileHistoryService.js';
import { type FileSystemService, type FileEncodingType } from '../services/fileSystemService.js';
import { GitService } from '../services/gitService.js';
import { CronScheduler } from '../services/cronScheduler.js';
import { type SendSdkMcpMessage } from '../tools/mcp-client.js';
import { ToolRegistry } from '../tools/tool-registry.js';
import type { McpBudgetEvent } from '../tools/mcp-client-manager.js';
import type { LspClient, LspStatusSnapshot } from '../lsp/types.js';
import { InputFormat, OutputFormat } from '../output/types.js';
import { PromptRegistry } from '../prompts/prompt-registry.js';
import { SkillManager } from '../skills/skill-manager.js';
import { PermissionManager } from '../permissions/permission-manager.js';
import { type AutoModeDenialState } from '../permissions/denialTracking.js';
import { SubagentManager } from '../subagents/subagent-manager.js';
import type { SubagentConfig } from '../subagents/types.js';
import { BackgroundTaskRegistry } from '../agents/background-tasks.js';
import { MonitorRegistry } from '../services/monitorRegistry.js';
import { BackgroundAgentResumeService } from '../agents/background-agent-resume.js';
import { BackgroundShellRegistry } from '../services/backgroundShellRegistry.js';
import { FileReadCache } from '../services/fileReadCache.js';
import { type TelemetryTarget } from '../telemetry/index.js';
import { ExtensionManager, type Extension } from '../extension/extensionManager.js';
import { HookSystem } from '../hooks/index.js';
import { MessageBus } from '../confirmation-bus/message-bus.js';
import { type HookEventName, type HookDefinition } from '../hooks/types.js';
import { FileExclusions } from '../utils/ignorePatterns.js';
import { WorkspaceContext } from '../utils/workspaceContext.js';
import type { FileFilteringOptions } from './constants.js';
import { DEFAULT_FILE_FILTERING_OPTIONS, DEFAULT_MEMORY_FILE_FILTERING_OPTIONS } from './constants.js';
import { Storage } from './storage.js';
import { ChatRecordingService } from '../services/chatRecordingService.js';
import { SessionService, type ResumedSessionData } from '../services/sessionService.js';
import { ConditionalRulesRegistry } from '../utils/rulesDiscovery.js';
import { type DebugLogger } from '../utils/debugLogger.js';
import { MemoryManager } from '../memory/manager.js';
import { ModelsConfig, type ModelProvidersConfig, type AvailableModel, type RuntimeModelSnapshot } from '../models/index.js';
import type { ClaudeMarketplaceConfig } from '../extension/claude-converter.js';
export type { AnyToolInvocation, FileFilteringOptions, MCPOAuthConfig };
export { DEFAULT_FILE_FILTERING_OPTIONS, DEFAULT_MEMORY_FILE_FILTERING_OPTIONS, };
export declare enum ApprovalMode {
    PLAN = "plan",
    DEFAULT = "default",
    AUTO_EDIT = "auto-edit",
    AUTO = "auto",
    YOLO = "yolo"
}
export declare const APPROVAL_MODES: ApprovalMode[];
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
    hints?: {
        /** Natural-language descriptions of actions the user wants AUTO mode to allow. */
        allow?: string[];
        /** Natural-language descriptions of actions the user wants AUTO mode to block. */
        deny?: string[];
    };
    /** Environment / context lines injected into the classifier's system prompt. */
    environment?: string[];
}
export interface AccessibilitySettings {
    enableLoadingPhrases?: boolean;
    screenReader?: boolean;
}
export interface BugCommandSettings {
    urlTemplate: string;
}
export interface ChatCompressionSettings {
    contextPercentageThreshold?: number;
    /**
     * Estimated tokens for a single inline image / document part when
     * apportioning chars across history in `findCompressSplitPoint`.
     * Also used as the placeholder budget when stripping inline media
     * out of the side-query compaction prompt. Default 1600.
     * Env override: `QWEN_IMAGE_TOKEN_ESTIMATE`.
     */
    imageTokenEstimate?: number;
}
/**
 * Settings for clearing stale context after idle periods.
 * Threshold values of -1 mean "never clear" (disabled).
 */
export interface ClearContextOnIdleSettings {
    /** Minutes idle before clearing old tool results. Default 60. Use -1 to disable. */
    toolResultsThresholdMinutes?: number;
    /** Number of most-recent tool results to preserve. Default 5. */
    toolResultsNumToKeep?: number;
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
    includeSensitiveSpanAttributes?: boolean;
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
export type GitCoAuthorParam = boolean | {
    commit?: boolean;
    pr?: boolean;
};
export type ExtensionOriginSource = 'QwenCode' | 'Claude' | 'Gemini';
export interface ExtensionInstallMetadata {
    source: string;
    type: 'git' | 'local' | 'link' | 'github-release' | 'npm';
    originSource?: ExtensionOriginSource;
    releaseTag?: string;
    registryUrl?: string;
    ref?: string;
    autoUpdate?: boolean;
    allowPreRelease?: boolean;
    marketplaceConfig?: ClaudeMarketplaceConfig;
    pluginName?: string;
}
export declare const DEFAULT_TRUNCATE_TOOL_OUTPUT_THRESHOLD = 25000;
export declare const DEFAULT_TRUNCATE_TOOL_OUTPUT_LINES = 1000;
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
    readonly type?: "sdk" | undefined;
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
    constructor(command?: string | undefined, args?: string[] | undefined, env?: Record<string, string> | undefined, cwd?: string | undefined, url?: string | undefined, httpUrl?: string | undefined, headers?: Record<string, string> | undefined, tcp?: string | undefined, timeout?: number | undefined, trust?: boolean | undefined, description?: string | undefined, includeTools?: string[] | undefined, excludeTools?: string[] | undefined, extensionName?: string | undefined, oauth?: MCPOAuthConfig | undefined, authProviderType?: AuthProviderType | undefined, targetAudience?: string | undefined, targetServiceAccount?: string | undefined, type?: "sdk" | undefined, 
    /**
     * Per-server cap on the discovery handshake (`connect` + `tools/list` +
     * `prompts/list` + `resources/list`). Defaults: 30s for stdio servers,
     * 5s for remote HTTP/SSE. Tool-call timeout (`timeout` above) is
     * unaffected — a long-running tool invocation is not a startup
     * pathology. Appended at the end of the parameter list to avoid
     * shifting positional arguments at the many `new MCPServerConfig(...)`
     * call sites.
     */
    discoveryTimeoutMs?: number | undefined);
}
/**
 * Check if an MCP server config represents an SDK server
 */
export declare function isSdkMcpServerConfig(config: MCPServerConfig): boolean;
export declare enum AuthProviderType {
    DYNAMIC_DISCOVERY = "dynamic_discovery",
    GOOGLE_CREDENTIALS = "google_credentials",
    SERVICE_ACCOUNT_IMPERSONATION = "service_account_impersonation"
}
export interface SandboxConfig {
    command: 'docker' | 'podman' | 'sandbox-exec';
    image: string;
}
/**
 * Settings shared across multi-agent collaboration features
 * (Arena, Team, Swarm).
 */
export interface AgentsCollabSettings {
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
     * Tool names hidden from the registry at construction time. Unlike
     * `permissions.deny` (which keeps the tool registered and rejects
     * invocation), tools listed here are not registered at all and never
     * appear in `/tools`, `getAllTools()`, or function-call discovery.
     * Sourced from `settings.tools.disabled` and the daemon mutation route
     * `POST /workspace/tools/:name/enable {enabled:false}` (#4175 Wave 4 PR
     * 17). Active sessions retain already-registered tools — the disabled
     * set is consulted at register time, so toggling takes effect on the
     * next ACP child spawn or `ToolRegistry.refresh()`.
     */
    disabledTools?: string[];
    /** Merged permission rules from all sources (settings + CLI args). */
    permissions?: {
        allow?: string[];
        ask?: string[];
        deny?: string[];
        /** Settings consumed by the AUTO approval mode classifier. */
        autoMode?: AutoModeSettings;
    };
    toolDiscoveryCommand?: string;
    toolCallCommand?: string;
    mcpServerCommand?: string;
    mcpServers?: Record<string, MCPServerConfig>;
    lsp?: {
        enabled?: boolean;
    };
    lspClient?: LspClient;
    userMemory?: string;
    geminiMdFileCount?: number;
    approvalMode?: ApprovalMode;
    contextFileName?: string | string[];
    accessibility?: AccessibilitySettings;
    telemetry?: TelemetrySettings;
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
        enableRecursiveFileSearch?: boolean;
        enableFuzzySearch?: boolean;
    };
    checkpointing?: boolean;
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
    clearContextOnIdle?: ClearContextOnIdleSettings;
    sessionTokenLimit?: number;
    experimentalZedIntegration?: boolean;
    cronEnabled?: boolean;
    emitToolUseSummaries?: boolean;
    listExtensions?: boolean;
    overrideExtensions?: string[];
    allowedMcpServers?: string[];
    excludedMcpServers?: string[];
    noBrowser?: boolean;
    folderTrustFeature?: boolean;
    folderTrust?: boolean;
    ideMode?: boolean;
    authType?: AuthType;
    generationConfig?: Partial<ContentGeneratorConfig>;
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
    interactive?: boolean;
    trustedFolder?: boolean;
    defaultFileEncoding?: FileEncodingType;
    useRipgrep?: boolean;
    useBuiltinRipgrep?: boolean;
    shouldUseNodePtyShell?: boolean;
    skipNextSpeakerCheck?: boolean;
    shellExecutionConfig?: ShellExecutionConfig;
    skipLoopDetection?: boolean;
    truncateToolOutputThreshold?: number;
    truncateToolOutputLines?: number;
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
    /** Model providers configuration grouped by authType */
    modelProvidersConfig?: ModelProvidersConfig;
    /** Multi-agent collaboration settings (Arena, Team, Swarm) */
    agents?: AgentsCollabSettings;
    /** Enable managed auto-memory background extraction and dream. Defaults to true. */
    enableManagedAutoMemory?: boolean;
    /** Enable managed auto-dream consolidation separately from extraction. Defaults to true. */
    enableManagedAutoDream?: boolean;
    /** Enable automatic project skill review after tool-heavy sessions. Defaults to false. */
    enableAutoSkill?: boolean;
    /**
     * Lightweight model for background tasks (memory extraction, dream, /btw side questions).
     * When set and valid for the current auth type, forked agents use this model instead of
     * the main session model, reducing latency and cost.
     * Corresponds to the `fastModel` setting (configurable via `/model --fast`).
     */
    fastModel?: string;
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
     * Callback for persisting a permission rule to settings.
     * Injected by the CLI layer; core uses this to write allow/ask/deny rules
     * to project or user settings when the user clicks "Always Allow".
     *
     * @param scope - 'project' for workspace settings, 'user' for user settings.
     * @param ruleType - 'allow' | 'ask' | 'deny'.
     * @param rule - The raw rule string, e.g. "Bash(git *)" or "Edit".
     */
    onPersistPermissionRule?: (scope: 'project' | 'user', ruleType: 'allow' | 'ask' | 'deny', rule: string) => Promise<void>;
}
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
}
export declare class Config {
    private sessionId;
    private sessionData?;
    private debugLogger;
    private toolRegistry;
    /**
     * PR 14b fix #2 (codex review round 1): callback stashed BEFORE
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
    private subagentManager;
    private readonly backgroundTaskRegistry;
    private readonly monitorRegistry;
    private backgroundAgentResumeService?;
    private readonly backgroundShellRegistry;
    private fileReadCache;
    private extensionManager;
    private skillManager;
    private permissionManager;
    private modelInvocableCommandsProvider;
    private modelInvocableCommandsExecutor;
    private fileSystemService;
    private contentGeneratorConfig;
    private contentGeneratorConfigSources;
    private contentGenerator;
    private readonly embeddingModel;
    private modelsConfig;
    private readonly modelProvidersConfig?;
    private readonly sandbox;
    private readonly targetDir;
    private workspaceContext;
    private readonly debugMode;
    private readonly inputFormat;
    private readonly outputFormat;
    private readonly includePartialMessages;
    private readonly question;
    private readonly systemPrompt;
    private readonly appendSystemPrompt;
    private readonly coreTools;
    private readonly allowedTools;
    private readonly excludeTools;
    private readonly disabledSlashCommands;
    private readonly disabledTools;
    private readonly permissionsAllow;
    private readonly permissionsAsk;
    private readonly permissionsDeny;
    private readonly permissionsAutoMode;
    private readonly toolDiscoveryCommand;
    private readonly toolCallCommand;
    private readonly mcpServerCommand;
    private mcpServers;
    private readonly lspEnabled;
    private lspClient?;
    private lspInitializationError?;
    private readonly allowedMcpServers?;
    private excludedMcpServers?;
    private sessionSubagents;
    private userMemory;
    private sdkMode;
    private geminiMdFileCount;
    private conditionalRulesRegistry;
    private readonly contextRuleExcludes;
    private approvalMode;
    private prePlanMode?;
    private autoModeDenialState;
    private readonly accessibility;
    private readonly telemetrySettings;
    private readonly gitCoAuthor;
    private readonly fileReadCacheDisabled;
    private geminiClient;
    private baseLlmClient;
    private cronScheduler;
    private readonly fileFiltering;
    private fileDiscoveryService;
    private gitService;
    private sessionService;
    private chatRecordingService;
    private readonly checkpointing;
    private readonly fileCheckpointingEnabled;
    private fileHistoryService;
    private readonly proxy;
    private readonly cwd;
    private readonly explicitIncludeDirectories;
    private readonly bugCommand;
    private readonly outputLanguageFilePath?;
    private readonly noBrowser;
    private readonly folderTrustFeature;
    private readonly folderTrust;
    private ideMode;
    private readonly maxSessionTurns;
    private readonly clearContextOnIdle;
    private readonly sessionTokenLimit;
    private readonly listExtensions;
    private readonly overrideExtensions?;
    private readonly cliVersion?;
    private runtimeStatusEnabled;
    private readonly experimentalZedIntegration;
    private readonly cronEnabled;
    private readonly emitToolUseSummaries;
    private readonly chatRecordingEnabled;
    private readonly loadMemoryFromIncludeDirectories;
    private readonly importFormat;
    private readonly chatCompression;
    private readonly interactive;
    private readonly trustedFolder;
    private readonly useRipgrep;
    private readonly useBuiltinRipgrep;
    private readonly shouldUseNodePtyShell;
    private readonly skipNextSpeakerCheck;
    private shellExecutionConfig;
    private arenaManager;
    private arenaManagerChangeCallback;
    private readonly arenaAgentClient;
    private readonly agentsSettings;
    private readonly skipLoopDetection;
    private readonly skipStartupContext;
    private readonly bareMode;
    private readonly warnings;
    private readonly allowedHttpHookUrls;
    private readonly onPersistPermissionRuleCallback?;
    private initialized;
    readonly storage: Storage;
    private readonly fileExclusions;
    private readonly truncateToolOutputThreshold;
    private readonly truncateToolOutputLines;
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
    private readonly enableAutoSkill;
    private fastModel?;
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
    constructor(params: ConfigParameters);
    /**
     * Must only be called once, throws if called again.
     * @param options Optional initialization options including sendSdkMcpMessage callback
     */
    initialize(options?: ConfigInitializeOptions): Promise<void>;
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
    refreshHierarchicalMemory(): Promise<void>;
    private getMemoryDiscoveryDirectories;
    getConditionalRulesRegistry(): ConditionalRulesRegistry | undefined;
    /**
     * Update the conditional rules registry. Called after external refresh
     * paths (e.g. /memory refresh or /directory add) that bypass
     * refreshHierarchicalMemory().
     */
    setConditionalRulesRegistry(registry: ConditionalRulesRegistry | undefined): void;
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
    updateCredentials(credentials: {
        apiKey?: string;
        baseUrl?: string;
        model?: string;
    }, settingsGenerationConfig?: Partial<ContentGeneratorConfig>): void;
    /**
     * Reload model providers configuration at runtime.
     * This enables hot-reloading of modelProviders settings without restarting the CLI.
     * Should be called before refreshAuth when settings.json has been updated.
     *
     * @param modelProvidersConfig - The updated model providers configuration
     */
    reloadModelProvidersConfig(modelProvidersConfig?: ModelProvidersConfig): void;
    /**
     * Refresh authentication and rebuild ContentGenerator.
     */
    refreshAuth(authMethod: AuthType, isInitialAuth?: boolean): Promise<void>;
    /**
     * Provides access to the BaseLlmClient for stateless LLM operations.
     */
    getBaseLlmClient(): BaseLlmClient;
    getSessionId(): string;
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
    /**
     * Returns the resumed session data if this session was resumed from a previous one.
     */
    getResumedSessionData(): ResumedSessionData | undefined;
    shouldLoadMemoryFromIncludeDirectories(): boolean;
    getImportFormat(): 'tree' | 'flat';
    getContentGeneratorConfig(): ContentGeneratorConfig;
    getContentGeneratorConfigSources(): ContentGeneratorConfigSources;
    getModel(): string;
    onModelChange(listener: (model: string) => void): () => void;
    private notifyModelChangeListeners;
    /**
     * Returns the configured fast model selector when it resolves to an available
     * model. Bare selectors stay bare and authType-qualified selectors keep their
     * authType prefix so selector-aware runtime paths can route cross-auth calls.
     */
    getFastModel(): string | undefined;
    private resolveFastModelSelector;
    /**
     * Update the fast model at runtime (e.g., when the user runs `/model --fast <model>`).
     * Pass undefined or an empty string to clear the fast model override.
     */
    setFastModel(model: string | undefined): void;
    /**
     * Set model programmatically (e.g., VLM auto-switch, fallback).
     * Delegates to ModelsConfig.
     */
    setModel(newModel: string, metadata?: {
        reason?: string;
        context?: string;
    }): Promise<void>;
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
    switchModel(authType: AuthType, modelId: string, options?: {
        requireCachedCredentials?: boolean;
        baseUrl?: string;
    }): Promise<void>;
    getMaxSessionTurns(): number;
    getClearContextOnIdle(): ClearContextOnIdleSettings;
    getSessionTokenLimit(): number;
    getEmbeddingModel(): string;
    getSandbox(): SandboxConfig | undefined;
    isRestrictiveSandbox(): boolean;
    getTargetDir(): string;
    getProjectRoot(): string;
    getCwd(): string;
    getWorkspaceContext(): WorkspaceContext;
    getToolRegistry(): ToolRegistry;
    /**
     * Shuts down the Config and releases all resources.
     * This method is idempotent and safe to call multiple times.
     * It handles the case where initialization was not completed.
     */
    shutdown(): Promise<void>;
    getPromptRegistry(): PromptRegistry;
    getDebugMode(): boolean;
    getQuestion(): string | undefined;
    getSystemPrompt(): string | undefined;
    getAppendSystemPrompt(): string | undefined;
    /** @deprecated Use getPermissionsAllow() instead. */
    getCoreTools(): string[] | undefined;
    /**
     * Returns the merged allow-rules for PermissionManager.
     *
     * This merges all sources so that PermissionManager receives a single,
     * authoritative list:
     *   - settings.permissions.allow  (persistent rules from all scopes)
     *   - allowedTools param  (SDK / argv auto-approve list)
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
     *   - settings.permissions.deny  (persistent rules from all scopes)
     *   - excludeTools param  (SDK / argv blocklist)
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
     * Returns the read-only set of tool names hidden from this Config's
     * ToolRegistry. Consulted by `ToolRegistry.registerTool` and
     * `ToolRegistry.registerFactory` to skip registration. Toggling at
     * runtime requires re-spawning the ACP child (the set is frozen at
     * construction time). See `disabledTools` in ConfigParameters.
     */
    getDisabledTools(): ReadonlySet<string>;
    getToolCallCommand(): string | undefined;
    getMcpServerCommand(): string | undefined;
    getMcpServers(): Record<string, MCPServerConfig> | undefined;
    getExcludedMcpServers(): string[] | undefined;
    setExcludedMcpServers(excluded: string[]): void;
    isMcpServerDisabled(serverName: string): boolean;
    addMcpServers(servers: Record<string, MCPServerConfig>): void;
    isLspEnabled(): boolean;
    getLspClient(): LspClient | undefined;
    getLspStatusSnapshot(): LspStatusSnapshot;
    private createLspStatusSnapshot;
    /**
     * Allows wiring an LSP client after Config construction but before initialize().
     */
    setLspClient(client: LspClient | undefined): void;
    setLspInitializationError(error: Error | string | undefined): void;
    getSessionSubagents(): SubagentConfig[];
    setSessionSubagents(subagents: SubagentConfig[]): void;
    getSdkMode(): boolean;
    setSdkMode(value: boolean): void;
    getUserMemory(): string;
    setUserMemory(newUserMemory: string): void;
    getGeminiMdFileCount(): number;
    setGeminiMdFileCount(count: number): void;
    getArenaManager(): ArenaManager | null;
    setArenaManager(manager: ArenaManager | null): void;
    /**
     * Register a callback invoked whenever the arena manager changes.
     * Pass `null` to unsubscribe. Only one subscriber is supported.
     */
    onArenaManagerChange(cb: ((manager: ArenaManager | null) => void) | null): void;
    getArenaAgentClient(): ArenaAgentClient | null;
    getAgentsSettings(): AgentsCollabSettings;
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
    setApprovalMode(mode: ApprovalMode): void;
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
    getTelemetryEnabled(): boolean;
    getTelemetryLogPromptsEnabled(): boolean;
    getTelemetryIncludeSensitiveSpanAttributes(): boolean;
    getTelemetryOtlpEndpoint(): string | undefined;
    getTelemetryOtlpProtocol(): 'grpc' | 'http';
    getTelemetryOtlpTracesEndpoint(): string | undefined;
    getTelemetryOtlpLogsEndpoint(): string | undefined;
    getTelemetryOtlpMetricsEndpoint(): string | undefined;
    getTelemetryTarget(): TelemetryTarget;
    getTelemetryResourceAttributes(): Record<string, string>;
    getTelemetryMetricsIncludeSessionId(): boolean;
    getTelemetryResourceAttributeWarnings(): readonly string[];
    getTelemetryOutfile(): string | undefined;
    getGitCoAuthor(): GitCoAuthorSettings;
    getGeminiClient(): GeminiClient;
    getCronScheduler(): CronScheduler;
    isCronEnabled(): boolean;
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
    getCheckpointingEnabled(): boolean;
    getFileCheckpointingEnabled(): boolean;
    getFileHistoryService(): FileHistoryService;
    getProxy(): string | undefined;
    getWorkingDir(): string;
    getBugCommand(): BugCommandSettings | undefined;
    getFileService(): FileDiscoveryService;
    getUsageStatisticsEnabled(): boolean;
    getExtensionContextFilePaths(): string[];
    getExperimentalZedIntegration(): boolean;
    getListExtensions(): boolean;
    getExtensionManager(): ExtensionManager;
    /**
     * Get the hook system instance if hooks are enabled.
     * Returns undefined if hooks are not enabled.
     */
    getHookSystem(): HookSystem | undefined;
    /**
     * Fast-path check: returns true only when hooks are enabled AND there are
     * registered hooks for the given event name.  Callers can use this to skip
     * expensive MessageBus round-trips when no hooks are configured.
     */
    hasHooksForEvent(eventName: string, sessionId?: string): boolean;
    /**
     * Check if all hooks are disabled.
     */
    getDisableAllHooks(): boolean;
    getStopHookBlockingCap(): number;
    getManagedAutoMemoryEnabled(): boolean;
    getManagedAutoDreamEnabled(): boolean;
    getAutoSkillEnabled(): boolean;
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
    getProjectHooks(): {
        [K in HookEventName]?: HookDefinition[];
    } | undefined;
    /**
     * Get user-level hooks configuration.
     * Returns hooks from user settings, always available regardless of folder trust.
     * Used by HookRegistry to load user-specific hooks with proper source attribution.
     */
    getUserHooks(): {
        [K in HookEventName]?: HookDefinition[];
    } | undefined;
    getExtensions(): Extension[];
    private getExplicitExtensionNames;
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
    isInteractive(): boolean;
    getUseRipgrep(): boolean;
    getUseBuiltinRipgrep(): boolean;
    getShouldUseNodePtyShell(): boolean;
    getSkipNextSpeakerCheck(): boolean;
    getShellExecutionConfig(): ShellExecutionConfig;
    setShellExecutionConfig(config: ShellExecutionConfig): void;
    getScreenReader(): boolean;
    getSkipLoopDetection(): boolean;
    getSkipStartupContext(): boolean;
    getBareMode(): boolean;
    getTruncateToolOutputThreshold(): number;
    getTruncateToolOutputLines(): number;
    getOutputFormat(): OutputFormat;
    getGitService(): Promise<GitService>;
    /**
     * Returns the chat recording service.
     */
    getChatRecordingService(): ChatRecordingService | undefined;
    /**
     * Returns the transcript file path for the current session.
     * This is the path to the JSONL file where the conversation is recorded.
     * Returns empty string if chat recording is disabled.
     */
    getTranscriptPath(): string;
    /**
     * Gets or creates a SessionService for managing chat sessions.
     */
    getSessionService(): SessionService;
    getFileExclusions(): FileExclusions;
    getSubagentManager(): SubagentManager;
    getBackgroundTaskRegistry(): BackgroundTaskRegistry;
    getMonitorRegistry(): MonitorRegistry;
    getBackgroundAgentResumeService(): BackgroundAgentResumeService;
    loadPausedBackgroundAgents(sessionId?: string): Promise<ReadonlyArray<import('../agents/background-tasks.js').AgentTask>>;
    resumeBackgroundAgent(agentId: string, initialMessage?: string): Promise<import('../agents/background-tasks.js').AgentTask | undefined>;
    abandonBackgroundAgent(agentId: string): boolean;
    getBackgroundShellRegistry(): BackgroundShellRegistry;
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
     * CommandService after initialisation so that SkillTool can merge these into
     * its tool description.
     */
    setModelInvocableCommandsProvider(provider: () => ReadonlyArray<{
        name: string;
        description: string;
    }>): void;
    /**
     * Returns the registered model-invocable commands provider, or null if none
     * has been registered (e.g., in SDK mode).
     */
    getModelInvocableCommandsProvider(): (() => ReadonlyArray<{
        name: string;
        description: string;
    }>) | null;
    /**
     * Registers an executor that can invoke a model-invocable command by name
     * (e.g., MCP prompts). Returns the prompt content as a string, or null if
     * the command cannot be found or executed. Called by the CLI layer.
     */
    setModelInvocableCommandsExecutor(executor: (name: string, args?: string) => Promise<string | null>): void;
    /**
     * Returns the registered model-invocable commands executor, or null if none
     * has been registered (e.g., in SDK mode).
     */
    getModelInvocableCommandsExecutor(): ((name: string, args?: string) => Promise<string | null>) | null;
    getPermissionManager(): PermissionManager | null;
    /**
     * Returns the callback for persisting permission rules to settings files.
     * Returns undefined if no callback was provided (e.g. SDK mode).
     */
    getOnPersistPermissionRule(): ((scope: 'project' | 'user', ruleType: 'allow' | 'ask' | 'deny', rule: string) => Promise<void>) | undefined;
    createToolRegistry(sendSdkMcpMessage?: SendSdkMcpMessage, options?: {
        skipDiscovery?: boolean;
        forSubAgent?: boolean;
    }): Promise<ToolRegistry>;
    /**
     * PR 14b fix #2 (codex review round 1): register the MCP guardrail
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
    setMcpBudgetEventCallback(cb: ((event: McpBudgetEvent) => void) | undefined): void;
}
