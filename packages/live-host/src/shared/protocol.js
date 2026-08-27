export const LIVE_PROTOCOL_VERSION = 6;
export const LIVE_HOST_BUNDLE_ID = 'com.alibaba.qwen-code.live-host';
export const MAX_CONTROL_FRAME_BYTES = 64 * 1024;
export const MAX_INPUT_AUDIO_FRAME_BYTES = 64 * 1024;
export const INPUT_AUDIO_EPOCH_BYTES = 8;
export const MAX_INPUT_AUDIO_WIRE_FRAME_BYTES = INPUT_AUDIO_EPOCH_BYTES + MAX_INPUT_AUDIO_FRAME_BYTES;
export const MAX_OUTPUT_AUDIO_FRAME_BYTES = 256 * 1024;
export const MAX_SOCKET_BUFFERED_BYTES = 1024 * 1024;
const LIVE_STATES = new Set([
    'unavailable',
    'idle',
    'starting',
    'listening',
    'thinking',
    'speaking',
    'stopping',
    'error',
]);
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function boundedString(value, maximumLength) {
    return typeof value === 'string' && value.length <= maximumLength
        ? value
        : undefined;
}
const REQUIREMENT_STATES = new Set([
    'ready',
    'missing',
    'denied',
    'unavailable',
    'checking',
]);
const REQUIREMENT_KEYS = [
    'host',
    'microphone',
    'accessibility',
    'screenRecording',
    'audioInput',
    'audioOutput',
    'globalShortcut',
    'appshot',
    'provider',
];
export function parseLiveStatus(value) {
    const shortcut = isRecord(value)
        ? boundedString(value.shortcut, 128)
        : undefined;
    if (!isRecord(value) ||
        value.v !== 1 ||
        typeof value.available !== 'boolean' ||
        shortcut === undefined) {
        return undefined;
    }
    if (typeof value.state !== 'string' ||
        !LIVE_STATES.has(value.state)) {
        return undefined;
    }
    const status = {
        v: 1,
        available: value.available,
        state: value.state,
        shortcut,
    };
    const blocker = boundedString(value.blocker, 128);
    const message = boundedString(value.message, 1_024);
    const callId = boundedString(value.callId, 256);
    const transcript = boundedString(value.transcript, 8_192);
    const caption = boundedString(value.caption, 8_192);
    const statusText = boundedString(value.statusText, 512);
    if (blocker)
        status.blocker = blocker;
    if (message)
        status.message = message;
    if (callId)
        status.callId = callId;
    if (transcript)
        status.transcript = transcript;
    if (caption)
        status.caption = caption;
    if (statusText)
        status.statusText = statusText;
    if (isRecord(value.pendingPermission)) {
        const workspaceId = boundedString(value.pendingPermission.workspaceId, 512);
        const sessionId = boundedString(value.pendingPermission.sessionId, 256);
        if (workspaceId && sessionId) {
            status.pendingPermission = { workspaceId, sessionId };
        }
    }
    if (typeof value.inputMuted === 'boolean')
        status.inputMuted = value.inputMuted;
    if (typeof value.outputMuted === 'boolean')
        status.outputMuted = value.outputMuted;
    if (isRecord(value.requirements)) {
        const requirements = {};
        for (const key of REQUIREMENT_KEYS) {
            const requirement = value.requirements[key];
            if (typeof requirement === 'string' &&
                REQUIREMENT_STATES.has(requirement)) {
                requirements[key] = requirement;
            }
        }
        status.requirements = requirements;
    }
    if (isRecord(value.host)) {
        const version = boundedString(value.host.version, 128);
        const protocolVersion = Number.isSafeInteger(value.host.protocolVersion)
            ? Number(value.host.protocolVersion)
            : undefined;
        status.host = {
            ...(version ? { version } : {}),
            ...(protocolVersion !== undefined ? { protocolVersion } : {}),
        };
    }
    return status;
}
export function parseDaemonControlMessage(data) {
    if (Buffer.byteLength(data, 'utf8') > MAX_CONTROL_FRAME_BYTES)
        return undefined;
    let value;
    try {
        value = JSON.parse(data);
    }
    catch {
        return undefined;
    }
    if (!isRecord(value) || typeof value.type !== 'string')
        return undefined;
    if (value.type === 'host.welcome') {
        const status = parseLiveStatus(value.status);
        const daemonInstanceNonce = boundedString(value.daemonInstanceNonce, 256);
        if (!Number.isSafeInteger(value.protocolVersion) ||
            !Number.isSafeInteger(value.heartbeatIntervalMs) ||
            !Number.isSafeInteger(value.epoch) ||
            Number(value.epoch) < 0 ||
            !daemonInstanceNonce ||
            !status) {
            return undefined;
        }
        return {
            type: 'host.welcome',
            protocolVersion: Number(value.protocolVersion),
            daemonInstanceNonce,
            heartbeatIntervalMs: Math.min(30_000, Math.max(1_000, Number(value.heartbeatIntervalMs))),
            epoch: Number(value.epoch),
            status,
        };
    }
    if (value.type === 'host.state') {
        const status = parseLiveStatus(value.status);
        return status &&
            Number.isSafeInteger(value.epoch) &&
            Number(value.epoch) >= 0
            ? { type: 'host.state', epoch: Number(value.epoch), status }
            : undefined;
    }
    if (value.type === 'host.ping') {
        const pingId = boundedString(value.pingId, 128);
        return pingId ? { type: 'host.ping', pingId } : undefined;
    }
    if (value.type === 'host.clear_output') {
        return Number.isSafeInteger(value.epoch) && Number(value.epoch) >= 0
            ? { type: 'host.clear_output', epoch: Number(value.epoch) }
            : undefined;
    }
    if (value.type === 'host.set_shortcut') {
        const requestId = boundedString(value.requestId, 128);
        const shortcut = boundedString(value.shortcut, 128);
        return requestId && shortcut !== undefined
            ? { type: 'host.set_shortcut', requestId, shortcut }
            : undefined;
    }
    if (value.type === 'host.capture_screen_context') {
        const requestId = boundedString(value.requestId, 128);
        return requestId &&
            Number.isSafeInteger(value.epoch) &&
            Number(value.epoch) >= 0
            ? {
                type: 'host.capture_screen_context',
                requestId,
                epoch: Number(value.epoch),
            }
            : undefined;
    }
    if (value.type === 'host.error') {
        const code = boundedString(value.code, 128);
        const message = boundedString(value.message, 1_024);
        if (!code)
            return undefined;
        return message
            ? { type: 'host.error', code, message }
            : { type: 'host.error', code };
    }
    return undefined;
}
export function encodeHostControlMessage(message) {
    const encoded = JSON.stringify(message);
    if (Buffer.byteLength(encoded, 'utf8') > MAX_CONTROL_FRAME_BYTES) {
        throw new Error('Live Host control frame exceeds the protocol limit');
    }
    return encoded;
}
export function isValidInputAudioFrame(frame) {
    return (frame.byteLength > 0 &&
        frame.byteLength <= MAX_INPUT_AUDIO_FRAME_BYTES &&
        frame.byteLength % 2 === 0);
}
export function encodeInputAudioFrame(epoch, pcm16) {
    if (!Number.isSafeInteger(epoch) ||
        epoch < 0 ||
        !isValidInputAudioFrame(pcm16)) {
        return undefined;
    }
    const frame = new Uint8Array(INPUT_AUDIO_EPOCH_BYTES + pcm16.byteLength);
    new DataView(frame.buffer).setBigUint64(0, BigInt(epoch), false);
    frame.set(new Uint8Array(pcm16.buffer, pcm16.byteOffset, pcm16.byteLength), INPUT_AUDIO_EPOCH_BYTES);
    return frame;
}
export function isValidOutputAudioFrame(frame) {
    return (frame.byteLength > 0 &&
        frame.byteLength <= MAX_OUTPUT_AUDIO_FRAME_BYTES &&
        frame.byteLength % 2 === 0);
}
//# sourceMappingURL=protocol.js.map