import { EventEmitter } from 'node:events';
import { CHANNEL_PROMPT_AUTHORIZATION_META_KEY, CHANNEL_PROMPT_DISPLAY_TEXT_META_KEY, CHANNEL_PROMPT_META_KEY, } from './ChannelAgentBridge.js';
import { readAvailableCommandAltNames } from './AcpBridge.js';
import { ChannelLoopMcpServer, } from './ChannelLoopTools.js';
const MAX_RESPONDED_PERMISSION_REQUESTS = 256;
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function getString(value) {
    return typeof value === 'string' ? value : undefined;
}
function getTextContent(content) {
    if (!isRecord(content)) {
        return undefined;
    }
    return getString(content['text']);
}
function getSessionUpdate(data) {
    if (!isRecord(data) || !isRecord(data['update'])) {
        return undefined;
    }
    return data['update'];
}
function isAvailableCommand(value) {
    if (!isRecord(value) || typeof value['name'] !== 'string')
        return false;
    // altNames is optional; when present it MUST be a string[] (so the type guard is
    // honest). A malformed wire payload — e.g. `altNames: 5` — would otherwise survive
    // onto the command and throw at the downstream `altNames.some(...)` recognition
    // site in ChannelBase.matchAgentCommand.
    const altNames = value['altNames'];
    return (altNames === undefined ||
        (Array.isArray(altNames) && altNames.every((n) => typeof n === 'string')));
}
function isPermissionRequestData(value) {
    if (!isRecord(value) ||
        typeof value['requestId'] !== 'string' ||
        !isRecord(value['toolCall']) ||
        typeof value['toolCall']['toolCallId'] !== 'string' ||
        typeof value['toolCall']['kind'] !== 'string' ||
        !Array.isArray(value['options'])) {
        return false;
    }
    return value['options'].every((option) => isRecord(option) && typeof option['optionId'] === 'string');
}
function parsePermissionOutcome(value) {
    if (!isRecord(value)) {
        return undefined;
    }
    if (value['outcome'] === 'cancelled') {
        return { outcome: 'cancelled' };
    }
    if (value['outcome'] === 'selected' &&
        typeof value['optionId'] === 'string') {
        return { outcome: 'selected', optionId: value['optionId'] };
    }
    return undefined;
}
function summarizeProtocolDetails(details) {
    if (!isRecord(details)) {
        return { type: typeof details };
    }
    const summary = {};
    for (const key of [
        'requestId',
        'sessionId',
        'sessionUpdate',
        'modelId',
        'requestedModelId',
        'toolCallId',
        'kind',
    ]) {
        const value = details[key];
        if (typeof value === 'string') {
            summary[key] = value;
        }
    }
    return summary;
}
export class DaemonChannelBridge extends EventEmitter {
    options;
    sessions = new Map();
    sessionBindingTokens = new Map();
    eventControllers = new Map();
    requestToSession = new Map();
    respondedRequestToSession = new Map();
    activePrompts = new Set();
    activePromptControllers = new Map();
    availableCommandsBySession = new Map();
    turnBarriers = new Map();
    channelLoopToolHandlers = [];
    registeredChannelLoopMcpSessions = new Set();
    channelLoopMcpRegistrations = new Map();
    channelLoopMcpServer;
    connected = false;
    lifecycleGeneration = 0;
    latestAvailableCommandsSessionId;
    lastError;
    deleteSessionData;
    constructor(options) {
        super();
        this.options = options;
        const deleteSessionData = options.deleteSessionData;
        if (deleteSessionData) {
            this.deleteSessionData = async (sessionId) => {
                await deleteSessionData(sessionId);
                this.removeSessionBinding(sessionId);
            };
        }
        this.on('error', (error) => {
            this.lastError = error;
        });
    }
    get availableCommands() {
        if (this.latestAvailableCommandsSessionId) {
            return (this.availableCommandsBySession.get(this.latestAvailableCommandsSessionId) ?? []);
        }
        return Array.from(this.availableCommandsBySession.values()).at(-1) ?? [];
    }
    get lastDaemonError() {
        return this.lastError;
    }
    getAvailableCommands(sessionId) {
        return this.availableCommandsBySession.get(sessionId) ?? [];
    }
    listSessions() {
        const result = [];
        for (const session of this.sessions.values()) {
            result.push({
                sessionId: session.sessionId,
                workspaceCwd: session.workspaceCwd,
                hasActivePrompt: this.activePrompts.has(session.sessionId),
            });
        }
        return result;
    }
    async start() {
        this.connected = true;
    }
    async newSession(cwd, options, bindingToken) {
        const lifecycleGeneration = this.lifecycleGeneration;
        const session = await this.options.sessionFactory({
            workspaceCwd: cwd || this.options.cwd,
            modelServiceId: this.options.modelServiceId,
            sessionScope: this.options.sessionScope ?? 'thread',
            ...(options?.approvalMode ? { approvalMode: options.approvalMode } : {}),
            ...(options?.sourceId ? { sourceId: options.sourceId } : {}),
        });
        if (lifecycleGeneration !== this.lifecycleGeneration) {
            await this.rejectStaleSession(session);
        }
        this.attachSession(session, bindingToken);
        await this.registerChannelLoopMcpForSession(session.sessionId);
        return session.sessionId;
    }
    async loadSession(sessionId, cwd, options, bindingToken) {
        const lifecycleGeneration = this.lifecycleGeneration;
        const session = await this.options.sessionFactory({
            workspaceCwd: cwd || this.options.cwd,
            modelServiceId: this.options.modelServiceId,
            sessionId,
            sessionScope: this.options.sessionScope ?? 'thread',
            ...(options?.approvalMode ? { approvalMode: options.approvalMode } : {}),
        });
        if (lifecycleGeneration !== this.lifecycleGeneration) {
            await this.rejectStaleSession(session);
        }
        if (session.sessionId !== sessionId) {
            void this.releaseSessionClient(session).catch((error) => {
                this.lastError = error;
            });
            throw new Error(`Daemon returned session ${session.sessionId} while loading ${sessionId}`);
        }
        this.attachSession(session, bindingToken);
        await this.registerChannelLoopMcpForSession(session.sessionId);
        return session.sessionId;
    }
    registerChannelLoopToolHandler(handler) {
        if (!this.channelLoopToolHandlers.includes(handler)) {
            this.channelLoopToolHandlers.push(handler);
        }
        this.channelLoopMcpServer ??= new ChannelLoopMcpServer({
            create: (sessionId, input) => this.resolveChannelLoopToolHandler(sessionId).create(sessionId, input),
            list: (sessionId) => this.resolveChannelLoopToolHandler(sessionId).list(sessionId),
            cancel: (sessionId, id) => this.resolveChannelLoopToolHandler(sessionId).cancel(sessionId, id),
        });
        for (const sessionId of this.sessions.keys()) {
            void this.registerChannelLoopMcpForSession(sessionId);
        }
    }
    async prompt(sessionId, text, options) {
        const session = this.ensureSession(sessionId);
        if (this.activePrompts.has(sessionId)) {
            throw new Error(`Prompt already in flight for daemon session ${sessionId}`);
        }
        this.activePrompts.add(sessionId);
        const controller = new AbortController();
        let controllers = this.activePromptControllers.get(sessionId);
        if (!controllers) {
            controllers = new Set();
            this.activePromptControllers.set(sessionId, controllers);
        }
        controllers.add(controller);
        const chunks = [];
        let slashCommandOutput = '';
        const onChunk = (sid, chunk) => {
            if (sid === sessionId) {
                chunks.push(chunk);
            }
        };
        const onSlashCommandOutput = (sid, chunk) => {
            if (sid === sessionId) {
                slashCommandOutput = chunk;
            }
        };
        const clearChunks = (sid) => {
            if (sid === sessionId) {
                chunks.length = 0;
                slashCommandOutput = '';
            }
        };
        const onSessionDied = (info) => {
            if (info.sessionId === sessionId) {
                controller.abort();
            }
        };
        this.on('textChunk', onChunk);
        this.on('slashCommandOutput', onSlashCommandOutput);
        this.on('responseBoundary', clearChunks);
        this.on('sessionDied', onSessionDied);
        const turnBarrier = this.createTurnBarrier(sessionId);
        const prompt = [];
        if (options?.imageBase64 && options.imageMimeType) {
            prompt.push({
                type: 'image',
                data: options.imageBase64,
                mimeType: options.imageMimeType,
            });
        }
        prompt.push({ type: 'text', text });
        const promptAuthorization = options?.displayText !== undefined
            ? this.options.promptAuthorization
            : undefined;
        try {
            const result = await session.prompt({
                prompt,
                _meta: {
                    [CHANNEL_PROMPT_META_KEY]: true,
                    ...(promptAuthorization
                        ? {
                            [CHANNEL_PROMPT_AUTHORIZATION_META_KEY]: promptAuthorization,
                        }
                        : {}),
                    ...(options?.displayText !== undefined
                        ? {
                            [CHANNEL_PROMPT_DISPLAY_TEXT_META_KEY]: options.displayText,
                        }
                        : {}),
                },
            }, controller.signal);
            // Prefer turn_complete for deterministic chunk collection (SSE path).
            // Fall back to one event-loop tick for non-SSE prompt paths (blocking
            // HTTP, non-202 responses) where turn_complete never arrives.
            await Promise.race([
                turnBarrier,
                new Promise((resolve) => setTimeout(resolve, 0)),
            ]);
            const textResult = chunks.join('') || slashCommandOutput;
            this.emit('promptComplete', {
                sessionId,
                text: textResult,
                stopReason: result.stopReason,
            });
            return textResult;
        }
        finally {
            this.clearTurnBarrier(sessionId);
            this.off('textChunk', onChunk);
            this.off('slashCommandOutput', onSlashCommandOutput);
            this.off('responseBoundary', clearChunks);
            this.off('sessionDied', onSessionDied);
            this.activePrompts.delete(sessionId);
            controllers.delete(controller);
            if (controllers.size === 0 &&
                this.activePromptControllers.get(sessionId) === controllers) {
                this.activePromptControllers.delete(sessionId);
            }
        }
    }
    async shellCommand(sessionId, command, signal) {
        const session = this.ensureSession(sessionId);
        if (!session.shellCommand) {
            throw new Error('Shell command not supported by this session client');
        }
        return session.shellCommand(command, signal);
    }
    async cancelSession(sessionId) {
        const session = this.ensureSession(sessionId);
        this.resolveTurnBarrier(sessionId);
        this.abortActivePrompts(sessionId);
        this.activePrompts.delete(sessionId);
        await session.cancel();
    }
    async discardSession(sessionId, expectedBindingToken) {
        if (expectedBindingToken !== undefined &&
            this.sessionBindingTokens.get(sessionId) !== expectedBindingToken) {
            return;
        }
        const session = this.removeSessionBinding(sessionId);
        if (!session)
            return;
        await this.releaseSessionClient(session);
    }
    async releaseSessionClient(session) {
        if (session.detach) {
            try {
                await session.detach();
                return;
            }
            catch {
                // Fall back to cancellation for clients that cannot detach cleanly.
            }
        }
        await session.cancel();
    }
    async setSessionModel(sessionId, modelId) {
        return await this.ensureSession(sessionId).setModel(modelId);
    }
    async respondToPermission(requestId, response) {
        const sessionId = this.requestToSession.get(requestId);
        if (!sessionId) {
            return false;
        }
        const session = this.sessions.get(sessionId);
        if (!session) {
            this.requestToSession.delete(requestId);
            this.respondedRequestToSession.delete(requestId);
            return false;
        }
        try {
            const accepted = await session.respondToPermission(requestId, response);
            this.requestToSession.delete(requestId);
            if (accepted) {
                this.rememberRespondedPermissionRequest(requestId, sessionId);
            }
            else {
                this.respondedRequestToSession.delete(requestId);
            }
            return accepted;
        }
        catch (error) {
            this.requestToSession.delete(requestId);
            this.respondedRequestToSession.delete(requestId);
            throw error;
        }
    }
    stop() {
        this.lifecycleGeneration++;
        for (const sessionId of Array.from(this.sessions.keys())) {
            const session = this.sessions.get(sessionId);
            if (session) {
                void session.cancel().catch((error) => {
                    this.lastError = error;
                });
            }
            this.dropSession(sessionId, 'bridge_stopped', false);
        }
        this.latestAvailableCommandsSessionId = undefined;
        this.connected = false;
    }
    get isConnected() {
        return this.connected;
    }
    attachSession(session, bindingToken) {
        const replacedSession = this.removeSessionBinding(session.sessionId, false);
        if (replacedSession) {
            void this.releaseSessionClient(replacedSession).catch((error) => {
                this.lastError = error;
            });
            this.emit('sessionDied', {
                sessionId: session.sessionId,
                reason: 'session_replaced',
            });
        }
        this.sessions.set(session.sessionId, session);
        this.sessionBindingTokens.set(session.sessionId, bindingToken);
        const controller = new AbortController();
        this.eventControllers.set(session.sessionId, controller);
        void this.pumpEvents(session, controller.signal);
    }
    async rejectStaleSession(session) {
        void this.releaseSessionClient(session).catch((error) => {
            this.lastError = error;
        });
        throw new Error('Daemon channel bridge stopped during session creation');
    }
    ensureSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`No daemon session bound for ${sessionId}`);
        }
        return session;
    }
    async pumpEvents(session, signal) {
        try {
            for await (const event of session.events({
                signal,
                lastEventId: session.lastEventId,
                resume: true,
            })) {
                if (!this.isCurrentPump(session, signal)) {
                    return;
                }
                this.handleEvent(session, event);
            }
            if (!signal.aborted && this.isCurrentPump(session, signal)) {
                this.dropSession(session.sessionId, 'stream_ended');
            }
        }
        catch (error) {
            if (!signal.aborted && this.isCurrentPump(session, signal)) {
                this.emit('error', error);
                this.dropSession(session.sessionId, error instanceof Error ? error.message : String(error));
            }
        }
    }
    isCurrentPump(session, signal) {
        return (this.sessions.get(session.sessionId) === session &&
            this.eventControllers.get(session.sessionId)?.signal === signal);
    }
    handleEvent(session, event) {
        switch (event.type) {
            case 'session_update':
                if (isRecord(event.data) &&
                    typeof event.data['sessionId'] === 'string' &&
                    event.data['sessionId'] !== session.sessionId) {
                    break;
                }
                this.handleSessionUpdate(session.sessionId, event.data);
                break;
            case 'permission_request':
                this.handlePermissionRequest(session.sessionId, event.data);
                break;
            case 'permission_resolved':
                this.handlePermissionResolved(session.sessionId, event.data);
                break;
            case 'model_switched':
                this.handleModelSwitched(session.sessionId, event.data);
                break;
            case 'model_switch_failed':
                this.handleModelSwitchFailed(session.sessionId, event.data);
                break;
            case 'session_died':
                this.handleSessionDied(session.sessionId, event.data);
                break;
            case 'client_evicted':
                this.dropSession(session.sessionId, this.getStringField(event.data, 'reason', 'client_evicted'));
                break;
            case 'stream_error':
                this.dropSession(session.sessionId, this.getStringField(event.data, 'error', 'stream_error'));
                break;
            case 'turn_complete':
                this.resolveTurnBarrier(session.sessionId);
                break;
            case 'turn_error':
                this.emitProtocolError(`Daemon turn error for session ${session.sessionId}`, event.data);
                this.resolveTurnBarrier(session.sessionId);
                break;
            default:
                break;
        }
    }
    handleSessionUpdate(sessionId, data) {
        const update = getSessionUpdate(data);
        if (!update) {
            this.emitProtocolError('Malformed daemon session_update event', data);
            return;
        }
        const type = getString(update['sessionUpdate']);
        switch (type) {
            case 'agent_message_chunk': {
                const meta = isRecord(update['_meta']) ? update['_meta'] : undefined;
                if (typeof meta?.['parentToolCallId'] === 'string') {
                    break;
                }
                const text = getTextContent(update['content']);
                if (meta?.['qwenDiscreteMessage'] === true) {
                    if (meta['source'] === 'background_notification_response' &&
                        meta['rewritten'] !== true &&
                        text) {
                        this.emit('backgroundResponse', sessionId, text);
                    }
                    break;
                }
                if (text) {
                    this.emit(meta?.['source'] === 'slash_command'
                        ? 'slashCommandOutput'
                        : 'textChunk', sessionId, text);
                }
                break;
            }
            case 'agent_thought_chunk': {
                const text = getTextContent(update['content']);
                if (text) {
                    this.emit('thoughtChunk', sessionId, text);
                }
                break;
            }
            case 'tool_call':
            case 'tool_call_update': {
                const toolCallId = getString(update['toolCallId']);
                const kind = getString(update['kind']);
                const meta = isRecord(update['_meta']) ? update['_meta'] : undefined;
                if (!kind &&
                    toolCallId &&
                    getString(update['status']) === 'in_progress' &&
                    meta?.['shellProgress'] !== undefined) {
                    // Silent-shell liveness heartbeat: a kind-less in_progress frame
                    // carrying only the id, status, and _meta.shellProgress stats.
                    // Channels have no use for it — drop it without flagging the
                    // session as malformed. Gate on shellProgress (matching the
                    // qwen-agent and web-shell normalizer guards) so a genuinely
                    // malformed kind-less tool_call still reaches emitProtocolError
                    // below instead of being silently swallowed.
                    break;
                }
                if (!toolCallId || !kind) {
                    this.emitProtocolError(`Malformed daemon ${type} event`, update);
                    break;
                }
                const event = {
                    sessionId,
                    toolCallId,
                    kind,
                    title: getString(update['title']) ?? '',
                    status: getString(update['status']) ?? 'pending',
                    rawInput: isRecord(update['rawInput'])
                        ? update['rawInput']
                        : undefined,
                };
                if (event.status === 'pending' || event.status === 'in_progress') {
                    this.emitResponseBoundary(sessionId);
                }
                this.emit('toolCall', event);
                break;
            }
            case 'plan': {
                this.emitResponseBoundary(sessionId);
                break;
            }
            case 'available_commands_update': {
                if (Array.isArray(update['availableCommands'])) {
                    const commands = update['availableCommands']
                        .filter(isAvailableCommand)
                        .map((cmd) => {
                        const altNames = readAvailableCommandAltNames(cmd);
                        return altNames ? { ...cmd, altNames } : cmd;
                    });
                    this.availableCommandsBySession.set(sessionId, commands);
                    this.latestAvailableCommandsSessionId = sessionId;
                }
                else {
                    this.emitProtocolError('Malformed daemon available_commands_update event', data);
                }
                break;
            }
            default:
                break;
        }
        this.emit('sessionUpdate', data);
    }
    handlePermissionRequest(sessionId, data) {
        if (!isPermissionRequestData(data)) {
            this.emitProtocolError('Malformed daemon permission_request event', data);
            return;
        }
        const requestId = data['requestId'];
        this.requestToSession.set(requestId, sessionId);
        this.emitResponseBoundary(sessionId);
        this.emit('permissionRequest', {
            requestId,
            sessionId,
            request: data,
        });
    }
    rememberRespondedPermissionRequest(requestId, sessionId) {
        this.respondedRequestToSession.set(requestId, sessionId);
        while (this.respondedRequestToSession.size > MAX_RESPONDED_PERMISSION_REQUESTS) {
            const oldestRequestId = this.respondedRequestToSession
                .keys()
                .next().value;
            if (oldestRequestId === undefined) {
                return;
            }
            this.respondedRequestToSession.delete(oldestRequestId);
        }
    }
    handlePermissionResolved(sessionId, data) {
        if (!isRecord(data) || typeof data['requestId'] !== 'string') {
            this.emitProtocolError('Malformed daemon permission_resolved event', data);
            return;
        }
        const requestId = data['requestId'];
        const mappedSessionId = this.requestToSession.get(requestId) ??
            this.respondedRequestToSession.get(requestId);
        if (!mappedSessionId) {
            this.emitProtocolError(`Ignoring daemon permission_resolved for unknown request ${requestId}`, data);
            return;
        }
        if (mappedSessionId !== sessionId) {
            this.requestToSession.delete(requestId);
            this.respondedRequestToSession.delete(requestId);
            this.emitProtocolError(`Ignoring daemon permission_resolved for request ${requestId} from non-owning session ${sessionId}`, data);
            return;
        }
        const outcome = parsePermissionOutcome(data['outcome']);
        if (!outcome) {
            this.requestToSession.delete(requestId);
            this.respondedRequestToSession.delete(requestId);
            this.emitProtocolError('Malformed daemon permission_resolved outcome', data);
            return;
        }
        this.requestToSession.delete(requestId);
        this.respondedRequestToSession.delete(requestId);
        this.emit('permissionResolved', {
            requestId,
            outcome,
        });
    }
    handleModelSwitched(sessionId, data) {
        if (!isRecord(data) || typeof data['modelId'] !== 'string') {
            this.emitProtocolError('Malformed daemon model_switched event', data);
            return;
        }
        this.emit('modelSwitched', {
            sessionId,
            modelId: data['modelId'],
        });
    }
    handleModelSwitchFailed(sessionId, data) {
        if (!isRecord(data)) {
            this.emitProtocolError('Malformed daemon model_switch_failed event', data);
            return;
        }
        this.emit('modelSwitchFailed', {
            sessionId,
            requestedModelId: getString(data['requestedModelId']),
            error: getString(data['error']) ?? 'model_switch_failed',
        });
    }
    handleSessionDied(sessionId, data) {
        this.dropSession(sessionId, this.getStringField(data, 'reason', 'session_died'));
    }
    dropSession(sessionId, reason, releaseClient = true) {
        const session = this.removeSessionBinding(sessionId);
        if (!session)
            return;
        if (releaseClient) {
            void this.releaseSessionClient(session).catch((error) => {
                this.lastError = error;
            });
        }
        this.emit('sessionDied', { sessionId, reason });
    }
    removeSessionBinding(sessionId, unregisterChannelLoopMcp = true) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return undefined;
        this.resolveTurnBarrier(sessionId);
        this.eventControllers.get(sessionId)?.abort();
        this.eventControllers.delete(sessionId);
        this.sessions.delete(sessionId);
        this.sessionBindingTokens.delete(sessionId);
        this.abortActivePrompts(sessionId);
        this.activePrompts.delete(sessionId);
        this.availableCommandsBySession.delete(sessionId);
        if (this.latestAvailableCommandsSessionId === sessionId) {
            this.latestAvailableCommandsSessionId = Array.from(this.availableCommandsBySession.keys()).at(-1);
        }
        for (const [requestId, mappedSessionId] of this.requestToSession) {
            if (mappedSessionId === sessionId) {
                this.requestToSession.delete(requestId);
            }
        }
        for (const [requestId, mappedSessionId] of this.respondedRequestToSession) {
            if (mappedSessionId === sessionId) {
                this.respondedRequestToSession.delete(requestId);
            }
        }
        if (unregisterChannelLoopMcp) {
            this.unregisterChannelLoopMcpForSession(sessionId);
        }
        return session;
    }
    async registerChannelLoopMcpForSession(sessionId) {
        const host = this.options.channelLoopMcpHost;
        const server = this.channelLoopMcpServer;
        if (!host ||
            !server ||
            this.registeredChannelLoopMcpSessions.has(sessionId)) {
            return;
        }
        const pending = this.channelLoopMcpRegistrations.get(sessionId);
        if (pending) {
            await pending;
            return;
        }
        const registration = host
            .register(sessionId, (message) => server.handleMessage(message, { sessionId }))
            .then(async () => {
            if (this.sessions.has(sessionId)) {
                this.registeredChannelLoopMcpSessions.add(sessionId);
            }
            else {
                await host.unregister(sessionId);
            }
        })
            .catch((error) => {
            this.lastError = error;
        })
            .finally(() => {
            if (this.channelLoopMcpRegistrations.get(sessionId) === registration) {
                this.channelLoopMcpRegistrations.delete(sessionId);
            }
        });
        this.channelLoopMcpRegistrations.set(sessionId, registration);
        await registration;
    }
    unregisterChannelLoopMcpForSession(sessionId) {
        if (!this.registeredChannelLoopMcpSessions.delete(sessionId))
            return;
        void this.options.channelLoopMcpHost
            ?.unregister(sessionId)
            .catch((error) => {
            this.lastError = error;
        });
    }
    resolveChannelLoopToolHandler(sessionId) {
        const handler = this.channelLoopToolHandlers.find((candidate) => candidate.canHandle?.(sessionId) === true ||
            (this.channelLoopToolHandlers.length === 1 && !candidate.canHandle));
        if (handler)
            return handler;
        throw new Error(`No channel loop handler matched session ${sessionId}.`);
    }
    getStringField(data, field, fallback) {
        return isRecord(data) && typeof data[field] === 'string'
            ? data[field]
            : fallback;
    }
    abortActivePrompts(sessionId) {
        const promptControllers = this.activePromptControllers.get(sessionId);
        if (!promptControllers) {
            return;
        }
        for (const controller of promptControllers) {
            controller.abort();
        }
        this.activePromptControllers.delete(sessionId);
    }
    emitResponseBoundary(sessionId) {
        this.emit('responseBoundary', sessionId);
    }
    createTurnBarrier(sessionId) {
        return new Promise((resolve) => {
            this.turnBarriers.set(sessionId, resolve);
        });
    }
    resolveTurnBarrier(sessionId) {
        const resolve = this.turnBarriers.get(sessionId);
        if (resolve) {
            this.turnBarriers.delete(sessionId);
            resolve();
        }
    }
    clearTurnBarrier(sessionId) {
        this.turnBarriers.delete(sessionId);
    }
    emitProtocolError(message, details) {
        const error = new Error(message);
        error.details = summarizeProtocolDetails(details);
        this.emit('error', error);
    }
}
//# sourceMappingURL=DaemonChannelBridge.js.map