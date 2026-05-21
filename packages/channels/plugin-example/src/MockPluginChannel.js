import { ChannelBase } from '@qwen-code/channel-base';
import WebSocket from 'ws';
export class MockPluginChannel extends ChannelBase {
    ws = null;
    serverWsUrl;
    pendingMessageId;
    constructor(name, config, bridge, options) {
        super(name, config, bridge, options);
        this.serverWsUrl = config.serverWsUrl;
    }
    async connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.serverWsUrl);
            this.ws.on('open', () => {
                resolve();
            });
            this.ws.on('message', (data) => {
                try {
                    const msg = JSON.parse(data.toString());
                    if (msg.type === 'inbound') {
                        this.onInboundMessage(msg);
                    }
                }
                catch {
                    // ignore parse errors
                }
            });
            this.ws.on('close', () => {
                this.ws = null;
            });
            this.ws.on('error', (err) => {
                if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                    reject(err);
                }
            });
        });
    }
    onInboundMessage(msg) {
        const envelope = {
            channelName: this.name,
            senderId: msg.senderId,
            senderName: msg.senderName,
            chatId: msg.chatId,
            text: msg.text,
            messageId: msg.messageId,
            isGroup: false,
            isMentioned: false,
            isReplyToBot: false,
        };
        this.handleInbound(envelope).catch(() => {
            // errors handled internally by ChannelBase
        });
    }
    onResponseChunk(chatId, chunk, _sessionId) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN)
            return;
        const msg = {
            type: 'chunk',
            messageId: this.pendingMessageId || 'unknown',
            chatId,
            text: chunk,
        };
        this.ws.send(JSON.stringify(msg));
    }
    async onResponseComplete(chatId, fullText, _sessionId) {
        await this.sendMessage(chatId, fullText);
    }
    async sendMessage(chatId, text) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }
        const outbound = {
            type: 'outbound',
            messageId: this.pendingMessageId || 'unknown',
            chatId,
            text,
        };
        this.ws.send(JSON.stringify(outbound));
    }
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
    async handleInbound(envelope) {
        this.pendingMessageId = envelope.messageId;
        try {
            await super.handleInbound(envelope);
        }
        finally {
            this.pendingMessageId = undefined;
        }
    }
}
//# sourceMappingURL=MockPluginChannel.js.map