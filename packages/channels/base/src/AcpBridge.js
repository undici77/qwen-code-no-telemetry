import { spawn } from 'node:child_process';
import { Readable, Writable } from 'node:stream';
import { EventEmitter } from 'node:events';
import { ClientSideConnection, ndJsonStream, PROTOCOL_VERSION, } from '@agentclientprotocol/sdk';
export class AcpBridge extends EventEmitter {
    child = null;
    connection = null;
    options;
    _availableCommands = [];
    constructor(options) {
        super();
        this.options = options;
    }
    get availableCommands() {
        return this._availableCommands;
    }
    async start() {
        const { cliEntryPath, cwd } = this.options;
        const args = [cliEntryPath, '--acp'];
        if (this.options.model) {
            args.push('--model', this.options.model);
        }
        this.child = spawn(process.execPath, args, {
            cwd,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env },
            shell: false,
        });
        this.child.stderr?.on('data', (data) => {
            const msg = data.toString().trim();
            if (msg) {
                process.stderr.write(`[AcpBridge] ${msg}\n`);
            }
        });
        this.child.on('exit', (code, signal) => {
            process.stderr.write(`[AcpBridge] Process exited (code=${code}, signal=${signal})\n`);
            this.connection = null;
            this.child = null;
            this.emit('disconnected', code, signal);
        });
        // Give the process a moment to start
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (!this.child || this.child.killed) {
            throw new Error('ACP process failed to start');
        }
        const stdout = Readable.toWeb(this.child.stdout);
        const stdin = Writable.toWeb(this.child.stdin);
        const stream = ndJsonStream(stdin, stdout);
        this.connection = new ClientSideConnection(() => ({
            sessionUpdate: (params) => {
                this.handleSessionUpdate(params);
                return Promise.resolve();
            },
            requestPermission: async (params) => {
                // Auto-approve for now; Phase 5 will add interactive approval
                const options = Array.isArray(params.options) ? params.options : [];
                const optionId = options.find((o) => o.optionId === 'proceed_once')?.optionId ||
                    options[0]?.optionId ||
                    'proceed_once';
                return { outcome: { outcome: 'selected', optionId } };
            },
            extNotification: async () => { },
        }), stream);
        await this.connection.initialize({
            protocolVersion: PROTOCOL_VERSION,
            clientCapabilities: {},
        });
    }
    async newSession(cwd) {
        const conn = this.ensureConnection();
        const response = await conn.newSession({ cwd, mcpServers: [] });
        return response.sessionId;
    }
    async loadSession(sessionId, cwd) {
        const conn = this.ensureConnection();
        const response = await conn.loadSession({
            sessionId,
            cwd,
            mcpServers: [],
        });
        return response.sessionId;
    }
    async prompt(sessionId, text, options) {
        const conn = this.ensureConnection();
        const chunks = [];
        const onChunk = (sid, chunk) => {
            if (sid === sessionId)
                chunks.push(chunk);
        };
        this.on('textChunk', onChunk);
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
            await conn.prompt({
                sessionId,
                prompt: prompt,
            });
        }
        finally {
            this.off('textChunk', onChunk);
        }
        return chunks.join('');
    }
    async cancelSession(sessionId) {
        const conn = this.ensureConnection();
        await conn.cancel({ sessionId });
    }
    stop() {
        if (this.child) {
            this.child.kill();
            this.child = null;
        }
        this.connection = null;
    }
    get isConnected() {
        return (this.child !== null && !this.child.killed && this.child.exitCode === null);
    }
    handleSessionUpdate(params) {
        const { sessionId } = params;
        const update = params['update'];
        if (!update)
            return;
        const type = update['sessionUpdate'];
        switch (type) {
            case 'agent_message_chunk': {
                const content = update['content'];
                if (content?.type === 'text' && content.text) {
                    this.emit('textChunk', sessionId, content.text);
                }
                break;
            }
            case 'tool_call': {
                const event = {
                    sessionId,
                    toolCallId: update['toolCallId'],
                    kind: update['kind'] || '',
                    title: update['title'] || '',
                    status: update['status'] || 'pending',
                    rawInput: update['rawInput'],
                };
                this.emit('toolCall', event);
                break;
            }
            case 'available_commands_update': {
                if (Array.isArray(update['availableCommands'])) {
                    this._availableCommands = update['availableCommands'];
                }
                break;
            }
            default:
                // Ignore other session update types
                break;
        }
        this.emit('sessionUpdate', params);
    }
    ensureConnection() {
        if (!this.connection || !this.isConnected) {
            throw new Error('Not connected to ACP agent');
        }
        return this.connection;
    }
}
//# sourceMappingURL=AcpBridge.js.map