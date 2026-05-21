/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import * as path from 'node:path';
import process from 'node:process';
// External dependencies
import { ProxyAgent, setGlobalDispatcher } from 'undici';
import { ArenaAgentClient } from '../agents/arena/ArenaAgentClient.js';
// Core
import { BaseLlmClient } from '../core/baseLlmClient.js';
import { GeminiClient } from '../core/client.js';
import { createContentGenerator, resolveContentGeneratorConfigWithSources, } from '../core/contentGenerator.js';
import { AuthType } from '../core/authTypes.js';
import { getRuntimeContentGenerator } from '../agents/runtime/agent-context.js';
// Services
import { FileDiscoveryService } from '../services/fileDiscoveryService.js';
import { FileHistoryService } from '../services/fileHistoryService.js';
import { StandardFileSystemService, } from '../services/fileSystemService.js';
import { GitService } from '../services/gitService.js';
import { GitWorktreeService } from '../services/gitWorktreeService.js';
import { cleanupStaleAgentWorktrees } from '../services/worktreeCleanup.js';
import { CronScheduler } from '../services/cronScheduler.js';
// Tools — only lightweight imports; tool classes are lazy-loaded via dynamic import
import { MCPServerStatus, getMCPServerStatus, } from '../tools/mcp-client.js';
import { setGeminiMdFilename } from '../memory/const.js';
import { canUseRipgrep } from '../utils/ripgrepUtils.js';
import { recordStartupEvent } from '../utils/startupEventSink.js';
import { ToolRegistry } from '../tools/tool-registry.js';
import { ToolNames } from '../tools/tool-names.js';
// Other modules
import { ideContextStore } from '../ide/ideContext.js';
import { InputFormat, OutputFormat } from '../output/types.js';
import { PromptRegistry } from '../prompts/prompt-registry.js';
import { SkillManager } from '../skills/skill-manager.js';
import { PermissionManager } from '../permissions/permission-manager.js';
import { createDenialState, resetDenialState, } from '../permissions/denialTracking.js';
import { SubagentManager } from '../subagents/subagent-manager.js';
import { BackgroundTaskRegistry } from '../agents/background-tasks.js';
import { MonitorRegistry } from '../services/monitorRegistry.js';
import { BackgroundAgentResumeService } from '../agents/background-agent-resume.js';
import { BackgroundShellRegistry } from '../services/backgroundShellRegistry.js';
import { FileReadCache } from '../services/fileReadCache.js';
import { resolveStopHookBlockingCap } from '../hooks/stopHookCap.js';
import { DEFAULT_OTLP_ENDPOINT, DEFAULT_TELEMETRY_TARGET, isTelemetrySdkInitialized, initializeTelemetry, shutdownTelemetry, refreshSessionContext, logStartSession, logRipgrepFallback, RipgrepFallbackEvent, StartSessionEvent, } from '../telemetry/index.js';
import { ExtensionManager, } from '../extension/extensionManager.js';
import { HookSystem, createHookOutput } from '../hooks/index.js';
import { MessageBus } from '../confirmation-bus/message-bus.js';
import { MessageBusType, } from '../confirmation-bus/types.js';
import { PermissionMode, NotificationType, } from '../hooks/types.js';
import { fireNotificationHook } from '../core/toolHookTriggers.js';
// Utils
import { shouldAttemptBrowserLaunch } from '../utils/browser.js';
import { FileExclusions } from '../utils/ignorePatterns.js';
import { shouldDefaultToNodePty } from '../utils/shell-utils.js';
import { WorkspaceContext } from '../utils/workspaceContext.js';
import {} from '../utils/tool-utils.js';
import { getErrorMessage } from '../utils/errors.js';
import { normalizeProxyUrl } from '../utils/proxyUtils.js';
import { DEFAULT_FILE_FILTERING_OPTIONS, DEFAULT_MEMORY_FILE_FILTERING_OPTIONS, } from './constants.js';
import { DEFAULT_QWEN_EMBEDDING_MODEL } from './models.js';
import { Storage } from './storage.js';
import { ChatRecordingService } from '../services/chatRecordingService.js';
import { clearRuntimeStatus, writeRuntimeStatus, } from '../utils/runtimeStatus.js';
import { SessionService, } from '../services/sessionService.js';
import { randomUUID } from 'node:crypto';
import { loadServerHierarchicalMemory } from '../utils/memoryDiscovery.js';
import { ConditionalRulesRegistry } from '../utils/rulesDiscovery.js';
import { createDebugLogger, setDebugLogSession, } from '../utils/debugLogger.js';
import { getAutoMemoryRoot } from '../memory/paths.js';
import { readAutoMemoryIndex } from '../memory/store.js';
import { MemoryManager } from '../memory/manager.js';
import { CommitAttributionService } from '../services/commitAttribution.js';
const gitCoAuthorLogger = createDebugLogger('GIT_CO_AUTHOR');
import { ModelsConfig, } from '../models/index.js';
import { resolveModelId } from '../utils/modelId.js';
export { DEFAULT_FILE_FILTERING_OPTIONS, DEFAULT_MEMORY_FILE_FILTERING_OPTIONS, };
export var ApprovalMode;
(function (ApprovalMode) {
    ApprovalMode["PLAN"] = "plan";
    ApprovalMode["DEFAULT"] = "default";
    ApprovalMode["AUTO_EDIT"] = "auto-edit";
    ApprovalMode["AUTO"] = "auto";
    ApprovalMode["YOLO"] = "yolo";
})(ApprovalMode || (ApprovalMode = {}));
export const APPROVAL_MODES = Object.values(ApprovalMode);
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
export class TrustGateError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TrustGateError';
    }
}
/**
 * Detailed information about each approval mode.
 * Used for UI display and protocol responses.
 */
export const APPROVAL_MODE_INFO = {
    [ApprovalMode.PLAN]: {
        id: ApprovalMode.PLAN,
        name: 'Plan',
        description: 'Analyze only, do not modify files or execute commands',
    },
    [ApprovalMode.DEFAULT]: {
        id: ApprovalMode.DEFAULT,
        name: 'Default',
        description: 'Require approval for file edits or shell commands',
    },
    [ApprovalMode.AUTO_EDIT]: {
        id: ApprovalMode.AUTO_EDIT,
        name: 'Auto Edit',
        description: 'Automatically approve file edits',
    },
    [ApprovalMode.AUTO]: {
        id: ApprovalMode.AUTO,
        name: 'Auto',
        description: 'LLM classifier auto-approves safe actions, blocks risky ones',
    },
    [ApprovalMode.YOLO]: {
        id: ApprovalMode.YOLO,
        name: 'YOLO',
        description: 'Automatically approve all tools',
    },
};
function normalizeGitCoAuthor(value) {
    if (value === undefined) {
        return { commit: false, pr: false };
    }
    if (typeof value === 'boolean') {
        return { commit: value, pr: value };
    }
    // Default to `false` (the schema default) ONLY when the sub-field
    // is genuinely absent. For PRESENT-but-non-boolean values, honor
    // common string forms (`"true"`/`"yes"`/`"on"`/`"1"` → true,
    // `"false"`/`"no"`/`"off"`/`"0"`/`""` → false) and treat anything
    // else as opt-out. settings.json is user-editable, and the previous
    // "default-to-true on mismatch" policy meant a hand-edited
    // `{ "commit": "false" }` silently activated attribution against
    // the user's clear intent. Safer-by-default: ambiguous values
    // disable rather than enable.
    const pickBool = (v, fieldName) => {
        if (v === undefined)
            return false;
        if (typeof v === 'boolean')
            return v;
        if (typeof v === 'string') {
            const lowered = v.trim().toLowerCase();
            if (lowered === 'true' ||
                lowered === 'yes' ||
                lowered === 'on' ||
                lowered === '1') {
                return true;
            }
            // Known disable-intent forms — silent (matches user intent).
            const knownDisable = ['false', 'no', 'off', '0', 'disabled', ''];
            if (!knownDisable.includes(lowered)) {
                // Unrecognised string — disable (safer-by-default) but log
                // so a user wondering "why is my setting being ignored?"
                // can see the actual coercion in QWEN_DEBUG_LOG_FILE.
                gitCoAuthorLogger.warn(`Unrecognized string value for general.gitCoAuthor.${fieldName}: ${JSON.stringify(v)}; treating as false. Accepted forms: true/yes/on/1, false/no/off/0/empty.`);
            }
            return false;
        }
        if (typeof v === 'number')
            return v === 1;
        return false;
    };
    return {
        commit: pickBool(value?.commit, 'commit'),
        pr: pickBool(value?.pr, 'pr'),
    };
}
export const DEFAULT_TRUNCATE_TOOL_OUTPUT_THRESHOLD = 25_000;
export const DEFAULT_TRUNCATE_TOOL_OUTPUT_LINES = 1000;
export class MCPServerConfig {
    command;
    args;
    env;
    cwd;
    url;
    httpUrl;
    headers;
    tcp;
    timeout;
    trust;
    description;
    includeTools;
    excludeTools;
    extensionName;
    oauth;
    authProviderType;
    targetAudience;
    targetServiceAccount;
    type;
    discoveryTimeoutMs;
    constructor(
    // For stdio transport
    command, args, env, cwd, 
    // For sse transport
    url, 
    // For streamable http transport
    httpUrl, headers, 
    // For websocket transport
    tcp, 
    // Common
    timeout, trust, 
    // Metadata
    description, includeTools, excludeTools, extensionName, 
    // OAuth configuration
    oauth, authProviderType, 
    // Service Account Configuration
    /* targetAudience format: CLIENT_ID.apps.googleusercontent.com */
    targetAudience, 
    /* targetServiceAccount format: <service-account-name>@<project-num>.iam.gserviceaccount.com */
    targetServiceAccount, 
    // SDK MCP server type - 'sdk' indicates server runs in SDK process
    type, 
    /**
     * Per-server cap on the discovery handshake (`connect` + `tools/list` +
     * `prompts/list` + `resources/list`). Defaults: 30s for stdio servers,
     * 5s for remote HTTP/SSE. Tool-call timeout (`timeout` above) is
     * unaffected — a long-running tool invocation is not a startup
     * pathology. Appended at the end of the parameter list to avoid
     * shifting positional arguments at the many `new MCPServerConfig(...)`
     * call sites.
     */
    discoveryTimeoutMs) {
        this.command = command;
        this.args = args;
        this.env = env;
        this.cwd = cwd;
        this.url = url;
        this.httpUrl = httpUrl;
        this.headers = headers;
        this.tcp = tcp;
        this.timeout = timeout;
        this.trust = trust;
        this.description = description;
        this.includeTools = includeTools;
        this.excludeTools = excludeTools;
        this.extensionName = extensionName;
        this.oauth = oauth;
        this.authProviderType = authProviderType;
        this.targetAudience = targetAudience;
        this.targetServiceAccount = targetServiceAccount;
        this.type = type;
        this.discoveryTimeoutMs = discoveryTimeoutMs;
    }
}
/**
 * Check if an MCP server config represents an SDK server
 */
