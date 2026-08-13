import { type SessionConfig } from '../sessions/index.ts';
import type { StoredMessage } from '@craft-agent/core/types';
import type { Plan } from '../agent/plan-types.ts';
import type { ThinkingLevel } from '../agent/thinking-levels.ts';
import { type ConfigDefaults } from './config-defaults-schema.ts';
export { CONFIG_DIR } from './paths.ts';
export type { WorkspaceInfo, Workspace, McpAuthType, OAuthCredentials, } from '@craft-agent/core/types';
import type { Workspace } from '@craft-agent/core/types';
import type { LlmConnection } from './llm-connections.ts';
export interface StoredConfig {
    llmConnections?: LlmConnection[];
    defaultLlmConnection?: string;
    defaultThinkingLevel?: ThinkingLevel;
    workspaces: Workspace[];
    activeWorkspaceId: string | null;
    activeSessionId: string | null;
    notificationsEnabled?: boolean;
    colorTheme?: string;
    dismissedUpdateVersion?: string;
    autoCapitalisation?: boolean;
    sendMessageKey?: 'enter' | 'cmd-enter';
    voiceModel?: string;
    voiceEnabled?: boolean;
    spellCheck?: boolean;
    keepAwakeWhileRunning?: boolean;
    richToolDescriptions?: boolean;
    selectedPetId?: string;
    petEnabled?: boolean;
    petSize?: number;
    petWindowBounds?: {
        x: number;
        y: number;
    };
    browserToolEnabled?: boolean;
    extendedPromptCache?: boolean;
    enable1MContext?: boolean;
    networkProxy?: import('./types.ts').NetworkProxySettings;
    gitBashPath?: string;
    setupDeferred?: boolean;
    serverConfig?: import('./server-config.ts').ServerConfig;
    migrationsApplied?: string[];
}
export declare const DEFAULT_CONVERSATION_WORKSPACE_NAME = "Qwen";
export declare const DEFAULT_CONVERSATION_WORKSPACE_KIND: "conversation";
export declare const DEFAULT_CONVERSATION_WORKSPACE_PATH_ENV = "QWEN_DEFAULT_WORKSPACE_DIR";
/**
 * Load config defaults from ~/.craft-agent/config-defaults.json
 * This file is synced from bundled assets on every launch.
 */
export declare function loadConfigDefaults(): ConfigDefaults;
/**
 * Ensure config-defaults.json exists and is up-to-date.
 * Syncs from bundled assets on every launch (like docs, themes, permissions).
 */
export declare function ensureConfigDefaults(): void;
export declare function ensureConfigDir(): void;
export declare function loadStoredConfig(): StoredConfig | null;
export declare function saveConfig(config: StoredConfig): void;
/**
 * Get whether desktop notifications are enabled.
 * Defaults to true if not set.
 */
export declare function getNotificationsEnabled(): boolean;
/**
 * Set whether desktop notifications are enabled.
 */
export declare function setNotificationsEnabled(enabled: boolean): void;
/**
 * Get whether auto-capitalisation is enabled.
 * Defaults to true if not set.
 */
export declare function getAutoCapitalisation(): boolean;
/**
 * Set whether auto-capitalisation is enabled.
 */
export declare function setAutoCapitalisation(enabled: boolean): void;
/**
 * Get the key combination used to send messages.
 * Defaults to 'enter' if not set.
 */
export declare function getSendMessageKey(): 'enter' | 'cmd-enter';
/**
 * Set the key combination used to send messages.
 */
export declare function setSendMessageKey(key: 'enter' | 'cmd-enter'): void;
/**
 * Get the ASR model id used for voice dictation.
 * Defaults to 'qwen3-asr-flash' if not set.
 */
export declare function getVoiceModel(): string;
/**
 * Set the ASR model id used for voice dictation.
 */
export declare function setVoiceModel(model: string): void;
/**
 * Whether the voice dictation mic is shown in the composer. Defaults to true.
 */
