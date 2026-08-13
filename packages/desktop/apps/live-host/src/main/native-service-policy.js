export function shouldActivateNativeServices(phase) {
    return phase === 'ready';
}
export function shouldDeactivateNativeServices(phase) {
    return (phase === 'disconnected' ||
        phase === 'incompatible' ||
        phase === 'error');
}
//# sourceMappingURL=native-service-policy.js.map