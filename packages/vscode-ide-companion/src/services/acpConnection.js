/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { ClientSideConnection, ndJsonStream, PROTOCOL_VERSION, RequestError, } from '@agentclientprotocol/sdk';
import { spawn } from 'child_process';
import { Readable, Writable } from 'node:stream';
import * as fs from 'node:fs';
import { AcpFileHandler } from './acpFileHandler.js';
import { ACP_ERROR_CODES } from '../constants/acpSchema.js';
/**
 * ACP Connection Handler for VSCode Extension
 *
 * External API preserved for backward compatibility.
 * Internally uses SDK ClientSideConnection + ndJsonStream for protocol handling.
 */
export class AcpConnection {
    child = null;
    sdkConnection = null;
    sessionId = null;
    workingDir = process.cwd();
    fileHandler = new AcpFileHandler();
    lastExitCode = null;
    lastExitSignal = null;
    onSessionUpdate = () => { };
    onPermissionRequest = (data) => Promise.resolve({
        optionId: this.resolvePermissionOptionId(data) || '',
    });
    onAuthenticateUpdate = () => { };
    onSlashCommandNotification = () => { };
    onEndTurn = () => { };
    /** Invoked when the child process exits (expected or unexpected). */
    onDisconnected = () => { };
    onAskUserQuestion = () => Promise.resolve({ optionId: 'cancel' });
    onInitialized = () => { };
    async connect(cliEntryPath, workingDir = process.cwd(), extraArgs = []) {
        if (this.child) {
            this.disconnect();
        }
        this.lastExitCode = null;
        this.lastExitSignal = null;
        this.workingDir = workingDir;
        const env = { ...process.env };
        const proxyArg = extraArgs.find((arg, i) => arg === '--proxy' && i + 1 < extraArgs.length);
        if (proxyArg) {
            const proxyIndex = extraArgs.indexOf('--proxy');
            const proxyUrl = extraArgs[proxyIndex + 1];
            console.log('[ACP] Setting proxy environment variables:', proxyUrl);
            env['HTTP_PROXY'] = proxyUrl;
            env['HTTPS_PROXY'] = proxyUrl;
            env['http_proxy'] = proxyUrl;
            env['https_proxy'] = proxyUrl;
        }
        const spawnCommand = process.execPath;
        const spawnArgs = [
            cliEntryPath,
            '--acp',
            '--channel=VSCode',
            ...extraArgs,
        ];
        if (!fs.existsSync(cliEntryPath)) {
            throw new Error(`Bundled Qwen CLI entry not found at ${cliEntryPath}. The extension may not have been packaged correctly.`);
        }
        console.log('[ACP] Spawning command:', spawnCommand, spawnArgs.join(' '));
        const options = {
            cwd: workingDir,
            stdio: ['pipe', 'pipe', 'pipe'],
            env,
            shell: false,
        };
        this.child = spawn(spawnCommand, spawnArgs, options);
        await this.setupChildProcessHandlers();
    }
    async setupChildProcessHandlers() {
        let spawnError = null;
        const stderrChunks = [];
        let rejectOnExit = null;
        const processExitPromise = new Promise((_resolve, reject) => {
            rejectOnExit = reject;
        });
        this.child.stderr?.on('data', (data) => {
            const message = data.toString();
            stderrChunks.push(message);
            if (message.toLowerCase().includes('error') &&
                !message.includes('Loaded cached')) {
                console.error(`[ACP qwen]:`, message);
            }
            else {
                console.log(`[ACP qwen]:`, message);
            }
        });
        this.child.on('error', (error) => {
            spawnError = error;
        });
        this.child.on('exit', (code, signal) => {
            console.error(`[ACP qwen] Process exited with code: ${code}, signal: ${signal}`);
            this.lastExitCode = code;
            this.lastExitSignal = signal;
            const stderrOutput = stderrChunks.join('').trim();
            const stderrSuffix = stderrOutput
                ? `\nCLI stderr: ${stderrOutput.slice(-500)}`
                : '';
            rejectOnExit?.(new Error(`Qwen ACP process exited unexpectedly (exit code: ${code}, signal: ${signal})${stderrSuffix}`));
            if (this.child) {
                this.sdkConnection = null;
                this.sessionId = null;
                this.child = null;
                this.onDisconnected(code, signal);
            }
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (spawnError) {
            throw spawnError;
        }
        if (!this.child || this.child.killed) {
            const code = this.lastExitCode ?? this.child?.exitCode ?? null;
            const signal = this.lastExitSignal;
            const stderrOutput = stderrChunks.join('').trim();
            const stderrSuffix = stderrOutput
                ? `\nCLI stderr: ${stderrOutput.slice(-500)}`
                : '';
            throw new Error(`Qwen ACP process failed to start (exit code: ${code}, signal: ${signal})${stderrSuffix}`);
        }
        // Convert Node.js child process streams to Web Streams for SDK
        const stdout = Readable.toWeb(this.child.stdout);
        const stdin = Writable.toWeb(this.child.stdin);
        const stream = ndJsonStream(stdin, stdout);
        // Build the SDK Client implementation that bridges to our callbacks.
        this.sdkConnection = new ClientSideConnection((_agent) => ({
            sessionUpdate: (params) => {
                console.log('[ACP] >>> Processing session_update:', JSON.stringify(params).substring(0, 300));
                this.onSessionUpdate(params);
                return Promise.resolve();
            },
            requestPermission: async (params) => {
                const permissionData = params;
                try {
                    // Check if this is an ask_user_question request by inspecting rawInput
                    const rawInput = permissionData.toolCall?.rawInput;
                    const isAskUserQuestion = Array.isArray(rawInput?.questions);
                    if (isAskUserQuestion) {
                        // Handle ask_user_question separately via dedicated callback
                        const questions = (rawInput?.questions ??
                            []);
                        const metadata = rawInput?.metadata;
                        const response = await this.onAskUserQuestion({
                            sessionId: permissionData.sessionId,
                            questions,
                            metadata,
                        });
                        const optionId = response?.optionId;
                        const answers = response?.answers;
                        console.log('[ACP] AskUserQuestion response:', optionId);
                        let outcome;
                        if (optionId &&
                            (optionId.includes('reject') || optionId === 'cancel')) {
                            outcome = 'cancelled';
                        }
                        else {
                            outcome = 'selected';
                        }
                        if (outcome === 'cancelled') {
                            return { outcome: { outcome: 'cancelled' } };
                        }
                        return {
                            outcome: {
                                outcome: 'selected',
                                optionId: optionId || 'proceed_once',
                            },
                            answers,
                        };
                    }
                    // Handle regular permission request
                    const response = await this.onPermissionRequest(permissionData);
                    const optionId = response?.optionId;
                    console.log('[ACP] Permission request:', optionId);
                    let outcome;
                    if (optionId &&
                        (optionId.includes('reject') || optionId === 'cancel')) {
                        outcome = 'cancelled';
                    }
                    else {
                        outcome = 'selected';
                    }
                    console.log('[ACP] Permission outcome:', outcome);
                    if (outcome === 'cancelled') {
                        return { outcome: { outcome: 'cancelled' } };
                    }
                    const selectedOptionId = this.resolvePermissionOptionId(permissionData, optionId);
                    if (!selectedOptionId) {
                        return { outcome: { outcome: 'cancelled' } };
                    }
                    return {
                        outcome: {
                            outcome: 'selected',
                            optionId: selectedOptionId,
                        },
                    };
                }
                catch (_error) {
                    return { outcome: { outcome: 'cancelled' } };
                }
            },
            readTextFile: async (params) => {
                try {
                    const result = await this.fileHandler.handleReadTextFile({
                        path: params.path,
                        sessionId: params.sessionId,
                        line: params.line ?? null,
                        limit: params.limit ?? null,
                    });
                    return { content: result.content };
                }
                catch (error) {
                    throw this.mapReadTextFileError(error, params.path);
                }
            },
            writeTextFile: async (params) => {
                await this.fileHandler.handleWriteTextFile({
                    path: params.path,
                    content: params.content,
                    sessionId: params.sessionId,
                });
                return {};
            },
            extNotification: async (method, params) => {
                if (method === 'authenticate/update') {
                    console.log('[ACP] >>> Processing authenticate_update:', JSON.stringify(params).substring(0, 300));
                    this.onAuthenticateUpdate(params);
                }
                else if (method === '_qwencode/slash_command') {
                    this.onSlashCommandNotification(params);
                }
                else {
                    console.warn(`[ACP] Unhandled extension notification: ${method}`);
                }
            },
        }), stream);
        // Race the SDK initialize against process exit so we don't hang forever
        // if the CLI crashes before responding.
        console.log('[ACP] Sending initialize request...');
        const initResponse = await Promise.race([
            this.sdkConnection.initialize({
                protocolVersion: PROTOCOL_VERSION,
                clientCapabilities: {
                    fs: {
                        readTextFile: true,
                        writeTextFile: true,
                    },
                },
            }),
            processExitPromise,
        ]);
        console.log('[ACP] Initialize successful');
        console.log('[ACP] Initialization response:', initResponse);
        try {
            this.onInitialized(initResponse);
        }
        catch (err) {
            console.warn('[ACP] onInitialized callback error:', err);
        }
    }
    ensureConnection() {
        // sdkConnection is cleared asynchronously by the exit handler;
        // isConnected (via exitCode) catches the race window before the exit event fires.
        if (!this.sdkConnection || !this.isConnected) {
            throw new Error('Not connected to ACP agent');
        }
        return this.sdkConnection;
    }
    mapReadTextFileError(error, filePath) {
        const errorCode = typeof error === 'object' && error !== null && 'code' in error
            ? error.code
            : undefined;
        if (errorCode === 'ENOENT') {
            throw new RequestError(ACP_ERROR_CODES.RESOURCE_NOT_FOUND, `File not found: ${filePath}`);
        }
        return error;
    }
    resolvePermissionOptionId(request, preferredOptionId) {
        // ACP permission options expose two different identifiers:
        // - `kind` (e.g. "allow_once"), used for UX intent
        // - `optionId` (e.g. "proceed_once"), which the CLI parses as ToolConfirmationOutcome.
        // We must always return a real optionId from request.options; sending `kind`
        // as optionId (like "allow_once") will fail enum parsing on the CLI side.
        const options = Array.isArray(request.options) ? request.options : [];
        if (options.length === 0) {
            return undefined;
        }
        if (preferredOptionId &&
            options.some((option) => option.optionId === preferredOptionId)) {
            return preferredOptionId;
        }
        return (options.find((option) => option.kind === 'allow_once')?.optionId ||
            options.find((option) => option.optionId === 'proceed_once')?.optionId ||
            options.find((option) => option.optionId.includes('proceed_once'))
                ?.optionId ||
            options[0]?.optionId);
    }
    async authenticate(methodId) {
        const conn = this.ensureConnection();
        const authMethodId = methodId || 'default';
        console.log('[ACP] Sending authenticate request with methodId:', authMethodId);
        const response = await conn.authenticate({ methodId: authMethodId });
        console.log('[ACP] Authenticate successful', response);
        return response;
    }
    async newSession(cwd = process.cwd()) {
        const conn = this.ensureConnection();
        console.log('[ACP] Sending session/new request with cwd:', cwd);
        const response = await conn.newSession({
            cwd,
            mcpServers: [],
        });
        this.sessionId = response.sessionId || null;
        console.log('[ACP] Session created with ID:', this.sessionId);
        return response;
    }
    async sendPrompt(prompt) {
        const conn = this.ensureConnection();
        if (!this.sessionId) {
            throw new Error('No active ACP session');
        }
        const promptBlocks = typeof prompt === 'string' ? [{ type: 'text', text: prompt }] : prompt;
        const response = await conn.prompt({
            sessionId: this.sessionId,
            prompt: promptBlocks,
        });
        // Emit end-of-turn from stopReason
        if (response.stopReason) {
            this.onEndTurn(response.stopReason);
        }
        else {
            this.onEndTurn();
        }
        return response;
    }
    async rewindSession(targetTurnIndex) {
        const conn = this.ensureConnection();
        if (!this.sessionId) {
            throw new Error('No active ACP session');
        }
        return (await conn.extMethod('rewindSession', {
            sessionId: this.sessionId,
            targetTurnIndex,
            cwd: this.workingDir,
        }));
    }
    async restoreSessionHistory(history) {
        const conn = this.ensureConnection();
        if (!this.sessionId) {
            throw new Error('No active ACP session');
        }
        await conn.extMethod('restoreSessionHistory', {
            sessionId: this.sessionId,
            history,
            cwd: this.workingDir,
        });
    }
    async loadSession(sessionId, cwdOverride) {
        const conn = this.ensureConnection();
        console.log('[ACP] Sending session/load request for session:', sessionId);
        const cwd = cwdOverride || this.workingDir;
        try {
            const response = await conn.loadSession({
                sessionId,
                cwd,
                mcpServers: [],
            });
            console.log('[ACP] Session load succeeded. Response:', JSON.stringify(response));
            this.sessionId = sessionId;
            return response;
        }
        catch (error) {
            console.error('[ACP] Session load request failed:', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
    async listSessions(options) {
        const conn = this.ensureConnection();
        console.log('[ACP] Requesting session list...');
        try {
            const params = { cwd: this.workingDir };
            if (options?.cursor !== undefined) {
                params['cursor'] = String(options.cursor);
            }
            if (options?.size !== undefined) {
                // ACP ListSessionsRequest schema has no `size` field; the SDK's zod
                // validator strips unknown top-level keys, so the agent would never
                // see it. Carry it via `_meta` instead, matching the pattern used for
                // other Qwen Code ACP extensions.
                const existingMeta = (params['_meta'] ?? {});
                params['_meta'] = { ...existingMeta, size: options.size };
            }
            const response = await conn.unstable_listSessions(params);
            console.log('[ACP] Session list response:', JSON.stringify(response).substring(0, 200));
            return response;
        }
        catch (error) {
            console.error('[ACP] Failed to get session list:', error);
            throw error;
        }
    }
    async deleteSession(sessionId) {
        const conn = this.ensureConnection();
        try {
            const result = await conn.extMethod('deleteSession', {
                sessionId,
                cwd: this.workingDir,
            });
            return result;
        }
        catch (error) {
            console.error('[ACP] Failed to delete session:', error);
            throw error;
        }
    }
    async renameSession(sessionId, title) {
        const conn = this.ensureConnection();
        try {
            const result = await conn.extMethod('renameSession', {
                sessionId,
                title,
                cwd: this.workingDir,
            });
            return result;
        }
        catch (error) {
            console.error('[ACP] Failed to rename session:', error);
            throw error;
        }
    }
    async switchSession(sessionId) {
        console.log('[ACP] Switching to session:', sessionId);
        this.sessionId = sessionId;
        console.log('[ACP] Session ID updated locally (switch not supported by CLI)');
    }
    async cancelSession() {
        const conn = this.ensureConnection();
        if (!this.sessionId) {
            console.warn('[ACP] No active session to cancel');
            return;
        }
        console.log('[ACP] Cancelling session:', this.sessionId);
        await conn.cancel({ sessionId: this.sessionId });
        console.log('[ACP] Cancel notification sent');
    }
    async setMode(modeId) {
        const conn = this.ensureConnection();
        if (!this.sessionId) {
            throw new Error('No active ACP session');
        }
        console.log('[ACP] Sending session/set_mode:', modeId);
        const res = await conn.setSessionMode({
            sessionId: this.sessionId,
            modeId,
        });
        console.log('[ACP] set_mode response:', res);
        return res;
    }
    async getAccountInfo() {
        const conn = this.ensureConnection();
        const result = await conn.extMethod('getAccountInfo', {
            sessionId: this.sessionId,
        });
        return {
            authType: result['authType'] ?? null,
            model: result['model'] ?? null,
            baseUrl: result['baseUrl'] ?? null,
            apiKeyEnvKey: result['apiKeyEnvKey'] ?? null,
        };
    }
    async setModel(modelId) {
        const conn = this.ensureConnection();
        if (!this.sessionId) {
            throw new Error('No active ACP session');
        }
        console.log('[ACP] Sending session/set_model:', modelId);
        const res = await conn.unstable_setSessionModel({
            sessionId: this.sessionId,
            modelId,
        });
        console.log('[ACP] set_model response:', res);
        return res;
    }
    disconnect() {
        if (this.child) {
            this.child.kill();
            this.child = null;
        }
        this.sdkConnection = null;
        this.sessionId = null;
    }
    get isConnected() {
        return (this.child !== null && !this.child.killed && this.child.exitCode === null);
    }
    get hasActiveSession() {
        return this.sessionId !== null;
    }
    get currentSessionId() {
        return this.sessionId;
    }
}
//# sourceMappingURL=acpConnection.js.map