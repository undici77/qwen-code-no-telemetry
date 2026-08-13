import { mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';
import { Buffer } from 'node:buffer';
import { DWClient, TOPIC_CARD, TOPIC_ROBOT, EventAck, } from 'dingtalk-stream-sdk-nodejs';
import { ChannelBase, isTerminalTaskLifecycleType, sanitizeLogText, sanitizeSenderName, } from '@qwen-code/channel-base';
import { normalizeDingTalkMarkdown, extractTitle } from './markdown.js';
import { downloadMedia } from './media.js';
import { DingTalkMediaUploadError, findImageMarkers, readValidatedImage, replaceImageMarkers, uploadDingTalkImage, } from './outbound-image.js';
import { DingtalkConnectionManager, } from './DingtalkConnectionManager.js';
import { DingtalkInteractiveCardClient } from './interactive-card-client.js';
import { parseDingtalkCardActorId, parseDingtalkCardCallback, parseDingtalkInteractiveCardConfig, } from './interactive-card-types.js';
import { StatusCardController } from './status-card-controller.js';
import { QuestionCardController } from './question-card-controller.js';
import { DingtalkInteractionPresenter } from './interaction-presenter.js';
/** Track seen msgIds to deduplicate retried callbacks. */
const DEDUP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const ACK_REACTION_NAME = '👀';
const ACK_EMOTION_ID = '2659900';
const ACK_EMOTION_BG_ID = 'im_bg_1';
const EMOTION_API = 'https://api.dingtalk.com/v1.0/robot/emotion';
const EMOTION_MAX_ATTEMPTS = 3;
const EMOTION_RETRY_BASE_DELAY_MS = 250;
const GROUP_MSG_API = 'https://api.dingtalk.com/v1.0/robot/groupMessages/send';
const DIRECT_MSG_API = 'https://api.dingtalk.com/v1.0/robot/oToMessages/batchSend';
const PROACTIVE_MSG_KEY = 'sampleMarkdown'; // DingTalk's built-in {title, text} markdown template key
const TOKEN_API = 'https://oapi.dingtalk.com/gettoken';
const PROACTIVE_FETCH_TIMEOUT_MS = 15_000;
const mentionTarget = Symbol('mentionTarget');
const IMAGE_INSTRUCTIONS = [
    '',
    'If you created an image file (screenshot, chart, etc.), you can send it to the user by writing:',
    '`[IMAGE: /absolute/path/to/file.png]` (without the backticks)',
    '',
    'The marker is stripped from text and the image is uploaded automatically.',
    '',
    'Only use a real image file inside the workspace or system temporary directory.',
].join('\n');
function collectNonBotMentionIds(data) {
    if (!Array.isArray(data.atUsers) || typeof data.chatbotUserId !== 'string') {
        return [];
    }
    const mentions = new Set();
    for (const user of data.atUsers) {
        if (!user)
            continue;
        const dingtalkId = typeof user.dingtalkId === 'string' ? user.dingtalkId : undefined;
        // DingTalk Stream always sets dingtalkId for the bot entry; staffId-only bot entries are not expected.
        if (dingtalkId === data.chatbotUserId)
            continue;
        const staffId = typeof user.staffId === 'string' ? user.staffId : undefined;
        // Prefer staffId so the model sees the same identifier space as senderId.
        const stableId = staffId || dingtalkId;
        if (stableId)
            mentions.add(stableId);
    }
    return [...mentions];
}
export class DingtalkChannel extends ChannelBase {
    client;
    atSender;
    connectionManager;
    seenMessages = new Map();
    mentionTargets = new Map();
    sessionMentionTargets = new Map();
    bufferedMentionTargets = new Set();
    bufferedMentionTargetsBySession = new Map();
    dedupTimer;
    /** Map conversationId → latest sessionWebhook URL for sending replies. */
    webhooks = new Map();
    activeReactionKeys = new Set();
    /** sessionId → reaction keys, so a dead session's reactions can be recalled. */
    sessionReactionKeys = new Map();
    /**
     * Real inbound message ids (insertion-ordered, size-capped). Unlike the
     * TTL-swept seenMessages dedup map, entries survive long queue waits, so a
     * turn that starts minutes after its message arrived still gets a reaction.
     */
    inboundMessageIds = new Set();
    /**
     * Token cache for proactive sends. The stream SDK only refreshes its token
     * on (re)connect, so a long-lived socket serves a stale one after ~2h.
     */
    proactiveToken;
    interactiveCardConfig;
    interactiveCardClient;
    statusCardController;
    questionCardController;
    interactionPresenter;
    inboundCardOwners = new Map();
    cardRunBySession = new Map();
    cardRuns = new Map();
    constructor(name, config, bridge, options) {
        super(name, config, bridge, options);
        this.atSender =
            config['atSender'] === true;
        if (!this.config.instructions) {
            this.config.instructions = [
                '## DingTalk Channel',
                '',
                'You are responding through DingTalk.',
                IMAGE_INSTRUCTIONS,
            ].join('\n');
        }
        else if (!this.config.instructions.includes('[IMAGE:')) {
            this.config.instructions += IMAGE_INSTRUCTIONS;
        }
        this.interactiveCardConfig = parseDingtalkInteractiveCardConfig(config.interactiveCards);
        if (!config.clientId || !config.clientSecret) {
            throw new Error(`Channel "${name}" requires clientId and clientSecret for DingTalk.`);
        }
        const rawUseConnectionManager = config
            .useConnectionManager;
        if (rawUseConnectionManager !== undefined &&
            typeof rawUseConnectionManager !== 'boolean') {
            throw new Error(`Channel "${name}" useConnectionManager must be a boolean.`);
        }
        const useConnectionManager = rawUseConnectionManager ?? true;
        this.client = this.createClient(useConnectionManager);
        if (this.interactiveCardConfig.enabled) {
            this.interactiveCardClient = new DingtalkInteractiveCardClient({
                robotCode: config.clientId,
                getAccessToken: () => this.getProactiveToken(),
            });
            if (this.interactiveCardConfig.statusCard.enabled &&
                config.blockStreaming !== 'on') {
                this.statusCardController = new StatusCardController({
                    client: this.interactiveCardClient,
                    cancelRun: (sessionId, runId) => this.requestPromptRunCancellation(sessionId, runId),
                    ...(config.model ? { model: config.model } : {}),
                    onError: (operation, error) => {
                        process.stderr.write(`[DingTalk:${this.name}] ${operation} failed: ${sanitizeLogText(String(error), 300)}\n`);
                    },
                });
            }
            if (this.interactiveCardConfig.questionCard.enabled) {
                this.questionCardController = new QuestionCardController({
                    client: this.interactiveCardClient,
                    timeoutMs: this.interactiveCardConfig.questionCard.timeoutMs,
                    sendFallback: (chatId, text) => this.sendMessage(chatId, text),
                    reserveRunProjection: (runId) => this.interactionPresenter?.reserveProjection(runId),
                    onError: (operation, error) => {
                        process.stderr.write(`[DingTalk:${this.name}] ${operation} failed: ${sanitizeLogText(String(error), 300)}\n`);
                    },
                });
            }
            if (this.statusCardController || this.questionCardController) {
                this.interactionPresenter = new DingtalkInteractionPresenter({
                    statusCards: this.statusCardController,
                    questionCards: this.questionCardController,
                    ...(config.blockStreaming !== 'on'
                        ? {
                            sendFallback: (chatId, text, sessionId) => this.sendFallbackReply(chatId, text, sessionId),
                        }
                        : {}),
                });
            }
        }
        if (useConnectionManager) {
            this.connectionManager = new DingtalkConnectionManager({
                initialClient: this.client,
                createClient: () => this.createClient(true),
                getSocket: (client) => client.socket,
                onClientChanged: (client) => {
                    this.client = client;
                },
                log: (message) => {
                    process.stderr.write(`[DingTalk:${this.name}] ${sanitizeLogText(message, 200)}\n`);
                },
            });
        }
    }
    createClient(useConnectionManager) {
        const client = new DWClient({
            clientId: this.config.clientId,
            clientSecret: this.config.clientSecret,
            keepAlive: !useConnectionManager,
        });
        client.config.autoReconnect = !useConnectionManager;
        this.installStructuredDownstreamHandler(client);
        this.registerMessageHandler(client);
        return client;
    }
    installStructuredDownstreamHandler(streamClient) {
        const client = streamClient;
        client.debug = false;
        // Keep raw SDK downstream frames off stdout; this switch mirrors the SDK
        // dispatch table and should be checked when upgrading the DingTalk SDK.
        client.onDownStream = (raw) => {
            this.onDownStream(raw, client);
        };
    }
    registerMessageHandler(client) {
        client.registerCallbackListener(TOPIC_ROBOT, (msg) => {
            client.send(msg.headers.messageId, {
                status: EventAck.SUCCESS,
                message: 'ok',
            });
            this.onMessage(msg);
        });
        if (this.interactiveCardConfig.enabled) {
            client.registerCallbackListener(TOPIC_CARD, (msg) => {
                this.onCardCallback(client, msg);
            });
        }
    }
    onCardCallback(client, msg) {
        const callback = parseDingtalkCardCallback(msg.data);
        const actorId = callback?.actorId ?? parseDingtalkCardActorId(msg.data);
        let result;
        try {
            result = callback
                ? this.routeCardCallback(callback)
                : { kind: 'ignored', ...(actorId ? { actorId } : {}) };
        }
        catch (err) {
            process.stderr.write(`[DingTalk:${this.name}] card callback routing failed: ${sanitizeLogText(String(err), 200)}\n`);
            result = { kind: 'ignored', ...(actorId ? { actorId } : {}) };
        }
        client.send(msg.headers.messageId, {
            status: EventAck.SUCCESS,
            message: 'ok',
        });
        if (result.kind === 'accepted') {
            void result.execute().catch((err) => {
                process.stderr.write(`[DingTalk:${this.name}] card callback action failed: ${sanitizeLogText(String(err), 200)}\n`);
            });
        }
        else if (result.kind === 'forbidden') {
            void this.sendCardInteractionFeedback(result.actorId, result.target).catch((err) => {
                process.stderr.write(`[DingTalk:${this.name}] card interaction feedback failed: ${sanitizeLogText(String(err), 200)}\n`);
            });
        }
    }
    routeCardCallback(callback) {
        if (callback.actionId === 'btn_stop') {
            return (this.statusCardController?.claimStop(callback.outTrackId, callback.actorId) ?? { kind: 'ignored', actorId: callback.actorId });
        }
        return (this.questionCardController?.claim(callback) ?? {
            kind: 'ignored',
            actorId: callback.actorId,
        });
    }
    onDownStream(raw, client) {
        this.connectionManager?.noteActivity(client);
        const decoded = this.decodeDownStream(raw);
        let msg;
        try {
            const parsed = JSON.parse(decoded.text);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                process.stderr.write(`[DingTalk:${this.name}] downstream parsed to non-object, ignoring.\n`);
                return;
            }
            msg = parsed;
        }
        catch (err) {
            process.stderr.write(`[DingTalk:${this.name}] Failed to parse downstream: ${sanitizeLogText(String(err), 200)}\n`);
            return;
        }
        const headers = msg.headers && typeof msg.headers === 'object' ? msg.headers : {};
        const type = typeof msg.type === 'string' ? msg.type : '';
        const topic = typeof headers['topic'] === 'string' ? headers['topic'] : '';
        const messageId = typeof headers['messageId'] === 'string' ? headers['messageId'] : '';
        process.stderr.write(`[DingTalk:${this.name}] downstream type=${sanitizeLogText(type, 40)} topic=${sanitizeLogText(topic, 80)} messageId=${sanitizeLogText(messageId, 80)} bytes=${decoded.bytes}\n`);
        if ((type === 'CALLBACK' || type === 'EVENT') && (!topic || !messageId)) {
            process.stderr.write(`[DingTalk:${this.name}] Ignoring downstream with invalid routing headers.\n`);
            return;
        }
        const normalizedMsg = {
            ...msg,
            headers: { ...headers, topic, messageId },
        };
        switch (type) {
            case 'SYSTEM':
                this.callDownStreamHandler(client, 'onSystem', normalizedMsg);
                if (topic === 'disconnect') {
                    this.connectionManager?.requestReconnect(client, 'SYSTEM disconnect');
                }
                break;
            case 'EVENT':
                this.callDownStreamHandler(client, 'onEvent', normalizedMsg);
                break;
            case 'CALLBACK':
                this.callDownStreamHandler(client, 'onCallback', normalizedMsg);
                break;
            default:
                process.stderr.write(`[DingTalk:${this.name}] Ignoring downstream type ${sanitizeLogText(type || 'unknown', 40)}.\n`);
        }
    }
    callDownStreamHandler(client, method, msg) {
        try {
            client[method](msg);
        }
        catch (err) {
            process.stderr.write(`[DingTalk:${this.name}] ${method} failed: ${sanitizeLogText(String(err), 200)}\n`);
        }
    }
    decodeDownStream(raw) {
        if (typeof raw === 'string') {
            return { text: raw, bytes: Buffer.byteLength(raw) };
        }
        if (Buffer.isBuffer(raw)) {
            return { text: raw.toString('utf8'), bytes: raw.length };
        }
        if (raw instanceof Uint8Array) {
            return { text: Buffer.from(raw).toString('utf8'), bytes: raw.byteLength };
        }
        if (raw instanceof ArrayBuffer) {
            return {
                text: Buffer.from(raw).toString('utf8'),
                bytes: raw.byteLength,
            };
        }
        return { text: String(raw), bytes: Buffer.byteLength(String(raw)) };
    }
    async connect() {
        if (this.connectionManager) {
            await this.connectionManager.start();
        }
        else {
            await this.client.connect();
        }
        // Periodically clean up dedup map
        this.dedupTimer = setInterval(() => {
            const now = Date.now();
            for (const [id, ts] of this.seenMessages) {
                if (now - ts > DEDUP_TTL_MS) {
                    this.seenMessages.delete(id);
                }
            }
        }, 60_000);
        process.stderr.write(`[DingTalk:${this.name}] Connected via stream.\n`);
    }
    /**
     * A group message with no conversationId can't be routed to a stable shared
     * session (chatId would fall back to the expiring sessionWebhook), so it is
     * dropped on ingestion. Exposed for testing the drop rule.
     */
    static isUnroutableGroupMessage(isGroup, conversationId) {
        return isGroup && !conversationId;
    }
    async prepareOutgoingText(text) {
        const markers = findImageMarkers(text);
        if (markers.length === 0)
            return text;
        const replacements = [];
        for (const marker of markers) {
            const fileName = basename(marker.path)
                .replace(/[\r\n[\]]+/g, '_')
                .slice(0, 100) || 'image';
            try {
                const image = readValidatedImage(marker.path, {
                    workspaceDir: this.config.cwd,
                });
                let mediaId;
                for (let attempt = 0; attempt < 2; attempt++) {
                    const token = await this.getProactiveToken();
                    try {
                        mediaId = await uploadDingTalkImage(image, token);
                        break;
                    }
                    catch (error) {
                        if (error instanceof DingTalkMediaUploadError &&
                            error.authFailure &&
                            attempt === 0) {
                            this.proactiveToken = undefined;
                            continue;
                        }
                        throw error;
                    }
                }
                if (!mediaId) {
                    throw new Error('DingTalk media upload returned no MediaID');
                }
                replacements.push(`![image](${mediaId})`);
            }
            catch (error) {
                process.stderr.write(`[DingTalk:${this.name}] outbound image upload failed (${sanitizeLogText(fileName, 100)}): ${sanitizeLogText(error instanceof Error ? error.message : String(error), 300)}\n`);
                replacements.push(`[Image delivery failed: ${fileName}]`);
            }
        }
        return replaceImageMarkers(text, markers, replacements);
    }
    async sendReply(chatId, text, atUserId) {
        // chatId is a conversationId — resolve to the latest sessionWebhook
        const webhook = this.webhooks.get(chatId);
        if (!webhook) {
            process.stderr.write(`[DingTalk:${this.name}] No webhook for chatId ${chatId}, cannot send.\n`);
            return;
        }
        const outgoingText = await this.prepareOutgoingText(text);
        const mentionPrefix = atUserId ? `@${atUserId}\n\n` : '';
        const chunks = normalizeDingTalkMarkdown(mentionPrefix + outgoingText);
        const title = extractTitle(outgoingText);
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const isMention = i === 0 && atUserId !== undefined;
            const body = {
                msgtype: 'markdown',
                markdown: {
                    title: i === 0 ? title : `${title} (cont.)`,
                    text: chunk,
                },
                ...(isMention ? { at: { atUserIds: [atUserId] } } : {}),
            };
            const resp = await fetch(webhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (isMention && process.env['QWEN_CHANNEL_DEBUG_MENTIONS'] === '1') {
                const payload = (await resp
                    .clone()
                    .json()
                    .catch(() => undefined));
                const response = payload && typeof payload === 'object'
                    ? payload
                    : {};
                const value = response['errcode'] ?? response['code'];
                const code = typeof value === 'number' || typeof value === 'string'
                    ? String(value)
                    : 'unknown';
                process.stderr.write(`[DingTalk:${this.name}] mention delivery status=${resp.status} code=${code}\n`);
            }
            if (!resp.ok) {
                const detail = await resp.text().catch(() => '');
                process.stderr.write(`[DingTalk:${this.name}] sendMessage failed: HTTP ${resp.status} ${detail}\n`);
            }
        }
    }
    async sendMessage(chatId, text) {
        await this.sendReply(chatId, text);
    }
    supportsProactiveSend() {
        return true;
    }
    // Regular proactive paths accept only group targets; webhook tasks may use
    // DMs through the one-to-one API.
    supportsProactiveTarget(target) {
        return (target.isGroup === true &&
            target.threadId === undefined &&
            this.isStableTargetId(target.chatId));
    }
    supportsProactiveDeliveryTarget(target) {
        return (typeof target.isGroup === 'boolean' &&
            target.threadId === undefined &&
            this.isStableTargetId(target.chatId));
    }
    supportsProactiveWebhookTarget(target) {
        return (typeof target.isGroup === 'boolean' &&
            target.threadId === undefined &&
            this.isStableTargetId(target.chatId));
    }
    /**
     * Single-shot cold send: a failed chunk aborts the remainder (already-sent
     * chunks are not recalled) and the error surfaces in the loop's lastError.
     */
    async pushProactive(target, text) {
        if (!text.trim())
            return;
        const outgoingText = await this.prepareOutgoingText(text);
        const chunks = normalizeDingTalkMarkdown(outgoingText);
        const title = extractTitle(outgoingText);
        for (let i = 0; i < chunks.length; i++) {
            await this.sendProactiveChunk(target, i === 0 ? title : `${title} (cont.)`, chunks[i], `chunk ${i + 1}/${chunks.length}`);
        }
    }
    async getProactiveToken() {
        const cached = this.proactiveToken;
        if (cached && Date.now() < cached.expiresAt)
            return cached.token;
        const url = `${TOKEN_API}?appkey=${encodeURIComponent(this.config.clientId)}&appsecret=${encodeURIComponent(this.config.clientSecret)}`;
        let data;
        try {
            const resp = await fetch(url, {
                signal: AbortSignal.timeout(PROACTIVE_FETCH_TIMEOUT_MS),
            });
            data = (await resp.json());
        }
        catch {
            process.stderr.write(`[DingTalk:${this.name}] access token fetch failed.\n`);
            throw new Error('DingTalk access token fetch failed');
        }
        if (!data.access_token) {
            const errmsg = sanitizeLogText(String(data.errmsg ?? ''), 200);
            process.stderr.write(`[DingTalk:${this.name}] access token request failed: gettoken errcode=${data.errcode} ${errmsg}\n`);
            throw new Error(`DingTalk access token request failed: gettoken errcode=${data.errcode}${errmsg ? ` ${errmsg}` : ''}`);
        }
        this.proactiveToken = {
            token: data.access_token,
            // Refresh a minute early so a fire mid-expiry doesn't race the TTL.
            expiresAt: Date.now() + Math.max(60, (data.expires_in ?? 7200) - 60) * 1000,
        };
        return data.access_token;
    }
    sendCardInteractionFeedback(actorId, target) {
        if (target?.isGroup) {
            return this.sendProactiveChunk({
                channelName: this.name,
                senderId: actorId,
                chatId: target.chatId,
                isGroup: true,
            }, '卡片操作', '仅任务发起人可以操作这张卡片，本次操作未生效。', 'card interaction feedback');
        }
        return this.sendProactiveChunk({
            channelName: this.name,
            senderId: actorId,
            chatId: actorId,
            isGroup: false,
        }, '卡片操作', '你无权操作这张卡片，仅任务发起人可以提交或停止。', 'card interaction feedback');
    }
    async sendProactiveChunk(target, title, text, chunkLabel) {
        const targetKind = target.isGroup === true ? 'group' : 'dm';
        for (let attempt = 0;; attempt++) {
            const token = await this.getProactiveToken();
            let resp;
            try {
                const targetBody = target.isGroup === true
                    ? { openConversationId: target.chatId }
                    : { userIds: [target.chatId] };
                resp = await fetch(target.isGroup === true ? GROUP_MSG_API : DIRECT_MSG_API, {
                    method: 'POST',
                    headers: {
                        'x-acs-dingtalk-access-token': token,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        robotCode: this.config.clientId,
                        ...targetBody,
                        msgKey: PROACTIVE_MSG_KEY,
                        msgParam: JSON.stringify({ title, text }),
                    }),
                    signal: AbortSignal.timeout(PROACTIVE_FETCH_TIMEOUT_MS),
                });
            }
            catch (err) {
                const cause = err.cause;
                process.stderr.write(`[DingTalk:${this.name}] proactive send error (${targetKind}, ${chunkLabel}): ${err}${cause ? ` (${cause})` : ''}\n`);
                throw new Error(`DingTalk proactive send failed: ${err instanceof Error ? err.message : String(err)}`);
            }
            if (resp.status === 401 && attempt === 0) {
                // Stale or revoked token — refresh once and retry this chunk.
                this.proactiveToken = undefined;
                await resp.body?.cancel();
                continue;
            }
            if (!resp.ok) {
                const detail = sanitizeLogText(await resp.text().catch(() => ''), 300);
                process.stderr.write(`[DingTalk:${this.name}] proactive send failed (${targetKind}, ${chunkLabel}): HTTP ${resp.status} ${detail}\n`);
                throw new Error(`DingTalk proactive send failed: HTTP ${resp.status}${detail ? ` ${detail}` : ''}`);
            }
            if (target.isGroup === false) {
                let data;
                try {
                    data = (await resp.json());
                }
                catch {
                    process.stderr.write(`[DingTalk:${this.name}] proactive send failed (${targetKind}, ${chunkLabel}): invalid JSON response\n`);
                    throw new Error('DingTalk proactive send failed: invalid JSON response');
                }
                if (data.invalidStaffIdList?.includes(target.chatId)) {
                    process.stderr.write(`[DingTalk:${this.name}] proactive send failed (${targetKind}, ${chunkLabel}): invalid direct recipient\n`);
                    throw new Error('DingTalk proactive send failed: invalid direct recipient');
                }
                if (data.flowControlledStaffIdList?.includes(target.chatId)) {
                    process.stderr.write(`[DingTalk:${this.name}] proactive send failed (${targetKind}, ${chunkLabel}): direct recipient rate limited\n`);
                    throw new Error('DingTalk proactive send failed: direct recipient rate limited');
                }
                return;
            }
            await resp.body?.cancel();
            return;
        }
    }
    getAccessToken() {
        return this.client.getConfig().access_token;
    }
    async emotionApi(endpoint, msgId, conversationId) {
        const robotCode = this.config.clientId;
        if (!robotCode || !msgId || !conversationId)
            return;
        try {
            const token = this.config.clientSecret
                ? await this.getProactiveToken()
                : this.getAccessToken();
            if (!token)
                return;
            for (let attempt = 0; attempt < EMOTION_MAX_ATTEMPTS; attempt++) {
                const resp = await fetch(`${EMOTION_API}/${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'x-acs-dingtalk-access-token': token,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        robotCode,
                        openMsgId: msgId,
                        openConversationId: conversationId,
                        emotionType: 2,
                        emotionName: ACK_REACTION_NAME,
                        textEmotion: {
                            emotionId: ACK_EMOTION_ID,
                            emotionName: ACK_REACTION_NAME,
                            text: ACK_REACTION_NAME,
                            backgroundId: ACK_EMOTION_BG_ID,
                        },
                    }),
                });
                if (resp.ok)
                    return;
                const isTransient = resp.status === 429 || resp.status >= 500;
                if (isTransient && attempt < EMOTION_MAX_ATTEMPTS - 1) {
                    await resp.body?.cancel();
                    await new Promise((resolve) => setTimeout(resolve, EMOTION_RETRY_BASE_DELAY_MS * 2 ** attempt));
                    continue;
                }
                const detail = sanitizeLogText(await resp.text().catch(() => ''), 500);
                process.stderr.write(`[DingTalk:${this.name}] emotion/${endpoint} failed after ${attempt + 1}/${EMOTION_MAX_ATTEMPTS} attempts: ${resp.status} ${detail}\n`);
                return;
            }
        }
        catch {
            // best-effort, don't break message flow
        }
    }
    async attachReaction(msgId, conversationId) {
        await this.emotionApi('reply', msgId, conversationId);
    }
    async recallReaction(msgId, conversationId) {
        await this.emotionApi('recall', msgId, conversationId);
    }
    disconnect() {
        if (this.dedupTimer) {
            clearInterval(this.dedupTimer);
        }
        this.activeReactionKeys.clear();
        this.sessionReactionKeys.clear();
        if (this.connectionManager) {
            this.connectionManager.stop();
        }
        else {
            this.client.disconnect();
        }
        process.stderr.write(`[DingTalk:${this.name}] Disconnected.\n`);
    }
    /** Stable API targets are conversation or user IDs, never webhook URLs. */
    isStableTargetId(chatId) {
        return !!chatId && !/^https?:\/\//i.test(chatId);
    }
    reactionKey(messageId, conversationId) {
        return `${conversationId}:${messageId}`;
    }
    rememberInboundMessageId(msgId) {
        this.inboundMessageIds.delete(msgId);
        this.inboundMessageIds.add(msgId);
        if (this.inboundMessageIds.size > 1000) {
            const oldest = this.inboundMessageIds.values().next().value;
            if (oldest !== undefined)
                this.inboundMessageIds.delete(oldest);
        }
    }
    logReactionFailure(action, err) {
        process.stderr.write(`[DingTalk:${this.name}] ${action} failed: ${err instanceof Error ? err.message : err}\n`);
    }
    startReaction(chatId, messageId, sessionId) {
        if (!messageId || !this.isStableTargetId(chatId))
            return;
        // Loop lifecycle events carry the internal job id as messageId; the
        // emotion API only accepts ids of real inbound messages, so skip anything
        // we never saw arrive.
        if (!this.inboundMessageIds.has(messageId))
            return;
        const key = this.reactionKey(messageId, chatId);
        if (this.activeReactionKeys.has(key))
            return;
        this.activeReactionKeys.add(key);
        if (sessionId) {
            let keys = this.sessionReactionKeys.get(sessionId);
            if (!keys) {
                keys = new Map();
                this.sessionReactionKeys.set(sessionId, keys);
            }
            keys.set(key, { messageId, chatId });
        }
        this.attachReaction(messageId, chatId)
            .then(() => {
            if (!this.activeReactionKeys.has(key)) {
                void this.recallReaction(messageId, chatId).catch((err) => {
                    this.logReactionFailure('late reaction recall', err);
                });
            }
        })
            .catch((err) => {
            this.activeReactionKeys.delete(key);
            this.logReactionFailure('reaction attach', err);
        });
    }
    stopReaction(chatId, messageId, sessionId) {
        if (!messageId || !this.isStableTargetId(chatId))
            return;
        const key = this.reactionKey(messageId, chatId);
        if (sessionId) {
            const keys = this.sessionReactionKeys.get(sessionId);
            if (keys) {
                keys.delete(key);
                if (keys.size === 0)
                    this.sessionReactionKeys.delete(sessionId);
            }
        }
        if (!this.activeReactionKeys.delete(key))
            return;
        this.recallReaction(messageId, chatId).catch((err) => {
            this.logReactionFailure('reaction recall', err);
        });
    }
    /** Recall reactions left behind when a session dies without terminal lifecycle events. */
    onSessionDied(sessionId) {
        const bufferedTargets = this.bufferedMentionTargetsBySession.get(sessionId);
        if (bufferedTargets) {
            this.bufferedMentionTargetsBySession.delete(sessionId);
            for (const messageId of bufferedTargets) {
                this.bufferedMentionTargets.delete(messageId);
                this.mentionTargets.delete(messageId);
            }
        }
        this.sessionMentionTargets.delete(sessionId);
        const cardRunId = this.cardRunBySession.get(sessionId);
        if (cardRunId) {
            this.cardRunBySession.delete(sessionId);
            this.interactionPresenter?.terminalizeRun(cardRunId, 'cancelled');
            this.cardRuns.delete(cardRunId);
        }
        const keys = this.sessionReactionKeys.get(sessionId);
        if (keys) {
            this.sessionReactionKeys.delete(sessionId);
            for (const [key, { messageId, chatId }] of keys) {
                if (this.activeReactionKeys.delete(key)) {
                    void this.recallReaction(messageId, chatId).catch((err) => {
                        this.logReactionFailure('session-death reaction recall', err);
                    });
                }
            }
        }
        super.onSessionDied(sessionId);
    }
    onTaskLifecycle(event) {
        if (event.type === 'started') {
            this.startReaction(event.chatId, event.messageId, event.sessionId);
            const inboundOwner = event.messageId
                ? this.inboundCardOwners.get(event.messageId)
                : undefined;
            if (event.messageId)
                this.inboundCardOwners.delete(event.messageId);
            if (event.runId &&
                event.owner &&
                inboundOwner?.ownerId === event.owner.id) {
                this.cardRuns.set(event.runId, inboundOwner);
                this.cardRunBySession.set(event.sessionId, event.runId);
                this.interactionPresenter?.registerRun(event.runId, event.owner.id, inboundOwner.target, event.sessionId, inboundOwner.sender);
                this.interactionPresenter?.startStatusCard(event.runId);
            }
            return;
        }
        if (isTerminalTaskLifecycleType(event.type)) {
            if (event.messageId)
                this.mentionTargets.delete(event.messageId);
            this.stopReaction(event.chatId, event.messageId, event.sessionId);
            if (event.runId) {
                if (event.type === 'failed') {
                    this.interactionPresenter?.terminalizeRun(event.runId, 'failed', event.error);
                }
                else if (event.type === 'cancelled') {
                    this.interactionPresenter?.terminalizeRun(event.runId, 'cancelled', event.reason);
                }
                else {
                    this.interactionPresenter?.terminalizeRun(event.runId, 'completed');
                }
                this.cardRuns.delete(event.runId);
                if (this.cardRunBySession.get(event.sessionId) === event.runId) {
                    this.cardRunBySession.delete(event.sessionId);
                }
            }
        }
    }
    onPromptBufferDropped(_chatId, sessionId, messageIds) {
        for (const messageId of messageIds) {
            this.bufferedMentionTargets.delete(messageId);
            this.mentionTargets.delete(messageId);
            this.untrackBufferedMentionTarget(sessionId, messageId);
        }
    }
    onPromptBufferDrained(_chatId, sessionId, messageIds) {
        for (const messageId of messageIds) {
            this.bufferedMentionTargets.delete(messageId);
            this.untrackBufferedMentionTarget(sessionId, messageId);
        }
        for (const messageId of messageIds.slice(0, -1)) {
            this.mentionTargets.delete(messageId);
        }
    }
    onPromptBuffered(_chatId, sessionId, messageId) {
        if (messageId && this.mentionTargets.has(messageId)) {
            this.bufferedMentionTargets.add(messageId);
            let targets = this.bufferedMentionTargetsBySession.get(sessionId);
            if (!targets) {
                targets = new Set();
                this.bufferedMentionTargetsBySession.set(sessionId, targets);
            }
            targets.add(messageId);
        }
    }
    onPromptStart(chatId, sessionId, messageId) {
        if (messageId) {
            this.bufferedMentionTargets.delete(messageId);
            this.untrackBufferedMentionTarget(sessionId, messageId);
            const atUserId = this.mentionTargets.get(messageId);
            this.mentionTargets.delete(messageId);
            if (this.atSender && atUserId) {
                this.sessionMentionTargets.set(sessionId, atUserId);
            }
        }
        this.startReaction(chatId, messageId, sessionId);
    }
    async handleInbound(envelope) {
        if (!(await this.preflightInbound(envelope)))
            return;
        const messageId = envelope.messageId;
        if (messageId && envelope.senderId) {
            this.inboundCardOwners.delete(messageId);
            this.inboundCardOwners.set(messageId, {
                ownerId: envelope.senderId,
                target: {
                    chatId: envelope.chatId,
                    isGroup: envelope.isGroup,
                },
                ...(this.atSender && envelope.isGroup
                    ? {
                        sender: {
                            senderName: envelope.senderName,
                        },
                    }
                    : {}),
            });
            if (this.inboundCardOwners.size > 1000) {
                const oldest = this.inboundCardOwners.keys().next().value;
                if (oldest !== undefined)
                    this.inboundCardOwners.delete(oldest);
            }
        }
        const atUserId = envelope[mentionTarget];
        if (this.atSender && messageId && atUserId) {
            this.mentionTargets.set(messageId, atUserId);
        }
        await this.processInbound(envelope);
    }
    async processInbound(envelope) {
        const messageId = envelope.messageId;
        try {
            await super.processInbound(envelope);
        }
        finally {
            if (messageId && !this.bufferedMentionTargets.has(messageId)) {
                this.mentionTargets.delete(messageId);
            }
        }
    }
    untrackBufferedMentionTarget(sessionId, messageId) {
        const targets = this.bufferedMentionTargetsBySession.get(sessionId);
        if (!targets)
            return;
        targets.delete(messageId);
        if (targets.size === 0)
            this.bufferedMentionTargetsBySession.delete(sessionId);
    }
    onPromptEnd(chatId, sessionId, messageId) {
        this.sessionMentionTargets.delete(sessionId);
        this.stopReaction(chatId, messageId, sessionId);
    }
    async sendResponseMessage(chatId, text, sessionId) {
        const atUserId = this.atSender
            ? this.sessionMentionTargets.get(sessionId)
            : undefined;
        if (atUserId)
            this.sessionMentionTargets.delete(sessionId);
        await this.sendReply(chatId, text, atUserId);
    }
    async sendFallbackReply(chatId, text, sessionId) {
        // Mid-run fallbacks must not consume the prompt's mention target: the
        // final answer of the same run still needs it.
        const atUserId = this.atSender
            ? this.sessionMentionTargets.get(sessionId)
            : undefined;
        await this.sendReply(chatId, text, atUserId);
    }
    async onResponseComplete(chatId, text, sessionId, segment) {
        if (segment && this.interactionPresenter) {
            const outgoingText = await this.prepareOutgoingText(text);
            if (await this.interactionPresenter.closeOutput(segment.segmentId, outgoingText, 'completed', segment)) {
                return;
            }
        }
        await this.sendResponseMessage(chatId, text, sessionId);
    }
    onOutputSegmentEnd(_chatId, _sessionId, segment, reason) {
        if (!this.interactionPresenter)
            return;
        return this.interactionPresenter
            .closeOutput(segment.segmentId, '', reason, segment)
            .then(() => undefined);
    }
    onResponseChunk(_chatId, chunk, _sessionId, segment) {
        if (segment)
            this.interactionPresenter?.appendOutput(segment, chunk);
    }
    async presentUserInputRequest(context) {
        const run = this.cardRuns.get(context.runId);
        if (!run || run.ownerId !== context.owner.id) {
            return { kind: 'unsupported' };
        }
        if (!this.questionCardController || !this.interactionPresenter) {
            return { kind: 'unsupported' };
        }
        return this.interactionPresenter.presentInput(context);
    }
    /**
     * Extract quoted/referenced message context from a reply.
     * DingTalk provides this via text.repliedMsg (newer) or quoteMessage (legacy).
     */
    extractQuotedContext(data) {
        // Newer format: text.repliedMsg
        if (data.text?.isReplyMsg && data.text.repliedMsg) {
            const replied = data.text.repliedMsg;
            const isReplyToBot = !!data.chatbotUserId && replied.senderId === data.chatbotUserId;
            // Note: DingTalk doesn't include content for interactiveCard replies
            // (bot responses sent via webhook). Only user message quotes have text.
            const text = this.summarizeRepliedContent(replied);
            return { referencedText: text || undefined, isReplyToBot };
        }
        // Legacy format: quoteMessage
        if (data.quoteMessage) {
            const quote = data.quoteMessage;
            const isReplyToBot = !!data.chatbotUserId && quote.senderId === data.chatbotUserId;
            const text = quote.text?.content?.trim();
            return { referencedText: text || undefined, isReplyToBot };
        }
        return { isReplyToBot: false };
    }
    /**
     * Build a text summary from a repliedMsg, handling text, richText, and
     * media message types with placeholders.
     */
    summarizeRepliedContent(replied) {
        const msgType = replied.msgType;
        const content = replied.content;
        // Direct text content
        if (content?.text?.trim()) {
            return content.text.trim();
        }
        // RichText: concatenate text parts, placeholder for images
        if (content?.richText && Array.isArray(content.richText)) {
            const parts = [];
            for (const part of content.richText) {
                const partType = part.type || 'text';
                if (partType === 'text' && part.text) {
                    parts.push(part.text);
                }
                else if (partType === 'picture') {
                    parts.push('[image]');
                }
                else if (partType === 'at' && part.atName) {
                    parts.push(`@${part.atName}`);
                }
            }
            const summary = parts.join('').trim();
            if (summary)
                return summary;
        }
        // Media type placeholders
        switch (msgType) {
            case 'picture':
                return '[image]';
            case 'file':
                return `[file: ${content?.fileName || 'file'}]`;
            case 'audio':
                return '[audio]';
            case 'video':
                return '[video]';
            default:
                break;
        }
        return '';
    }
    /**
     * Extract text and media download codes from an incoming DingTalk message.
     * Handles text, richText, picture, file, audio, and video message types.
     */
    extractContent(data) {
        const msgtype = data.msgtype || 'text';
        if (msgtype === 'richText') {
            const richText = data.content?.richText;
            if (!Array.isArray(richText)) {
                return { text: '', downloadCodes: [] };
            }
            let text = '';
            const codes = [];
            for (const part of richText) {
                const partType = part.type || 'text';
                if (partType === 'text' && part.text) {
                    text += part.text;
                }
                else if (partType === 'picture' && part.downloadCode) {
                    codes.push(part.downloadCode);
                }
            }
            return {
                text: text.trim() || (codes.length > 0 ? '(image)' : ''),
                downloadCodes: codes,
                mediaType: codes.length > 0 ? 'image' : undefined,
            };
        }
        if (msgtype === 'picture') {
            const code = data.content?.downloadCode;
            return {
                text: '(image)',
                downloadCodes: code ? [code] : [],
                mediaType: 'image',
            };
        }
        if (msgtype === 'file') {
            const code = data.content?.downloadCode;
            const fileName = data.content?.fileName || undefined;
            return {
                text: `(file: ${fileName || 'file'})`,
                downloadCodes: code ? [code] : [],
                mediaType: 'file',
                fileName,
            };
        }
        if (msgtype === 'audio') {
            const code = data.content?.downloadCode;
            const recognition = data.content?.recognition;
            return {
                text: recognition || '(audio)',
                downloadCodes: code ? [code] : [],
                mediaType: 'audio',
            };
        }
        if (msgtype === 'video') {
            const code = data.content?.downloadCode;
            return {
                text: '(video)',
                downloadCodes: code ? [code] : [],
                mediaType: 'video',
            };
        }
        // Default: text message
        return { text: data.text?.content?.trim() || '', downloadCodes: [] };
    }
    /**
     * Download a media file and attach it to the envelope.
     * Images → base64 in envelope; files → saved to temp dir with path in text.
     */
    async attachMedia(envelope, downloadCode, mediaType, fileName) {
        let token;
        try {
            token = await this.getProactiveToken();
        }
        catch {
            process.stderr.write(`[DingTalk:${this.name}] Cannot download media: access token refresh failed.\n`);
            return;
        }
        const robotCode = this.config.clientId;
        if (!robotCode) {
            process.stderr.write(`[DingTalk:${this.name}] Cannot download media: missing robotCode.\n`);
            return;
        }
        const media = await downloadMedia(downloadCode, robotCode, token);
        if (!media)
            return;
        if (mediaType === 'image') {
            const mimeType = media.mimeType.startsWith('image/')
                ? media.mimeType
                : 'image/jpeg';
            envelope.attachments = [
                ...(envelope.attachments || []),
                {
                    type: 'image',
                    data: media.buffer.toString('base64'),
                    mimeType,
                },
            ];
        }
        else {
            // Save non-image files to temp dir so the agent can read them
            const dir = join(tmpdir(), 'channel-files', randomUUID());
            mkdirSync(dir, { recursive: true });
            const safeName = basename(fileName || '') || `dingtalk_${mediaType}_${Date.now()}`;
            const filePath = join(dir, safeName);
            writeFileSync(filePath, media.buffer);
            // Clean up placeholder text like "(audio)", "(video)", "(file: name)"
            if (envelope.text === `(file: ${fileName || 'file'})` ||
                envelope.text === '(audio)' ||
                envelope.text === '(video)') {
                envelope.text = '';
            }
            envelope.attachments = [
                ...(envelope.attachments || []),
                {
                    type: mediaType,
                    filePath,
                    mimeType: media.mimeType,
                    fileName: safeName,
                },
            ];
        }
    }
    onMessage(downstream) {
        try {
            const data = typeof downstream.data === 'string'
                ? JSON.parse(downstream.data)
                : downstream.data;
            this.logDebugPayload('DingTalk', data);
            const dataMsgId = typeof data.msgId === 'string' ? data.msgId : undefined;
            const headerMsgId = typeof downstream.headers.messageId === 'string'
                ? downstream.headers.messageId
                : undefined;
            const msgId = dataMsgId || headerMsgId;
            // Dedup: DingTalk retries unACKed messages
            if (msgId && this.seenMessages.has(msgId)) {
                return;
            }
            if (msgId) {
                this.seenMessages.set(msgId, Date.now());
                this.rememberInboundMessageId(msgId);
            }
            const isGroup = data.conversationType === '2';
            const sessionWebhook = typeof data.sessionWebhook === 'string'
                ? data.sessionWebhook
                : undefined;
            const conversationId = typeof data.conversationId === 'string'
                ? data.conversationId
                : undefined;
            const conversationTitle = typeof data.conversationTitle === 'string'
                ? data.conversationTitle
                : undefined;
            const isMentioned = Boolean(data.isInAtList);
            const senderNick = typeof data.senderNick === 'string' ? data.senderNick : undefined;
            const senderStaffId = typeof data.senderStaffId === 'string' ? data.senderStaffId : undefined;
            const senderIdValue = typeof data.senderId === 'string' ? data.senderId : undefined;
            if (!sessionWebhook) {
                process.stderr.write(`[DingTalk:${this.name}] No sessionWebhook in message, skipping.\n`);
                return;
            }
            // A group message with no conversationId can't be routed to a stable
            // session — chatId would fall back to the expiring sessionWebhook and the
            // shared-session key would churn. Drop it rather than fragment the group.
            if (DingtalkChannel.isUnroutableGroupMessage(isGroup, conversationId)) {
                // Include identifying context so an operator can tell whether one sender
                // or every group message is affected if DingTalk starts omitting
                // conversationId (API regression / edge-case message type).
                process.stderr.write(`[DingTalk:${this.name}] Group message has no conversationId, skipping (msgId=${msgId || 'unknown'}, sender=${sanitizeSenderName(senderNick || senderStaffId || 'unknown')})\n`);
                return;
            }
            // Cache webhook by conversationId so sendMessage can look it up
            if (conversationId) {
                this.webhooks.set(conversationId, sessionWebhook);
            }
            process.stderr.write(`[DingTalk:${this.name}] message msgId=${sanitizeLogText(msgId || 'unknown', 80)} conversationId=${sanitizeLogText(conversationId || '', 120)} isGroup=${isGroup} isMentioned=${isMentioned} senderNick=${sanitizeLogText(senderNick || '', 80)} senderStaffId=${sanitizeLogText(senderStaffId || '', 80)} senderId=${sanitizeLogText(senderIdValue || '', 80)}\n`);
            // Extract text and media info from message
            const content = this.extractContent(data);
            let cleanText = content.text;
            // Strip first @mention (the bot) from text, keep other @mentions intact.
            // Anchor to start-of-string so @ symbols inside URLs or emails
            // (e.g. git@host:path) are not accidentally stripped (#7402).
            if (isMentioned) {
                cleanText = cleanText.replace(/^\s*@[^\s\p{Cf}]+/u, '').trim();
            }
            // Extract quoted message context
            const quoted = this.extractQuotedContext(data);
            const chatId = conversationId || sessionWebhook;
            // After stripping the bot @mention, cleanText may legitimately be empty
            // (user pinged the bot with no other text). Don't fall back to the
            // original text in that case — it would re-introduce the @mention.
            const messageText = isMentioned ? cleanText : cleanText || content.text;
            // Carry mention targets as a structured envelope field (like
            // referencedText) so ChannelBase renders the marker after prompt
            // sanitization and slash-command parsing sees the body alone.
            const mentionedMemberIds = isGroup ? collectNonBotMentionIds(data) : [];
            const senderId = senderStaffId || senderIdValue || '';
            const senderName = senderNick || senderId || 'Unknown';
            const envelope = {
                channelName: this.name,
                senderId,
                senderName,
                chatId,
                ...(isGroup && conversationTitle
                    ? { chatName: conversationTitle }
                    : {}),
                text: messageText,
                ...(mentionedMemberIds.length > 0 ? { mentionedMemberIds } : {}),
                isGroup,
                isMentioned,
                isReplyToBot: quoted.isReplyToBot,
                referencedText: quoted.referencedText,
            };
            // Reactions are resolved later via the chatId passed to
            // onPromptStart/onPromptEnd — no extra bookkeeping needed.
            envelope.messageId = msgId;
            if (this.atSender && isGroup && senderStaffId) {
                envelope[mentionTarget] = senderStaffId;
            }
            const processMessage = async () => {
                // Download media if present (first downloadCode only for images)
                if (content.downloadCodes.length > 0 && content.mediaType) {
                    await this.attachMedia(envelope, content.downloadCodes[0], content.mediaType, content.fileName);
                }
                await this.handleInbound(envelope);
            };
            // Don't await — stream callback should return quickly
            processMessage().catch((err) => {
                process.stderr.write(`[DingTalk:${this.name}] Error handling message: ${err}\n`);
                this.sendMessage(chatId, 'Sorry, something went wrong processing your message.').catch(() => { });
            });
        }
        catch (err) {
            process.stderr.write(`[DingTalk:${this.name}] Failed to parse message: ${err}\n`);
        }
    }
}
//# sourceMappingURL=DingtalkAdapter.js.map