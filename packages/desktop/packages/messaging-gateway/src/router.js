/**
 * Router — routes inbound messages from platform adapters to sessions.
 *
 * Looks up the ChannelBinding for (platform, channelId).
 * If found → resolves any `IncomingAttachment.localPath` entries to
 * `FileAttachment`s via `readFileAttachment()`, then forwards to
 * SessionManager.
 * If not found → delegates to Commands for /bind, /new, etc.
 */
import { readFileAttachment } from '@craft-agent/shared/utils';
const NOOP_LOGGER = {
    info: () => { },
    warn: () => { },
    error: () => { },
    child: () => NOOP_LOGGER,
};
export class Router {
    sessionManager;
    bindingStore;
    commands;
    log;
    constructor(sessionManager, bindingStore, commands, log = NOOP_LOGGER) {
        this.sessionManager = sessionManager;
        this.bindingStore = bindingStore;
        this.commands = commands;
        this.log = log;
    }
    async route(adapter, msg) {
        const binding = this.bindingStore.findByChannel(msg.platform, msg.channelId);
        if (binding) {
            try {
                const fileAttachments = this.resolveAttachments(msg);
                this.log.info('routing inbound chat message to session', {
                    event: 'message_routed',
                    platform: msg.platform,
                    channelId: msg.channelId,
                    sessionId: binding.sessionId,
                    bindingId: binding.id,
                    attachmentCount: fileAttachments?.length ?? 0,
                });
                await this.sessionManager.sendMessage(binding.sessionId, msg.text, fileAttachments, undefined, // storedAttachments (handled by session layer)
                undefined);
            }
            catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                this.log.error('failed to route inbound chat message', {
                    event: 'message_route_failed',
                    platform: msg.platform,
                    channelId: msg.channelId,
                    sessionId: binding.sessionId,
                    bindingId: binding.id,
                    error: err,
                });
                await adapter.sendText(msg.channelId, `Failed to send message to session: ${errorMsg}`);
            }
            return;
        }
        this.log.info('routing inbound chat message to command handler', {
            event: 'message_unbound',
            platform: msg.platform,
            channelId: msg.channelId,
            messageId: msg.messageId,
        });
        await this.commands.handle(adapter, msg);
    }
    /**
     * Convert adapter-emitted `IncomingAttachment[]` into the session's
     * `FileAttachment[]` shape. Adapters that download the blob to disk
     * populate `localPath`; we wrap it with `readFileAttachment()` which
     * handles image→base64 / pdf→base64 / text→utf-8 encoding.
     *
     * Attachments without a `localPath`, or whose file can't be read, are
     * silently skipped — the upstream adapter already logged/notified on
     * download failure, so re-surfacing here would double up.
     */
    resolveAttachments(msg) {
        if (!msg.attachments?.length)
            return undefined;
        const built = [];
        for (const a of msg.attachments) {
            if (!a.localPath)
                continue;
            const att = readFileAttachment(a.localPath);
            if (!att)
                continue;
            if (a.fileName)
                att.name = a.fileName;
            built.push(att);
        }
        return built.length > 0 ? built : undefined;
    }
}
//# sourceMappingURL=router.js.map