/**
 * PermissionManager - Centralized Tool Permission Evaluation
 *
 * Provides a unified interface for checking tool permissions that both
 * Backend agents can use. Delegates to the existing mode-manager
 * implementation to ensure consistent behavior.
 *
 * Key responsibilities:
 * - Evaluate tool calls against permission mode (explore/ask/execute)
 * - Check bash commands against read-only patterns
 * - Validate API endpoints against allowlists
 * - Provide detailed rejection reasons for blocked operations
 */
import { homedir } from 'os';
import { getPermissionMode, setPermissionMode, cyclePermissionMode, shouldAllowToolInMode, isApiEndpointAllowed, getBashRejectionReason, formatBashRejectionMessage, } from '../mode-manager.ts';
import { createLogger } from '../../utils/debug.ts';
import { permissionsConfigCache } from '../permissions-config.ts';
const log = createLogger('permissions');
/**
 * Dangerous commands that should always require permission in 'ask' mode.
 * These are never auto-allowed regardless of user configuration.
 */
const DANGEROUS_COMMANDS = new Set([
    'rm', 'rmdir', 'sudo', 'su', 'chmod', 'chown', 'chgrp',
    'mv', 'cp', 'dd', 'mkfs', 'fdisk', 'parted',
    'kill', 'killall', 'pkill',
    'reboot', 'shutdown', 'halt', 'poweroff',
    'curl', 'wget', 'ssh', 'scp', 'rsync',
    'git push', 'git reset', 'git rebase', 'git checkout',
]);
/**
 * PermissionManager provides centralized permission checking for agent backends.
 *
 * Usage:
 * ```typescript
 * const permManager = new PermissionManager({
 *   workspaceId: workspace.id,
 *   sessionId: session.id,
 *   workingDirectory: session.workingDirectory,
 *   plansFolderPath: getSessionPlansPath(workspace, session.id),
 * });
 *
 * // Check if a tool call is allowed
 * const result = permManager.evaluateToolCall('Bash', { command: 'git status' });
 * if (!result.allowed) {
 *   // Block with reason
 * }
 * ```
 */