export function isSdkMcpServerConfig(config) {
    return config.type === 'sdk';
}
export var AuthProviderType;
(function (AuthProviderType) {
    AuthProviderType["DYNAMIC_DISCOVERY"] = "dynamic_discovery";
    AuthProviderType["GOOGLE_CREDENTIALS"] = "google_credentials";
    AuthProviderType["SERVICE_ACCOUNT_IMPERSONATION"] = "service_account_impersonation";
})(AuthProviderType || (AuthProviderType = {}));
function normalizeConfigOutputFormat(format) {
    if (!format) {
        return undefined;
    }
    switch (format) {
        case 'stream-json':
            return OutputFormat.STREAM_JSON;
        case 'json':
        case OutputFormat.JSON:
            return OutputFormat.JSON;
        case 'text':
        case OutputFormat.TEXT:
        default:
            return OutputFormat.TEXT;
    }
}
const DEFAULT_BARE_CORE_TOOLS = [
    ToolNames.READ_FILE,
    ToolNames.EDIT,
    ToolNames.NOTEBOOK_EDIT,
    ToolNames.SHELL,
];
export class Config {
    sessionId;
    sessionData;
    debugLogger;
    toolRegistry;
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
    pendingMcpBudgetCallback;
    promptRegistry;
    subagentManager;
    backgroundTaskRegistry = new BackgroundTaskRegistry();
    monitorRegistry = new MonitorRegistry();
    backgroundAgentResumeService;
    backgroundShellRegistry = new BackgroundShellRegistry();
    // Field initializer runs once on the parent Config; child Configs
    // built via Object.create(parent) intentionally do NOT pick this up
    // — see getFileReadCache() for the per-instance lazy initialization
    // that keeps subagent caches isolated from the parent's.
    fileReadCache = new FileReadCache();
    extensionManager;
    skillManager = null;
    permissionManager = null;
    modelInvocableCommandsProvider = null;
    modelInvocableCommandsExecutor = null;
    fileSystemService;
    contentGeneratorConfig;
    contentGeneratorConfigSources = {};
    contentGenerator;
    embeddingModel;
    modelsConfig;
    modelProvidersConfig;
    sandbox;
    targetDir;
    workspaceContext;
    debugMode;
    inputFormat;
    outputFormat;
    includePartialMessages;
    question;
    systemPrompt;
    appendSystemPrompt;
    coreTools;
    allowedTools;
    excludeTools;
    disabledSlashCommands;
    disabledTools;
    permissionsAllow;
    permissionsAsk;
    permissionsDeny;
    permissionsAutoMode;
    toolDiscoveryCommand;
    toolCallCommand;
    mcpServerCommand;
    mcpServers;
    lspEnabled;
    lspClient;
    lspInitializationError;
    allowedMcpServers;
    excludedMcpServers;
    sessionSubagents;
    userMemory;
    sdkMode;
    geminiMdFileCount;
    conditionalRulesRegistry;
    contextRuleExcludes;
    approvalMode;
    prePlanMode;
    autoModeDenialState = createDenialState();
    accessibility;
    telemetrySettings;
    gitCoAuthor;
    fileReadCacheDisabled;
    geminiClient;
    baseLlmClient;
    cronScheduler = null;
    fileFiltering;
    fileDiscoveryService = null;
    gitService = undefined;
    sessionService = undefined;
    chatRecordingService = undefined;
    checkpointing;
    fileCheckpointingEnabled;
    fileHistoryService;
    proxy;
    cwd;
    explicitIncludeDirectories;
    bugCommand;
    outputLanguageFilePath;
    noBrowser;
    folderTrustFeature;
    folderTrust;
    ideMode;
    maxSessionTurns;
    clearContextOnIdle;
    sessionTokenLimit;
    listExtensions;
    overrideExtensions;
    cliVersion;
    runtimeStatusEnabled = false;
    experimentalZedIntegration = false;
    cronEnabled = false;
    emitToolUseSummaries = true;
    chatRecordingEnabled;
    loadMemoryFromIncludeDirectories = false;
    importFormat;
    chatCompression;
    interactive;
    trustedFolder;
    useRipgrep;
    useBuiltinRipgrep;
    shouldUseNodePtyShell;
    skipNextSpeakerCheck;
    shellExecutionConfig;
    arenaManager = null;
    arenaManagerChangeCallback = null;
    arenaAgentClient;
    agentsSettings;
    skipLoopDetection;
    skipStartupContext;
    bareMode;
    warnings;
    allowedHttpHookUrls;
    onPersistPermissionRuleCallback;
    initialized = false;
    storage;
    fileExclusions;
    truncateToolOutputThreshold;
    truncateToolOutputLines;
    eventEmitter;
    channel;
    jsonFd;
    jsonFile;
    jsonSchema;
    inputFile;
    plansDir;
    plansDirectoryConfigured;
    defaultFileEncoding;
    enableManagedAutoMemory;
    enableManagedAutoDream;
    enableAutoSkill;
    fastModel;
    disableAllHooks;
    stopHookBlockingCap;
    /** User-level hooks (always loaded regardless of trust) */
    userHooks;
    /** Project-level hooks (only loaded in trusted folders) */
    projectHooks;
    /** @deprecated Legacy merged hooks field - use userHooks/projectHooks instead */
    hooks;
    hookSystem;
    messageBus;
    memoryManager;
    modelChangeListeners = new Set();
    constructor(params) {
        this.sessionId = params.sessionId ?? randomUUID();
        this.sessionData = params.sessionData;
        setDebugLogSession(this);
        this.debugLogger = createDebugLogger();
        this.embeddingModel = params.embeddingModel ?? DEFAULT_QWEN_EMBEDDING_MODEL;
        this.fileSystemService = new StandardFileSystemService();
        this.sandbox = params.sandbox;
        this.targetDir = path.resolve(params.targetDir);
        this.plansDirectoryConfigured = Boolean(params.plansDirectory?.trim());
        this.plansDir = Storage.getPlansDir(this.targetDir, params.plansDirectory);
        this.explicitIncludeDirectories = Array.from(new Set(params.includeDirectories ?? []));
        this.workspaceContext = new WorkspaceContext(this.targetDir, this.explicitIncludeDirectories);
        this.debugMode = params.debugMode;
        this.inputFormat = params.inputFormat ?? InputFormat.TEXT;
        const normalizedOutputFormat = normalizeConfigOutputFormat(params.outputFormat ?? params.output?.format);
        this.outputFormat = normalizedOutputFormat ?? OutputFormat.TEXT;
        this.includePartialMessages = params.includePartialMessages ?? false;
        this.question = params.question;
        this.systemPrompt = params.systemPrompt;
        this.appendSystemPrompt = params.appendSystemPrompt;
        this.coreTools = params.coreTools;
        this.allowedTools = params.allowedTools;
        this.excludeTools = params.excludeTools;
        this.disabledSlashCommands = Object.freeze([
            ...(params.disabledSlashCommands ?? []),
        ]);
        this.disabledTools = new Set(params.disabledTools ?? []);
        this.permissionsAllow = params.permissions?.allow || [];
        this.permissionsAsk = params.permissions?.ask || [];
        this.permissionsDeny = params.permissions?.deny || [];
        this.permissionsAutoMode = params.permissions?.autoMode ?? {};
        this.toolDiscoveryCommand = params.toolDiscoveryCommand;
        this.toolCallCommand = params.toolCallCommand;
        this.mcpServerCommand = params.mcpServerCommand;
        this.mcpServers = params.mcpServers;
        this.lspEnabled = params.lsp?.enabled ?? false;
        this.lspClient = params.lspClient;
        this.allowedMcpServers = params.allowedMcpServers;
        this.excludedMcpServers = params.excludedMcpServers;
        this.sessionSubagents = params.sessionSubagents ?? [];
        this.sdkMode = params.sdkMode ?? false;
        this.userMemory = params.userMemory ?? '';
        this.geminiMdFileCount = params.geminiMdFileCount ?? 0;
        this.contextRuleExcludes = params.contextRuleExcludes ?? [];
        this.approvalMode = params.approvalMode ?? ApprovalMode.DEFAULT;
        this.accessibility = params.accessibility ?? {};
        this.telemetrySettings = {
            enabled: params.telemetry?.enabled ?? false,
            target: params.telemetry?.target ?? DEFAULT_TELEMETRY_TARGET,
            otlpEndpoint: params.telemetry?.otlpEndpoint,
            otlpProtocol: params.telemetry?.otlpProtocol,
            otlpTracesEndpoint: params.telemetry?.otlpTracesEndpoint,
            otlpLogsEndpoint: params.telemetry?.otlpLogsEndpoint,
            otlpMetricsEndpoint: params.telemetry?.otlpMetricsEndpoint,
            logPrompts: params.telemetry?.logPrompts ?? true,
            includeSensitiveSpanAttributes: params.telemetry?.includeSensitiveSpanAttributes ?? false,
            outfile: params.telemetry?.outfile,
            resourceAttributes: params.telemetry?.resourceAttributes,
            metrics: params.telemetry?.metrics,
            resourceAttributeWarnings: params.telemetry?.resourceAttributeWarnings,
        };
        this.gitCoAuthor = {
            ...normalizeGitCoAuthor(params.gitCoAuthor),
            name: 'Qwen-Coder',
            email: 'qwen-coder@alibabacloud.com',
        };
        this.fileReadCacheDisabled = params.fileReadCacheDisabled ?? false;
        this.outputLanguageFilePath = params.outputLanguageFilePath;
        this.fileFiltering = {
            respectGitIgnore: params.fileFiltering?.respectGitIgnore ?? true,
            respectQwenIgnore: params.fileFiltering?.respectQwenIgnore ?? true,
            enableRecursiveFileSearch: params.fileFiltering?.enableRecursiveFileSearch ?? true,
            enableFuzzySearch: params.fileFiltering?.enableFuzzySearch ?? true,
        };
        this.checkpointing = params.checkpointing ?? false;
        this.fileCheckpointingEnabled =
            params.fileCheckpointingEnabled ??
                (!params.sdkMode && (params.interactive ?? false));
        this.proxy = params.proxy;
        this.cwd = params.cwd ?? process.cwd();
        this.fileDiscoveryService = params.fileDiscoveryService ?? null;
        this.bugCommand = params.bugCommand;
        this.maxSessionTurns = params.maxSessionTurns ?? -1;
        this.clearContextOnIdle = {
            toolResultsThresholdMinutes: params.clearContextOnIdle?.toolResultsThresholdMinutes ?? 60,
            toolResultsNumToKeep: params.clearContextOnIdle?.toolResultsNumToKeep ?? 5,
        };
        this.sessionTokenLimit = params.sessionTokenLimit ?? -1;
        this.experimentalZedIntegration =
            params.experimentalZedIntegration ?? false;
        this.cronEnabled = params.cronEnabled ?? false;
        this.emitToolUseSummaries = params.emitToolUseSummaries ?? true;
        this.listExtensions = params.listExtensions ?? false;
        this.overrideExtensions = params.overrideExtensions;
        this.noBrowser = params.noBrowser ?? false;
        this.folderTrustFeature = params.folderTrustFeature ?? false;
        this.folderTrust = params.folderTrust ?? false;
        this.ideMode = params.ideMode ?? false;
        this.modelProvidersConfig = params.modelProvidersConfig;
        this.cliVersion = params.cliVersion;
        this.chatRecordingEnabled = params.chatRecording ?? true;
        this.loadMemoryFromIncludeDirectories =
            params.loadMemoryFromIncludeDirectories ?? false;
        this.importFormat = params.importFormat ?? 'tree';
        this.chatCompression = params.chatCompression;
        this.interactive = params.interactive ?? false;
        this.trustedFolder = params.trustedFolder;
        this.skipLoopDetection = params.skipLoopDetection ?? false;
        this.skipStartupContext = params.skipStartupContext ?? false;
        this.bareMode = params.bareMode ?? false;
        this.warnings = params.warnings ?? [];
        this.addLegacyPlanLocationWarning();
        this.allowedHttpHookUrls = params.allowedHttpHookUrls ?? [];
        this.onPersistPermissionRuleCallback = params.onPersistPermissionRule;
        // (web search removed)
        this.useRipgrep = params.useRipgrep ?? true;
        this.useBuiltinRipgrep = params.useBuiltinRipgrep ?? true;
        this.shouldUseNodePtyShell =
            params.shouldUseNodePtyShell ?? shouldDefaultToNodePty();
        this.skipNextSpeakerCheck = params.skipNextSpeakerCheck ?? true;
        this.shellExecutionConfig = {
            terminalWidth: params.shellExecutionConfig?.terminalWidth ?? 80,
            terminalHeight: params.shellExecutionConfig?.terminalHeight ?? 24,
            showColor: params.shellExecutionConfig?.showColor ?? false,
            pager: params.shellExecutionConfig?.pager ?? 'cat',
        };
        this.truncateToolOutputThreshold =
            params.truncateToolOutputThreshold ??
                DEFAULT_TRUNCATE_TOOL_OUTPUT_THRESHOLD;
        this.truncateToolOutputLines =
            params.truncateToolOutputLines ?? DEFAULT_TRUNCATE_TOOL_OUTPUT_LINES;
        this.channel = params.channel;
        this.jsonFd = params.jsonFd;
        this.jsonFile = params.jsonFile;
        this.jsonSchema = params.jsonSchema;
        this.inputFile = params.inputFile;
        this.defaultFileEncoding = params.defaultFileEncoding;
        this.storage = new Storage(this.targetDir);
        this.inputFormat = params.inputFormat ?? InputFormat.TEXT;
        this.fileExclusions = new FileExclusions(this);
        this.eventEmitter = params.eventEmitter;
        this.arenaAgentClient = ArenaAgentClient.create();
        this.agentsSettings = params.agents ?? {};
        if (params.contextFileName) {
            setGeminiMdFilename(params.contextFileName);
        }
        // Create ModelsConfig for centralized model management
        // Prefer params.authType over generationConfig.authType because:
        // - params.authType preserves undefined (user hasn't selected yet)
        // - generationConfig.authType may have a default value from resolvers
        this.modelsConfig = new ModelsConfig({
            initialAuthType: params.authType ?? params.generationConfig?.authType,
            modelProvidersConfig: this.modelProvidersConfig,
            generationConfig: {
                model: params.model,
                ...(params.generationConfig || {}),
                baseUrl: params.generationConfig?.baseUrl,
            },
            generationConfigSources: params.generationConfigSources,
            onModelChange: this.handleModelChange.bind(this),
        });
        if (this.telemetrySettings.enabled) {
            initializeTelemetry(this);
        }
        const proxyUrl = this.getProxy();
        if (proxyUrl) {
            setGlobalDispatcher(new ProxyAgent(proxyUrl));
        }
        this.geminiClient = new GeminiClient(this);
        this.chatRecordingService = this.chatRecordingEnabled
            ? new ChatRecordingService(this)
            : undefined;
        this.extensionManager = new ExtensionManager({
            workspaceDir: this.targetDir,
            enabledExtensionOverrides: this.overrideExtensions,
            isWorkspaceTrusted: this.isTrustedFolder(),
        });
        this.enableManagedAutoMemory = params.enableManagedAutoMemory ?? true;
        this.enableManagedAutoDream = params.enableManagedAutoDream ?? false;
        this.enableAutoSkill = params.enableAutoSkill ?? false;
        this.fastModel = params.fastModel || undefined;
        this.disableAllHooks = params.disableAllHooks ?? false;
        this.stopHookBlockingCap = resolveStopHookBlockingCap(params.stopHookBlockingCap);
        // Store user and project hooks separately for proper source attribution
        this.userHooks = params.userHooks;
        this.projectHooks = params.projectHooks;
        // Legacy: fall back to merged hooks if new fields are not provided
        this.hooks = params.hooks;
        this.memoryManager = new MemoryManager();
    }
    /**
     * Must only be called once, throws if called again.
     * @param options Optional initialization options including sendSdkMcpMessage callback
     */
    async initialize(options) {
        if (this.initialized) {
            throw Error('Config was already initialized');
        }
        this.initialized = true;
        this.debugLogger.info('Config initialization started');
        // Initialize centralized FileDiscoveryService
        this.getFileService();
        if (this.getCheckpointingEnabled()) {
            await this.getGitService();
        }
        this.promptRegistry = new PromptRegistry();
        this.extensionManager.setConfig(this);
        const explicitExtensionNames = this.getExplicitExtensionNames();
        if (!this.getBareMode()) {
            await this.extensionManager.refreshCache();
        }
        else if (explicitExtensionNames.length > 0) {
            await this.extensionManager.refreshCache({
                names: explicitExtensionNames,
            });
        }
        this.debugLogger.debug('Extension manager initialized');
        // Bare mode skips all hook loading and execution.
        if (!this.getDisableAllHooks()) {
            this.hookSystem = new HookSystem(this);
            await this.hookSystem.initialize();
            this.debugLogger.debug('Hook system initialized');
            // Initialize MessageBus for hook execution
            this.messageBus = new MessageBus();
            // Subscribe to HOOK_EXECUTION_REQUEST to execute hooks
            this.messageBus.subscribe(MessageBusType.HOOK_EXECUTION_REQUEST, async (request) => {
                try {
                    const hookSystem = this.hookSystem;
                    if (!hookSystem) {
                        this.messageBus?.publish({
                            type: MessageBusType.HOOK_EXECUTION_RESPONSE,
                            correlationId: request.correlationId,
                            success: false,
                            error: new Error('Hook system not initialized'),
                        });
                        return;
                    }
                    // Check if request was aborted
                    if (request.signal?.aborted) {
                        this.messageBus?.publish({
                            type: MessageBusType.HOOK_EXECUTION_RESPONSE,
                            correlationId: request.correlationId,
                            success: false,
                            error: new Error('Hook execution cancelled (aborted)'),
                        });
                        return;
                    }
                    // Execute the appropriate hook based on eventName
                    let result;
                    let stopHookCount;
                    const input = request.input || {};
                    const signal = request.signal;
                    switch (request.eventName) {
                        case 'UserPromptSubmit':
                            result = await hookSystem.fireUserPromptSubmitEvent(input['prompt'] || '', signal);
                            break;
                        case 'Stop': {
                            const stopResult = await hookSystem.fireStopEvent(input['stop_hook_active'] || false, input['last_assistant_message'] || '', signal);
                            result = stopResult.finalOutput
                                ? createHookOutput('Stop', stopResult.finalOutput)
                                : undefined;
                            stopHookCount = stopResult.allOutputs.length;
                            break;
                        }
                        case 'PreToolUse': {
                            result = await hookSystem.firePreToolUseEvent(input['tool_name'] || '', input['tool_input'] || {}, input['tool_use_id'] || '', input['permission_mode'] ??
                                PermissionMode.Default, signal);
                            break;
                        }
                        case 'PostToolUse':
                            result = await hookSystem.firePostToolUseEvent(input['tool_name'] || '', input['tool_input'] || {}, input['tool_response'] || {}, input['tool_use_id'] || '', input['permission_mode'] || 'default', signal);
                            break;
                        case 'PostToolUseFailure':
                            result = await hookSystem.firePostToolUseFailureEvent(input['tool_use_id'] || '', input['tool_name'] || '', input['tool_input'] || {}, input['error'] || '', input['is_interrupt'], input['permission_mode'] || 'default', signal);
                            break;
                        case 'Notification':
                            result = await hookSystem.fireNotificationEvent(input['message'] || '', input['notification_type'] ||
                                'permission_prompt', input['title'] || undefined, signal);
                            break;
                        case 'PermissionRequest':
                            result = await hookSystem.firePermissionRequestEvent(input['tool_name'] || '', input['tool_input'] || {}, input['permission_mode'] ||
                                PermissionMode.Default, input['permission_suggestions'] || undefined, signal);
                            break;
                        case 'SubagentStart':
                            result = await hookSystem.fireSubagentStartEvent(input['agent_id'] || '', input['agent_type'] || '', input['permission_mode'] ||
                                PermissionMode.Default, signal);
                            break;
                        case 'SubagentStop':
                            result = await hookSystem.fireSubagentStopEvent(input['agent_id'] || '', input['agent_type'] || '', input['agent_transcript_path'] || '', input['last_assistant_message'] || '', input['stop_hook_active'] || false, input['permission_mode'] ||
                                PermissionMode.Default, signal);
                            break;
                        default:
                            this.debugLogger.warn(`Unknown hook event: ${request.eventName}`);
                            result = undefined;
                    }
                    // Send response
                    this.messageBus?.publish({
                        type: MessageBusType.HOOK_EXECUTION_RESPONSE,
                        correlationId: request.correlationId,
                        success: true,
                        output: result,
                        // Include stop hook count for Stop events
                        stopHookCount,
                    });
                }
                catch (error) {
                    this.debugLogger.warn(`Hook execution failed: ${error}`);
                    this.messageBus?.publish({
                        type: MessageBusType.HOOK_EXECUTION_RESPONSE,
                        correlationId: request.correlationId,
                        success: false,
                        error: error instanceof Error ? error : new Error(String(error)),
                    });
                }
            });
            this.debugLogger.debug('MessageBus initialized with hook subscription');
        }
        else {
            this.debugLogger.debug('Hook system disabled, skipping initialization');
        }
        this.subagentManager = new SubagentManager(this);
        this.skillManager = new SkillManager(this);
        if (this.getBareMode()) {
            await this.skillManager.refreshCache();
        }
        else {
            await this.skillManager.startWatching();
        }
        this.debugLogger.debug('Skill manager initialized');
        this.permissionManager = new PermissionManager(this);
        this.permissionManager.initialize();
        this.debugLogger.debug('Permission manager initialized');
        // Load session subagents if they were provided before initialization
        if (this.sessionSubagents.length > 0) {
            this.subagentManager.loadSessionSubagents(this.sessionSubagents);
        }
        if (!this.getBareMode()) {
            await this.extensionManager.refreshCache();
        }
        await this.refreshHierarchicalMemory();
        this.debugLogger.debug('Hierarchical memory loaded');
        // Progressive MCP availability: skip MCP discovery in the synchronous
        // tool-registry construction path and kick it off in the background
        // after the registry exists. This lets `Config.initialize()` (and the
        // cli's `input_enabled` checkpoint) resolve without waiting on MCP
        // server response time. Users can opt back into the legacy synchronous
        // behavior with `QWEN_CODE_LEGACY_MCP_BLOCKING=1` — kept ≥ 1 release as
        // an escape hatch.
        const legacyBlockingMcp = process.env['QWEN_CODE_LEGACY_MCP_BLOCKING'] === '1';
        const skipInlineMcpDiscovery = this.getBareMode() || !legacyBlockingMcp;
        this.toolRegistry = await this.createToolRegistry(options?.sendSdkMcpMessage, skipInlineMcpDiscovery ? { skipDiscovery: true } : undefined);
        recordStartupEvent('tool_registry_created', {
            toolCount: this.toolRegistry.getAllToolNames().length,
            mcpInline: !skipInlineMcpDiscovery,
        });
        this.debugLogger.info(`Tool registry initialized with ${this.toolRegistry.getAllToolNames().length} tools`);
        if (!options?.skipGeminiInitialization) {
            await this.geminiClient.initialize();
            this.debugLogger.info('Gemini client initialized');
        }
        else {
            this.debugLogger.info('Gemini client initialization skipped');
        }
        // Detect and capture runtime model snapshot (from CLI/ENV/credentials)
        this.modelsConfig.detectAndCaptureRuntimeModel();
        // Warm all lazy tool factories so telemetry can access tool metadata synchronously.
        // Use strict mode so a broken built-in tool surfaces immediately at startup.
        await this.toolRegistry.warmAll({ strict: true });
        // Fire-and-forget MCP discovery. Each server's tools land in the
        // registry as it becomes ready; the cli's AppContainer debounces
        // `setTools()` (~16ms / one frame) so the model sees the new tools
        // shortly after each server settles. See `AppContainer.tsx`'s
        // `mcp-client-update` subscriber.
        if (skipInlineMcpDiscovery && !this.getBareMode()) {
            this.startMcpDiscoveryInBackground();
        }
        logStartSession(this, new StartSessionEvent(this));
        this.debugLogger.info('Config initialization completed');
        // Fire-and-forget sweep of stale ephemeral worktrees left behind by
        // earlier `agent` runs that exited before their cleanup helper ran
        // (Ctrl-C, process crash, abrupt shutdown). The sweep only touches
        // `agent-<7hex>` slugs, skips anything newer than 30 days, and
        // is fail-closed against tracked changes or unpushed commits — so
        // running it on every startup cannot destroy user work. We do not
        // await this: it is a hygiene task that must never delay the
        // first model turn.
        //
        // Anchor the sweep at the repo top-level so it scans the same
        // directory the worktree creators (`enter_worktree` and
        // `agent isolation:'worktree'`) write to. Using `this.targetDir`
        // directly would cause launches from a monorepo subdirectory to
        // scan `<subdir>/.qwen/worktrees/` — which never exists — and the
        // sweep would silently be a no-op forever.
        if (!this.getBareMode()) {
            void (async () => {
                try {
                    // Resolve the repo top-level FIRST. The previous code bailed
                    // on `fs.access(<targetDir>/.qwen/worktrees)` before resolving,
                    // so a monorepo subdir launch (where `targetDir` is the
                    // subdir, not the repo root) always early-returned and the
                    // sweep was permanently a no-op. Fast-bail still happens, just
                    // against the *correct* directory.
                    const probe = new GitWorktreeService(this.targetDir);
                    const root = (await probe.getRepoTopLevel()) ?? this.targetDir;
                    const worktreesDir = path.join(root, '.qwen', 'worktrees');
                    try {
                        await fsPromises.access(worktreesDir);
                    }
                    catch {
                        // Skipped (no worktrees dir) is the common-case happy
                        // path on every CLI start for ~99% of users. `debug` so
                        // operators can opt in via `--debug` when they actually
                        // want to confirm the sweep is wired up — `info` would
                        // be log noise.
                        this.debugLogger.debug(`Stale worktree sweep skipped: ${worktreesDir} does not exist`);
                        return;
                    }
                    const removed = await cleanupStaleAgentWorktrees(root);
                    if (removed > 0) {
                        // Only the "actually removed something" path warrants
                        // `info` — that's the signal an operator chasing a leak
                        // would grep for. The "ran, found nothing" path is
                        // reconstructable at `debug` and is otherwise noise:
                        // every CLI start that has any worktree dir would emit
                        // it, drowning the actually-actionable message.
                        this.debugLogger.info(`Stale worktree sweep removed ${removed} ephemeral worktree(s) under ${root}`);
                    }
                    else {
                        this.debugLogger.debug(`Stale worktree sweep ran under ${root}: nothing to remove`);
                    }
                }
                catch (error) {
                    // Promote sweep errors to `warn` for the same reason: a
                    // permission failure / disk full / repo-corruption case
                    // should leave a visible breadcrumb instead of being
                    // invisible at the default log level.
                    this.debugLogger.warn(`Stale worktree sweep failed (non-fatal): ${error}`);
                }
            })();
        }
    }
    /**
     * In-flight background MCP discovery promise. Captured so non-interactive
     * code paths can await it before invoking the model (see
     * {@link waitForMcpReady}). Undefined when MCP discovery was skipped
     * entirely (bare mode, legacy blocking mode, or no MCP servers).
     */
    mcpDiscoveryPromise;
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
    startMcpDiscoveryInBackground() {
        // `getMcpClientManager` is a public method on `ToolRegistry`. The
        // cast below is NOT defensive against the production type — it
        // exists only because some tests (e.g. those using
        // `createMockToolRegistry`) stub `ToolRegistry` as a plain object
        // that doesn't implement the method. The optional-chaining call
        // (`?.()`) means the stubbed path resolves to `undefined` instead
        // of crashing `initialize()` for tests that never exercise MCP.
        //
        // Crucially, the inner shape is `ReturnType<ToolRegistry['getMcpClientManager']>`
        // — not a hand-rolled `{ discoverAllMcpToolsIncremental: ... }` — so
        // a future rename of `getMcpClientManager` on `ToolRegistry` still
        // surfaces here as a type error rather than silently falling
        // through to the `if (!manager) return` branch.
        const manager = this.toolRegistry.getMcpClientManager?.();
        if (!manager) {
            this.debugLogger.debug('Skipping background MCP discovery: ToolRegistry has no MCP client manager');
            return;
        }
        this.mcpDiscoveryPromise = manager
            .discoverAllMcpToolsIncremental(this)
            .then(async () => {
            // After background discovery completes, push the newly-registered
            // MCP tools into the active GeminiChat so the next model request
            // sees them. Interactive mode also calls setTools() via
            // AppContainer's batch-flush effect — this trailing call is
            // idempotent there, but it's the ONLY path that updates
            // `chat.tools` for non-interactive runs (no AppContainer).
            // Without this, `chat.tools` would be frozen at the built-in-only
            // snapshot taken inside `geminiClient.initialize()` → `startChat()`,
            // and `runNonInteractive` / stream-json / ACP would silently lose
            // every MCP tool — a regression vs the legacy synchronous path.
            try {
                await this.geminiClient?.setTools();
            }
            catch (err) {
                this.debugLogger.error(`setTools() after background MCP discovery failed: ${err instanceof Error ? err.message : String(err)}`);
            }
        })
            .catch((err) => {
            this.debugLogger.error(`Background MCP discovery failed: ${err instanceof Error ? err.message : String(err)}`);
        });
    }
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
    async waitForMcpReady() {
        if (this.mcpDiscoveryPromise) {
            await this.mcpDiscoveryPromise;
        }
    }
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
    getFailedMcpServerNames() {
        const servers = this.getMcpServers();
        if (!servers) {
            return [];
        }
        const failed = [];
        for (const name of Object.keys(servers)) {
            if (this.isMcpServerDisabled(name)) {
                continue;
            }
            if (getMCPServerStatus(name) !== MCPServerStatus.CONNECTED) {
                failed.push(name);
            }
        }
        return failed;
    }
    async refreshHierarchicalMemory() {
        const { memoryContent, fileCount, conditionalRules, projectRoot } = await loadServerHierarchicalMemory(this.getWorkingDir(), this.getMemoryDiscoveryDirectories(), this.getFileService(), this.getExtensionContextFilePaths(), this.isTrustedFolder(), this.getImportFormat(), this.contextRuleExcludes, { explicitOnly: this.getBareMode() });
        if (this.getManagedAutoMemoryEnabled()) {
            const managedAutoMemoryIndex = await readAutoMemoryIndex(this.getProjectRoot());
            this.setUserMemory(this.memoryManager.appendToUserMemory(memoryContent, getAutoMemoryRoot(this.getProjectRoot()), managedAutoMemoryIndex));
        }
        else {
            this.setUserMemory(memoryContent);
        }
        this.setGeminiMdFileCount(fileCount);
        this.conditionalRulesRegistry = new ConditionalRulesRegistry(conditionalRules, projectRoot);
    }
    getMemoryDiscoveryDirectories() {
        if (!this.shouldLoadMemoryFromIncludeDirectories()) {
            return [];
        }
        if (this.getBareMode()) {
            return this.explicitIncludeDirectories;
        }
        return [...this.getWorkspaceContext().getDirectories()];
    }
    getConditionalRulesRegistry() {
        return this.conditionalRulesRegistry;
    }
    /**
     * Update the conditional rules registry. Called after external refresh
     * paths (e.g. /memory refresh or /directory add) that bypass
     * refreshHierarchicalMemory().
     */
    setConditionalRulesRegistry(registry) {
        this.conditionalRulesRegistry = registry;
    }
    getContextRuleExcludes() {
        return this.contextRuleExcludes;
    }
    getContentGenerator() {
        return (getRuntimeContentGenerator()?.contentGenerator ?? this.contentGenerator);
    }
    /**
     * Get the ModelsConfig instance for model-related operations.
     * External code (e.g., CLI) can use this to access model configuration.
     */
    getModelsConfig() {
        return this.modelsConfig;
    }
    /**
     * Updates the credentials in the generation config.
     * Exclusive for `OpenAIKeyPrompt` to update credentials via `/auth`
     * Delegates to ModelsConfig.
     */
    updateCredentials(credentials, settingsGenerationConfig) {
        this.modelsConfig.updateCredentials(credentials, settingsGenerationConfig);
    }
    /**
     * Reload model providers configuration at runtime.
     * This enables hot-reloading of modelProviders settings without restarting the CLI.
     * Should be called before refreshAuth when settings.json has been updated.
     *
     * @param modelProvidersConfig - The updated model providers configuration
     */
    reloadModelProvidersConfig(modelProvidersConfig) {
        this.modelsConfig.reloadModelProvidersConfig(modelProvidersConfig);
    }
    /**
     * Refresh authentication and rebuild ContentGenerator.
     */
    async refreshAuth(authMethod, isInitialAuth) {
        // Sync modelsConfig state for this auth refresh
        const modelId = this.modelsConfig.getModel();
        this.modelsConfig.syncAfterAuthRefresh(authMethod, modelId);
        // Check and consume cached credentials flag
        const requireCached = this.modelsConfig.consumeRequireCachedCredentialsFlag();
        const { config, sources } = resolveContentGeneratorConfigWithSources(this, authMethod, this.modelsConfig.getGenerationConfig(), this.modelsConfig.getGenerationConfigSources(), {
            strictModelProvider: this.modelsConfig.isStrictModelProviderSelection(),
        });
        const newContentGeneratorConfig = config;
        this.contentGenerator = await createContentGenerator(newContentGeneratorConfig, this, requireCached ? true : isInitialAuth);
        // Only assign to instance properties after successful initialization
        this.contentGeneratorConfig = newContentGeneratorConfig;
        this.contentGeneratorConfigSources = sources;
        // Initialize BaseLlmClient now that the ContentGenerator is available
        this.baseLlmClient = new BaseLlmClient(this.contentGenerator, this);
        // Fire auth_success notification hook (supports both interactive & non-interactive)
        const messageBus = this.getMessageBus();
        const hooksEnabled = !this.getDisableAllHooks();
        if (hooksEnabled && messageBus) {
            fireNotificationHook(messageBus, `Successfully authenticated with ${authMethod}`, NotificationType.AuthSuccess, 'Authentication successful').catch(() => {
                // Silently ignore errors - fireNotificationHook has internal error handling
                // and notification hooks should not block the auth flow
            });
        }
    }
    /**
     * Provides access to the BaseLlmClient for stateless LLM operations.
     */
    getBaseLlmClient() {
        if (!this.baseLlmClient) {
            // Handle cases where initialization might be deferred or authentication failed
            if (this.contentGenerator) {
                this.baseLlmClient = new BaseLlmClient(this.getContentGenerator(), this);
            }
            else {
                throw new Error('BaseLlmClient not initialized. Ensure authentication has occurred and ContentGenerator is ready.');
            }
        }
        return this.baseLlmClient;
    }
    getSessionId() {
        return this.sessionId;
    }
    /**
     * Returns warnings generated during configuration resolution.
     * These warnings are collected from model configuration resolution
     * and should be displayed to the user during startup.
     */
    getWarnings() {
        return this.warnings;
    }
    getDebugLogger() {
        return this.debugLogger;
    }
    /**
     * Starts a new session and resets session-scoped services.
     */
    startNewSession(sessionId, sessionData) {
        // Finalize the outgoing session before switching.
        try {
            this.chatRecordingService?.finalize();
        }
        catch {
            // Best-effort — don't block session switch
        }
        const previousSessionId = this.sessionId;
        this.sessionId = sessionId ?? randomUUID();
        this.sessionData = sessionData;
        setDebugLogSession(this);
        this.debugLogger = createDebugLogger();
        this.chatRecordingService = this.chatRecordingEnabled
            ? new ChatRecordingService(this)
            : undefined;
        // The file-read cache is session-scoped: its `file_unchanged`
        // placeholder relies on the model having seen the prior full read
        // earlier in the *current* conversation. Carrying entries across
        // /clear or session resume would let a follow-up Read return the
        // placeholder despite the new session never having received the
        // file contents. Use the getter so the lazy own-property
        // initialization in getFileReadCache() applies even for Configs
        // constructed via Object.create — those should clear their own
        // cache, not the parent's.
        this.getFileReadCache().clear();
        this.fileHistoryService = undefined;
        refreshSessionContext(this.sessionId);
        // The commit-attribution singleton accumulates per-file AI edits
        // and a session-scoped prompt counter — both stop being meaningful
        // when the session resets. Without this, pending attributions
        // from the previous session could attach to a commit in the new
        // one, and the "N-shotted" PR label would span sessions.
        CommitAttributionService.resetInstance();
        if (this.initialized) {
            logStartSession(this, new StartSessionEvent(this));
        }
        // Refresh the runtime.json sidecar so external observers (terminal
        // multiplexers, IDE integrations, status daemons) see the new
        // session id rather than a stale claim against a still-live PID.
        // /clear, /reset, /new, and /resume all flow through this method,
        // so handling the swap centrally covers every same-PID session
        // transition. Best-effort: must never block /clear or /resume.
        //
        // Only refresh when THIS process established its own sidecar at
        // startup (interactive UI). A non-interactive `/clear` (e.g.
        // qwen --prompt-interactive) must not delete a sibling shell's
        // sidecar that happens to share the outgoing session id —
        // mirrors kimi-cli PR #2082's "write only when a session is
        // established for this process" rule.
        if (this.runtimeStatusEnabled && previousSessionId !== this.sessionId) {
            const oldPath = this.storage.getRuntimeStatusPath(previousSessionId);
            const newPath = this.storage.getRuntimeStatusPath(this.sessionId);
            const cliVersion = this.cliVersion ?? null;
            const workDir = this.targetDir;
            const newSessionId = this.sessionId;
            void (async () => {
                try {
                    await clearRuntimeStatus(oldPath);
                    await writeRuntimeStatus(newPath, {
                        sessionId: newSessionId,
                        workDir,
                        qwenVersion: cliVersion,
                    });
                }
                catch {
                    // ignored: best-effort cleanup
                }
            })();
        }
        return this.sessionId;
    }
    /**
     * Marks this Config as the owner of a runtime.json sidecar for the
     * current PID. Call once after the initial sidecar write succeeds
     * (typically from the interactive UI bootstrap). When set, subsequent
     * startNewSession() calls will refresh the sidecar on session swap;
     * when unset, startNewSession() leaves sibling sidecars alone so a
     * short-lived non-interactive process can't trample a concurrent
     * shell's sidecar that happens to share the outgoing session id.
     */
    markRuntimeStatusEnabled() {
        this.runtimeStatusEnabled = true;
    }
    /**
     * Returns the resumed session data if this session was resumed from a previous one.
     */
    getResumedSessionData() {
        return this.sessionData;
    }
    shouldLoadMemoryFromIncludeDirectories() {
        return this.loadMemoryFromIncludeDirectories;
    }
    getImportFormat() {
        return this.importFormat;
    }
    getContentGeneratorConfig() {
        return (getRuntimeContentGenerator()?.contentGeneratorConfig ??
            this.contentGeneratorConfig);
    }
    getContentGeneratorConfigSources() {
        // If contentGeneratorConfigSources is empty (before initializeAuth),
        // get sources from ModelsConfig
        if (Object.keys(this.contentGeneratorConfigSources).length === 0 &&
            this.modelsConfig) {
            return this.modelsConfig.getGenerationConfigSources();
        }
        return this.contentGeneratorConfigSources;
    }
    getModel() {
        return (this.getContentGeneratorConfig()?.model || this.modelsConfig.getModel());
    }
    onModelChange(listener) {
        this.modelChangeListeners.add(listener);
        return () => {
            this.modelChangeListeners.delete(listener);
        };
    }
    notifyModelChangeListeners() {
        const model = this.getModel();
        for (const listener of this.modelChangeListeners) {
            listener(model);
        }
    }
    /**
     * Returns the configured fast model selector when it resolves to an available
     * model. Bare selectors stay bare and authType-qualified selectors keep their
     * authType prefix so selector-aware runtime paths can route cross-auth calls.
     */
    getFastModel() {
        const selector = this.resolveFastModelSelector();
        if (!selector)
            return undefined;
        const available = selector.authType
            ? this.getAllConfiguredModels([selector.authType])
            : this.getAllConfiguredModels();
        if (!available.some((m) => m.id === selector.modelId)) {
            return undefined;
        }
        const rawSelector = resolveModelId(this.fastModel);
        return rawSelector?.authType
            ? `${rawSelector.authType}:${selector.modelId}`
            : selector.modelId;
    }
    resolveFastModelSelector() {
        if (!this.fastModel)
            return undefined;
        try {
            return resolveModelId(this.fastModel, {
                currentAuthType: this.getContentGeneratorConfig()?.authType,
                getAvailableModels: (authTypes) => this.getAllConfiguredModels(authTypes),
            });
        }
        catch {
            return undefined;
        }
    }
    /**
     * Update the fast model at runtime (e.g., when the user runs `/model --fast <model>`).
     * Pass undefined or an empty string to clear the fast model override.
     */
    setFastModel(model) {
        this.fastModel = model || undefined;
    }
    /**
     * Set model programmatically (e.g., VLM auto-switch, fallback).
     * Delegates to ModelsConfig.
     */
    async setModel(newModel, metadata) {
        await this.modelsConfig.setModel(newModel, metadata);
        // Also update contentGeneratorConfig for hot-update compatibility
        if (this.contentGeneratorConfig) {
            this.contentGeneratorConfig.model = newModel;
        }
        this.notifyModelChangeListeners();
    }
    /**
     * Handle model change from ModelsConfig.
     * This updates the content generator config with the new model settings.
     */
    async handleModelChange(authType, requiresRefresh) {
        if (!this.contentGeneratorConfig) {
            return;
        }
        // Keep full history (including thought parts) on model switch.
        // Some OpenAI-compatible reasoning models (e.g. DeepSeek) require
        // reasoning_content to be preserved across turns.
        // Hot update path: only supported for qwen-oauth.
        // For other auth types we always refresh to recreate the ContentGenerator.
        //
        // Rationale:
        // - Non-qwen providers may need to re-validate credentials / baseUrl / envKey.
        // - ModelsConfig.applyResolvedModelDefaults can clear or change credentials sources.
        // - Refresh keeps runtime behavior consistent and centralized.
        if (authType === AuthType.QWEN_OAUTH && !requiresRefresh) {
            const { config, sources } = resolveContentGeneratorConfigWithSources(this, authType, this.modelsConfig.getGenerationConfig(), this.modelsConfig.getGenerationConfigSources(), {
                strictModelProvider: this.modelsConfig.isStrictModelProviderSelection(),
            });
            // Hot-update fields (qwen-oauth models share the same auth + client).
            this.contentGeneratorConfig.model = config.model;
            this.contentGeneratorConfig.samplingParams = config.samplingParams;
            this.contentGeneratorConfig.contextWindowSize = config.contextWindowSize;
            this.contentGeneratorConfig.enableCacheControl =
                config.enableCacheControl;
            this.contentGeneratorConfig.splitToolMedia = config.splitToolMedia;
            if ('model' in sources) {
                this.contentGeneratorConfigSources['model'] = sources['model'];
            }
            if ('samplingParams' in sources) {
                this.contentGeneratorConfigSources['samplingParams'] =
                    sources['samplingParams'];
            }
            if ('enableCacheControl' in sources) {
                this.contentGeneratorConfigSources['enableCacheControl'] =
                    sources['enableCacheControl'];
            }
            if ('contextWindowSize' in sources) {
                this.contentGeneratorConfigSources['contextWindowSize'] =
                    sources['contextWindowSize'];
            }
            if ('splitToolMedia' in sources) {
                this.contentGeneratorConfigSources['splitToolMedia'] =
                    sources['splitToolMedia'];
            }
            return;
        }
        // Full refresh path
        await this.refreshAuth(authType);
    }
    /**
     * Get available models for the current authType.
     * Delegates to ModelsConfig.
     */
    getAvailableModels() {
        return this.modelsConfig.getAvailableModels();
    }
    /**
     * Get available models for a specific authType.
     * Delegates to ModelsConfig.
     */
    getAvailableModelsForAuthType(authType) {
        return this.modelsConfig.getAvailableModelsForAuthType(authType);
    }
    /**
     * Get all configured models across authTypes.
     * Delegates to ModelsConfig.
     */
    getAllConfiguredModels(authTypes) {
        return this.modelsConfig.getAllConfiguredModels(authTypes);
    }
    /**
     * Get the currently active runtime model snapshot.
     * Delegates to ModelsConfig.
     */
    getActiveRuntimeModelSnapshot() {
        return this.modelsConfig.getActiveRuntimeModelSnapshot();
    }
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
    async switchModel(authType, modelId, options) {
        await this.modelsConfig.switchModel(authType, modelId, options);
        this.notifyModelChangeListeners();
    }
    getMaxSessionTurns() {
        return this.maxSessionTurns;
    }
    getClearContextOnIdle() {
        return this.clearContextOnIdle;
    }
    getSessionTokenLimit() {
        return this.sessionTokenLimit;
    }
    getEmbeddingModel() {
        return this.embeddingModel;
    }
    getSandbox() {
        return this.sandbox;
    }
    isRestrictiveSandbox() {
        const sandboxConfig = this.getSandbox();
        const seatbeltProfile = process.env['SEATBELT_PROFILE'];
        return (!!sandboxConfig &&
            sandboxConfig.command === 'sandbox-exec' &&
            !!seatbeltProfile &&
            seatbeltProfile.startsWith('restrictive-'));
    }
    getTargetDir() {
        return this.targetDir;
    }
    getProjectRoot() {
        return this.targetDir;
    }
    getCwd() {
        return this.targetDir;
    }
    getWorkspaceContext() {
        return this.workspaceContext;
    }
    getToolRegistry() {
        return this.toolRegistry;
    }
    /**
     * Shuts down the Config and releases all resources.
     * This method is idempotent and safe to call multiple times.
     * It handles the case where initialization was not completed.
     */
    async shutdown() {
        try {
            if (!this.initialized) {
                // Nothing else to clean up if not initialized.
                return;
            }
            // Finalize the current session's metadata before cleanup, then drain
            // the async write queue so no records are lost on exit.
            try {
                this.chatRecordingService?.finalize();
                await this.chatRecordingService?.flush();
            }
            catch {
                // Best-effort — don't block shutdown
            }
            this.skillManager?.stopWatching();
            if (this.toolRegistry) {
                await this.toolRegistry.stop();
            }
            this.backgroundTaskRegistry.abortAll();
            this.monitorRegistry.abortAll({ notify: false });
            this.backgroundShellRegistry.abortAll();
            await this.cleanupArenaRuntime();
        }
        catch (error) {
            // Log but don't throw - cleanup should be best-effort
            this.debugLogger.error('Error during Config shutdown:', error);
        }
        finally {
            if (isTelemetrySdkInitialized()) {
                await shutdownTelemetry();
            }
        }
    }
    getPromptRegistry() {
        return this.promptRegistry;
    }
    getDebugMode() {
        return this.debugMode;
    }
    getQuestion() {
        return this.question;
    }
    getSystemPrompt() {
        return this.systemPrompt;
    }
    getAppendSystemPrompt() {
        return this.appendSystemPrompt;
    }
    /** @deprecated Use getPermissionsAllow() instead. */
    getCoreTools() {
        if (this.getBareMode()) {
            return DEFAULT_BARE_CORE_TOOLS;
        }
        return this.coreTools;
    }
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
    getPermissionsAllow() {
        const base = this.permissionsAllow ?? [];
        const sdkAllow = [...(this.allowedTools ?? [])];
        if (sdkAllow.length === 0)
            return base.length > 0 ? base : [];
        const merged = [...base];
        for (const t of sdkAllow) {
            if (t && !merged.includes(t))
                merged.push(t);
        }
        return merged;
    }
    getPermissionsAsk() {
        return this.permissionsAsk;
    }
    /**
     * Returns the merged deny-rules for PermissionManager.
     *
     * Merges:
     *   - settings.permissions.deny  (persistent rules from all scopes)
     *   - excludeTools param  (SDK / argv blocklist)
     *
     * CLI callers pre-merge argv.excludeTools into permissionsDeny.
     */
    getPermissionsDeny() {
        const base = this.permissionsDeny ?? [];
        const sdkDeny = this.excludeTools ?? [];
        if (sdkDeny.length === 0)
            return base.length > 0 ? base : [];
        const merged = [...base];
        for (const t of sdkDeny) {
            if (t && !merged.includes(t))
                merged.push(t);
        }
        return merged;
    }
    getToolDiscoveryCommand() {
        return this.toolDiscoveryCommand;
    }
    /**
     * Returns the pre-merged list of slash command names that should be hidden
     * from the CLI surface. Callers should treat this as a case-insensitive
     * denylist; `CommandService.create` handles the normalization.
     */
    getDisabledSlashCommands() {
        return this.disabledSlashCommands;
    }
    /**
     * Returns the read-only set of tool names hidden from this Config's
     * ToolRegistry. Consulted by `ToolRegistry.registerTool` and
     * `ToolRegistry.registerFactory` to skip registration. Toggling at
     * runtime requires re-spawning the ACP child (the set is frozen at
     * construction time). See `disabledTools` in ConfigParameters.
     */
    getDisabledTools() {
        return this.disabledTools;
    }
    getToolCallCommand() {
        return this.toolCallCommand;
    }
    getMcpServerCommand() {
        return this.mcpServerCommand;
    }
    getMcpServers() {
        let mcpServers = { ...(this.mcpServers || {}) };
        const extensions = this.getActiveExtensions();
        for (const extension of extensions) {
            Object.entries(extension.config.mcpServers || {}).forEach(([key, server]) => {
                if (mcpServers[key])
                    return;
                mcpServers[key] = {
                    ...server,
                    extensionName: extension.config.name,
                };
            });
        }
        if (this.allowedMcpServers) {
            mcpServers = Object.fromEntries(Object.entries(mcpServers).filter(([key]) => this.allowedMcpServers?.includes(key)));
        }
        // Note: We no longer filter out excluded servers here.
        // The UI layer should check isMcpServerDisabled() to determine
        // whether to show a server as disabled.
        return mcpServers;
    }
    getExcludedMcpServers() {
        return this.excludedMcpServers;
    }
    setExcludedMcpServers(excluded) {
        this.excludedMcpServers = excluded;
    }
    isMcpServerDisabled(serverName) {
        return this.excludedMcpServers?.includes(serverName) ?? false;
    }
    addMcpServers(servers) {
        if (this.initialized) {
            throw new Error('Cannot modify mcpServers after initialization');
        }
        this.mcpServers = { ...this.mcpServers, ...servers };
    }
    isLspEnabled() {
        return this.lspEnabled && !this.getBareMode();
    }
    getLspClient() {
        return this.lspClient;
    }
    getLspStatusSnapshot() {
        if (!this.isLspEnabled()) {
            return this.createLspStatusSnapshot(false);
        }
        const clientSnapshot = this.lspClient?.getStatusSnapshot?.();
        if (clientSnapshot) {
            return {
                ...clientSnapshot,
                enabled: true,
                initializationError: this.lspInitializationError ?? clientSnapshot.initializationError,
            };
        }
        if (this.lspClient) {
            return {
                ...this.createLspStatusSnapshot(true),
                statusUnavailable: true,
            };
        }
        return this.createLspStatusSnapshot(true, this.lspInitializationError ?? 'LSP client is not initialized');
    }
    createLspStatusSnapshot(enabled, initializationError) {
        return {
            enabled,
            configuredServers: 0,
            readyServers: 0,
            failedServers: 0,
            inProgressServers: 0,
            notStartedServers: 0,
            servers: [],
            ...(initializationError ? { initializationError } : {}),
        };
    }
    /**
     * Allows wiring an LSP client after Config construction but before initialize().
     */
    setLspClient(client) {
        if (this.initialized) {
            throw new Error('Cannot set LSP client after initialization');
        }
        this.lspClient = client;
    }
    setLspInitializationError(error) {
        if (this.initialized) {
            throw new Error('Cannot set LSP status after initialization');
        }
        this.lspInitializationError =
            error instanceof Error ? error.message : error;
    }
    getSessionSubagents() {
        return this.sessionSubagents;
    }
    setSessionSubagents(subagents) {
        if (this.initialized) {
            throw new Error('Cannot modify sessionSubagents after initialization');
        }
        this.sessionSubagents = subagents;
    }
    getSdkMode() {
        return this.sdkMode;
    }
    setSdkMode(value) {
        this.sdkMode = value;
    }
    getUserMemory() {
        return this.userMemory;
    }
    setUserMemory(newUserMemory) {
        this.userMemory = newUserMemory;
    }
    getGeminiMdFileCount() {
        return this.geminiMdFileCount;
    }
    setGeminiMdFileCount(count) {
        this.geminiMdFileCount = count;
    }
    getArenaManager() {
        return this.arenaManager;
    }
    setArenaManager(manager) {
        this.arenaManager = manager;
        this.arenaManagerChangeCallback?.(manager);
    }
    /**
     * Register a callback invoked whenever the arena manager changes.
     * Pass `null` to unsubscribe. Only one subscriber is supported.
     */
    onArenaManagerChange(cb) {
        this.arenaManagerChangeCallback = cb;
    }
    getArenaAgentClient() {
        return this.arenaAgentClient;
    }
    getAgentsSettings() {
        return this.agentsSettings;
    }
    /**
     * Clean up Arena runtime. When `force` is true (e.g., /arena select --discard),
     * always removes worktrees regardless of preserveArtifacts.
     */
    async cleanupArenaRuntime(force) {
        const manager = this.arenaManager;
        if (!manager) {
            return;
        }
        if (!force && this.agentsSettings.arena?.preserveArtifacts) {
            await manager.cleanupRuntime();
        }
        else {
            await manager.cleanup();
        }
        this.setArenaManager(null);
    }
    getApprovalMode() {
        return this.approvalMode;
    }
    /**
     * Returns the AUTO approval mode classifier settings (hints + environment).
     * Returns an empty object when no settings are configured.
     */
    getAutoModeSettings() {
        return this.permissionsAutoMode;
    }
    /**
     * Returns the AUTO mode denialTracking state for the current session.
     * Used by the scheduler to decide whether to fall back from classifier
     * evaluation to manual approval. Session-scoped, never persisted.
     */
    getAutoModeDenialState() {
        return this.autoModeDenialState;
    }
    /**
     * Replace the AUTO mode denialTracking state. Caller produces the new
     * state via one of the pure transitions in `permissions/denialTracking.ts`
     * (recordAllow / recordBlock / recordUnavailable / recordFallback*).
     */
    setAutoModeDenialState(state) {
        this.autoModeDenialState = state;
    }
    /**
     * Returns the approval mode that was active before entering plan mode.
     * Falls back to DEFAULT if no pre-plan mode was recorded.
     */
    getPrePlanMode() {
        return this.prePlanMode ?? ApprovalMode.DEFAULT;
    }
    setApprovalMode(mode) {
        if (!this.isTrustedFolder() &&
            mode !== ApprovalMode.DEFAULT &&
            mode !== ApprovalMode.PLAN) {
            throw new TrustGateError('Cannot enable privileged approval modes in an untrusted folder.');
        }
        // Track the mode before entering plan mode so it can be restored later
        if (mode === ApprovalMode.PLAN && this.approvalMode !== ApprovalMode.PLAN) {
            this.prePlanMode = this.approvalMode;
        }
        else if (mode !== ApprovalMode.PLAN &&
            this.approvalMode === ApprovalMode.PLAN) {
            this.prePlanMode = undefined;
        }
        // Strip over-broad allow rules (Bash interpreter wildcards, any Agent /
        // Skill allow) on AUTO entry; restore them on AUTO exit. Settings on
        // disk are NEVER touched — this is a runtime-only adjustment of the
        // active PermissionManager rule set. The PermissionManager is `null`
        // until initialize() is called, so skip the hook on early-startup
        // mode changes (the strip will happen via initialize for AUTO-default
        // sessions).
        const fromMode = this.approvalMode;
        if (this.permissionManager) {
            if (mode === ApprovalMode.AUTO && fromMode !== ApprovalMode.AUTO) {
                this.permissionManager.stripDangerousRulesForAutoMode();
            }
            else if (fromMode === ApprovalMode.AUTO && mode !== ApprovalMode.AUTO) {
                this.permissionManager.restoreDangerousRules();
            }
        }
        // Any deliberate mode change invalidates the AUTO denialTracking signal.
        if (fromMode !== mode) {
            this.autoModeDenialState = resetDenialState();
        }
        this.approvalMode = mode;
    }
    /**
     * Returns the directory where this session's plan file is stored.
     */
    getPlansDir() {
        return this.plansDir;
    }
    assertPlansDirWithinTargetDir() {
        if (!this.plansDirectoryConfigured) {
            return;
        }
        Storage.assertPathWithinDirectory(this.plansDir, this.targetDir, `plansDirectory must resolve within the project root.`);
    }
    assertPlanFilePathWithinTargetDir(filePath) {
        if (!this.plansDirectoryConfigured) {
            return;
        }
        Storage.assertPathWithinDirectory(filePath, this.targetDir, `plansDirectory must resolve within the project root.`);
    }
    addLegacyPlanLocationWarning() {
        try {
            if (!this.plansDirectoryConfigured) {
                return;
            }
            const legacyPlansDir = Storage.getPlansDir();
            const legacyPlanFiles = this.getPlanFileNames(legacyPlansDir);
            if (legacyPlanFiles.length === 0) {
                return;
            }
            const configuredPlanFiles = new Set(this.getPlanFileNames(this.plansDir));
            const hiddenLegacyPlanFiles = legacyPlanFiles.filter((fileName) => !configuredPlanFiles.has(fileName));
            if (hiddenLegacyPlanFiles.length === 0) {
                return;
            }
            this.warnings.push(`Warning: Saved plan files exist at ${legacyPlansDir}, but ` +
                `plansDirectory is configured to use ${this.plansDir}. Move ` +
                `existing plan files to ${this.plansDir} if you want to keep ` +
                `using them.`);
        }
        catch (err) {
            const message = `Failed to check legacy plan directory migration warning: ${err instanceof Error ? err.message : String(err)}`;
            this.warnings.push(message);
            this.debugLogger.warn(message, err);
        }
    }
    getPlanFileNames(plansDir) {
        try {
            return fs.readdirSync(plansDir).filter((entry) => entry.endsWith('.md'));
        }
        catch (err) {
            const code = err.code;
            if (code === 'ENOENT') {
                return [];
            }
            if (code === 'EACCES' || code === 'EPERM') {
                const message = `Failed to read plan directory ${plansDir}: ${err instanceof Error ? err.message : String(err)}`;
                this.warnings.push(message);
                this.debugLogger.warn(message, err);
                return [];
            }
            throw err;
        }
    }
    /**
     * Returns the file path for this session's plan file.
     */
    getPlanFilePath() {
        return path.join(this.plansDir, `${Storage.sanitizePlanSessionId(this.sessionId)}.md`);
    }
    /**
     * Saves a plan to disk for the current session.
     */
    savePlan(plan) {
        this.assertPlansDirWithinTargetDir();
        const filePath = this.getPlanFilePath();
        const dir = path.dirname(filePath);
        fs.mkdirSync(dir, { recursive: true });
        // Write to a temp file first, then atomically rename to avoid
        // leaving a corrupted file if the process crashes mid-write.
        const tmpPath = filePath + '.tmp';
        fs.writeFileSync(tmpPath, plan, 'utf-8');
        try {
            fs.renameSync(tmpPath, filePath);
        }
        catch (err) {
            if (err.code !== 'EXDEV') {
                throw err;
            }
            fs.copyFileSync(tmpPath, filePath);
            fs.unlinkSync(tmpPath);
        }
        try {
            this.assertPlanFilePathWithinTargetDir(filePath);
        }
        catch (err) {
            try {
                fs.unlinkSync(filePath);
            }
            catch {
                // Ignore rollback errors; the containment check already failed.
            }
            throw err;
        }
    }
    /**
     * Loads the plan for the current session, or returns undefined if none exists.
     */
    loadPlan() {
        this.assertPlansDirWithinTargetDir();
        const filePath = this.getPlanFilePath();
        this.assertPlanFilePathWithinTargetDir(filePath);
        try {
            return fs.readFileSync(filePath, 'utf-8');
        }
        catch (error) {
            if (typeof error === 'object' &&
                error !== null &&
                'code' in error &&
                error.code === 'ENOENT') {
                return undefined;
            }
            throw error;
        }
    }
    getInputFormat() {
        return this.inputFormat;
    }
    getIncludePartialMessages() {
        return this.includePartialMessages;
    }
    getAccessibility() {
        return this.accessibility;
    }
    getTelemetryEnabled() {
        return this.telemetrySettings.enabled ?? false;
    }
    getTelemetryLogPromptsEnabled() {
        return this.telemetrySettings.logPrompts ?? true;
    }
    getTelemetryIncludeSensitiveSpanAttributes() {
        return this.telemetrySettings.includeSensitiveSpanAttributes ?? false;
    }
    getTelemetryOtlpEndpoint() {
        return this.telemetrySettings.otlpEndpoint ?? DEFAULT_OTLP_ENDPOINT;
    }
    getTelemetryOtlpProtocol() {
        return this.telemetrySettings.otlpProtocol ?? 'grpc';
    }
    getTelemetryOtlpTracesEndpoint() {
        return this.telemetrySettings.otlpTracesEndpoint;
    }
    getTelemetryOtlpLogsEndpoint() {
        return this.telemetrySettings.otlpLogsEndpoint;
    }
    getTelemetryOtlpMetricsEndpoint() {
        return this.telemetrySettings.otlpMetricsEndpoint;
    }
    getTelemetryTarget() {
        return this.telemetrySettings.target ?? DEFAULT_TELEMETRY_TARGET;
    }
    getTelemetryResourceAttributes() {
        return this.telemetrySettings.resourceAttributes ?? {};
    }
    getTelemetryMetricsIncludeSessionId() {
        return this.telemetrySettings.metrics?.includeSessionId ?? false;
    }
    getTelemetryResourceAttributeWarnings() {
        return this.telemetrySettings.resourceAttributeWarnings ?? [];
    }
    getTelemetryOutfile() {
        return this.telemetrySettings.outfile;
    }
    getGitCoAuthor() {
        return this.gitCoAuthor;
    }
    getGeminiClient() {
        return this.geminiClient;
    }
    getCronScheduler() {
        if (!this.cronScheduler) {
            this.cronScheduler = new CronScheduler();
        }
        return this.cronScheduler;
    }
    isCronEnabled() {
        // Cron is experimental and opt-in: enabled via settings or env var
        if (process.env['QWEN_CODE_ENABLE_CRON'] === '1')
            return true;
        return this.cronEnabled;
    }
    /**
     * Whether the turn loop should fire a fast-model call after each tool batch
     * to emit a `tool_use_summary` message. Mirrors Claude Code's
     * `CLAUDE_CODE_EMIT_TOOL_USE_SUMMARIES` gate, but defaults to on so the
     * compact-mode UI benefits without configuration.
     *
     * Env overrides (either direction): `QWEN_CODE_EMIT_TOOL_USE_SUMMARIES=0`
     * to force off, `=1` to force on.
     */
    getEmitToolUseSummaries() {
        const env = process.env['QWEN_CODE_EMIT_TOOL_USE_SUMMARIES'];
        if (env === '0' || env === 'false')
            return false;
        if (env === '1' || env === 'true')
            return true;
        return this.emitToolUseSummaries;
    }
    getEnableRecursiveFileSearch() {
        return this.fileFiltering.enableRecursiveFileSearch;
    }
    getFileFilteringEnableFuzzySearch() {
        return this.fileFiltering.enableFuzzySearch;
    }
    getFileFilteringRespectGitIgnore() {
        return this.fileFiltering.respectGitIgnore;
    }
    getFileFilteringRespectQwenIgnore() {
        return this.fileFiltering.respectQwenIgnore;
    }
    getFileFilteringOptions() {
        return {
            respectGitIgnore: this.fileFiltering.respectGitIgnore,
            respectQwenIgnore: this.fileFiltering.respectQwenIgnore,
        };
    }
    /**
     * Gets custom file exclusion patterns from configuration.
     * TODO: This is a placeholder implementation. In the future, this could
     * read from settings files, CLI arguments, or environment variables.
     */
    getCustomExcludes() {
        // Placeholder implementation - returns empty array for now
        // Future implementation could read from:
        // - User settings file
        // - Project-specific configuration
        // - Environment variables
        // - CLI arguments
        return [];
    }
    getCheckpointingEnabled() {
        return this.checkpointing;
    }
    getFileCheckpointingEnabled() {
        return this.fileCheckpointingEnabled;
    }
    getFileHistoryService() {
        if (!this.fileHistoryService) {
            this.fileHistoryService = new FileHistoryService(this.sessionId, this.fileCheckpointingEnabled, this.cwd);
        }
        return this.fileHistoryService;
    }
    getProxy() {
        return normalizeProxyUrl(this.proxy);
    }
    getWorkingDir() {
        return this.cwd;
    }
    getBugCommand() {
        return this.bugCommand;
    }
    getFileService() {
        if (!this.fileDiscoveryService) {
            this.fileDiscoveryService = new FileDiscoveryService(this.targetDir);
        }
        return this.fileDiscoveryService;
    }
    getUsageStatisticsEnabled() {
        return false;
    }
    getExtensionContextFilePaths() {
        const extensionContextFilePaths = this.getActiveExtensions().flatMap((e) => e.contextFiles);
        return [
            ...extensionContextFilePaths,
            ...(this.outputLanguageFilePath ? [this.outputLanguageFilePath] : []),
        ];
    }
    getExperimentalZedIntegration() {
        return this.experimentalZedIntegration;
    }
    getListExtensions() {
        return this.listExtensions;
    }
    getExtensionManager() {
        return this.extensionManager;
    }
    /**
     * Get the hook system instance if hooks are enabled.
     * Returns undefined if hooks are not enabled.
     */
    getHookSystem() {
        return this.hookSystem;
    }
    /**
     * Fast-path check: returns true only when hooks are enabled AND there are
     * registered hooks for the given event name.  Callers can use this to skip
     * expensive MessageBus round-trips when no hooks are configured.
     */
    hasHooksForEvent(eventName, sessionId) {
        return (this.hookSystem?.hasHooksForEvent(eventName, sessionId ?? this.getSessionId()) ?? false);
    }
    /**
     * Check if all hooks are disabled.
     */
    getDisableAllHooks() {
        return this.disableAllHooks || this.getBareMode();
    }
    getStopHookBlockingCap() {
        return this.stopHookBlockingCap;
    }
    getManagedAutoMemoryEnabled() {
        return this.enableManagedAutoMemory && !this.getBareMode();
    }
    getManagedAutoDreamEnabled() {
        return this.enableManagedAutoDream && !this.getBareMode();
    }
    getAutoSkillEnabled() {
        return this.enableAutoSkill && !this.getBareMode();
    }
    /**
     * Return the MemoryManager instance created for this Config.
     * Use this to share background-task state (registry, drainer) with memory
     * module runtimes (extract, dream) instead of relying on module-level
     * globals.
     */
    getMemoryManager() {
        return this.memoryManager;
    }
    /**
     * Get the message bus instance.
     * Returns undefined if not set.
     */
    getMessageBus() {
        return this.messageBus;
    }
    /**
     * Set the message bus instance.
     * This is called by the CLI layer to inject the MessageBus.
     */
    setMessageBus(messageBus) {
        this.messageBus = messageBus;
    }
    /**
     * Get project-level hooks configuration.
     * Returns hooks from workspace settings, only in trusted folders.
     * Used by HookRegistry to load project-specific hooks with proper source attribution.
     */
    getProjectHooks() {
        if (this.getBareMode()) {
            return undefined;
        }
        // Only return project hooks if workspace is trusted
        if (!this.isTrustedFolder()) {
            return undefined;
        }
        // Prefer new projectHooks field, fall back to hooks for backward compatibility
        const hooks = this.projectHooks ?? this.hooks;
        return hooks;
    }
    /**
     * Get user-level hooks configuration.
     * Returns hooks from user settings, always available regardless of folder trust.
     * Used by HookRegistry to load user-specific hooks with proper source attribution.
     */
    getUserHooks() {
        if (this.getBareMode()) {
            return undefined;
        }
        // Prefer new userHooks field, fall back to hooks for backward compatibility
        const hooks = this.userHooks ?? this.hooks;
        return hooks;
    }
    getExtensions() {
        const extensions = this.extensionManager.getLoadedExtensions();
        if (this.overrideExtensions) {
            const overrideExtensionNames = new Set(this.overrideExtensions.map((name) => name.toLowerCase()));
            return extensions.filter((e) => overrideExtensionNames.has(e.name.toLowerCase()));
        }
        else {
            return extensions;
        }
    }
    getExplicitExtensionNames() {
        return (this.overrideExtensions ?? []).filter((name) => name.trim() !== '' && name.toLowerCase() !== 'none');
    }
    getActiveExtensions() {
        return this.getExtensions().filter((e) => e.isActive);
    }
    getBlockedMcpServers() {
        const mcpServers = { ...(this.mcpServers || {}) };
        const extensions = this.getActiveExtensions();
        for (const extension of extensions) {
            Object.entries(extension.config.mcpServers || {}).forEach(([key, server]) => {
                if (mcpServers[key])
                    return;
                mcpServers[key] = {
                    ...server,
                    extensionName: extension.config.name,
                };
            });
        }
        const blockedMcpServers = [];
        if (this.allowedMcpServers) {
            Object.entries(mcpServers).forEach(([key, server]) => {
                const isAllowed = this.allowedMcpServers?.includes(key);
                if (!isAllowed) {
                    blockedMcpServers.push({
                        name: key,
                        extensionName: server.extensionName || '',
                    });
                }
            });
        }
        return blockedMcpServers;
    }
    getNoBrowser() {
        return this.noBrowser;
    }
    isBrowserLaunchSuppressed() {
        return this.getNoBrowser() || !shouldAttemptBrowserLaunch();
    }
    getIdeMode() {
        return this.ideMode;
    }
    getFolderTrustFeature() {
        return this.folderTrustFeature;
    }
    /**
     * Returns 'true' if the workspace is considered "trusted".
     * 'false' for untrusted.
     */
    getFolderTrust() {
        return this.folderTrust;
    }
    /**
     * Returns the whitelist of allowed HTTP hook URL patterns.
     * If empty, all URLs are allowed (subject to SSRF protection).
     */
    getAllowedHttpHookUrls() {
        return this.getBareMode() ? [] : this.allowedHttpHookUrls;
    }
    isTrustedFolder() {
        // isWorkspaceTrusted in cli/src/config/trustedFolder.js returns undefined
        // when the file based trust value is unavailable, since it is mainly used
        // in the initialization for trust dialogs, etc. Here we return true since
        // config.isTrustedFolder() is used for the main business logic of blocking
        // tool calls etc in the rest of the application.
        //
        // Default value is true since we load with trusted settings to avoid
        // restarts in the more common path. If the user chooses to mark the folder
        // as untrusted, the CLI will restart and we will have the trust value
        // reloaded.
        const context = ideContextStore.get();
        if (context?.workspaceState?.isTrusted !== undefined) {
            return context.workspaceState.isTrusted;
        }
        return this.trustedFolder ?? true;
    }
    setIdeMode(value) {
        this.ideMode = value;
    }
    getAuthType() {
        return this.getContentGeneratorConfig()?.authType;
    }
    getCliVersion() {
        return this.cliVersion;
    }
    getChannel() {
        return this.channel;
    }
    /**
     * Get the file descriptor for dual output JSON event stream.
     * When set, the TUI mode will also emit structured JSON events to this fd.
     */
    getJsonFd() {
        return this.jsonFd;
    }
    /**
     * Get the file path for dual output JSON event stream.
     * When set, the TUI mode will also emit structured JSON events to this file.
     */
    getJsonFile() {
        return this.jsonFile;
    }
    /**
     * Get the JSON Schema the model's final output must conform to.
     * When set, the non-interactive CLI registers a synthetic
     * `structured_output` tool and ends the session on a valid call.
     */
    getJsonSchema() {
        return this.jsonSchema;
    }
    /**
     * Get the file path for remote input commands (bidirectional sync).
     * When set, the TUI mode will watch this file for JSONL commands written
     * by an external process and submit them as user messages.
     */
    getInputFile() {
        return this.inputFile;
    }
    /**
     * Get the default file encoding for new files.
     * @returns FileEncodingType
     */
    getDefaultFileEncoding() {
        return this.defaultFileEncoding;
    }
    /**
     * Get the current FileSystemService
     */
    getFileSystemService() {
        return this.fileSystemService;
    }
    /**
     * Set a custom FileSystemService
     */
    setFileSystemService(fileSystemService) {
        this.fileSystemService = fileSystemService;
    }
    getChatCompression() {
        return this.chatCompression;
    }
    isInteractive() {
        return this.interactive;
    }
    getUseRipgrep() {
        return this.useRipgrep;
    }
    getUseBuiltinRipgrep() {
        return this.useBuiltinRipgrep;
    }
    getShouldUseNodePtyShell() {
        return this.shouldUseNodePtyShell;
    }
    getSkipNextSpeakerCheck() {
        return this.skipNextSpeakerCheck;
    }
    getShellExecutionConfig() {
        return this.shellExecutionConfig;
    }
    setShellExecutionConfig(config) {
        this.shellExecutionConfig = {
            terminalWidth: config.terminalWidth ?? this.shellExecutionConfig.terminalWidth,
            terminalHeight: config.terminalHeight ?? this.shellExecutionConfig.terminalHeight,
            showColor: config.showColor ?? this.shellExecutionConfig.showColor,
            pager: config.pager ?? this.shellExecutionConfig.pager,
        };
    }
    getScreenReader() {
        return this.accessibility.screenReader ?? false;
    }
    getSkipLoopDetection() {
        return this.skipLoopDetection;
    }
    getSkipStartupContext() {
        return this.skipStartupContext;
    }
    getBareMode() {
        return this.bareMode;
    }
    getTruncateToolOutputThreshold() {
        if (this.truncateToolOutputThreshold <= 0) {
            return Number.POSITIVE_INFINITY;
        }
        return this.truncateToolOutputThreshold;
    }
    getTruncateToolOutputLines() {
        if (this.truncateToolOutputLines <= 0) {
            return Number.POSITIVE_INFINITY;
        }
        return this.truncateToolOutputLines;
    }
    getOutputFormat() {
        return this.outputFormat;
    }
    async getGitService() {
        if (!this.gitService) {
            this.gitService = new GitService(this.targetDir, this.storage);
            await this.gitService.initialize();
        }
        return this.gitService;
    }
    /**
     * Returns the chat recording service.
     */
    getChatRecordingService() {
        if (!this.chatRecordingEnabled) {
            return undefined;
        }
        if (!this.chatRecordingService) {
            this.chatRecordingService = new ChatRecordingService(this);
        }
        return this.chatRecordingService;
    }
    /**
     * Returns the transcript file path for the current session.
     * This is the path to the JSONL file where the conversation is recorded.
     * Returns empty string if chat recording is disabled.
     */
    getTranscriptPath() {
        if (!this.chatRecordingEnabled) {
            return '';
        }
        const projectDir = this.storage.getProjectDir();
        const sessionId = this.getSessionId();
        const safeFilename = `${sessionId}.jsonl`;
        return path.join(projectDir, 'chats', safeFilename);
    }
    /**
     * Gets or creates a SessionService for managing chat sessions.
     */
    getSessionService() {
        if (!this.sessionService) {
            this.sessionService = new SessionService(this.targetDir);
        }
        return this.sessionService;
    }
    getFileExclusions() {
        return this.fileExclusions;
    }
    getSubagentManager() {
        return this.subagentManager;
    }
    getBackgroundTaskRegistry() {
        return this.backgroundTaskRegistry;
    }
    getMonitorRegistry() {
        return this.monitorRegistry;
    }
    getBackgroundAgentResumeService() {
        if (!this.backgroundAgentResumeService) {
            this.backgroundAgentResumeService = new BackgroundAgentResumeService(this);
        }
        return this.backgroundAgentResumeService;
    }
    async loadPausedBackgroundAgents(sessionId = this.getSessionId()) {
        return this.getBackgroundAgentResumeService().loadPausedBackgroundAgents(sessionId);
    }
    async resumeBackgroundAgent(agentId, initialMessage) {
        return this.getBackgroundAgentResumeService().resumeBackgroundAgent(agentId, initialMessage);
    }
    abandonBackgroundAgent(agentId) {
        return this.getBackgroundAgentResumeService().abandonBackgroundAgent(agentId);
    }
    getBackgroundShellRegistry() {
        return this.backgroundShellRegistry;
    }
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
    getFileReadCache() {
        if (!Object.prototype.hasOwnProperty.call(this, 'fileReadCache')) {
            // The own-property write needs to bypass `private`'s structural
            // check — the field is conceptually still private to the class,
            // we just need TS to let us install an own copy on a child
            // instance produced by `Object.create(parent)`.
            this.fileReadCache =
                new FileReadCache();
        }
        return this.fileReadCache;
    }
    /**
     * When true, ReadFile / Edit / WriteFile must bypass the session
     * FileReadCache entirely and behave as if it did not exist (no
     * `file_unchanged` placeholder, no future prior-read enforcement).
     * Intended as an escape hatch for sessions where the cache's "model
     * has already seen this content earlier in the conversation"
     * assumption is unreliable — e.g. after context compaction or
     * transcript transformation.
     */
    getFileReadCacheDisabled() {
        return this.fileReadCacheDisabled;
    }
    /**
     * Whether interactive permission prompts should be auto-denied.
     * True for background agents that have no UI to show prompts.
     * PermissionRequest hooks still run and can override the denial.
     */
    getShouldAvoidPermissionPrompts() {
        return false;
    }
    getSkillManager() {
        return this.skillManager;
    }
    /**
     * Registers a provider that returns model-invocable commands (e.g., bundled
     * skills, user/project file commands, MCP prompts). Called by the CLI's
     * CommandService after initialisation so that SkillTool can merge these into
     * its tool description.
     */
    setModelInvocableCommandsProvider(provider) {
        this.modelInvocableCommandsProvider = provider;
    }
    /**
     * Returns the registered model-invocable commands provider, or null if none
     * has been registered (e.g., in SDK mode).
     */
    getModelInvocableCommandsProvider() {
        return this.modelInvocableCommandsProvider;
    }
    /**
     * Registers an executor that can invoke a model-invocable command by name
     * (e.g., MCP prompts). Returns the prompt content as a string, or null if
     * the command cannot be found or executed. Called by the CLI layer.
     */
    setModelInvocableCommandsExecutor(executor) {
        this.modelInvocableCommandsExecutor = executor;
    }
    /**
     * Returns the registered model-invocable commands executor, or null if none
     * has been registered (e.g., in SDK mode).
     */
    getModelInvocableCommandsExecutor() {
        return this.modelInvocableCommandsExecutor;
    }
    getPermissionManager() {
        return this.permissionManager;
    }
    /**
     * Returns the callback for persisting permission rules to settings files.
     * Returns undefined if no callback was provided (e.g. SDK mode).
     */
    getOnPersistPermissionRule() {
        return this.onPersistPermissionRuleCallback;
    }
    async createToolRegistry(sendSdkMcpMessage, options) {
        const registry = new ToolRegistry(this, this.eventEmitter, sendSdkMcpMessage);
        // Helper: check permission then register a lazy factory (no module import
        // happens here — the dynamic import() only runs when the tool is first used).
        const registerLazy = async (toolName, factory) => {
            // PermissionManager handles both the coreTools allowlist (registry-level)
            // and deny rules (runtime-level) in a single check.
            let pmEnabled = true;
            try {
                pmEnabled = this.permissionManager
                    ? await this.permissionManager.isToolEnabled(toolName)
                    : true; // Should never reach here after initialize(), but safe default.
            }
            catch (error) {
                this.debugLogger.warn(`Failed to check permissions for tool "${toolName}", skipping registration:`, error);
                return;
            }
            if (pmEnabled) {
                registry.registerFactory(toolName, factory);
            }
        };
        // The synthetic structured_output tool is the terminal contract for
        // --json-schema runs. It must be registered in BOTH the bare-mode
        // branch and the regular branch — without it the model can't finish
        // a structured run, so omitting either branch causes
        // `qwen [--bare] --json-schema X -p "..."` to loop until
        // maxSessionTurns and exit via the "plain text" failure path. Hoisted
        // out of the two branches so the dynamic-import factory shape stays
        // in sync between them.
        //
        // Skipped when building a subagent-context registry. `this.jsonSchema`
        // propagates to subagent overrides via prototype delegation
        // (`Object.create(base)` in `createApprovalModeOverride` /
        // `buildSubagentContextOverride`), but only `runNonInteractive`'s main
        // and drain loops detect a successful structured_output call as
        // terminal. A subagent that called the tool would receive the
        // "Session will end now" llmContent, then keep running because its
        // own loop has no termination handler — wasted tokens with no
        // structured payload surfacing on stdout. Strip the registration in
        // those contexts.
        const registerStructuredOutputIfRequested = async () => {
            if (!this.jsonSchema)
                return;
            if (options?.forSubAgent)
                return;
            const schema = this.jsonSchema;
            await registerLazy(ToolNames.STRUCTURED_OUTPUT, async () => {
                const { SyntheticOutputTool } = await import('../tools/syntheticOutput.js');
                return new SyntheticOutputTool(schema);
            });
        };
        if (this.getBareMode()) {
            await registerLazy(ToolNames.READ_FILE, async () => {
                const { ReadFileTool } = await import('../tools/read-file.js');
                return new ReadFileTool(this);
            });
            await registerLazy(ToolNames.EDIT, async () => {
                const { EditTool } = await import('../tools/edit.js');
                return new EditTool(this);
            });
            await registerLazy(ToolNames.NOTEBOOK_EDIT, async () => {
                const { NotebookEditTool } = await import('../tools/notebook-edit.js');
                return new NotebookEditTool(this);
            });
            await registerLazy(ToolNames.SHELL, async () => {
                const { ShellTool } = await import('../tools/shell.js');
                return new ShellTool(this);
            });
            await registerStructuredOutputIfRequested();
            this.debugLogger.debug(`ToolRegistry created: ${JSON.stringify(registry.getAllToolNames())} (${registry.getAllToolNames().length} tools)`);
            return registry;
        }
        // --- Core tools (always registered) ---
        await registerLazy(ToolNames.TOOL_SEARCH, async () => {
            const { ToolSearchTool } = await import('../tools/tool-search.js');
            return new ToolSearchTool(this);
        });
        await registerLazy(ToolNames.AGENT, async () => {
            const { AgentTool } = await import('../tools/agent/agent.js');
            return new AgentTool(this);
        });
        await registerLazy(ToolNames.TASK_STOP, async () => {
            const { TaskStopTool } = await import('../tools/task-stop.js');
            return new TaskStopTool(this);
        });
        await registerLazy(ToolNames.SEND_MESSAGE, async () => {
            const { SendMessageTool } = await import('../tools/send-message.js');
            return new SendMessageTool(this);
        });
        await registerLazy(ToolNames.SKILL, async () => {
            const { SkillTool } = await import('../tools/skill.js');
            return new SkillTool(this);
        });
        await registerLazy(ToolNames.LS, async () => {
            const { LSTool } = await import('../tools/ls.js');
            return new LSTool(this);
        });
        await registerLazy(ToolNames.READ_FILE, async () => {
            const { ReadFileTool } = await import('../tools/read-file.js');
            return new ReadFileTool(this);
        });
        // --- Grep / RipGrep (conditional) ---
        if (this.getUseRipgrep()) {
            let useRipgrep = false;
            let errorString = undefined;
            try {
                useRipgrep = await canUseRipgrep(this.getUseBuiltinRipgrep());
            }
            catch (error) {
                errorString = getErrorMessage(error);
            }
            if (useRipgrep) {
                await registerLazy(ToolNames.GREP, async () => {
                    const { RipGrepTool } = await import('../tools/ripGrep.js');
                    return new RipGrepTool(this);
                });
            }
            else {
                logRipgrepFallback(this, new RipgrepFallbackEvent(this.getUseRipgrep(), this.getUseBuiltinRipgrep(), errorString || 'ripgrep is not available'));
                await registerLazy(ToolNames.GREP, async () => {
                    const { GrepTool } = await import('../tools/grep.js');
                    return new GrepTool(this);
                });
            }
        }
        else {
            await registerLazy(ToolNames.GREP, async () => {
                const { GrepTool } = await import('../tools/grep.js');
                return new GrepTool(this);
            });
        }
        await registerLazy(ToolNames.GLOB, async () => {
            const { GlobTool } = await import('../tools/glob.js');
            return new GlobTool(this);
        });
        await registerLazy(ToolNames.EDIT, async () => {
            const { EditTool } = await import('../tools/edit.js');
            return new EditTool(this);
        });
        await registerLazy(ToolNames.NOTEBOOK_EDIT, async () => {
            const { NotebookEditTool } = await import('../tools/notebook-edit.js');
            return new NotebookEditTool(this);
        });
        await registerLazy(ToolNames.WRITE_FILE, async () => {
            const { WriteFileTool } = await import('../tools/write-file.js');
            return new WriteFileTool(this);
        });
        await registerLazy(ToolNames.SHELL, async () => {
            const { ShellTool } = await import('../tools/shell.js');
            return new ShellTool(this);
        });
        await registerLazy(ToolNames.TODO_WRITE, async () => {
            const { TodoWriteTool } = await import('../tools/todoWrite.js');
            return new TodoWriteTool(this);
        });
        await registerLazy(ToolNames.ASK_USER_QUESTION, async () => {
            const { AskUserQuestionTool } = await import('../tools/askUserQuestion.js');
            return new AskUserQuestionTool(this);
        });
        if (!this.sdkMode) {
            await registerLazy(ToolNames.EXIT_PLAN_MODE, async () => {
                const { ExitPlanModeTool } = await import('../tools/exitPlanMode.js');
                return new ExitPlanModeTool(this);
            });
        }
        await registerLazy(ToolNames.ENTER_WORKTREE, async () => {
            const { EnterWorktreeTool } = await import('../tools/enter-worktree.js');
            return new EnterWorktreeTool(this);
        });
        await registerLazy(ToolNames.EXIT_WORKTREE, async () => {
            const { ExitWorktreeTool } = await import('../tools/exit-worktree.js');
            return new ExitWorktreeTool(this);
        });
        await registerLazy(ToolNames.WEB_FETCH, async () => {
            const { WebFetchTool } = await import('../tools/web-fetch.js');
            return new WebFetchTool(this);
        });
        if (this.isLspEnabled() && this.getLspClient()) {
            await registerLazy(ToolNames.LSP, async () => {
                const { LspTool } = await import('../tools/lsp.js');
                return new LspTool(this);
            });
        }
        // Register synthetic structured-output tool when --json-schema is set.
        // The tool's parameter schema IS the user-supplied JSON Schema, so the
        // model's arguments must match it (Ajv-validated in BaseDeclarativeTool).
        // Same helper as the bare-mode branch above to keep the registration
        // shape and permission gating in sync between the two paths.
        await registerStructuredOutputIfRequested();
        // Register cron tools unless disabled
        if (this.isCronEnabled()) {
            await registerLazy(ToolNames.CRON_CREATE, async () => {
                const { CronCreateTool } = await import('../tools/cron-create.js');
                return new CronCreateTool(this);
            });
            await registerLazy(ToolNames.CRON_LIST, async () => {
                const { CronListTool } = await import('../tools/cron-list.js');
                return new CronListTool(this);
            });
            await registerLazy(ToolNames.CRON_DELETE, async () => {
                const { CronDeleteTool } = await import('../tools/cron-delete.js');
                return new CronDeleteTool(this);
            });
        }
        // Register monitor tool
        await registerLazy(ToolNames.MONITOR, async () => {
            const { MonitorTool } = await import('../tools/monitor.js');
            return new MonitorTool(this);
        });
        // PR 14b fix #2 (codex review round 1): apply any pending MCP
        // budget-event callback BEFORE `discoverAllTools` (legacy blocking
        // mode runs MCP discovery synchronously in there) and BEFORE the
        // post-`createToolRegistry` `startMcpDiscoveryInBackground` (default
        // mode). Either way the manager has its callback wired at the
        // moment the first discovery pass fires, so end-of-pass events
        // for that pass are routed through the SDK push channel.
        if (this.pendingMcpBudgetCallback) {
            const mgr = registry.getMcpClientManager();
            if (mgr && typeof mgr.setOnBudgetEvent === 'function') {
                mgr.setOnBudgetEvent(this.pendingMcpBudgetCallback);
            }
            // PR 14b fix (codex round 6): clear after consumption so a
            // subsequent `createToolRegistry` call (e.g. subagent override
            // via `createApprovalModeOverride` /
            // `buildSubagentContextOverride`) doesn't re-apply the parent
            // session's callback to a fresh manager. Subagent contexts run
            // their own MCP clients but should NOT push budget events
            // through the parent's ACP session — that would route subagent
            // telemetry to the wrong subscriber.
            //
            // Late-call setter (`setMcpBudgetEventCallback` after
            // `initialize()`) is unaffected: it dispatches directly to the
            // existing manager via the `if (this.toolRegistry)` branch,
            // not through `pendingMcpBudgetCallback`.
            this.pendingMcpBudgetCallback = undefined;
        }
        if (!options?.skipDiscovery) {
            await registry.discoverAllTools();
        }
        this.debugLogger.debug(`ToolRegistry created: ${JSON.stringify(registry.getAllToolNames())} (${registry.getAllToolNames().length} tools)`);
        return registry;
    }
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
    setMcpBudgetEventCallback(cb) {
        if (this.toolRegistry) {
            // Late-call path: apply directly. Do NOT stash — see comment
            // above for the subagent isolation rationale.
            const mgr = this.toolRegistry.getMcpClientManager?.();
            if (mgr && typeof mgr.setOnBudgetEvent === 'function') {
                mgr.setOnBudgetEvent(cb);
            }
            this.pendingMcpBudgetCallback = undefined;
            return;
        }
        // Pre-init path: stash for `createToolRegistry` to consume.
        this.pendingMcpBudgetCallback = cb;
    }
}
//# sourceMappingURL=config.js.map