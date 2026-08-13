/**
 * Server mode configuration — controls whether the Electron app
 * accepts remote connections from other machines.
 *
 * When enabled, the app binds to 0.0.0.0 on a fixed port instead of
 * localhost on a random port, allowing thin clients to connect.
 */
export const DEFAULT_SERVER_CONFIG = {
    enabled: false,
    port: 9100,
};
//# sourceMappingURL=server-config.js.map