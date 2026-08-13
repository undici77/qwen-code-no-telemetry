/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Qwen Connection Handler
 *
 * Handles Qwen Agent connection establishment, authentication, and session creation
 */
import { logger } from '../utils/logger.js';
import * as vscode from 'vscode';
import { isAuthenticationRequiredError } from '../utils/authErrors.js';
import { authMethod } from '../types/acpTypes.js';
import { extractModelInfoFromNewSessionResult, extractSessionModeState, extractSessionModelState, } from '../utils/acpModelInfo.js';
import { getErrorMessage } from '../utils/errorMessage.js';
/**
 * Qwen Connection Handler class
 * Handles connection, authentication, and session initialization
 */
export class QwenConnectionHandler {
    /**
     * Connect to Qwen service and establish session
     *
     * @param connection - ACP connection instance
     * @param workingDir - Working directory
     * @param cliEntryPath - CLI entry path (if provided will override the path in configuration)
     * @param options - Optional connection settings
     */
    async connect(connection, workingDir, cliEntryPath, options) {
        const connectId = Date.now();
        logger.log(`[QwenAgentManager] 🚀 CONNECT() CALLED - ID: ${connectId}`);
        const autoAuthenticate = options?.autoAuthenticate ?? true;
        let sessionCreated = false;
        let requiresAuth = false;
        let modelInfo;
        let availableModels;
        let currentModeId;
        let availableModes;
        // Build extra CLI arguments (only essential parameters)
        const extraArgs = [];
        const httpConfig = vscode.workspace.getConfiguration('http');
        const proxyUrl = httpConfig.get('proxy') || httpConfig.get('https.proxy');
        if (proxyUrl) {
            extraArgs.push('--proxy', proxyUrl);
            logger.log('[QwenAgentManager] Using proxy from VSCode settings:', proxyUrl);
        }
        // Retry loop for connection.connect() to handle transient spawn failures
        // (e.g., SIGTERM during the 1-second startup grace period)
        const maxConnectAttempts = 3;
        for (let attempt = 1; attempt <= maxConnectAttempts; attempt++) {
            try {
                logger.log(`[QwenAgentManager] Connecting to ACP process (attempt ${attempt}/${maxConnectAttempts})...`);
                await connection.connect(cliEntryPath, workingDir, extraArgs);
                logger.log('[QwenAgentManager] ACP process connected successfully');
                break;
            }
            catch (connectError) {
                logger.error(`[QwenAgentManager] Connect attempt ${attempt} failed:`, getErrorMessage(connectError));
                if (attempt === maxConnectAttempts) {
                    throw connectError;
                }
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
                logger.log(`[QwenAgentManager] Retrying connect in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        // Try to restore existing session or create new session
        // Note: Auto-restore on connect is disabled to avoid surprising loads
        // when user opens a "New Chat" tab. Restoration is now an explicit action
        // (session selector → session/load) or handled by higher-level flows.
        const sessionRestored = false;
        // Create new session if unable to restore
        if (!sessionRestored) {
            logger.log('[QwenAgentManager] no sessionRestored, Creating new session...');
            try {
                logger.log('[QwenAgentManager] Creating new session (letting CLI handle authentication)...');
                const newSessionResult = await this.newSessionWithRetry(connection, workingDir, 3, authMethod, autoAuthenticate);
                modelInfo =
                    extractModelInfoFromNewSessionResult(newSessionResult) || undefined;
                // Extract available models from session/new response
                const modelState = extractSessionModelState(newSessionResult);
                if (modelState?.availableModels &&
                    modelState.availableModels.length > 0) {
                    availableModels = modelState.availableModels;
                    logger.log('[QwenAgentManager] Extracted availableModels from session/new:', availableModels.map((m) => m.modelId));
                }
                const modeState = extractSessionModeState(newSessionResult);
                currentModeId = modeState?.currentModeId;
                availableModes = modeState?.availableModes;
                logger.log('[QwenAgentManager] New session created successfully');
                sessionCreated = true;
            }
            catch (sessionError) {
                const needsAuth = autoAuthenticate === false &&
                    isAuthenticationRequiredError(sessionError);
                if (needsAuth) {
                    requiresAuth = true;
                    logger.log('[QwenAgentManager] Session creation requires authentication; waiting for user-triggered login.');
                }
                else {
                    logger.error(`\n⚠️ [SESSION FAILED] newSessionWithRetry threw error\n`);
                    logger.error(`[QwenAgentManager] Error details:`, sessionError);
                    throw sessionError;
                }
            }
        }
        else {
            sessionCreated = true;
        }
        logger.log(`\n========================================`);
        logger.log(`[QwenAgentManager] ✅ CONNECT() COMPLETED SUCCESSFULLY`);
        logger.log(`========================================\n`);
        return {
            sessionCreated,
            requiresAuth,
            modelInfo,
            availableModels,
            currentModeId,
            availableModes,
        };
    }
    /**
     * Create new session (with retry)
     *
     * @param connection - ACP connection instance
     * @param workingDir - Working directory
     * @param maxRetries - Maximum number of retries
     */
    async newSessionWithRetry(connection, workingDir, maxRetries, authMethod, autoAuthenticate) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger.log(`[QwenAgentManager] Creating session (attempt ${attempt}/${maxRetries})...`);
                const res = await connection.newSession(workingDir);
                logger.log('[QwenAgentManager] Session created successfully');
                return res;
            }
            catch (error) {
                lastError = error;
                const errorMessage = getErrorMessage(error);
                logger.error(`[QwenAgentManager] Session creation attempt ${attempt} failed:`, errorMessage);
                // If Qwen reports that authentication is required, try to
                // authenticate on-the-fly once and retry without waiting.
                const requiresAuth = isAuthenticationRequiredError(error);
                if (requiresAuth) {
                    if (!autoAuthenticate) {
                        logger.log('[QwenAgentManager] Authentication required but auto-authentication is disabled. Propagating error.');
                        throw error;
                    }
                    logger.log('[QwenAgentManager] Qwen requires authentication. Authenticating and retrying session/new...');
                    try {
                        await connection.authenticate(authMethod);
                        // FIXME: @yiliang114 If there is no delay for a while, immediately executing
                        // newSession may cause the cli authorization jump to be triggered again
                        // Add a slight delay to ensure auth state is settled
                        await new Promise((resolve) => setTimeout(resolve, 300));
                        logger.log('[QwenAgentManager] newSessionWithRetry Authentication successful');
                        // Retry immediately after successful auth
                        const res = await connection.newSession(workingDir);
                        logger.log('[QwenAgentManager] Session created successfully after auth');
                        return res;
                    }
                    catch (authErr) {
                        logger.error('[QwenAgentManager] Re-authentication failed:', authErr);
                        // Fall through to retry logic below
                    }
                }
                if (attempt === maxRetries) {
                    throw error;
                }
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                logger.log(`[QwenAgentManager] Retrying in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        if (lastError !== undefined) {
            throw lastError;
        }
        throw new Error('Session creation failed unexpectedly');
    }
}
//# sourceMappingURL=qwenConnectionHandler.js.map