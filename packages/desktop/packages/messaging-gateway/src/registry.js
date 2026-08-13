/**
 * MessagingGatewayRegistry — owns per-workspace MessagingGateway instances.
 *
 * Responsibilities:
 *   - Satisfies IMessagingGatewayRegistry for the RPC handlers in server-core.
 *   - Acts as a single EventSink consumer fanning session events to the right gateway.
 *   - Owns the in-memory pairing code manager (shared across workspaces; codes are workspace-scoped).
 *   - Owns per-workspace MessagingConfig (messaging/config.json).
 *   - Owns platform adapter lifecycle (initialize/swap/destroy) via CredentialManager.
 *
 * The registry is constructed once, wired into HandlerDeps, then populated with
 * gateways via initializeWorkspace() for every workspace that has messaging enabled.
 */
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { RPC_CHANNELS } from '@craft-agent/shared/protocol';
import { MessagingGateway } from './gateway';
import { ConfigStore } from './config-store';
import { PairingCodeManager } from './pairing';
import { TelegramAdapter } from './adapters/telegram/index';
import { WhatsAppAdapter } from './adapters/whatsapp/index';
const consoleLogger = {
    info: (message, meta) => console.log('[MessagingRegistry]', message, meta ?? ''),
    warn: (message, meta) => console.warn('[MessagingRegistry]', message, meta ?? ''),
    error: (message, meta) => console.error('[MessagingRegistry]', message, meta ?? ''),
    child(context) {
        return {
            info: (message, meta) => console.log('[MessagingRegistry]', context, message, meta ?? ''),
            warn: (message, meta) => console.warn('[MessagingRegistry]', context, message, meta ?? ''),
            error: (message, meta) => console.error('[MessagingRegistry]', context, message, meta ?? ''),
            child: (next) => consoleLogger.child({ ...context, ...next }),
        };
    },
};
export class MessagingGatewayRegistry {
    opts;
    workspaces = new Map();
    pairing = new PairingCodeManager();
    log;
    constructor(opts) {
        this.opts = opts;
        this.log = (opts.logger ?? consoleLogger).child({ component: 'registry' });
    }
    // -------------------------------------------------------------------------
    // Public registry lifecycle (called by the app bootstrap)
    // -------------------------------------------------------------------------
    async initializeWorkspace(workspaceId) {
        if (this.workspaces.has(workspaceId))
            return;
        const state = this.bootstrapWorkspace(workspaceId);
        const config = state.configStore.get();
        if (!config.enabled)
            return;
        await state.gateway.start();
        this.log.info('gateway started for workspace', {
            event: 'gateway_started',
            workspaceId,
        });
        if (isPlatformConfigured(config, 'telegram')) {
            this.setPlatformRuntime(workspaceId, state, 'telegram', {
                configured: true,
                connected: false,
                state: 'connecting',
                lastError: undefined,
            });
            void this.tryConnectTelegram(workspaceId, state).catch((err) => {
                this.log.error('background Telegram connect failed', {
                    event: 'telegram_connect_failed',
                    workspaceId,
                    error: err,
                });
            });
        }
        if (isPlatformConfigured(config, 'whatsapp')) {
            if (this.hasWhatsAppAuthState(workspaceId)) {
                this.setPlatformRuntime(workspaceId, state, 'whatsapp', {
                    configured: true,
                    connected: false,
                    state: 'connecting',
                    lastError: undefined,
                });
                void this.startWhatsAppAdapter(workspaceId, state, { persistConfig: false, reason: 'restore' }).catch((err) => {
                    this.log.error('background WhatsApp restore failed', {
                        event: 'whatsapp_restore_failed',
                        workspaceId,
                        error: err,
                    });
                    this.setPlatformRuntime(workspaceId, state, 'whatsapp', {
                        configured: true,
                        connected: false,
                        state: 'error',
                        lastError: err instanceof Error ? err.message : String(err),
                    });
                });
            }
            else {
                this.setPlatformRuntime(workspaceId, state, 'whatsapp', {
                    configured: true,
                    connected: false,
                    state: 'reconnect_required',
                    lastError: 'WhatsApp needs to be linked again.',
                });
            }
        }
    }
    async removeWorkspace(workspaceId) {
        const state = this.workspaces.get(workspaceId);
        if (!state)
            return;
        await state.gateway.stop();
        this.pairing.clearWorkspace(workspaceId);
        this.workspaces.delete(workspaceId);
    }
    async stopAll() {
        const stops = Array.from(this.workspaces.values()).map((s) => s.gateway.stop().catch(() => { }));
        await Promise.all(stops);
        this.workspaces.clear();
    }
    get size() {
        return this.workspaces.size;
    }
    // -------------------------------------------------------------------------
    // IMessagingGatewayRegistry — config
    // -------------------------------------------------------------------------
    getConfig(workspaceId) {
        const state = this.workspaces.get(workspaceId) ?? this.bootstrapWorkspace(workspaceId);
        const cfg = state.configStore.get();
        return {
            enabled: cfg.enabled,
            platforms: cfg.platforms,
            runtime: {
                telegram: cloneRuntime(state.runtime.telegram),
                whatsapp: cloneRuntime(state.runtime.whatsapp),
            },
        };
    }
    async updateConfig(workspaceId, partial) {
        const state = this.workspaces.get(workspaceId) ?? this.bootstrapWorkspace(workspaceId);
        state.configStore.update({
            enabled: partial.enabled,
            platforms: partial.platforms,
        });
        const cfg = state.configStore.get();
        if (!cfg.enabled) {
            await state.gateway.unregisterAdapter('telegram').catch(() => { });
            await state.gateway.unregisterAdapter('whatsapp').catch(() => { });
            state.whatsappOffEvent?.();
            state.whatsappOffEvent = undefined;
            state.whatsapp = null;
            this.setPlatformRuntime(workspaceId, state, 'telegram', {
                configured: false,
                connected: false,
                state: 'disconnected',
                identity: undefined,
                lastError: undefined,
            });
            this.setPlatformRuntime(workspaceId, state, 'whatsapp', {
                configured: false,
                connected: false,
                state: 'disconnected',
                identity: undefined,
                lastError: undefined,
            });
            return;
        }
        for (const platform of ['telegram', 'whatsapp']) {
            const configured = isPlatformConfigured(cfg, platform);
            if (!configured && state.gateway.getAdapter(platform)) {
                await state.gateway.unregisterAdapter(platform).catch(() => { });
            }
            if (!configured && platform === 'whatsapp') {
                state.whatsappOffEvent?.();
                state.whatsappOffEvent = undefined;
                state.whatsapp = null;
            }
            if (!configured) {
                this.setPlatformRuntime(workspaceId, state, platform, {
                    configured: false,
                    connected: false,
                    state: 'disconnected',
                    identity: undefined,
                    lastError: undefined,
                });
            }
        }
    }
    // -------------------------------------------------------------------------
    // IMessagingGatewayRegistry — bindings
    // -------------------------------------------------------------------------
    getBindings(workspaceId) {
        const state = this.workspaces.get(workspaceId);
        if (!state)
            return [];
        return state.gateway.getBindingStore().getAll().map(toBindingInfo);
    }
    unbindSession(workspaceId, sessionId, platform) {
        const state = this.workspaces.get(workspaceId);
        if (!state)
            return;
        const removed = state.gateway
            .getBindingStore()
            .unbindSession(sessionId, platform);
        if (removed > 0)
            this.emitBindingChanged(workspaceId);
    }
    unbindBinding(workspaceId, bindingId) {
        const state = this.workspaces.get(workspaceId);
        if (!state)
            return false;
        const removed = state.gateway.getBindingStore().unbindById(bindingId);
        if (removed)
            this.emitBindingChanged(workspaceId);
        return removed;
    }
    // -------------------------------------------------------------------------
    // IMessagingGatewayRegistry — pairing
    // -------------------------------------------------------------------------
    generatePairingCode(workspaceId, sessionId, platform) {
        if (!isKnownPlatform(platform)) {
            throw new Error(`Unknown messaging platform: ${platform}`);
        }
        const state = this.workspaces.get(workspaceId) ?? this.bootstrapWorkspace(workspaceId);
        if (!state.gateway.hasConnectedAdapter(platform)) {
            throw new Error(`${capitalize(platform)} is not connected`);
        }
        const gen = this.pairing.generate(workspaceId, sessionId, platform);
        this.log.info('pairing code generated', {
            event: 'pairing_generated',
            workspaceId,
            sessionId,
            platform,
            expiresAt: gen.expiresAt,
        });
        return {
            code: gen.code,
            expiresAt: gen.expiresAt,
            botUsername: state.botUsernames[platform],
        };
    }
    // -------------------------------------------------------------------------
    // IMessagingGatewayRegistry — platform lifecycle
    // -------------------------------------------------------------------------
    async testTelegramToken(token) {
        if (!token || token.trim().length === 0) {
            return { success: false, error: 'Token is empty' };
        }
        try {
            const info = await fetchTelegramBotInfo(token.trim());
            if (!info.ok) {
                return { success: false, error: info.description ?? 'Invalid token' };
            }
            return {
                success: true,
                botName: info.result.first_name ?? info.result.username ?? 'bot',
                botUsername: info.result.username,
            };
        }
        catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Network error',
            };
        }
    }
    async saveTelegramToken(workspaceId, token) {
        const trimmed = token.trim();
        if (!trimmed)
            throw new Error('Token is empty');
        const test = await this.testTelegramToken(trimmed);
        if (!test.success)
            throw new Error(test.error ?? 'Invalid token');
        await this.opts.credentialManager.set({
            type: 'messaging_bearer',
            workspaceId,
            name: 'telegram',
        }, { value: trimmed });
        const state = this.workspaces.get(workspaceId) ?? this.bootstrapWorkspace(workspaceId);
        state.configStore.update({
            enabled: true,
            platforms: { telegram: { enabled: true } },
        });
        this.setPlatformRuntime(workspaceId, state, 'telegram', {
            configured: true,
            connected: false,
            state: 'connecting',
            lastError: undefined,
        });
        await this.tryConnectTelegram(workspaceId, state);
        await state.gateway.start();
    }
    async disconnectPlatform(workspaceId, platform) {
        if (!isKnownPlatform(platform))
            return;
        const state = this.workspaces.get(workspaceId);
        if (!state)
            return;
        if (platform === 'whatsapp') {
            state.whatsappOffEvent?.();
            state.whatsappOffEvent = undefined;
            if (state.whatsapp) {
                await state.whatsapp.destroy().catch(() => { });
                state.whatsapp = null;
            }
        }
        await state.gateway.unregisterAdapter(platform).catch(() => { });
        state.botUsernames[platform] = undefined;
        this.pairing.clearWorkspace(workspaceId);
        const currentConfig = state.configStore.get();
        const nextPlatforms = {
            ...currentConfig.platforms,
            [platform]: { enabled: false },
        };
        const anyPlatformEnabled = Object.values(nextPlatforms).some((entry) => entry?.enabled);
        state.configStore.update({
            enabled: anyPlatformEnabled,
            platforms: nextPlatforms,
        });
        if (platform !== 'whatsapp') {
            await this.opts.credentialManager
                .delete({ type: 'messaging_bearer', workspaceId, name: platform })
                .catch(() => { });
        }
        this.setPlatformRuntime(workspaceId, state, platform, {
            configured: false,
            connected: false,
            state: 'disconnected',
            identity: undefined,
            lastError: undefined,
        });
    }
    async forgetPlatform(workspaceId, platform) {
        if (!isKnownPlatform(platform))
            return;
        await this.disconnectPlatform(workspaceId, platform);
        if (platform === 'whatsapp') {
            const authDir = this.getWhatsAppAuthStateDir(workspaceId);
            try {
                rmSync(authDir, { recursive: true, force: true });
                this.log.info('forgot WhatsApp auth state', {
                    event: 'whatsapp_auth_forgotten',
                    workspaceId,
                    authDir,
                });
            }
            catch (err) {
                this.log.error('failed to forget WhatsApp auth state', {
                    event: 'whatsapp_auth_forget_failed',
                    workspaceId,
                    authDir,
                    error: err,
                });
                throw err;
            }
        }
    }
    // -------------------------------------------------------------------------
    // WhatsApp — subprocess lifecycle
    // -------------------------------------------------------------------------
    async startWhatsAppConnect(workspaceId) {
        const waConfig = this.opts.whatsapp;
        if (!waConfig) {
            throw new Error('WhatsApp support is not configured on this server');
        }
        const state = this.workspaces.get(workspaceId) ?? this.bootstrapWorkspace(workspaceId);
        this.setPlatformRuntime(workspaceId, state, 'whatsapp', {
            configured: true,
            connected: false,
            state: 'connecting',
            lastError: undefined,
        });
        await this.startWhatsAppAdapter(workspaceId, state, { persistConfig: true, reason: 'user_connect' });
    }
    async submitWhatsAppPhone(workspaceId, phoneNumber) {
        const state = this.workspaces.get(workspaceId);
        if (!state?.whatsapp) {
            throw new Error('WhatsApp not started — call startWhatsAppConnect first');
        }
        const cleaned = phoneNumber.replace(/[^\d]/g, '');
        if (cleaned.length < 8)
            throw new Error('Phone number looks too short');
        await state.whatsapp.requestPairingCode(cleaned);
    }
    async startWhatsAppAdapter(workspaceId, state, options) {
        const waConfig = this.opts.whatsapp;
        if (!waConfig) {
            throw new Error('WhatsApp support is not configured on this server');
        }
        state.whatsappOffEvent?.();
        state.whatsappOffEvent = undefined;
        if (state.whatsapp) {
            await state.whatsapp.destroy().catch(() => { });
            state.whatsapp = null;
        }
        const adapter = new WhatsAppAdapter();
        state.whatsapp = adapter;
        state.whatsappOffEvent = adapter.onEvent((ev) => this.onWhatsAppEvent(workspaceId, ev));
        // selfChatMode: default ON. Persisted to workspace config so it
        // survives restart and can be toggled later if the user wants pure
        // contact-only routing.
        const persistedCfg = state.configStore.get();
        const selfChatMode = persistedCfg.platforms.whatsapp?.selfChatMode ?? true;
        await adapter.initialize({
            workerEntry: waConfig.workerEntry,
            nodeBin: waConfig.nodeBin,
            authStateDir: this.getWhatsAppAuthStateDir(workspaceId),
            pairingMode: waConfig.pairingMode ?? 'code',
            selfChatMode,
            logger: this.log.child({
                component: 'whatsapp-adapter',
                workspaceId,
                platform: 'whatsapp',
            }),
        });
        state.gateway.registerAdapter(adapter);
        if (options.persistConfig) {
            state.configStore.update({
                enabled: true,
                platforms: { whatsapp: { enabled: true, selfChatMode } },
            });
        }
        await state.gateway.start();
        this.log.info('WhatsApp adapter started', {
            event: 'whatsapp_adapter_started',
            workspaceId,
            reason: options.reason,
        });
    }
    onWhatsAppEvent(workspaceId, event) {
        const state = this.workspaces.get(workspaceId);
        if (!state)
            return;
        this.opts.publishEvent?.(RPC_CHANNELS.messaging.WA_UI_EVENT, { to: 'workspace', workspaceId }, { workspaceId, event });
        switch (event.type) {
            case 'qr':
                this.setPlatformRuntime(workspaceId, state, 'whatsapp', {
                    configured: true,
                    connected: false,
                    state: 'reconnect_required',
                    lastError: 'QR scan required',
                });
                return;
            case 'connected':
                this.setPlatformRuntime(workspaceId, state, 'whatsapp', {
                    configured: true,
                    connected: true,
                    state: 'connected',
                    identity: event.name ?? event.jid,
                    lastError: undefined,
                });
                return;
            case 'disconnected':
                this.setPlatformRuntime(workspaceId, state, 'whatsapp', {
                    configured: true,
                    connected: false,
                    state: event.loggedOut ? 'reconnect_required' : 'disconnected',
                    lastError: event.reason,
                    identity: undefined,
                });
                return;
            case 'unavailable':
                this.setPlatformRuntime(workspaceId, state, 'whatsapp', {
                    configured: true,
                    connected: false,
                    state: 'error',
                    lastError: event.message,
                    identity: undefined,
                });
                return;
            case 'error':
                if (!state.runtime.whatsapp.connected) {
                    this.setPlatformRuntime(workspaceId, state, 'whatsapp', {
                        configured: true,
                        connected: false,
                        state: 'error',
                        lastError: event.message,
                    });
                }
                return;
            case 'pairing_code':
                return;
        }
    }
    // -------------------------------------------------------------------------
    // EventSink-compatible callback
    // -------------------------------------------------------------------------
    onSessionEvent = (channel, target, ...args) => {
        if (channel !== RPC_CHANNELS.sessions.EVENT)
            return;
        const event = args[0];
        if (!event?.sessionId)
            return;
        const workspaceId = 'workspaceId' in target ? target.workspaceId : undefined;
        if (!workspaceId) {
            for (const state of this.workspaces.values()) {
                state.gateway.onSessionEvent(channel, target, ...args);
            }
            return;
        }
        const state = this.workspaces.get(workspaceId);
        if (state)
            state.gateway.onSessionEvent(channel, target, ...args);
    };
    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------
    bootstrapWorkspace(workspaceId) {
        const existing = this.workspaces.get(workspaceId);
        if (existing)
            return existing;
        const storageDir = this.opts.getMessagingDir(workspaceId);
        const legacyStorageDir = this.opts.getLegacyMessagingDir?.(workspaceId);
        const baseLog = this.log.child({ workspaceId });
        const configStore = new ConfigStore(storageDir, legacyStorageDir, baseLog.child({ component: 'config-store' }));
        const cfg = configStore.get();
        const gateway = new MessagingGateway({
            sessionManager: this.opts.sessionManager,
            workspaceId,
            storageDir,
            legacyStorageDir,
            logger: baseLog,
            pairingConsumer: {
                canConsume: (platform, senderId) => this.pairing.canConsume(workspaceId, platform, senderId),
                consume: (platform, code) => {
                    const entry = this.pairing.consume(workspaceId, platform, code);
                    if (!entry)
                        return null;
                    return { workspaceId: entry.workspaceId, sessionId: entry.sessionId };
                },
            },
            onBindingChanged: () => this.emitBindingChanged(workspaceId),
        });
        const state = {
            gateway,
            configStore,
            botUsernames: {},
            whatsapp: null,
            runtime: {
                telegram: createRuntime('telegram', isPlatformConfigured(cfg, 'telegram')),
                whatsapp: createRuntime('whatsapp', isPlatformConfigured(cfg, 'whatsapp')),
            },
        };
        this.workspaces.set(workspaceId, state);
        return state;
    }
    async tryConnectTelegram(workspaceId, state) {
        const cred = await this.opts.credentialManager
            .get({ type: 'messaging_bearer', workspaceId, name: 'telegram' })
            .catch(() => null);
        if (!cred?.value) {
            this.setPlatformRuntime(workspaceId, state, 'telegram', {
                configured: true,
                connected: false,
                state: 'error',
                lastError: 'Telegram token is missing.',
            });
            return;
        }
        await state.gateway.unregisterAdapter('telegram').catch((err) => {
            this.log.warn('unregisterAdapter(telegram) failed (non-fatal)', {
                event: 'telegram_unregister_failed',
                workspaceId,
                error: err,
            });
        });
        try {
            const adapter = new TelegramAdapter();
            await adapter.initialize({
                token: cred.value,
                logger: this.log.child({
                    component: 'telegram-adapter',
                    workspaceId,
                    platform: 'telegram',
                }),
            });
            try {
                const info = await adapter.getBotInfo();
                state.botUsernames.telegram = info?.username;
            }
            catch {
                // non-fatal
            }
            state.gateway.registerAdapter(adapter);
            this.setPlatformRuntime(workspaceId, state, 'telegram', {
                configured: true,
                connected: true,
                state: 'connected',
                identity: state.botUsernames.telegram,
                lastError: undefined,
            });
        }
        catch (err) {
            this.log.error('failed to connect Telegram', {
                event: 'telegram_connect_failed',
                workspaceId,
                error: err,
            });
            this.setPlatformRuntime(workspaceId, state, 'telegram', {
                configured: true,
                connected: false,
                state: 'error',
                lastError: err instanceof Error ? err.message : String(err),
            });
            throw err;
        }
    }
    setPlatformRuntime(workspaceId, state, platform, patch) {
        const previous = state.runtime[platform] ?? createRuntime(platform, false);
        const next = {
            ...previous,
            ...patch,
            platform,
            updatedAt: Date.now(),
        };
        state.runtime[platform] = next;
        this.emitPlatformStatus(workspaceId, platform, next);
    }
    emitBindingChanged(workspaceId) {
        this.opts.publishEvent?.(RPC_CHANNELS.messaging.BINDING_CHANGED, { to: 'workspace', workspaceId }, workspaceId);
    }
    emitPlatformStatus(workspaceId, platform, status) {
        this.opts.publishEvent?.(RPC_CHANNELS.messaging.PLATFORM_STATUS, { to: 'workspace', workspaceId }, workspaceId, platform, cloneRuntime(status));
    }
    hasWhatsAppAuthState(workspaceId) {
        const dir = this.getWhatsAppAuthStateDir(workspaceId);
        if (!existsSync(dir))
            return false;
        try {
            return readdirSync(dir).some((entry) => !entry.startsWith('.'));
        }
        catch {
            return false;
        }
    }
    getWhatsAppAuthStateDir(workspaceId) {
        return join(this.opts.getMessagingDir(workspaceId), 'whatsapp-auth');
    }
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toBindingInfo(b) {
    return {
        id: b.id,
        workspaceId: b.workspaceId,
        sessionId: b.sessionId,
        platform: b.platform,
        channelId: b.channelId,
        channelName: b.channelName,
        enabled: b.enabled,
        createdAt: b.createdAt,
    };
}
function isKnownPlatform(p) {
    return p === 'telegram' || p === 'whatsapp';
}
function capitalize(value) {
    return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}
function isPlatformConfigured(config, platform) {
    return Boolean(config.enabled && config.platforms[platform]?.enabled);
}
function createRuntime(platform, configured) {
    return {
        platform,
        configured,
        connected: false,
        state: configured ? 'disconnected' : 'disconnected',
        updatedAt: Date.now(),
    };
}
function cloneRuntime(runtime) {
    return { ...runtime };
}
async function fetchTelegramBotInfo(token) {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    return (await res.json());
}
//# sourceMappingURL=registry.js.map