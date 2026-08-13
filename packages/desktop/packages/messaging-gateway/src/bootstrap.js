/**
 * createMessagingBootstrap — composable messaging wiring shared by every host.
 *
 * Both hosts (Electron main and the standalone Bun server) MUST go through this
 * helper. Deleting either call site breaks the typecheck of the other — that is
 * the only guardrail keeping the two paths from diverging. Do not construct
 * MessagingGatewayRegistry directly from a host.
 *
 * Shape:
 *   const handle = createMessagingBootstrap({ ... })                  // pre-bootstrapServer
 *   const deps   = { ..., messagingRegistry: handle.registry }        // into createHandlerDeps
 *   sink = handle.wrapSink(baseSink)                                  // into setSessionEventSink
 *   handle.setPublisher(instance.wsServer.push.bind(instance.wsServer))  // post-bootstrap
 *   await handle.initializeWorkspaces(workspaceIds)                   // post-bootstrap
 *   await handle.dispose()                                            // on shutdown
 */
import { MessagingGatewayRegistry } from './registry';
import { createFanOutSink } from './event-fanout';
export function createMessagingBootstrap(opts) {
    let publisher = null;
    const registry = new MessagingGatewayRegistry({
        sessionManager: opts.sessionManager,
        credentialManager: opts.credentialManager,
        getMessagingDir: opts.getMessagingDir,
        getLegacyMessagingDir: opts.getLegacyMessagingDir,
        logger: opts.logger,
        whatsapp: {
            workerEntry: opts.whatsapp.workerEntry,
            nodeBin: opts.whatsapp.nodeBin,
            pairingMode: opts.whatsapp.pairingMode ?? 'qr',
        },
        publishEvent: (channel, target, ...args) => {
            publisher?.(channel, target, ...args);
        },
    });
    const log = opts.logger?.child({ component: 'bootstrap' });
    log?.info('messaging bootstrap created', {
        event: 'messaging_bootstrap_created',
        workerEntry: opts.whatsapp.workerEntry,
        nodeBin: opts.whatsapp.nodeBin ?? '(host default)',
        pairingMode: opts.whatsapp.pairingMode ?? 'qr',
    });
    return {
        registry,
        setPublisher(push) {
            publisher = push;
        },
        wrapSink(baseSink) {
            return createFanOutSink(baseSink, registry.onSessionEvent);
        },
        async initializeWorkspaces(workspaceIds) {
            for (const wsId of workspaceIds) {
                try {
                    await registry.initializeWorkspace(wsId);
                }
                catch (err) {
                    log?.error('failed to initialize workspace', {
                        event: 'workspace_init_failed',
                        workspaceId: wsId,
                        error: err,
                    });
                }
            }
        },
        async dispose() {
            await registry.stopAll().catch(() => { });
        },
    };
}
//# sourceMappingURL=bootstrap.js.map