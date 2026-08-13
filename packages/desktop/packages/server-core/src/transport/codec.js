const WIRE_TYPE_KEY = '__craftRpcType';
const WIRE_BASE64_KEY = 'base64';
const UINT8_WIRE_TYPE = 'u8';
const MESSAGE_TYPES = new Set([
    'handshake',
    'handshake_ack',
    'request',
    'response',
    'event',
    'error',
    'sequence_ack',
]);
function bytesToBase64(bytes) {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(bytes).toString('base64');
    }
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}
function base64ToBytes(base64) {
    if (typeof Buffer !== 'undefined') {
        return new Uint8Array(Buffer.from(base64, 'base64'));
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}
function toUint8Array(value) {
    if (value instanceof Uint8Array) {
        return value;
    }
    if (ArrayBuffer.isView(value)) {
        return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    }
    if (value instanceof ArrayBuffer) {
        return new Uint8Array(value);
    }
    return null;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function encodeWireValue(value) {
    const bytes = toUint8Array(value);
    if (bytes) {
        const encoded = {
            [WIRE_TYPE_KEY]: UINT8_WIRE_TYPE,
            [WIRE_BASE64_KEY]: bytesToBase64(bytes),
        };
        return encoded;
    }
    if (Array.isArray(value)) {
        return value.map(encodeWireValue);
    }
    if (isRecord(value)) {
        const encoded = {};
        for (const [key, val] of Object.entries(value)) {
            encoded[key] = encodeWireValue(val);
        }
        return encoded;
    }
    return value;
}
function decodeWireValue(value) {
    if (Array.isArray(value)) {
        return value.map(decodeWireValue);
    }
    if (isRecord(value)) {
        if (value[WIRE_TYPE_KEY] === UINT8_WIRE_TYPE &&
            typeof value[WIRE_BASE64_KEY] === 'string') {
            return base64ToBytes(value[WIRE_BASE64_KEY]);
        }
        const decoded = {};
        for (const [key, val] of Object.entries(value)) {
            decoded[key] = decodeWireValue(val);
        }
        return decoded;
    }
    return value;
}
function isWireError(value) {
    return isRecord(value)
        && value.code != null
        && typeof value.message === 'string';
}
export function validateEnvelopeShape(value) {
    if (!isRecord(value))
        return false;
    if (typeof value.id !== 'string' || value.id.length === 0)
        return false;
    if (typeof value.type !== 'string' || !MESSAGE_TYPES.has(value.type))
        return false;
    if (value.type === 'handshake_ack' && (typeof value.clientId !== 'string' || value.clientId.length === 0)) {
        return false;
    }
    if ((value.type === 'request' || value.type === 'event') && typeof value.channel !== 'string') {
        return false;
    }
    if (value.type === 'response' && value.error !== undefined && !isWireError(value.error)) {
        return false;
    }
    if (value.type === 'error' && !isWireError(value.error)) {
        return false;
    }
    return true;
}
export function serializeEnvelope(envelope) {
    return JSON.stringify(encodeWireValue(envelope));
}
export function deserializeEnvelope(raw) {
    const parsed = decodeWireValue(JSON.parse(raw));
    if (!validateEnvelopeShape(parsed)) {
        throw new Error('Invalid envelope shape');
    }
    return parsed;
}
//# sourceMappingURL=codec.js.map