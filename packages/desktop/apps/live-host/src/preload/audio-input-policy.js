export function shouldRecheckAudioInput(captureRequested) {
    return !captureRequested;
}
export function audioInputConstraints(selectedDeviceId) {
    return {
        channelCount: 1,
        noiseSuppression: true,
        ...(selectedDeviceId
            ? { deviceId: { exact: selectedDeviceId } }
            : undefined),
    };
}
export function isUnavailableDevicePreference(error) {
    return (error instanceof DOMException &&
        (error.name === 'NotFoundError' || error.name === 'OverconstrainedError'));
}
export function hasAudioInputDevice(devices) {
    return devices.some((device) => device.kind === 'audioinput');
}
//# sourceMappingURL=audio-input-policy.js.map