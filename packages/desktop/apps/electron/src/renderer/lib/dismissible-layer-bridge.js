const BRIDGE_KEY = '__craftAgentDismissibleLayerBridge__';
function getBridgeHost() {
    return globalThis;
}
export function setDismissibleLayerBridge(bridge) {
    getBridgeHost()[BRIDGE_KEY] = bridge;
}
export function getDismissibleLayerBridge() {
    return getBridgeHost()[BRIDGE_KEY] ?? null;
}
//# sourceMappingURL=dismissible-layer-bridge.js.map