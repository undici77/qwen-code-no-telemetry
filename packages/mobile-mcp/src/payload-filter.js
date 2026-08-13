"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayloadFilteringTransport = exports.decodePayloadMessage = exports.encodePayloadMessage = exports.decodeFilteredText = exports.encodeFilteredText = void 0;
const FILTERED_TERM_SOURCES = [
    'dash[-_ ]?scope',
    'ali[-_ ]?baba',
    'ali[-_ ]?yuncs',
    'ali[-_ ]?yun',
    'ali[-_ ]?cloud',
    'tong[-_ ]?yi',
    'qian[-_ ]?wen',
    'ant[-_ ]?group',
    'modelscope',
    'maxcompute',
    'bailian',
    'dingtalk',
    'lingma',
    'alipay',
    'antfin',
    'taobao',
    'qoder',
    'q[-_ ]?wen',
    'damo',
    'yuque',
    'tmall',
    'wanx',
    '通义',
    '千问',
    '阿里',
    '百炼',
    '魔搭',
    '达摩',
    '灵码',
    '万相',
    '支付宝',
    '蚂蚁',
    '语雀',
    '钉钉',
    '淘宝',
    '天猫',
];
const TOKEN_PREFIX = '__mcp_ref_';
const FILTERED_TERM_PATTERN = new RegExp(FILTERED_TERM_SOURCES.join('|'), 'giu');
const TOKEN_PREFIX_PATTERN = /__mcp_ref_/giu;
const REFERENCE_PATTERN = /__mcp_ref_([0-9a-f]+)__/giu;
const encodeReference = (value) => {
    const hex = Buffer.from(value, 'utf8').toString('hex');
    return `${TOKEN_PREFIX}${hex}__`;
};
const encodeFilteredText = (value) => {
    const escaped = value.replace(TOKEN_PREFIX_PATTERN, encodeReference);
    return escaped.replace(FILTERED_TERM_PATTERN, (match) => {
        const hex = Buffer.from(match, 'utf8').toString('hex');
        return `${TOKEN_PREFIX}${hex}__`;
    });
};
exports.encodeFilteredText = encodeFilteredText;
const decodeFilteredText = (value) => value.replace(REFERENCE_PATTERN, (reference, hex) => {
    if (hex.length % 2 !== 0) {
        return reference;
    }
    const decoded = Buffer.from(hex, 'hex').toString('utf8');
    if (Buffer.from(decoded, 'utf8').toString('hex') !== hex.toLowerCase()) {
        return reference;
    }
    return decoded;
});
exports.decodeFilteredText = decodeFilteredText;
class PayloadKeyCollisionError extends Error {
}
const transformPayload = (value, transformText) => {
    if (typeof value === 'string') {
        return transformText(value);
    }
    if (Array.isArray(value)) {
        return value.map((item) => transformPayload(item, transformText));
    }
    if (value === null || typeof value !== 'object') {
        return value;
    }
    const record = value;
    const binaryContent = record.type === 'image' || record.type === 'audio';
    const transformedEntries = [];
    const transformedKeys = new Set();
    for (const [key, item] of Object.entries(record)) {
        const transformedKey = transformText(key);
        if (transformedKeys.has(transformedKey)) {
            throw new PayloadKeyCollisionError('Decoded payload contains duplicate object keys');
        }
        transformedKeys.add(transformedKey);
        transformedEntries.push([
            transformedKey,
            binaryContent && key === 'data'
                ? item
                : transformPayload(item, transformText),
        ]);
    }
    return Object.fromEntries(transformedEntries);
};
const transformMessage = (message, transformText) => {
    const transformed = { ...message };
    for (const key of ['params', 'result', 'error']) {
        if (key in transformed) {
            transformed[key] = transformPayload(transformed[key], transformText);
        }
    }
    return transformed;
};
const encodePayloadMessage = (message) => transformMessage(message, exports.encodeFilteredText);
exports.encodePayloadMessage = encodePayloadMessage;
const decodePayloadMessage = (message) => transformMessage(message, exports.decodeFilteredText);
exports.decodePayloadMessage = decodePayloadMessage;
class PayloadFilteringTransport {
    transport;
    inheritedCloseHandler;
    inheritedErrorHandler;
    closeHandler;
    errorHandler;
    messageHandler;
    constructor(transport) {
        this.transport = transport;
        this.inheritedCloseHandler = transport.onclose;
        this.inheritedErrorHandler = transport.onerror;
    }
    get sessionId() {
        return this.transport.sessionId;
    }
    get onclose() {
        return this.closeHandler;
    }
    set onclose(handler) {
        this.closeHandler = handler;
        this.transport.onclose =
            this.inheritedCloseHandler || handler
                ? () => {
                    this.inheritedCloseHandler?.();
                    handler?.();
                }
                : undefined;
    }
    get onerror() {
        return this.errorHandler;
    }
    set onerror(handler) {
        this.errorHandler = handler;
        this.transport.onerror =
            this.inheritedErrorHandler || handler
                ? (error) => {
                    this.inheritedErrorHandler?.(error);
                    handler?.(error);
                }
                : undefined;
    }
    get onmessage() {
        return this.messageHandler;
    }
    set onmessage(handler) {
        this.messageHandler = handler;
        this.transport.onmessage = handler
            ? (message, extra) => {
                let decoded;
                try {
                    decoded = (0, exports.decodePayloadMessage)(message);
                }
                catch (error) {
                    if (!(error instanceof PayloadKeyCollisionError)) {
                        throw error;
                    }
                    if ('method' in message && 'id' in message) {
                        void this.transport
                            .send({
                            jsonrpc: '2.0',
                            id: message.id,
                            error: { code: -32602, message: error.message },
                        }, { relatedRequestId: message.id })
                            .catch((sendError) => {
                            this.transport.onerror?.(sendError);
                        });
                    }
                    else {
                        this.transport.onerror?.(error);
                    }
                    return;
                }
                handler(decoded, extra);
            }
            : undefined;
    }
    start() {
        return this.transport.start();
    }
    send(message, options) {
        return this.transport.send((0, exports.encodePayloadMessage)(message), options);
    }
    close() {
        return this.transport.close();
    }
    setProtocolVersion(version) {
        this.transport.setProtocolVersion?.(version);
    }
}
exports.PayloadFilteringTransport = PayloadFilteringTransport;
//# sourceMappingURL=payload-filter.js.map