export class PermissionManager {
    config;
    permissionsContext;
    // Session-scoped whitelists for "always allow" feature
    alwaysAllowedCommands = new Set();
    alwaysAllowedDomains = new Set();
    constructor(config) {
        this.config = config;
        // Build permissions context for loading custom permissions
        // PermissionsContext expects workspaceRootPath (absolute path to workspace)
        this.permissionsContext = {
            workspaceRootPath: config.workingDirectory ?? '',
        };
    }
    // ============================================================
    // Permission Mode Management
    // ============================================================
    /**
     * Get the current permission mode for this session.
     */
    getPermissionMode() {
        return getPermissionMode(this.config.sessionId);
    }
    /**
     * Set the permission mode for this session.
     */
    setPermissionMode(mode) {
        setPermissionMode(this.config.sessionId, mode);
    }
    /**
     * Cycle to the next permission mode (explore → ask → execute → explore).
     * Returns the new mode.
     */
    cyclePermissionMode(enabledModes) {
        return cyclePermissionMode(this.config.sessionId, enabledModes);
    }
    // ============================================================
    // Tool Permission Evaluation
    // ============================================================
    /**
     * Evaluate whether a tool call is allowed under the current permission mode.
     *
     * This is the main entry point for permission checking. It considers:
     * - Current permission mode (explore/ask/execute)
     * - Tool type (Bash, Write, MCP, API, etc.)
     * - Tool input parameters
     * - Custom permission rules from permissions.json
     *
     * @param toolName - Name of the tool being called
     * @param toolInput - Input parameters for the tool
     * @returns ToolPermissionResult with allowed status and reason if blocked
     */
    evaluateToolCall(toolName, toolInput) {
        const mode = this.getPermissionMode();
        // Use shouldAllowToolInMode which handles all the complex logic
        const result = shouldAllowToolInMode(toolName, toolInput, mode, {
            plansFolderPath: this.config.plansFolderPath,
            dataFolderPath: this.config.dataFolderPath,
            permissionsContext: this.permissionsContext,
        });
        if (result.allowed) {
            if ('requiresPermission' in result && result.requiresPermission) {
                log.info('Tool requires permission', {
                    sessionId: this.config.sessionId,
                    mode,
                    toolName,
                    description: result.description,
                    toolInput,
                });
                return {
                    allowed: true,
                    requiresPermission: true,
                    description: result.description,
                };
            }
            log.debug('Tool allowed', {
                sessionId: this.config.sessionId,
                mode,
                toolName,
            });
            return { allowed: true };
        }
        log.warn('Tool blocked', {
            sessionId: this.config.sessionId,
            mode,
            toolName,
            reason: result.reason,
            toolInput,
        });
        return {
            allowed: false,
            reason: result.reason,
        };
    }
    /**
     * Check if a bash command is allowed in the current mode.
     * Returns detailed rejection reason if blocked.
     *
     * @param command - The bash command to check
     * @returns null if allowed, or rejection reason string if blocked
     */
    checkBashCommand(command) {
        const mode = this.getPermissionMode();
        // In execute mode, all commands are allowed
        if (mode === 'allow-all') {
            return null;
        }
        // In ask mode, commands are allowed but may require confirmation
        if (mode === 'ask') {
            return null;
        }
        // In explore mode, check against read-only patterns
        const config = permissionsConfigCache.getMergedConfig(this.permissionsContext);
        const rejection = getBashRejectionReason(command, config);
        if (!rejection) {
            return null;
        }
        return formatBashRejectionMessage(rejection, config);
    }
    /**
     * Check if a bash command requires user permission in 'ask' mode.
     * Dangerous commands always require permission.
     *
     * @param command - The bash command to check
     * @returns true if permission should be requested
     */
    requiresBashPermission(command) {
        const mode = this.getPermissionMode();
        // YOLO mode never requires permission
        if (mode === 'allow-all') {
            return false;
        }
        // Plan mode blocks commands, doesn't ask
        if (mode === 'safe') {
            return false;
        }
        // In Ask before edits and Edit automatically modes, check if command is dangerous
        const baseCommand = this.getBaseCommand(command);
        return this.isDangerousCommand(baseCommand);
    }
    // ============================================================
    // API Endpoint Checking
    // ============================================================
    /**
     * Check if an API endpoint is allowed based on method and path.
     * GET requests are always allowed. Other methods check against allowlist.
     *
     * @param method - HTTP method (GET, POST, etc.)
     * @param path - API endpoint path
     * @returns true if the endpoint is allowed
     */
    isApiEndpointAllowed(method, path) {
        return isApiEndpointAllowed(method, path, this.permissionsContext);
    }
    // ============================================================
    // Command Analysis Utilities
    // ============================================================
    /**
     * Extract the base command (first word) from a bash command string.
     * Handles pipes, redirects, and other shell constructs.
     *
     * @param command - Full bash command
     * @returns Base command name
     */
    getBaseCommand(command) {
        const trimmed = command.trim();
        // Extract first word, handling common prefixes
        const match = trimmed.match(/^(?:sudo\s+)?(\S+)/);
        return match?.[1] ?? trimmed.split(/\s+/)[0] ?? '';
    }
    /**
     * Check if a command is in the dangerous commands list.
     *
     * @param baseCommand - Base command name (from getBaseCommand)
     * @returns true if command is dangerous
     */
    isDangerousCommand(baseCommand) {
        return DANGEROUS_COMMANDS.has(baseCommand.toLowerCase());
    }
    /**
     * Extract domain from network commands (curl, wget, ssh, etc.)
     * Used for domain whitelisting checks.
     *
     * @param command - Full bash command
     * @returns Domain if found, null otherwise
     */
    extractDomainFromNetworkCommand(command) {
        // Match common patterns for URLs and hostnames
        const urlMatch = command.match(/https?:\/\/([^\/\s:]+)/);
        if (urlMatch?.[1]) {
            return urlMatch[1];
        }
        // Match ssh-style user@host patterns
        const sshMatch = command.match(/@([^\s:]+)/);
        if (sshMatch?.[1]) {
            return sshMatch[1];
        }
        return null;
    }
    // ============================================================
    // Context Management
    // ============================================================
    /**
     * Update the working directory (used for permission context).
     */
    updateWorkingDirectory(path) {
        this.config.workingDirectory = path;
        this.permissionsContext.workspaceRootPath = path;
    }
    /**
     * Update the plans folder path.
     */
    updatePlansFolderPath(path) {
        this.config.plansFolderPath = path;
    }
    /**
     * Get the current session ID.
     */
    getSessionId() {
        return this.config.sessionId;
    }
    /**
     * Get the permissions context for external use.
     */
    getPermissionsContext() {
        return this.permissionsContext;
    }
    // ============================================================
    // Session-Scoped Whitelisting
    // ============================================================
    /**
     * Check if a base command has been whitelisted for this session.
     */
    isCommandWhitelisted(baseCommand) {
        return this.alwaysAllowedCommands.has(baseCommand.toLowerCase());
    }
    /**
     * Whitelist a command for the remainder of the session.
     * Called when user clicks "Always Allow" for a command.
     */
    whitelistCommand(baseCommand) {
        this.alwaysAllowedCommands.add(baseCommand.toLowerCase());
    }
    /**
     * Check if a domain has been whitelisted for network commands.
     */
    isDomainWhitelisted(domain) {
        return this.alwaysAllowedDomains.has(domain.toLowerCase());
    }
    /**
     * Whitelist a domain for network commands.
     * Called when user clicks "Always Allow" for curl/wget to a domain.
     */
    whitelistDomain(domain) {
        this.alwaysAllowedDomains.add(domain.toLowerCase());
    }
    /**
     * Clear all session-scoped whitelists.
     * Called on session clear or dispose.
     */
    clearWhitelists() {
        this.alwaysAllowedCommands.clear();
        this.alwaysAllowedDomains.clear();
    }
    /**
     * Get the set of whitelisted commands (for debugging).
     */
    getWhitelistedCommands() {
        return new Set(this.alwaysAllowedCommands);
    }
    /**
     * Get the set of whitelisted domains (for debugging).
     */
    getWhitelistedDomains() {
        return new Set(this.alwaysAllowedDomains);
    }
}
//# sourceMappingURL=permission-manager.js.map