export declare function getVoiceEnabled(): boolean;
/**
 * Enable or disable voice dictation in the composer.
 */
export declare function setVoiceEnabled(enabled: boolean): void;
/**
 * Get whether spell check is enabled in the input.
 */
export declare function getSpellCheck(): boolean;
/**
 * Set whether spell check is enabled in the input.
 */
export declare function setSpellCheck(enabled: boolean): void;
/**
 * Get whether screen should stay awake while sessions are running.
 * Defaults to false if not set.
 */
export declare function getKeepAwakeWhileRunning(): boolean;
/**
 * Set whether screen should stay awake while sessions are running.
 */
export declare function setKeepAwakeWhileRunning(enabled: boolean): void;
/**
 * Get whether rich tool descriptions are enabled.
 * When enabled, all tool calls include intent and display name metadata.
 * Defaults to true if not set.
 */
export declare function getRichToolDescriptions(): boolean;
/**
 * Set whether rich tool descriptions are enabled.
 */
export declare function setRichToolDescriptions(enabled: boolean): void;
/**
 * Get the selected pet companion id. Defaults to 'qwen' if not set.
 */
export declare function getSelectedPetId(): string;
/**
 * Set the selected pet companion id.
 */
export declare function setSelectedPetId(id: string): void;
/**
 * Get whether the floating pet companion is shown. Defaults to true.
 */
export declare function getPetEnabled(): boolean;
/**
 * Set whether the floating pet companion is shown.
 */
export declare function setPetEnabled(enabled: boolean): void;
/**
 * Get the rendered height of the floating pet companion.
 */
export declare function getPetSize(): number;
/**
 * Persist the rendered height of the floating pet companion.
 */
export declare function setPetSize(size: number): void;
/**
 * Get the saved position of the floating pet window, if any.
 */
export declare function getPetWindowBounds(): {
    x: number;
    y: number;
} | undefined;
/**
 * Persist the position of the floating pet window.
 */
export declare function setPetWindowBounds(bounds: {
    x: number;
    y: number;
}): void;
/**
 * Get whether extended prompt cache (1h TTL) is enabled.
 * When enabled, the interceptor upgrades cache_control TTL from 5m to 1h.
 * Defaults to false if not set.
 */
export declare function getExtendedPromptCache(): boolean;
/**
 * Set whether extended prompt cache (1h TTL) is enabled.
 */
export declare function setExtendedPromptCache(enabled: boolean): void;
/**
 * Get whether the built-in browser tool is enabled.
 * When disabled, browser_tool is not included in session tools.
 * Defaults to true if not set.
 */
export declare function getBrowserToolEnabled(): boolean;
/**
 * Set whether the built-in browser tool is enabled.
 */
export declare function setBrowserToolEnabled(enabled: boolean): void;
/**
 * Get whether 1M context window is enabled.
 * When disabled, models use 200K context and the interceptor strips the context-1m beta header.
 * Defaults to false; users opt in via AI Settings → Performance.
 */
export declare function getEnable1MContext(): boolean;
/**
 * Set whether 1M context window is enabled.
 */
export declare function setEnable1MContext(enabled: boolean): void;
/**
 * Get persisted Git Bash path (Windows only).
 * Used by Windows backend subprocess launch.
 */
export declare function getGitBashPath(): string | undefined;
/**
 * Set Git Bash path (Windows only).
 * Persists to config so it survives app restarts.
 * Returns false if the config could not be loaded (path not persisted).
 */
export declare function setGitBashPath(path: string): boolean;
/**
 * Clear persisted Git Bash path (Windows only).
 * Used when the stored path is stale or invalid.
 */
export declare function clearGitBashPath(): void;
export declare function getConfigPath(): string;
/**
 * Clear all configuration and credentials (for logout).
 * Deletes config file and credentials file.
 */
export declare function clearAllConfig(): Promise<void>;
/**
 * Generate a unique workspace ID.
 * Uses a random UUID-like format.
 */
