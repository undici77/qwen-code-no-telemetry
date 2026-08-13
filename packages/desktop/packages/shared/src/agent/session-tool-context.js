/**
 * Session Tool Context Factory
 *
 * Creates a SessionToolContext implementation with full access
 * to Electron internals, credential managers, MCP validation, etc.
 *
 * This enables the shared handlers in session-tools-core to work with
 * the app's full feature set.
 */
import { existsSync, readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'fs';
import { join, basename } from 'path';
import { CONFIG_DIR } from '../config/paths.ts';
import { validateConfig, validateSource, validateAllSources, validateStatuses, validatePreferences, validateAll, validateSkill, validateWorkspacePermissions, validateSourcePermissions, validateAllPermissions, validateToolIcons, } from '../config/validators.ts';
import { validateAutomations } from '../automations/index.ts';
import { validateMcpConnection as validateMcpConnectionImpl, validateStdioMcpConnection as validateStdioMcpConnectionImpl, } from '../mcp/validation.ts';
import { loadSourceConfig as loadSourceConfigImpl, saveSourceConfig as saveSourceConfigImpl, getSourcePath, } from '../sources/storage.ts';
import { getSourceCredentialManager } from '../sources/index.ts';
import { inferGoogleServiceFromUrl, inferSlackServiceFromUrl, inferMicrosoftServiceFromUrl, } from '../sources/types.ts';
import { isGoogleOAuthConfigured as isGoogleOAuthConfiguredImpl } from '../auth/google-oauth.ts';
import { debug } from '../utils/debug.ts';
import { getSessionPlansPath, getSessionPath, getSessionDataPath } from '../sessions/storage.ts';
import { updatePreferences as updatePreferencesImpl } from '../config/preferences.ts';
/**
 * Create a SessionToolContext with full capabilities.
 *
 * This provides:
 * - Full file system access
 * - Full Zod validators
 * - Credential manager with keychain access
 * - MCP connection validation
 * - Icon management
 */
export function createSessionToolContext(options) {
    const { sessionId, workspacePath, workspaceId, onPlanSubmitted, onAuthRequest } = options;
    // File system implementation
    const fs = {
        exists: (path) => existsSync(path),
        readFile: (path) => readFileSync(path, 'utf-8'),
        readFileBuffer: (path) => readFileSync(path),
        writeFile: (path, content) => writeFileSync(path, content, 'utf-8'),
        isDirectory: (path) => existsSync(path) && statSync(path).isDirectory(),
        readdir: (path) => readdirSync(path),
        stat: (path) => {
            const stats = statSync(path);
            return {
                size: stats.size,
                isDirectory: () => stats.isDirectory(),
            };
        },
    };
    // Callbacks implementation
    const callbacks = {
        onPlanSubmitted,
        onAuthRequest: (request) => onAuthRequest(request),
    };
    // Validators implementation
    const validators = {
        validateConfig: () => validateConfig(),
        validateSource: (wsPath, slug) => validateSource(wsPath, slug),
        validateAllSources: (wsPath) => validateAllSources(wsPath),
        validateStatuses: (wsPath) => validateStatuses(wsPath),
        validatePreferences: () => validatePreferences(),
        validatePermissions: (wsPath, sourceSlug) => {
            if (sourceSlug) {
                return validateSourcePermissions(wsPath, sourceSlug);
            }
            return validateAllPermissions(wsPath);
        },
        validateAutomations: (wsPath) => validateAutomations(wsPath),
        validateToolIcons: () => validateToolIcons(),
        validateAll: (wsPath) => validateAll(wsPath),
        validateSkill: (wsPath, slug) => validateSkill(wsPath, slug),
    };
    // Credential manager adapter
    const credentialManager = {
        hasValidCredentials: async (source) => {
            const mgr = getSourceCredentialManager();
            // Convert to shared type (guide not needed for credential operations)
            const sharedSource = {
                config: source.config,
                guide: null,
                folderPath: source.folderPath,
                workspaceRootPath: source.workspaceRootPath,
                workspaceId: source.workspaceId,
            };
            const token = await mgr.getToken(sharedSource);
            return !!token;
        },
        getToken: async (source) => {
            const mgr = getSourceCredentialManager();
            const sharedSource = {
                config: source.config,
                guide: null,
                folderPath: source.folderPath,
                workspaceRootPath: source.workspaceRootPath,
                workspaceId: source.workspaceId,
            };
            return mgr.getToken(sharedSource);
        },
        refresh: async (source) => {
            const mgr = getSourceCredentialManager();
            const sharedSource = {
                config: source.config,
                guide: null,
                folderPath: source.folderPath,
                workspaceRootPath: source.workspaceRootPath,
                workspaceId: source.workspaceId,
            };
            return mgr.refresh(sharedSource);
        },
    };
    // MCP validation
    const validateStdioMcpConnection = async (config) => {
        try {
            const result = await validateStdioMcpConnectionImpl(config);
            return {
                success: result.success,
                error: result.error,
                toolCount: result.tools?.length,
                toolNames: result.tools,
                serverName: result.serverInfo?.name,
                serverVersion: result.serverInfo?.version,
            };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Validation failed' };
        }
    };
    const validateMcpConnection = async (config) => {
        try {
            const result = await validateMcpConnectionImpl({
                mcpUrl: config.url,
                mcpTransport: config.transport,
                mcpHeaders: config.headers,
            });
            return {
                success: result.success,
                error: result.error,
                needsAuth: result.errorType === 'needs-auth',
                toolCount: result.tools?.length,
                toolNames: result.tools,
                serverName: result.serverInfo?.name,
                serverVersion: result.serverInfo?.version,
            };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Validation failed' };
        }
    };
    // Build context
    const context = {
        sessionId,
        workspacePath,
        get sourcesPath() { return join(workspacePath, 'sources'); },
        get skillsPath() { return join(workspacePath, 'skills'); },
        plansFolderPath: getSessionPlansPath(workspacePath, sessionId),
        sessionPath: getSessionPath(workspacePath, sessionId),
        dataPath: getSessionDataPath(workspacePath, sessionId),
        callbacks,
        fs,
        validators,
        credentialManager,
        updatePreferences: (updates) => {
            updatePreferencesImpl(updates);
        },
        submitFeedback: (feedback) => {
            const feedbackDir = join(CONFIG_DIR, 'feedback');
            mkdirSync(feedbackDir, { recursive: true });
            const filePath = join(feedbackDir, `${feedback.id}.json`);
            writeFileSync(filePath, JSON.stringify(feedback, null, 2), 'utf-8');
            debug('session-tool-context', `Developer feedback written to ${filePath}`);
        },
        // Source management
        loadSourceConfig: (sourceSlug) => {
            const config = loadSourceConfigImpl(workspacePath, sourceSlug);
            return config;
        },
        saveSourceConfig: (source) => {
            saveSourceConfigImpl(workspacePath, source);
        },
        // Service inference
        inferGoogleService: (url) => {
            return inferGoogleServiceFromUrl(url);
        },
        inferSlackService: (url) => {
            return inferSlackServiceFromUrl(url);
        },
        inferMicrosoftService: (url) => {
            return inferMicrosoftServiceFromUrl(url);
        },
        // OAuth config check
        isGoogleOAuthConfigured: (clientId, clientSecret) => {
            return isGoogleOAuthConfiguredImpl(clientId, clientSecret);
        },
        // MCP validation
        validateStdioMcpConnection,
        validateMcpConnection,
        // Icon helpers (simplified - full implementation would use logo.ts)
        isIconUrl: (value) => {
            try {
                const url = new URL(value);
                return url.protocol === 'http:' || url.protocol === 'https:';
            }
            catch {
                return false;
            }
        },
        deriveServiceUrl: (source) => {
            if (source.type === 'api' && source.api?.baseUrl) {
                try {
                    const url = new URL(source.api.baseUrl);
                    return `${url.protocol}//${url.hostname}`;
                }
                catch {
                    return null;
                }
            }
            if (source.type === 'mcp' && source.mcp?.url) {
                try {
                    const url = new URL(source.mcp.url);
                    return `${url.protocol}//${url.hostname}`;
                }
                catch {
                    return null;
                }
            }
            return null;
        },
        // Session self-management bindings are attached externally via
        // attachSessionSelfManagementBindings() — not part of the factory.
    };
    return context;
}
//# sourceMappingURL=session-tool-context.js.map