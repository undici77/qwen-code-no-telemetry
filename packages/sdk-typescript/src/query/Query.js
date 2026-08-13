/**
 * Query class - Main orchestrator for SDK
 *
 * Manages SDK workflow, routes messages, and handles lifecycle.
 * Implements AsyncIterator protocol for message consumption.
 */
const DEFAULT_CAN_USE_TOOL_TIMEOUT = 60_000;
const DEFAULT_MCP_REQUEST_TIMEOUT = 60_000;
const DEFAULT_CONTROL_REQUEST_TIMEOUT = 60_000;
const DEFAULT_STREAM_CLOSE_TIMEOUT = 60_000;
import { randomUUID } from 'node:crypto';
import { SdkLogger } from '../utils/logger.js';
import { isSDKUserMessage, isSDKAssistantMessage, isSDKSystemMessage, isSDKResultMessage, isSDKPartialAssistantMessage, isControlRequest, isControlResponse, isControlCancel, } from '../types/protocol.js';
import { isSdkMcpServerConfig } from '../types/types.js';
import { Stream } from '../utils/Stream.js';
import { serializeJsonLine } from '../utils/jsonLines.js';
import { AbortError } from '../types/errors.js';
import { SdkControlServerTransport, } from '../daemon-mcp/SdkControlServerTransport.js';
import { ControlRequestType } from '../types/protocol.js';
const logger = SdkLogger.createLogger('Query');
function parseEffortStatus(value) {
    if (typeof value !== 'object' ||
        value === null ||
        !('applied' in value) ||
        typeof value.applied !== 'boolean') {
        return undefined;
    }
    const record = value;
    return {
        applied: record.applied,
        override: record.override ?? null,
        reason: typeof record.reason === 'string' ? record.reason : undefined,
    };
}
export class Query {
    transport;
    options;
    sessionId;
    inputStream;
    sdkMessages;
    abortController;
    pendingControlRequests = new Map();
    pendingMcpResponses = new Map();
    sdkMcpTransports = new Map();
    sdkMcpServers = new Map();
    initialized;
    initialEffortStatus;
    closed = false;
    messageRouterStarted = false;
    transportReadFinalized = false;
    firstResultReceivedPromise;
    firstResultReceivedResolve;
    isSingleTurn;
    abortHandler = null;
    constructor(transport, options, singleTurn = false) {
        this.transport = transport;
        this.options = options;
        // When forkSession is true, sessionId is a fresh UUID (computed in createQuery)
        // that should be used instead of the resume (source) session ID
        this.sessionId = options.forkSession
            ? (options.sessionId ?? randomUUID())
            : (options.resume ?? options.sessionId ?? randomUUID());
        this.inputStream = new Stream();
        this.abortController = options.abortController ?? new AbortController();
        this.isSingleTurn = singleTurn;
        /**
         * Create async generator proxy to ensure stream.next() is called at least once.
         * The generator will start iterating when the user begins iteration.
         * This ensures readResolve/readReject are set up as soon as iteration starts.
         * If errors occur before iteration starts, they'll be stored in hasError and
         * properly rejected when the user starts iterating.
         */
        this.sdkMessages = this.readSdkMessages();
        /**
         * Promise that resolves when the first SDKResultMessage is received.
         * Used to coordinate endInput() timing - ensures all initialization
         * (SDK MCP servers, control responses) is complete before closing CLI stdin.
         */
        this.firstResultReceivedPromise = new Promise((resolve) => {
            this.firstResultReceivedResolve = resolve;
        });
        /**
         * Handle abort signal if controller is provided and already aborted or will be aborted.
         * If already aborted, set error immediately. Otherwise, listen for abort events
         * and set abort error on the stream before closing.
         */
        if (this.abortController.signal.aborted) {
            this.inputStream.error(new AbortError('Query aborted by user'));
            this.close().catch((err) => {
                logger.error('Error during abort cleanup:', err);
            });
        }
        else {
            this.abortHandler = () => {
                this.inputStream.error(new AbortError('Query aborted by user'));
                this.close().catch((err) => {
                    logger.error('Error during abort cleanup:', err);
                });
            };
            this.abortController.signal.addEventListener('abort', this.abortHandler);
        }
        this.initialized = this.initialize();
        this.initialized.catch((error) => {
            // Propagate initialization errors to inputStream so users can catch them
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('Query is closed') &&
                this.transport.exitError) {
                // If query was closed due to transport error, propagate the transport error
                this.inputStream.error(this.transport.exitError);
            }
            else {
                this.inputStream.error(error instanceof Error ? error : new Error(errorMessage));
            }
        });
        this.startMessageRouter();
    }
    async initializeSdkMcpServers() {
        if (!this.options.mcpServers) {
            return;
        }
        const connectionPromises = [];
        // Extract SDK MCP servers from the unified mcpServers config
        for (const [key, config] of Object.entries(this.options.mcpServers)) {
            if (!isSdkMcpServerConfig(config)) {
                continue; // Skip external MCP servers
            }
            // Use the name from SDKMcpServerConfig, fallback to key for backwards compatibility
            const serverName = config.name || key;
            const server = config.instance;
            // Create transport options with callback to route MCP server responses
            const transportOptions = {
                sendToQuery: async (message) => {
                    this.handleMcpServerResponse(serverName, message);
                },
                serverName,
            };
            const sdkTransport = new SdkControlServerTransport(transportOptions);
            // Connect server to transport and only register on success
            const connectionPromise = server
                .connect(sdkTransport)
                .then(() => {
                // Only add to maps after successful connection
                this.sdkMcpServers.set(serverName, server);
                this.sdkMcpTransports.set(serverName, sdkTransport);
                logger.debug(`SDK MCP server '${serverName}' connected to transport`);
            })
                .catch((error) => {
                logger.error(`Failed to connect SDK MCP server '${serverName}' to transport:`, error);
                // Don't throw - one failed server shouldn't prevent others
            });
            connectionPromises.push(connectionPromise);
        }
        // Wait for all connection attempts to complete
        await Promise.all(connectionPromises);
        if (this.sdkMcpServers.size > 0) {
            logger.info(`Initialized ${this.sdkMcpServers.size} SDK MCP server(s): ${Array.from(this.sdkMcpServers.keys()).join(', ')}`);
        }
    }
    /**
     * Handle response messages from SDK MCP servers
     *
     * When an MCP server sends a response via transport.send(), this callback
     * routes it back to the pending request that's waiting for it.
     */
    handleMcpServerResponse(serverName, message) {
        // Check if this is a response with an id
        if ('id' in message && message.id !== null && message.id !== undefined) {
            const key = `${serverName}:${message.id}`;
            const pending = this.pendingMcpResponses.get(key);
            if (pending) {
                logger.debug(`Routing MCP response for server '${serverName}', id: ${message.id}`);
                pending.resolve(message);
                this.pendingMcpResponses.delete(key);
                return;
            }
        }
        // If no pending request found, log a warning (this shouldn't happen normally)
        logger.warn(`Received MCP server response with no pending request: server='${serverName}'`, message);
    }
    /**
     * Get SDK MCP servers config for CLI initialization
     *
     * Only SDK servers are sent in the initialize request.
     */
    getSdkMcpServersForCli() {
        const sdkServers = {};
        for (const [name] of this.sdkMcpServers.entries()) {
            sdkServers[name] = { type: 'sdk', name };
        }
        return sdkServers;
    }
    /**
     * Get external MCP servers (non-SDK) that should be managed by the CLI
     */
    getMcpServersForCli() {
        if (!this.options.mcpServers) {
            return {};
        }
        const externalServers = {};
        for (const [name, config] of Object.entries(this.options.mcpServers)) {
            if (isSdkMcpServerConfig(config)) {
                continue;
            }
            externalServers[name] = config;
        }
        return externalServers;
    }
    async initialize() {
        try {
            logger.debug('Initializing Query');
            // Initialize SDK MCP servers and wait for connections
            await this.initializeSdkMcpServers();
            // Get only successfully connected SDK servers for CLI
            const sdkMcpServersForCli = this.getSdkMcpServersForCli();
            const mcpServersForCli = this.getMcpServersForCli();
            const response = await this.sendControlRequest(ControlRequestType.INITIALIZE, {
                hooks: null,
                timeout: this.options.timeout?.canUseTool
                    ? { canUseTool: this.options.timeout.canUseTool }
                    : undefined,
                sdkMcpServers: Object.keys(sdkMcpServersForCli).length > 0
                    ? sdkMcpServersForCli
                    : undefined,
                mcpServers: Object.keys(mcpServersForCli).length > 0
                    ? mcpServersForCli
                    : undefined,
                agents: this.options.agents,
                effort: this.options.effort,
            });
            this.initialEffortStatus = parseEffortStatus(response?.['effort_status']);
            if (this.initialEffortStatus?.applied === false) {
                // The CLI-side reason joins every cause that holds; prefer it over
                // re-deriving one so no cause is silently dropped here.
                const reason = this.initialEffortStatus.reason ??
                    (this.initialEffortStatus.override
                        ? `${this.initialEffortStatus.override.source}.${this.initialEffortStatus.override.field} takes precedence`
                        : 'thinking may be disabled');
                logger.warn(`Initial reasoning effort was not applied (${reason})`);
            }
            logger.info('Query initialized successfully');
        }
        catch (error) {
            logger.error('Initialization error:', error);
            throw error;
        }
    }
    startMessageRouter() {
        if (this.messageRouterStarted) {
            return;
        }
        this.messageRouterStarted = true;
        (async () => {
            try {
                for await (const message of this.transport.readMessages()) {
                    await this.routeMessage(message);
                    if (this.closed) {
                        break;
                    }
                }
                this.finishTransportRead();
            }
            catch (error) {
                // A transport-level crash (not clean EOF) must still reject every
                // pending control + MCP request, otherwise continueLastTurn() and MCP
                // callers hang until their timeout (MCP responses have none). Route
                // through finishTransportRead so the real error propagates.
                this.finishTransportRead(error instanceof Error ? error : new Error(String(error)));
            }
        })();
    }
    async routeMessage(message) {
        if (isControlRequest(message)) {
            await this.handleControlRequest(message);
            return;
        }
        if (isControlResponse(message)) {
            this.handleControlResponse(message);
            return;
        }
        if (isControlCancel(message)) {
            this.handleControlCancelRequest(message);
            return;
        }
        if (isSDKSystemMessage(message)) {
            /**
             * SystemMessage contains session info (cwd, tools, model, etc.)
             * that should be passed to user.
             */
            this.inputStream.enqueue(message);
            return;
        }
        if (isSDKResultMessage(message)) {
            if (this.firstResultReceivedResolve) {
                this.firstResultReceivedResolve();
            }
            /**
             * In single-turn mode, automatically close input after receiving result
             * to signal completion to the CLI.
             */
            if (this.isSingleTurn && 'endInput' in this.transport) {
                this.transport.endInput();
            }
            this.inputStream.enqueue(message);
            return;
        }
        if (isSDKAssistantMessage(message) ||
            isSDKUserMessage(message) ||
            isSDKPartialAssistantMessage(message)) {
            this.inputStream.enqueue(message);
            return;
        }
        logger.warn('Unknown message type:', message);
        this.inputStream.enqueue(message);
    }
    finishTransportRead(error) {
        // Idempotent: close() and the transport-read loop can both reach here.
        if (this.transportReadFinalized) {
            return;
        }
        this.transportReadFinalized = true;
        const rejectionError = error ??
            this.transport.exitError ??
            new Error('Transport closed before control response');
        // Surface a single correlatable line when the transport dies with work
        // still in flight (e.g. the CLI subprocess crashes mid-continuation):
        // otherwise oncall sees only scattered rejected promises with no anchor.
        const pendingCount = this.pendingControlRequests.size + this.pendingMcpResponses.size;
        if (pendingCount > 0) {
            logger.error('Transport finalized with pending requests rejected', {
                pendingControl: this.pendingControlRequests.size,
                pendingMcp: this.pendingMcpResponses.size,
                error: rejectionError.message,
            });
        }
        for (const pending of this.pendingControlRequests.values()) {
            pending.abortController.abort();
            clearTimeout(pending.timeout);
            pending.reject(rejectionError);
        }
        this.pendingControlRequests.clear();
        for (const pending of this.pendingMcpResponses.values()) {
            pending.reject(rejectionError);
        }
        this.pendingMcpResponses.clear();
        // Skip stream finalization if close() already settled the stream.
        if (this.inputStream.hasError === undefined) {
            if (this.abortController.signal.aborted) {
                this.inputStream.error(new AbortError('Query aborted'));
            }
            else if (error) {
                this.inputStream.error(error);
            }
            else {
                this.inputStream.done();
            }
        }
    }
    async handleControlRequest(request) {
        const { request_id, request: payload } = request;
        logger.debug(`Handling control request: ${payload.subtype}`);
        const requestAbortController = new AbortController();
        try {
            let response = null;
            switch (payload.subtype) {
                case 'can_use_tool':
                    response = await this.handlePermissionRequest(payload.tool_name, payload.input, payload.permission_suggestions, requestAbortController.signal);
                    break;
                case 'mcp_message':
                    response = await this.handleMcpMessage(payload.server_name, payload.message);
                    break;
                default:
                    throw new Error(`Unknown control request subtype: ${payload.subtype}`);
            }
            await this.sendControlResponse(request_id, true, response);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Control request error (${payload.subtype}):`, errorMessage);
            await this.sendControlResponse(request_id, false, errorMessage);
        }
    }
    async handlePermissionRequest(toolName, toolInput, permissionSuggestions, signal) {
        /* Default deny all wildcard tool requests */
        if (!this.options.canUseTool) {
            return { behavior: 'deny', message: 'Denied' };
        }
        try {
            const canUseToolTimeout = this.options.timeout?.canUseTool ?? DEFAULT_CAN_USE_TOOL_TIMEOUT;
            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error('Permission callback timeout')), canUseToolTimeout);
            });
            const result = await Promise.race([
                Promise.resolve(this.options.canUseTool(toolName, toolInput, {
                    signal,
                    suggestions: permissionSuggestions,
                })),
                timeoutPromise,
            ]);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            if (result.behavior === 'allow') {
                return {
                    behavior: 'allow',
                    updatedInput: result.updatedInput ?? toolInput,
                };
            }
            else {
                return {
                    behavior: 'deny',
                    message: result.message ?? 'Denied',
                    ...(result.interrupt !== undefined
                        ? { interrupt: result.interrupt }
                        : {}),
                };
            }
        }
        catch (error) {
            /**
             * Timeout or error → deny (fail-safe).
             * This ensures that any issues with the permission callback
             * result in a safe default of denying access.
             */
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.warn('Permission callback error (denying by default):', errorMessage);
            return {
                behavior: 'deny',
                message: `Permission check failed: ${errorMessage}`,
            };
        }
    }
    async handleMcpMessage(serverName, message) {
        const transport = this.sdkMcpTransports.get(serverName);
        if (!transport) {
            throw new Error(`MCP server '${serverName}' not found in SDK-embedded servers`);
        }
        /**
         * Check if this is a request (has method and id) or notification.
         * Requests need to wait for a response, while notifications are just routed.
         */
        const isRequest = 'method' in message && 'id' in message && message.id !== null;
        if (isRequest) {
            const response = await this.handleMcpRequest(serverName, message, transport);
            return { mcp_response: response };
        }
        else {
            transport.handleMessage(message);
            return { mcp_response: { jsonrpc: '2.0', result: {}, id: 0 } };
        }
    }
    handleMcpRequest(serverName, message, transport) {
        const messageId = 'id' in message ? message.id : null;
        const key = `${serverName}:${messageId}`;
        return new Promise((resolve, reject) => {
            const mcpRequestTimeout = this.options.timeout?.mcpRequest ?? DEFAULT_MCP_REQUEST_TIMEOUT;
            const timeout = setTimeout(() => {
                this.pendingMcpResponses.delete(key);
                reject(new Error('MCP request timeout'));
            }, mcpRequestTimeout);
            const cleanup = () => {
                clearTimeout(timeout);
                this.pendingMcpResponses.delete(key);
            };
            const resolveAndCleanup = (response) => {
                cleanup();
                resolve(response);
            };
            const rejectAndCleanup = (error) => {
                cleanup();
                reject(error);
            };
            // Register pending response handler
            this.pendingMcpResponses.set(key, {
                resolve: resolveAndCleanup,
                reject: rejectAndCleanup,
            });
            // Deliver message to MCP server via transport.onmessage
            // The server will process it and call transport.send() with the response,
            // which triggers handleMcpServerResponse to resolve our pending promise
            transport.handleMessage(message);
        });
    }
    handleControlResponse(response) {
        const { response: payload } = response;
        const request_id = payload.request_id;
        const pending = this.pendingControlRequests.get(request_id);
        if (!pending) {
            logger.warn('Received response for unknown request:', request_id, JSON.stringify(payload));
            return;
        }
        clearTimeout(pending.timeout);
        this.pendingControlRequests.delete(request_id);
        if (payload.subtype === 'success') {
            logger.debug(`Control response success for request: ${request_id}: ${JSON.stringify(payload.response)}`);
            pending.resolve(payload.response);
        }
        else {
            /**
             * Extract error message from error field.
             * Error can be either a string or an object with a message property.
             */
            const errorMessage = typeof payload.error === 'string'
                ? payload.error
                : (payload.error?.message ?? 'Unknown error');
            logger.error(`Control response error for request ${request_id}:`, errorMessage);
            pending.reject(new Error(errorMessage));
        }
    }
    handleControlCancelRequest(request) {
        const { request_id } = request;
        if (!request_id) {
            logger.warn('Received cancel request without request_id');
            return;
        }
        const pending = this.pendingControlRequests.get(request_id);
        if (pending) {
            logger.debug(`Cancelling control request: ${request_id}`);
            pending.abortController.abort();
            clearTimeout(pending.timeout);
            this.pendingControlRequests.delete(request_id);
            pending.reject(new AbortError('Request cancelled'));
        }
    }
    async sendControlRequest(subtype, data = {}) {
        if (this.closed) {
            return Promise.reject(new Error('Query is closed'));
        }
        // Check if transport has already exited with an error
        if (this.transport.exitError) {
            return Promise.reject(this.transport.exitError);
        }
        if (subtype !== ControlRequestType.INITIALIZE) {
            // Ensure all other control requests get processed after initialization
            await this.initialized;
        }
        const requestId = randomUUID();
        const request = {
            type: 'control_request',
            request_id: requestId,
            request: {
                subtype: subtype,
                ...data,
            },
        };
        const responsePromise = new Promise((resolve, reject) => {
            const abortController = new AbortController();
            const controlRequestTimeout = this.options.timeout?.controlRequest ??
                DEFAULT_CONTROL_REQUEST_TIMEOUT;
            const timeout = setTimeout(() => {
                this.pendingControlRequests.delete(requestId);
                reject(new Error(`Control request timeout: ${subtype}`));
            }, controlRequestTimeout);
            this.pendingControlRequests.set(requestId, {
                resolve,
                reject,
                timeout,
                abortController,
            });
        });
        try {
            this.transport.write(serializeJsonLine(request));
        }
        catch (error) {
            const pending = this.pendingControlRequests.get(requestId);
            if (pending) {
                clearTimeout(pending.timeout);
                this.pendingControlRequests.delete(requestId);
            }
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger.error(`Failed to send control request: ${errorMsg}`);
            return Promise.reject(new Error(`Failed to send control request: ${errorMsg}`));
        }
        return responsePromise;
    }
    async sendControlResponse(requestId, success, responseOrError) {
        const response = {
            type: 'control_response',
            response: success
                ? {
                    subtype: 'success',
                    request_id: requestId,
                    response: responseOrError,
                }
                : {
                    subtype: 'error',
                    request_id: requestId,
                    error: responseOrError,
                },
        };
        try {
            this.transport.write(serializeJsonLine(response));
        }
        catch (error) {
            // Write failed - log and ignore since response cannot be delivered
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger.warn(`Failed to send control response for request ${requestId}: ${errorMsg}`);
        }
    }
    async close() {
        if (this.closed) {
            return;
        }
        this.closed = true;
        // Remove abort listener to prevent memory leak
        if (this.abortHandler) {
            this.abortController.signal.removeEventListener('abort', this.abortHandler);
            this.abortHandler = null;
        }
        // Use transport's exit error if available, otherwise use generic error
        const transportError = this.transport.exitError;
        const rejectionError = transportError ?? new Error('Query is closed');
        for (const pending of this.pendingControlRequests.values()) {
            pending.abortController.abort();
            clearTimeout(pending.timeout);
            pending.reject(rejectionError);
        }
        this.pendingControlRequests.clear();
        // Clean up pending MCP responses
        for (const pending of this.pendingMcpResponses.values()) {
            pending.reject(rejectionError);
        }
        this.pendingMcpResponses.clear();
        await this.transport.close();
        /**
         * Complete input stream - check if aborted first.
         * Only set error/done if stream doesn't already have an error state.
         */
        if (this.inputStream.hasError === undefined) {
            if (this.abortController.signal.aborted) {
                this.inputStream.error(new AbortError('Query aborted'));
            }
            else {
                this.inputStream.done();
            }
        }
        for (const transport of this.sdkMcpTransports.values()) {
            try {
                await transport.close();
            }
            catch (error) {
                logger.error('Error closing MCP transport:', error);
            }
        }
        this.sdkMcpTransports.clear();
        logger.info('Query is closed');
    }
    async *readSdkMessages() {
        for await (const message of this.inputStream) {
            yield message;
        }
    }
    async next(...args) {
        return this.sdkMessages.next(...args);
    }
    async return(value) {
        return this.sdkMessages.return(value);
    }
    async throw(e) {
        return this.sdkMessages.throw(e);
    }
    [Symbol.asyncIterator]() {
        return this.sdkMessages;
    }
    async streamInput(messages) {
        if (this.closed) {
            throw new Error('Query is closed');
        }
        try {
            /**
             * Wait for initialization to complete before sending messages.
             * This prevents "write after end" errors when streamInput is called
             * with an empty iterable before initialization finishes.
             */
            await this.initialized;
            for await (const message of messages) {
                if (this.abortController.signal.aborted) {
                    break;
                }
                this.transport.write(serializeJsonLine(message));
            }
            /**
             * After all user messages are sent (for-await loop ended), determine when to
             * close the CLI's stdin via endInput().
             *
             * - If a result message was already received: All initialization (SDK MCP servers,
             *   control responses, etc.) is complete, safe to close stdin immediately.
             * - If no result yet: Wait for either the result to arrive, or the timeout to expire.
             *   This gives pending control_responses from SDK MCP servers or other modules
             *   time to complete their initialization before we close the input stream.
             *
             * The timeout ensures we don't hang indefinitely - either the turn proceeds
             * normally, or it fails with a timeout, but Promise.race will always resolve.
             */
            if (this.firstResultReceivedPromise) {
                const streamCloseTimeout = this.options.timeout?.streamClose ?? DEFAULT_STREAM_CLOSE_TIMEOUT;
                let timeoutId;
                const timeoutPromise = new Promise((resolve) => {
                    timeoutId = setTimeout(() => {
                        logger.info('streamCloseTimeout resolved');
                        resolve();
                    }, streamCloseTimeout);
                });
                await Promise.race([this.firstResultReceivedPromise, timeoutPromise]);
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
            }
            this.endInput();
        }
        catch (error) {
            if (this.abortController.signal.aborted) {
                logger.info('Aborted during input streaming');
                this.inputStream.error(new AbortError('Query aborted during input streaming'));
                return;
            }
            throw error;
        }
    }
    endInput() {
        if (this.closed) {
            throw new Error('Query is closed');
        }
        if ('endInput' in this.transport &&
            typeof this.transport.endInput === 'function') {
            this.transport.endInput();
        }
    }
    async interrupt() {
        await this.sendControlRequest(ControlRequestType.INTERRUPT);
    }
    /**
     * Continue the most recent unfinished turn without appending a synthetic user
     * message. Output arrives as regular messages on this Query's async iterator.
     */
    async continueLastTurn() {
        return this.sendControlRequest(ControlRequestType.CONTINUE_LAST_TURN);
    }
    async setPermissionMode(mode) {
        await this.sendControlRequest(ControlRequestType.SET_PERMISSION_MODE, {
            mode,
        });
    }
    async setModel(model) {
        await this.sendControlRequest(ControlRequestType.SET_MODEL, { model });
    }
    /**
     * Get context usage breakdown from the CLI
     *
     * @param showDetails Display hint for per-item breakdowns (data is always complete)
     * @returns Promise resolving to context usage data
     * @throws Error if query is closed
     */
    async getContextUsage(showDetails = false) {
        return this.sendControlRequest(ControlRequestType.GET_CONTEXT_USAGE, {
            show_details: showDetails,
        });
    }
    /**
     * Set the reasoning effort tier at runtime.
     *
     * @param effort - One of 'low', 'medium', 'high', 'xhigh', 'max'
     * @returns `true` when the tier is active. Use {@link setEffortStatus} to
     * distinguish disabled thinking from a higher-priority wire override.
     */
    async setEffort(effort) {
        return (await this.setEffortStatus(effort)).applied;
    }
    /** Set the reasoning effort and return the effective wire status. */
    async setEffortStatus(effort) {
        const response = await this.sendControlRequest(ControlRequestType.SET_EFFORT, { effort });
        return parseEffortStatus(response) ?? { applied: false, override: null };
    }
    /** Return the server-reported status for the initial effort request. */
    getInitialEffortStatus() {
        return this.initialEffortStatus;
    }
    /**
     * Get the list of models available for the current auth type.
     *
     * @returns Promise resolving to available models data
     * @throws Error if query is closed
     */
    async getAvailableModels() {
        return this.sendControlRequest(ControlRequestType.GET_AVAILABLE_MODELS);
    }
    /**
     * Get usage dashboard data from the CLI.
     *
     * @param range - Time range for usage data: 'today' (default), 'week', 'month', 'all'
     * @returns Promise resolving to usage dashboard data
     * @throws Error if query is closed
     */
    async getUsageInfo(range) {
        return this.sendControlRequest(ControlRequestType.GET_USAGE_INFO, {
            ...(range ? { range } : {}),
        });
    }
    /**
     * Get list of control commands supported by the CLI
     *
     * @returns Promise resolving to list of supported command names
     * @throws Error if query is closed
     */
    async supportedCommands() {
        return this.sendControlRequest(ControlRequestType.SUPPORTED_COMMANDS);
    }
    /**
     * Get the status of MCP servers
     *
     * @returns Promise resolving to MCP server status information
     * @throws Error if query is closed
     */
    async mcpServerStatus() {
        return this.sendControlRequest(ControlRequestType.MCP_SERVER_STATUS);
    }
    getSessionId() {
        return this.sessionId;
    }
    isClosed() {
        return this.closed;
    }
}
//# sourceMappingURL=Query.js.map