export declare function generateWorkspaceId(): string;
export declare function isProtectedWorkspace(workspace: Pick<Workspace, 'kind' | 'isProtected'> | {
    kind?: string;
    isProtected?: boolean;
} | null | undefined): boolean;
export declare function getDefaultConversationWorkspacePath(): string;
export declare function ensureDefaultConversationWorkspace(): Workspace;
/**
 * Find workspace icon file at workspace_root/icon.*
 * Returns absolute path to icon file if found, null otherwise
 */
export declare function findWorkspaceIcon(rootPath: string): string | null;
export declare function getWorkspaces(): Workspace[];
export declare function reorderWorkspaces(orderedIds: string[]): boolean;
export declare function getActiveWorkspace(): Workspace | null;
/**
 * Find a workspace by name (case-insensitive) or ID.
 * Useful for CLI -w flag to specify workspace.
 */
export declare function getWorkspaceByNameOrId(nameOrId: string): Workspace | null;
export declare function updateWorkspaceRemoteServer(workspaceId: string, remoteServer: {
    url: string;
    token: string;
    remoteWorkspaceId: string;
}): void;
export declare function setActiveWorkspace(workspaceId: string): void;
/**
 * Atomically switch to a workspace and load/create a session.
 * This prevents race conditions by doing both operations together.
 *
 * @param workspaceId The ID of the workspace to switch to
 * @returns The workspace and session, or null if workspace not found
 */
export declare function switchWorkspaceAtomic(workspaceId: string): Promise<{
    workspace: Workspace;
    session: SessionConfig;
} | null>;
/**
 * Add a workspace to the global config.
 * @param workspace - Workspace data (must include rootPath)
 */
export declare function addWorkspace(workspace: Omit<Workspace, 'id' | 'createdAt' | 'slug'>): Workspace;
/**
 * Sync workspaces by discovering workspaces in the default location
 * that aren't already tracked in the global config.
 * Call this on app startup.
 */
export declare function syncWorkspaces(): void;
export declare function removeWorkspace(workspaceId: string): Promise<boolean>;
export type { StoredAttachment, StoredMessage } from '@craft-agent/core/types';
export interface WorkspaceConversation {
    messages: StoredMessage[];
    tokenUsage: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        contextTokens: number;
        costUsd: number;
        cacheReadTokens?: number;
        cacheCreationTokens?: number;
    };
    savedAt: number;
}
export declare function saveWorkspaceConversation(workspaceId: string, messages: StoredMessage[], tokenUsage: WorkspaceConversation['tokenUsage']): void;
export declare function loadWorkspaceConversation(workspaceId: string): WorkspaceConversation | null;
export declare function getWorkspaceDataPath(workspaceId: string): string;
export declare function clearWorkspaceConversation(workspaceId: string): void;
/**
 * Save a plan for a workspace.
 * Plans are session-scoped - they persist during the session but are
 * cleared when the user runs /clear or starts a new session.
 */
export declare function saveWorkspacePlan(workspaceId: string, plan: Plan): void;
/**
 * Load the current plan for a workspace.
 * Returns null if no plan exists.
 */
export declare function loadWorkspacePlan(workspaceId: string): Plan | null;
/**
 * Clear the plan for a workspace.
 * Called when user runs /clear or cancels a plan.
 */
export declare function clearWorkspacePlan(workspaceId: string): void;
export interface DraftAttachmentContent {
    type: 'image' | 'pdf' | 'text' | 'office' | 'unknown';
    mimeType: string;
    size: number;
    base64?: string;
    text?: string;
    thumbnailBase64?: string;
}
export interface DraftAttachmentRef {
    path: string;
    name: string;
    /** Inline content for attachments without a real filesystem path (paste, web-drag).
     *  When present, hydrate reconstructs from these bytes and skips any disk read. */
    content?: DraftAttachmentContent;
}
export interface SessionDraft {
    text: string;
    attachments?: DraftAttachmentRef[];
}
/**
 * Get the persisted draft for a session (text + attachment refs).
 */
