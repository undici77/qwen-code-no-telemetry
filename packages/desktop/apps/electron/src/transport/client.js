/**
 * Re-export WsRpcClient from @craft-agent/server-core.
 *
 * The implementation was extracted to server-core so any package
 * (subprocesses, services, bridges) can use it without depending
 * on the Electron app layer. All existing imports continue to work.
 */
export { WsRpcClient, } from '@craft-agent/server-core/transport';
//# sourceMappingURL=client.js.map