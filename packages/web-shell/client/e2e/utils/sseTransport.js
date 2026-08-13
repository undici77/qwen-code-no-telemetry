export async function installSseTransport(page, options) {
    await page.addInitScript(({ baseURL }) => {
        const baseOrigin = new URL(baseURL, window.location.href).origin;
        const originalFetch = window.fetch.bind(window);
        const encoder = new TextEncoder();
        const controllers = [];
        const connections = [];
        function removeController(target) {
            const index = controllers.indexOf(target);
            if (index >= 0) {
                controllers.splice(index, 1);
            }
        }
        function removeConnection(target) {
            const index = connections.indexOf(target);
            if (index >= 0) {
                connections.splice(index, 1);
            }
        }
        function activeControllers() {
            const active = [];
            for (const controller of controllers) {
                try {
                    const _desiredSize = controller.desiredSize;
                    active.push(controller);
                }
                catch {
                    continue;
                }
            }
            if (active.length !== controllers.length) {
                controllers.splice(0, controllers.length, ...active);
            }
            return active;
        }
        function writeBytes(bytes) {
            for (const controller of activeControllers()) {
                controller.enqueue(bytes);
            }
        }
        function finishActiveStreams(finish) {
            const active = activeControllers();
            controllers.length = 0;
            connections.length = 0;
            for (const controller of active) {
                finish(controller);
            }
        }
        window.__webShellSseHarness = {
            connections,
            writeFrame(frame) {
                writeBytes(encoder.encode(frame));
            },
            writeSplitFrame(frame, chunkSizes) {
                const bytes = encoder.encode(frame);
                let offset = 0;
                for (const size of chunkSizes) {
                    const nextOffset = Math.min(bytes.length, offset + Math.max(1, size));
                    writeBytes(bytes.slice(offset, nextOffset));
                    offset = nextOffset;
                    if (offset >= bytes.length)
                        return;
                }
                writeBytes(bytes.slice(offset));
            },
            close() {
                finishActiveStreams((controller) => controller.close());
            },
            error(message) {
                finishActiveStreams((controller) => controller.error(new Error(message)));
            },
        };
        window.fetch = (input, init) => {
            const request = new Request(input, init);
            const url = new URL(request.url, window.location.href);
            const match = url.origin === baseOrigin &&
                /^\/session\/[^/]+\/events\/?$/.test(url.pathname);
            if (!match)
                return originalFetch(input, init);
            const sessionId = decodeURIComponent(url.pathname.split('/')[2] ?? '');
            let streamController = null;
            let connectionRecord = null;
            const stream = new ReadableStream({
                start(controller) {
                    streamController = controller;
                    controllers.push(controller);
                    connectionRecord = {
                        url: url.href,
                        sessionId,
                        headers: Object.fromEntries(request.headers.entries()),
                        connectedAt: Date.now(),
                    };
                    connections.push(connectionRecord);
                },
                cancel() {
                    if (streamController) {
                        removeController(streamController);
                    }
                    if (connectionRecord) {
                        removeConnection(connectionRecord);
                    }
                },
            });
            return Promise.resolve(new Response(stream, {
                status: 200,
                headers: {
                    'cache-control': 'no-cache',
                    'content-type': 'text/event-stream',
                },
            }));
        };
    }, options);
    const frameFor = (event) => `data: ${JSON.stringify(event)}\n\n`;
    const transport = {
        async waitForConnection(sessionId, { timeout = 10_000 } = {}) {
            await page.waitForFunction(({ targetSessionId }) => {
                const harness = window.__webShellSseHarness;
                if (!harness)
                    return false;
                return harness.connections.some((connection) => !targetSessionId || connection.sessionId === targetSessionId);
            }, { targetSessionId: sessionId }, { timeout });
            const connections = await transport.connections();
            const match = [...connections]
                .reverse()
                .find((connection) => !sessionId || connection.sessionId === sessionId);
            if (!match)
                throw new Error('SSE connection was not recorded.');
            return match;
        },
        connections() {
            return page.evaluate(() => window.__webShellSseHarness?.connections ?? []);
        },
        send(event) {
            return page.evaluate((frame) => {
                window.__webShellSseHarness?.writeFrame(frame);
            }, frameFor(event));
        },
        async burst(events) {
            for (const event of events) {
                await transport.send(event);
            }
        },
        split(event, chunkSizes = [7, 3, 11]) {
            return page.evaluate(({ frame, sizes }) => {
                window.__webShellSseHarness?.writeSplitFrame(frame, sizes);
            }, { frame: frameFor(event), sizes: chunkSizes });
        },
        close() {
            return page.evaluate(() => window.__webShellSseHarness?.close());
        },
        error(message = 'SSE transport error') {
            return page.evaluate((reason) => window.__webShellSseHarness?.error(reason), message);
        },
    };
    return transport;
}
//# sourceMappingURL=sseTransport.js.map