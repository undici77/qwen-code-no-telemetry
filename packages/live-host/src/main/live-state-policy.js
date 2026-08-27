const ACTIVE_CALL_STATES = new Set([
    'starting',
    'listening',
    'thinking',
    'speaking',
    'stopping',
]);
const CAPTURE_READY_STATES = new Set([
    'listening',
    'thinking',
    'speaking',
]);
export function isActiveLiveCall(status) {
    return ACTIVE_CALL_STATES.has(status.state);
}
export function canToggleLive(status, connectionReady, hostReady) {
    return (connectionReady &&
        hostReady &&
        (status.available || isActiveLiveCall(status)));
}
export function shouldCaptureLiveAudio(status, hostReady) {
    return (hostReady && status.available && CAPTURE_READY_STATES.has(status.state));
}
export function shouldStopLiveOnToggle(status, startPending) {
    return startPending || isActiveLiveCall(status);
}
export function projectLiveStatusForCapture(status, captureReady) {
    if (status.state !== 'listening' || captureReady)
        return status;
    return { ...status, state: 'starting', statusText: undefined };
}
export function shouldRenderSetup(status, connectionReady) {
    return !connectionReady || (!status.available && !isActiveLiveCall(status));
}
//# sourceMappingURL=live-state-policy.js.map