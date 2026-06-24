/**
 * WeChat channel adapter for Qwen Code.
 * Extends ChannelBase with WeChat iLink Bot API integration.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';
import { ChannelBase } from '@qwen-code/channel-base';
import { loadAccount, DEFAULT_BASE_URL } from './accounts.js';
import { startPollLoop, getContextToken } from './monitor.js';
import { sendText, sendImage, detectImageMime } from './send.js';
import { downloadAndDecrypt } from './media.js';
import { getConfig, sendTyping, WeixinApiError } from './api.js';
import { TypingStatus } from './types.js';
/** In-memory typing ticket cache: userId -> typingTicket */
const typingTickets = new Map();
/** Escape special regex characters in a string. */
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
export class WeixinChannel extends ChannelBase {
    abortController = null;
    baseUrl;
    token = '';
    constructor(name, config, bridge, options) {
        super(name, config, bridge, options);
        this.baseUrl =
            config.baseUrl ||
                DEFAULT_BASE_URL;
    }
    async connect() {
        // Default channel instructions — always include image capability info
        const imageInstructions = [
            '',
            'If you created an image file (screenshot, chart, etc.), you can send it to the user by writing:',
            '[IMAGE: /absolute/path/to/file.png]',
            '',
            'The marker is stripped from text and the image is uploaded automatically.',
            '',
            'CRITICAL: Only use real file paths. Do NOT write [IMAGE: ...] with:',
            '- Example paths like /path/to/file or /tmp/cat.png',
            '- Placeholder symbols like ...',
            "- Paths that don't exist on disk",
        ].join('\n');
        if (!this.config.instructions) {
            this.config.instructions = [
                '## WeChat Channel',
                '',
                'You are a concise coding assistant responding via WeChat.',
                'Keep responses under 500 characters. Use plain text only.',
                '',
                'Users can also send you images.',
                imageInstructions,
            ].join('\n');
        }
        else if (!this.config.instructions.includes('[IMAGE:')) {
            // Use a local copy to avoid mutating this.config.instructions on reconnect.
            this.config.instructions =
                this.config.instructions + '\n' + imageInstructions;
        }
        const account = loadAccount();
        if (!account) {
            throw new Error('WeChat account not configured. Run "qwen channel configure-weixin" first.');
        }
        this.token = account.token;
        if (account.baseUrl) {
            this.baseUrl = account.baseUrl;
        }
        this.abortController = new AbortController();
        startPollLoop({
            baseUrl: this.baseUrl,
            token: this.token,
            onMessage: async (msg) => {
                const envelope = {
                    channelName: this.name,
                    senderId: msg.fromUserId,
                    senderName: msg.fromUserId,
                    chatId: msg.fromUserId,
                    text: msg.text,
                    isGroup: false,
                    isMentioned: false,
                    isReplyToBot: false,
                    referencedText: msg.refText,
                };
                this.handleInboundWithMedia(envelope, msg.image, msg.file).catch((err) => {
                    const errMsg = err instanceof Error ? err.message : JSON.stringify(err, null, 2);
                    process.stderr.write(`[Weixin:${this.name}] Error handling message: ${errMsg}\n`);
                });
            },
            abortSignal: this.abortController.signal,
        }).catch((err) => {
            if (!this.abortController?.signal.aborted) {
                process.stderr.write(`[Weixin:${this.name}] Poll loop error: ${err}\n`);
            }
        });
        process.stderr.write(`[Weixin:${this.name}] Connected to WeChat (${this.baseUrl})\n`);
    }
    onPromptStart(chatId) {
        this.setTyping(chatId, true).catch(() => { });
    }
    onPromptEnd(chatId) {
        this.setTyping(chatId, false).catch(() => { });
    }
    async handleInboundWithMedia(envelope, image, file) {
        // Download image from CDN
        if (image) {
            try {
                const imageData = await downloadAndDecrypt(image.encryptQueryParam, image.aesKey);
                envelope.imageBase64 = imageData.toString('base64');
                envelope.imageMimeType = detectImageMime(imageData);
            }
            catch (err) {
                process.stderr.write(`[Weixin:${this.name}] Failed to download image: ${err instanceof Error ? err.message : err}\n`);
            }
        }
        // Download file from CDN, save to temp dir
        if (file) {
            try {
                const fileData = await downloadAndDecrypt(file.encryptQueryParam, file.aesKey);
                const dir = join(tmpdir(), 'channel-files', randomUUID());
                mkdirSync(dir, { recursive: true });
                const filePath = join(dir, basename(file.fileName) || `file_${Date.now()}`);
                writeFileSync(filePath, fileData);
                envelope.attachments = [
                    {
                        type: 'file',
                        filePath,
                        mimeType: 'application/octet-stream',
                        fileName: file.fileName,
                    },
                ];
            }
            catch (err) {
                process.stderr.write(`[Weixin:${this.name}] Failed to download file: ${err instanceof Error ? err.message : err}\n`);
                envelope.text = `(User sent a file "${file.fileName}" but download failed)`;
            }
        }
        await super.handleInbound(envelope);
    }
    async sendMessage(chatId, text) {
        const contextToken = getContextToken(chatId) || '';
        // Parse [IMAGE: /path/to/file.png] markers from text.
        // Strip code blocks first to avoid matching example syntax inside them.
        const textWithoutCode = text
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`[^`]*`/g, '');
        // Extract image paths from code-free text.
        const imageRegex = /\[IMAGE:\s*([^\]]+)\]/gi;
        const parsedImages = [];
        for (const m of textWithoutCode.matchAll(imageRegex)) {
            const trimmed = m[1]?.trim();
            if (trimmed)
                parsedImages.push(trimmed);
        }
        // Only strip markers that were actually parsed (avoids silently
        // removing [IMAGE:] inside code blocks from the displayed text).
        let cleanedText = text;
        for (const path of parsedImages) {
            cleanedText = cleanedText.replace(new RegExp(`\\[IMAGE:\\s*${escapeRegex(path)}\\]`, 'gi'), '');
        }
        // Clean up double blank lines left by removed markers
        cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n').trim();
        // Send text first if non-empty
        if (cleanedText) {
            await sendText({
                to: chatId,
                text: cleanedText,
                baseUrl: this.baseUrl,
                token: this.token,
                contextToken,
            });
        }
        // Send images
        if (parsedImages.length) {
            const workspaceDirs = [this.config.cwd];
            for (const imagePath of parsedImages) {
                try {
                    await sendImage({
                        to: chatId,
                        imagePath,
                        baseUrl: this.baseUrl,
                        token: this.token,
                        contextToken,
                        workspaceDirs,
                    });
                }
                catch (err) {
                    const status = err instanceof WeixinApiError ? err.status : 0;
                    const ret = err instanceof WeixinApiError ? err.ret : undefined;
                    const errcode = err instanceof WeixinApiError ? err.errcode : undefined;
                    const msg = err instanceof Error ? err.message : String(err);
                    process.stderr.write(`[Weixin:${this.name}] Failed to send image (status=${status} ret=${ret} errcode=${errcode}): ${msg}\n`);
                    try {
                        await sendText({
                            to: chatId,
                            text: '图片发送失败，请稍后重试',
                            baseUrl: this.baseUrl,
                            token: this.token,
                            contextToken,
                        });
                    }
                    catch (fallbackErr) {
                        process.stderr.write(`[Weixin:${this.name}] Fallback text also failed: ${fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)}\n`);
                    }
                }
            }
        }
    }
    disconnect() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }
    async setTyping(userId, typing) {
        try {
            let ticket = typingTickets.get(userId);
            if (!ticket) {
                const contextToken = getContextToken(userId);
                const config = await getConfig(this.baseUrl, this.token, userId, contextToken);
                if (config.typing_ticket) {
                    ticket = config.typing_ticket;
                    typingTickets.set(userId, ticket);
                }
            }
            if (!ticket)
                return;
            await sendTyping(this.baseUrl, this.token, {
                ilink_user_id: userId,
                typing_ticket: ticket,
                status: typing ? TypingStatus.TYPING : TypingStatus.CANCEL,
            });
        }
        catch {
            // Typing is best-effort — don't fail the message flow
        }
    }
}
//# sourceMappingURL=WeixinAdapter.js.map