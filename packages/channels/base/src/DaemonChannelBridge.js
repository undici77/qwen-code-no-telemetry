import { EventEmitter } from 'node:events';
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
    return isRecord(value) && typeof value['name'] === 'string';
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
async function drainDaemonEventLoop() {
    // TODO(daemon-roadmap): replace this bounded client-side drain with a daemon
    // terminal turn event / SSE waterline once the typed event schema defines it.
    await new Promise((resolve) => setTimeout(resolve, 0));
}
export class DaemonChannelBridge extends EventEmitter {
    options;
    sessions = new Map();
    eventControllers = new Map();
    requestToSession = new Map();
    respondedRequestToSession = new Map();
    activePrompts = new Set();
    activePromptControllers = new Map();
    availableCommandsBySession = new Map();
    connected = false;
    latestAvailableCommandsSessionId;
    lastError;
    constructor(options) {
        super();
        this.options = options;
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
    async start() {
        this.connected = true;
    }
    async newSession(cwd) {
        const session = await this.options.sessionFactory({
            workspaceCwd: cwd || this.options.cwd,
            modelServiceId: this.options.modelServiceId,
            sessionScope: this.options.sessionScope ?? 'thread',
        });
        this.attachSession(session);
        return session.sessionId;
    }
    async loadSession(sessionId, cwd) {
        const session = await this.options.sessionFactory({
            workspaceCwd: cwd || this.options.cwd,
            modelServiceId: this.options.modelServiceId,
            sessionId,
            sessionScope: this.options.sessionScope ?? 'thread',
        });
        if (session.sessionId !== sessionId) {
            throw new Error(`Daemon returned session ${session.sessionId} while loading ${sessionId}`);
        }
        this.attachSession(session);
        return session.sessionId;
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
        const onChunk = (sid, chunk) => {
            if (sid === sessionId) {
                chunks.push(chunk);
            }
        };
        const onSessionDied = (info) => {
            if (info.sessionId === sessionId) {
                controller.abort();
            }
        };
        this.on('textChunk', onChunk);
        this.on('sessionDied', onSessionDied);
        const prompt = [];
        if (options?.imageBase64 && options.imageMimeType) {
            prompt.push({
                type: 'image',
                data: options.imageBase64,
                mimeType: options.imageMimeType,
            });
        }
        prompt.push({ type: 'text', text });
        try {
            const result = await session.prompt({ prompt }, controller.signal);
            await drainDaemonEventLoop();
            const textResult = chunks.join('');
            this.emit('promptComplete', {
                sessionId,
                text: textResult,
                stopReason: result.stopReason,
            });
            return textResult;
        }
        finally {
            this.off('textChunk', onChunk);
            this.off('sessionDied', onSessionDied);
            this.activePrompts.delete(sessionId);
            controllers.delete(controller);
            if (controllers.size === 0 &&
                this.activePromptControllers.get(sessionId) === controllers) {
                this.activePromptControllers.delete(sessionId);
            }
        }
    }
    async cancelSession(sessionId) {
        const session = this.ensureSession(sessionId);
        await session.cancel();
        this.abortActivePrompts(sessionId);
        this.activePrompts.delete(sessionId);
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
        for (const sessionId of Array.from(this.sessions.keys())) {
            const session = this.sessions.get(sessionId);
            if (session) {
                void session.cancel().catch((error) => {
                    this.lastError = error;
                });
            }
            this.dropSession(sessionId, 'bridge_stopped');
        }
        this.latestAvailableCommandsSessionId = undefined;
        this.connected = false;
    }
    get isConnected() {
        return this.connected;
    }
    attachSession(session) {
        if (this.sessions.has(session.sessionId)) {
            this.dropSession(session.sessionId, 'session_replaced');
        }
        this.sessions.set(session.sessionId, session);
        const controller = new AbortController();
        this.eventControllers.set(session.sessionId, controller);
        void this.pumpEvents(session, controller.signal);
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
                this.dropSession(session.sessionId, this.getReason(event.data, 'client_evicted'));
                break;
            case 'stream_error':
                this.dropSession(session.sessionId, this.getError(event.data, 'stream_error'));
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
                const text = getTextContent(update['content']);
                if (text) {
                    this.emit('textChunk', sessionId, text);
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
                this.emit('toolCall', event);
                break;
            }
            case 'available_commands_update': {
                if (Array.isArray(update['availableCommands'])) {
                    const commands = update['availableCommands'].filter(isAvailableCommand);
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
        this.dropSession(sessionId, this.getReason(data, 'session_died'));
    }
    dropSession(sessionId, reason) {
        if (!this.sessions.has(sessionId)) {
            return;
        }
        this.eventControllers.get(sessionId)?.abort();
        this.eventControllers.delete(sessionId);
        this.sessions.delete(sessionId);
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
        this.emit('sessionDied', { sessionId, reason });
    }
    getReason(data, fallback) {
        return isRecord(data) && typeof data['reason'] === 'string'
            ? data['reason']
            : fallback;
    }
    getError(data, fallback) {
        return isRecord(data) && typeof data['error'] === 'string'
            ? data['error']
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
    emitProtocolError(message, details) {
        const error = new Error(message);
        error.details = summarizeProtocolDetails(details);
        this.emit('error', error);
    }
}
//# sourceMappingURL=DaemonChannelBridge.js.map