export declare function getSessionDraft(sessionId: string): SessionDraft | null;
/**
 * Set the draft for a session. Empty drafts (no text and no attachments)
 * are removed from disk.
 */
export declare function setSessionDraft(sessionId: string, draft: SessionDraft): void;
export declare function deleteSessionDraft(sessionId: string): void;
/**
 * Get all drafts as a record keyed by sessionId.
 */
export declare function getAllSessionDrafts(): Record<string, SessionDraft>;
import type { ThemeOverrides, PresetTheme } from './theme.ts';
/**
 * Get the path to the app-level theme override file (~/.craft-agent/theme.json).
 */
export declare function getAppThemePath(): string;
/**
 * Get the app-level themes directory.
 * Preset themes are stored at ~/.craft-agent/themes/
 */
export declare function getAppThemesDir(): string;
/**
 * Load app-level theme overrides
 */
export declare function loadAppTheme(): ThemeOverrides | null;
/**
 * Save app-level theme overrides
 */
export declare function saveAppTheme(theme: ThemeOverrides): void;
/**
 * Sync bundled preset themes to disk on launch.
 * Preserves user customizations:
 * - If file doesn't exist → copy from bundle
 * - If file exists but is invalid/corrupt → copy from bundle (auto-heal)
 * - If file exists and is valid → skip (preserve user changes)
 *
 * User-created custom theme files (with non-bundled filenames) are untouched.
 * User color overrides live in theme.json (separate file) and are never touched.
 */
export declare function ensurePresetThemes(): void;
/**
 * Load all preset themes from app themes directory.
 * Returns array of PresetTheme objects sorted by name.
 */
export declare function loadPresetThemes(): PresetTheme[];
/**
 * Load a specific preset theme by ID.
 * @param id - Theme ID (filename without .json)
 */
export declare function loadPresetTheme(id: string): PresetTheme | null;
/**
 * Get the path to the app-level preset themes directory.
 */
export declare function getPresetThemesDir(): string;
/**
 * Reset a preset theme to its bundled default.
 * Copies the bundled version over the user's version.
 * Resolves bundled path automatically via getBundledAssetsDir('themes').
 * @param id - Theme ID to reset
 */
export declare function resetPresetTheme(id: string): boolean;
/**
 * Get the currently selected color theme ID.
 * Returns 'default' if not set.
 */
export declare function getColorTheme(): string;
/**
 * Set the color theme ID.
 */
export declare function setColorTheme(themeId: string): void;
/**
 * Get the dismissed update version.
 * Returns null if no version is dismissed.
 */
export declare function getDismissedUpdateVersion(): string | null;
/**
 * Set the dismissed update version.
 * Pass the version string to dismiss notifications for that version.
 */
export declare function setDismissedUpdateVersion(version: string): void;
/**
 * Clear the dismissed update version.
 * Call this when a new version is released (or on successful update).
 */
export declare function clearDismissedUpdateVersion(): void;
export type { LlmConnection, LlmProviderType, LlmAuthType, LlmConnectionWithStatus, } from './llm-connections.ts';
export declare function inferModelSelectionMode(connection: Pick<LlmConnection, 'models'>, providerDefaultModelIds: string[]): 'automaticallySyncedFromProvider' | 'userDefined3Tier';
/**
 * Collapse any legacy provider configuration to the single built-in Qwen Code backend.
 * Call this on app startup before any getLlmConnections() calls.
 */
export declare function migrateLegacyLlmConnectionsConfig(): void;
/**
 * Fix defaultLlmConnection references that point to non-existent connections.
 * This can happen when a connection is removed or was never created.
 *
 * Fixes both the global defaultLlmConnection and per-workspace defaults.
 * Called on app startup alongside other migrations.
 */
