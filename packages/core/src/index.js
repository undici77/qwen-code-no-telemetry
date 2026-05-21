/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
// ============================================================================
// Configuration & Models
// ============================================================================
// Core configuration
export * from './config/config.js';
export { Storage } from './config/storage.js';
// Permission system
export * from './permissions/index.js';
// Model configuration
export { DEFAULT_QWEN_MODEL, DEFAULT_QWEN_FLASH_MODEL, DEFAULT_QWEN_EMBEDDING_MODEL, MAINLINE_CODER_MODEL, } from './config/models.js';
export { ModelRegistry, modelRegistryKey, ModelsConfig, MODEL_GENERATION_CONFIG_FIELDS, QWEN_OAUTH_MODELS, resolveModelConfig, validateModelConfig, } from './models/index.js';
// Output formatting
export * from './output/json-formatter.js';
export * from './output/types.js';
// ============================================================================
// Core Engine
// ============================================================================
export * from './core/client.js';
export * from './core/contentGenerator.js';
export * from './core/coreToolScheduler.js';
export * from './core/permissionFlow.js';
export * from './core/permission-helpers.js';
export * from './core/geminiChat.js';
export * from './core/geminiRequest.js';
export * from './core/insightProtocol.js';
export * from './core/logger.js';
export * from './core/nonInteractiveToolExecutor.js';
export * from './core/prompts.js';
export * from './core/tokenLimits.js';
export * from './core/turn.js';
// ============================================================================
// Tools
// ============================================================================
// Tool names and registry
export * from './tools/tool-names.js';
export * from './tools/tool-error.js';
export * from './tools/tool-registry.js';
export * from './tools/tools.js';
// Individual tools — MCP/SDK infrastructure only (tool classes are lazy-loaded)
export * from './tools/mcp-client.js';
export * from './tools/mcp-client-manager.js';
export * from './tools/mcp-tool.js';
export * from './tools/read-file.js';
export * from './tools/ripGrep.js';
export * from './tools/sdk-control-client-transport.js';
export * from './tools/modifiable-tool.js';
// Selective re-exports of types/utilities from tool files (avoids loading full tool modules)
export { buildSkillLlmContent } from './tools/skill-utils.js';
// ============================================================================
// Providers
// ============================================================================
export * from './providers/index.js';
// ============================================================================
// Services
// ============================================================================
export * from './services/chatRecordingService.js';
export * from './services/cronScheduler.js';
export * from './services/fileDiscoveryService.js';
export * from './services/fileHistoryService.js';
export * from './services/fileReadCache.js';
export * from './services/fileSystemService.js';
export { decodeBufferWithEncodingInfo } from './utils/fileUtils.js';
export * from './services/gitService.js';
export * from './services/gitWorktreeService.js';
export * from './services/sessionRecap.js';
export * from './services/sessionService.js';
export * from './services/sessionTitle.js';
export * from './services/worktreeSessionService.js';
export { stripTerminalControlSequences, TERMINAL_OSC_REGEX, TERMINAL_CSI_REGEX, TERMINAL_SHIFT_DCS_REGEX, } from './utils/terminalSafe.js';
export * from './services/shellExecutionService.js';
export * from './services/monitorRegistry.js';
export * from './services/backgroundShellRegistry.js';
export * from './services/toolUseSummary.js';
export * from './utils/bareMode.js';
// ============================================================================
// Managed Auto-Memory
// ============================================================================
// MemoryManager is the single public API for all memory operations.
// Production code: config.getMemoryManager().method(...)
// Tests: new MemoryManager()
export * from './memory/manager.js';
// Foundational utilities (paths, storage scaffold, type definitions, constants)
// that are legitimately needed by UI code (MemoryDialog, commands, etc.)
export * from './memory/types.js';
export * from './memory/paths.js';
export * from './memory/store.js';
export * from './memory/const.js';
// Issue #4175 PR 16: write helper for hierarchical context files,
// re-exported so the `qwen serve` daemon can mutate workspace memory
// via `POST /workspace/memory` without depending on internal paths.
export * from './memory/writeContextFile.js';
// ============================================================================
// IDE Support
// ============================================================================
export * from './ide/ide-client.js';
export * from './ide/ideContext.js';
export * from './ide/ide-installer.js';
export { detectIdeFromEnv, IDE_DEFINITIONS, } from './ide/detect-ide.js';
export * from './ide/constants.js';
export * from './ide/types.js';
// ============================================================================
// LSP Support
// ============================================================================
export * from './lsp/constants.js';
export * from './lsp/LspConfigLoader.js';
export * from './lsp/LspConnectionFactory.js';
export * from './lsp/LspResponseNormalizer.js';
export * from './lsp/LspServerManager.js';
export * from './lsp/NativeLspClient.js';
export * from './lsp/NativeLspService.js';
export * from './lsp/types.js';
// ============================================================================
// MCP (Model Context Protocol)
// ============================================================================
export { MCPOAuthProvider, OAUTH_AUTH_URL_EVENT, OAUTH_DISPLAY_MESSAGE_EVENT, } from './mcp/oauth-provider.js';
export { MCPOAuthTokenStorage } from './mcp/oauth-token-storage.js';
export { KeychainTokenStorage } from './mcp/token-storage/keychain-token-storage.js';
export { OAuthUtils } from './mcp/oauth-utils.js';
// ============================================================================
// Telemetry
// ============================================================================
export { QwenLogger } from './telemetry/qwen-logger/qwen-logger.js';
export * from './telemetry/index.js';
export { logAuth, logExtensionDisable, logExtensionEnable, logIdeConnection, logModelSlashCommand, logPromptSuggestion, logSpeculation, } from './telemetry/loggers.js';
export { AuthEvent, ExtensionDisableEvent, ExtensionEnableEvent, ExtensionInstallEvent, ExtensionUninstallEvent, IdeConnectionEvent, IdeConnectionType, LoopType, ModelSlashCommandEvent, PromptSuggestionEvent, SpeculationEvent, } from './telemetry/types.js';
// ============================================================================
// Extensions, Skills, Subagents & Agents
// ============================================================================
export * from './extension/index.js';
export * from './prompts/mcp-prompts.js';
export * from './skills/index.js';
export * from './subagents/index.js';
export * from './agents/index.js';
// ============================================================================
// Follow-up Suggestions
// ============================================================================
export * from './followup/index.js';
// ============================================================================
// Utilities
// ============================================================================
export * from './utils/browser.js';
export * from './utils/bundlePaths.js';
export * from './utils/configResolver.js';
export * from './utils/debugLogger.js';
export * from './utils/editor.js';
export * from './utils/environmentContext.js';
export * from './utils/errorParsing.js';
export * from './utils/errors.js';
export * from './utils/fileUtils.js';
export * from './utils/filesearch/fileSearch.js';
export * as crawlCache from './utils/filesearch/crawlCache.js';
export { Ignore, loadIgnoreRules, } from './utils/filesearch/ignore.js';
export * from './utils/formatters.js';
export * from './utils/generateContentResponseUtilities.js';
export * from './utils/getFolderStructure.js';
export * from './utils/gitDiff.js';
export * from './utils/gitIgnoreParser.js';
export * from './utils/gitUtils.js';
export * from './utils/ignorePatterns.js';
export * from './utils/jsonl-utils.js';
export * from './utils/memoryDiagnostics.js';
export * from './utils/memoryDiscovery.js';
export * from './utils/modelId.js';
export * from './utils/runtimeDiagnostics.js';
export { ConditionalRulesRegistry } from './utils/rulesDiscovery.js';
export { OpenAILogger, openaiLogger, resolveOpenAILogDir, } from './utils/openaiLogger.js';
export * from './utils/partUtils.js';
export * from './utils/sessionStorageUtils.js';
export * from './utils/pathReader.js';
export * from './utils/paths.js';
export * from './utils/projectSummary.js';
export * from './utils/promptIdContext.js';
export * from './utils/proxyUtils.js';
export * from './utils/quotaErrorDetection.js';
export * from './utils/rateLimit.js';
export * from './utils/readManyFiles.js';
export * from './utils/request-tokenizer/supportedImageFormats.js';
export { TextTokenizer } from './utils/request-tokenizer/textTokenizer.js';
export * from './utils/retry.js';
export * from './utils/ripgrepUtils.js';
export { detectRuntime, getOrCreateSharedDispatcher, redactProxyCredentials, } from './utils/runtimeFetchOptions.js';
export * from './utils/runtimeStatus.js';
export * from './utils/schemaValidator.js';
export * from './utils/shell-utils.js';
export * from './utils/subagentGenerator.js';
export * from './utils/symlink.js';
export * from './utils/systemEncoding.js';
export * from './utils/terminalSerializer.js';
export * from './utils/textUtils.js';
export * from './utils/thoughtUtils.js';
export * from './utils/toml-to-markdown-converter.js';
export * from './utils/tool-utils.js';
export * from './utils/workspaceContext.js';
export * from './utils/yaml-parser.js';
export * from './utils/forkedAgent.js';
export * from './utils/sideQuery.js';
// ============================================================================
// OAuth & Authentication
// ============================================================================
export * from './qwen/qwenOAuth2.js';
// ============================================================================
// Message Bus Types
// ============================================================================
export { MessageBusType, } from './confirmation-bus/types.js';
export { MessageBus } from './confirmation-bus/message-bus.js';
// ============================================================================
// Testing Utilities
// ============================================================================
export { makeFakeConfig } from './test-utils/config.js';
export * from './test-utils/index.js';
// ============================================================================
// Hooks
// ============================================================================
export * from './hooks/types.js';
export { HookSystem, HookRegistry } from './hooks/index.js';
export { DEFAULT_STOP_HOOK_BLOCK_CAP, STOP_HOOK_BLOCK_CAP_ENV, normalizeStopHookBlockingCap, resolveStopHookBlockingCap, formatStopHookBlockingCapWarning, } from './hooks/stopHookCap.js';
export {} from './hooks/types.js';
// ============================================================================
// Goals (/goal command runtime)
// ============================================================================
export * from './goals/index.js';
// Export hook triggers for all hook events
export { fireNotificationHook, firePermissionRequestHook, firePreToolUseHook, firePostToolUseHook, firePostToolUseFailureHook, generateToolUseId, } from './core/toolHookTriggers.js';
// ============================================================================
// Startup profiler — cross-package event sink (first-screen perf observability)
// ============================================================================
export { setStartupEventSink, recordStartupEvent, } from './utils/startupEventSink.js';
//# sourceMappingURL=index.js.map