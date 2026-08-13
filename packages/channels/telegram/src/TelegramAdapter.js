import { mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';
import { Bot } from 'grammy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { telegramFormat, splitHtmlForTelegram, } from 'telegram-markdown-formatter';
import { ChannelBase, isTerminalTaskLifecycleType, } from '@qwen-code/channel-base';
const TELEGRAM_BOT_COMMANDS = [
    { command: 'start', description: 'Show quick-start help' },
    { command: 'help', description: 'Show available commands' },
    { command: 'new', description: 'Start a fresh conversation' },
    { command: 'cancel', description: 'Cancel the running request' },
    { command: 'status', description: 'Show session info' },
];
const TELEGRAM_START_MESSAGE = [
    'Qwen Code Telegram bot',
    '',
    'Send any message to chat with Qwen Code.',
    'Use /new to start a fresh conversation.',
    'Use /cancel to stop a running request.',
    'Use /help to see available commands.',
].join('\n');
export class TelegramChannel extends ChannelBase {
    bot;
    botId = 0;
    botUsername = '';
    hasConnectedOnce = false;
    signalHandlersRegistered = false;
    inboundRoute = new AsyncLocalStorage();
    constructor(name, config, bridge, options) {
        super(name, config, bridge, options);
        this.bot = this.createBot();
        this.registerCommand('start', async (envelope) => {
            await this.sendMessage(envelope.chatId, TELEGRAM_START_MESSAGE);
            return true;
        });
        this.registerCancelCommand();
    }
    supportsProactiveSend() {
        return true;
    }
    supportsProactiveTarget(target) {
        return target.threadId === undefined || /^\d+$/u.test(target.threadId);
    }
    createBot() {
        const botConfig = this.proxy
            ? {
                client: {
                    baseFetchConfig: { agent: new HttpsProxyAgent(this.proxy) },
                },
            }
            : undefined;
        return new Bot(this.config.token, botConfig);
    }
    getFileUrl(filePath) {
        return `https://api.telegram.org/file/bot${this.bot.token}/${filePath}`;
    }
    async connect() {
        if (this.hasConnectedOnce) {
            this.bot = this.createBot();
        }
        this.hasConnectedOnce = true;
        const botInfo = await this.bot.api.getMe();
        this.botId = botInfo.id;
        this.botUsername = botInfo.username ?? '';
        await this.registerBotCommands();
        // All messages (including slash commands) go through handleInbound
        // where ChannelBase dispatches shared commands (/help, /clear, /status, etc.)
        this.bot.on('message:text', async (ctx) => {
            const msg = ctx.message;
            const text = msg.text;
            const envelope = this.buildEnvelope(msg, text, msg.entities);
            // Don't await — long prompts would block the update loop
            this.handleInbound(envelope).catch((err) => {
                process.stderr.write(`[Telegram:${this.name}] Error handling message: ${err}\n`);
                ctx
                    .reply('Sorry, something went wrong processing your message.')
                    .catch(() => { });
            });
        });
        // Photo messages
        this.bot.on('message:photo', async (ctx) => {
            const msg = ctx.message;
            const envelope = this.buildEnvelope(msg, msg.caption || '(image)', msg.caption_entities);
            // Pick the largest photo size (last in array)
            const photo = msg.photo[msg.photo.length - 1];
            if (!photo)
                return;
            try {
                const file = await ctx.api.getFile(photo.file_id);
                const fileUrl = this.getFileUrl(file.file_path);
                const resp = await fetch(fileUrl);
                if (!resp.ok)
                    throw new Error(`HTTP ${resp.status}`);
                const buf = Buffer.from(await resp.arrayBuffer());
                envelope.imageBase64 = buf.toString('base64');
                envelope.imageMimeType = 'image/jpeg'; // Telegram always converts photos to JPEG
            }
            catch (err) {
                process.stderr.write(`[Telegram:${this.name}] Failed to download photo: ${err instanceof Error ? err.message : err}\n`);
            }
            this.handleInbound(envelope).catch((err) => {
                process.stderr.write(`[Telegram:${this.name}] Error handling message: ${err}\n`);
                ctx
                    .reply('Sorry, something went wrong processing your message.')
                    .catch(() => { });
            });
        });
        // Document/file messages
        this.bot.on('message:document', async (ctx) => {
            const msg = ctx.message;
            const doc = msg.document;
            const fileName = doc.file_name || `file_${Date.now()}`;
            const envelope = this.buildEnvelope(msg, msg.caption || `(file: ${fileName})`, msg.caption_entities);
            try {
                const file = await ctx.api.getFile(doc.file_id);
                const fileUrl = this.getFileUrl(file.file_path);
                const resp = await fetch(fileUrl);
                if (!resp.ok)
                    throw new Error(`HTTP ${resp.status}`);
                const buf = Buffer.from(await resp.arrayBuffer());
                // Save to temp dir so the agent can read it via read-file tool
                const dir = join(tmpdir(), 'channel-files', randomUUID());
                mkdirSync(dir, { recursive: true });
                const filePath = join(dir, basename(fileName) || `file_${Date.now()}`);
                writeFileSync(filePath, buf);
                envelope.text = msg.caption || '';
                envelope.attachments = [
                    {
                        type: 'file',
                        filePath,
                        mimeType: doc.mime_type || 'application/octet-stream',
                        fileName,
                    },
                ];
            }
            catch (err) {
                process.stderr.write(`[Telegram:${this.name}] Failed to download document: ${err instanceof Error ? err.message : err}\n`);
                envelope.text =
                    (msg.caption || '') +
                        `\n\n(User sent a file "${fileName}" but download failed)`;
            }
            this.handleInbound(envelope).catch((err) => {
                process.stderr.write(`[Telegram:${this.name}] Error handling message: ${err}\n`);
                ctx
                    .reply('Sorry, something went wrong processing your message.')
                    .catch(() => { });
            });
        });
        // Voice messages
        this.bot.on('message:voice', async (ctx) => {
            const msg = ctx.message;
            const voice = msg.voice;
            const fileName = `voice_${Date.now()}.ogg`;
            const envelope = this.buildEnvelope(msg, msg.caption || '(voice message)', msg.caption_entities);
            try {
                const file = await ctx.api.getFile(voice.file_id);
                const fileUrl = this.getFileUrl(file.file_path);
                const resp = await fetch(fileUrl);
                if (!resp.ok)
                    throw new Error(`HTTP ${resp.status}`);
                const buf = Buffer.from(await resp.arrayBuffer());
                // Save to temp dir so the agent can read it via read-file tool
                const dir = join(tmpdir(), 'channel-files', randomUUID());
                mkdirSync(dir, { recursive: true });
                const filePath = join(dir, fileName);
                writeFileSync(filePath, buf);
                envelope.text = msg.caption || '';
                envelope.attachments = [
                    {
                        type: 'audio',
                        filePath,
                        mimeType: voice.mime_type || 'audio/ogg',
                        fileName,
                    },
                ];
            }
            catch (err) {
                process.stderr.write(`[Telegram:${this.name}] Failed to download voice message: ${err instanceof Error ? err.message : err}\n`);
                envelope.text =
                    (msg.caption || '') +
                        `\n\n(User sent a voice message but download failed)`;
            }
            this.handleInbound(envelope).catch((err) => {
                process.stderr.write(`[Telegram:${this.name}] Error handling message: ${err}\n`);
                ctx
                    .reply('Sorry, something went wrong processing your message.')
                    .catch(() => { });
            });
        });
        this.bot.start({ drop_pending_updates: true }).catch((err) => {
            process.stderr.write(`[Telegram:${this.name}] Bot launch error: ${err}\n`);
        });
        if (!this.signalHandlersRegistered) {
            process.once('SIGINT', () => this.bot.stop());
            process.once('SIGTERM', () => this.bot.stop());
            this.signalHandlersRegistered = true;
        }
    }
    async registerBotCommands() {
        try {
            await this.bot.api.setMyCommands(TELEGRAM_BOT_COMMANDS);
        }
        catch (err) {
            process.stderr.write(`[Telegram:${this.name}] Failed to register bot commands: ${err instanceof Error ? err.message : err}\n`);
        }
    }
    /** Per-chat typing interval — repeats every 4s since Telegram expires it after 5s. */
    typingIntervals = new Map();
    activeTypingSessions = new Map();
    sendTyping(chatId) {
        try {
            void this.bot.api.sendChatAction(chatId, 'typing').catch(() => { });
        }
        catch {
            // Best-effort typing indicator.
        }
    }
    startTyping(chatId, sessionId = chatId) {
        const sessions = this.activeTypingSessions.get(chatId) ?? new Set();
        sessions.add(sessionId);
        this.activeTypingSessions.set(chatId, sessions);
        if (this.typingIntervals.has(chatId))
            return;
        this.sendTyping(chatId);
        this.typingIntervals.set(chatId, setInterval(() => this.sendTyping(chatId), 4000));
    }
    stopTyping(chatId, sessionId = chatId) {
        const sessions = this.activeTypingSessions.get(chatId);
        if (sessions) {
            sessions.delete(sessionId);
            if (sessions.size > 0)
                return;
            this.activeTypingSessions.delete(chatId);
        }
        const interval = this.typingIntervals.get(chatId);
        if (!interval)
            return;
        clearInterval(interval);
        this.typingIntervals.delete(chatId);
    }
    onTaskLifecycle(event) {
        if (event.type === 'started') {
            this.startTyping(event.chatId, event.sessionId);
            return;
        }
        if (isTerminalTaskLifecycleType(event.type)) {
            this.stopTyping(event.chatId, event.sessionId);
        }
    }
    onPromptStart(chatId, sessionId) {
        this.startTyping(chatId, sessionId);
    }
    onPromptEnd(chatId, sessionId) {
        this.stopTyping(chatId, sessionId);
    }
    onSessionDied(sessionId) {
        for (const [chatId, sessions] of this.activeTypingSessions) {
            if (sessions.has(sessionId)) {
                this.stopTyping(chatId, sessionId);
            }
        }
        super.onSessionDied(sessionId);
    }
    async handleInbound(envelope) {
        const route = envelope.threadId === undefined ? {} : { threadId: envelope.threadId };
        await this.inboundRoute.run(route, () => super.handleInbound(envelope));
    }
    async sendMessage(chatId, text) {
        await this.sendTelegramMessage(chatId, text, this.inboundRoute.getStore()?.threadId);
    }
    async sendResponseMessage(chatId, text, sessionId) {
        const inboundRoute = this.inboundRoute.getStore();
        const target = this.router.getTarget(sessionId);
        const threadId = inboundRoute !== undefined
            ? inboundRoute.threadId
            : target?.channelName === this.name && target.chatId === chatId
                ? target.threadId
                : undefined;
        await this.sendTelegramMessage(chatId, text, threadId);
    }
    async pushProactive(target, text) {
        await this.sendTelegramMessage(target.chatId, text, target.threadId);
    }
    async sendTelegramMessage(chatId, text, threadId) {
        const html = telegramFormat(text);
        const chunks = splitHtmlForTelegram(html);
        const options = threadId === undefined
            ? { parse_mode: 'HTML' }
            : { parse_mode: 'HTML', message_thread_id: Number(threadId) };
        for (const chunk of chunks) {
            try {
                await this.bot.api.sendMessage(chatId, chunk, options);
            }
            catch {
                // Fallback to plain text for the failed chunk only
                await this.bot.api.sendMessage(chatId, chunk.replace(/<[^>]*>/g, ''), threadId === undefined
                    ? undefined
                    : { message_thread_id: Number(threadId) });
            }
        }
    }
    disconnect() {
        for (const interval of this.typingIntervals.values()) {
            clearInterval(interval);
        }
        this.typingIntervals.clear();
        this.activeTypingSessions.clear();
        this.bot.stop();
    }
    buildEnvelope(msg, text, entities) {
        const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
        const isMentioned = entities?.some((e) => {
            if (!this.botUsername)
                return false;
            const value = text.slice(e.offset, e.offset + e.length).toLowerCase();
            const username = this.botUsername.toLowerCase();
            if (e.type === 'mention') {
                return value === `@${username}`;
            }
            if (e.type === 'bot_command') {
                const mentionIndex = value.indexOf('@');
                return (mentionIndex !== -1 && value.slice(mentionIndex + 1) === username);
            }
            return false;
        }) ?? false;
        const isReplyToBot = msg.reply_to_message?.from?.id === this.botId;
        let cleanText = text;
        if (isMentioned && this.botUsername) {
            cleanText = text
                .replace(new RegExp(`@${this.botUsername}`, 'gi'), '')
                .trim();
        }
        // Extract referenced message text (when user replies to a message)
        const referencedText = msg.reply_to_message?.text || undefined;
        return {
            channelName: this.name,
            senderId: String(msg.from.id),
            senderName: msg.from.first_name +
                (msg.from.last_name ? ` ${msg.from.last_name}` : ''),
            chatId: String(msg.chat.id),
            ...(isGroup && msg.chat.title ? { chatName: msg.chat.title } : {}),
            threadId: typeof msg.message_thread_id === 'number'
                ? String(msg.message_thread_id)
                : undefined,
            text: cleanText,
            isGroup,
            isMentioned,
            isReplyToBot,
            referencedText,
        };
    }
}
//# sourceMappingURL=TelegramAdapter.js.map