export declare function migrateOrphanedDefaultConnections(): void;
/**
 * Migrate legacy global credentials to LLM connection-scoped credentials.
 * This ensures that credentials saved before the LLM connections system
 * are available through the new connection-based auth.
 *
 * Called on app startup (async operation, credentials use encrypted storage).
 *
 * Qwen Code uses the local backend runtime, so there are no app-managed
 * provider credentials to migrate.
 */
export declare function migrateLegacyCredentials(): Promise<void>;
/**
 * Get all LLM connections.
 * Returns only user-added connections (no auto-populated built-ins).
 *
 * Note: This function is read-only and never modifies config.
 * Call migrateLegacyLlmConnectionsConfig() on app startup to handle migration.
 */
export declare function getLlmConnections(): LlmConnection[];
/**
 * Get a specific LLM connection by slug.
 * @param slug - Connection slug
 * @returns Connection or null if not found
 */
export declare function getLlmConnection(slug: string): LlmConnection | null;
/**
 * Add a new LLM connection.
 * @param connection - Connection to add (slug must be unique)
 * @returns true if added, false if slug already exists
 */
export declare function addLlmConnection(connection: LlmConnection): boolean;
/**
 * Update an existing LLM connection.
 * @param slug - Connection slug to update
 * @param updates - Partial updates to apply (slug is ignored)
 * @returns true if updated, false if not found
 */
export declare function updateLlmConnection(slug: string, updates: Partial<Omit<LlmConnection, 'slug'>>): boolean;
/**
 * Delete an LLM connection.
 * @param slug - Connection slug to delete
 * @returns true if deleted, false if not found
 */
export declare function deleteLlmConnection(slug: string): boolean;
/**
 * Get the default LLM connection slug.
 * @returns Default connection slug, or null if no connections exist
 */
export declare function getDefaultLlmConnection(): string | null;
/**
 * Set the default LLM connection.
 * @param slug - Connection slug to set as default
 * @returns true if set, false if connection not found
 */
export declare function setDefaultLlmConnection(slug: string): boolean;
/**
 * Get the app-level default thinking level for new sessions.
 * Falls back to bundled config-defaults when unset.
 */
export declare function getDefaultThinkingLevel(): ThinkingLevel;
/**
 * Set the app-level default thinking level for new sessions.
 * @returns true if persisted, false if config could not be loaded
 */
export declare function setDefaultThinkingLevel(level: ThinkingLevel): boolean;
/**
 * Update the lastUsedAt timestamp for a connection.
 * @param slug - Connection slug
 */
export declare function touchLlmConnection(slug: string): void;
import type { NetworkProxySettings } from './types.ts';
/**
 * Get the current network proxy settings.
 * Returns undefined if not configured.
 */
export declare function getNetworkProxySettings(): NetworkProxySettings | undefined;
/**
 * Persist network proxy settings.
 * Deletes the key when disabled and all proxy fields are empty.
 */
export declare function setNetworkProxySettings(settings: NetworkProxySettings): void;
export declare function isSetupDeferred(): boolean;
export declare function setSetupDeferred(deferred: boolean): void;
/**
 * Returns the path to the tool-icons directory: ~/.craft-agent/tool-icons/
 */
export declare function getToolIconsDir(): string;
/**
 * Ensure tool-icons directory exists and has bundled defaults.
 * Resolves bundled path automatically via getBundledAssetsDir('tool-icons').
 * Copies bundled tool-icons.json and icon files on first run.
 * Only copies files that don't already exist (preserves user customizations).
 */
export declare function ensureToolIcons(): void;
import { type ServerConfig } from './server-config.ts';
/**
 * Get the current server configuration.
 * Returns defaults if not yet configured.
 */
export declare function getServerConfig(): ServerConfig;
/**
 * Persist server configuration.
 * Auto-generates a stable auth token on first enable if none exists.
 */
export declare function setServerConfig(serverConfig: ServerConfig): void;
