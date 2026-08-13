/**
 * Type-safe push helper — constrains args against BroadcastEventMap at compile time.
 */
export function pushTyped(server, channel, target, ...args) {
    server.push(channel, target, ...args);
}
//# sourceMappingURL=push.js.map