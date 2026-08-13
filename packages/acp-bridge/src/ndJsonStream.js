/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { createHash } from 'node:crypto';
import { inspect } from 'node:util';
export class NdJsonFrameTooLargeError extends Error {
    direction;
    limitBytes;
    observedBytes;
    code = 'ndjson_frame_too_large';
    constructor(direction, limitBytes, observedBytes) {
        super(`NDJSON ${direction} frame exceeds ${limitBytes} bytes ` +
            `(observed ${observedBytes} bytes)`);
        this.direction = direction;
        this.limitBytes = limitBytes;
        this.observedBytes = observedBytes;
        this.name = 'NdJsonFrameTooLargeError';
    }
}
export class NdJsonQueueLimitError extends Error {
    maxQueuedMessages;
    maxQueuedBytes;
    requiredBytes;
    availableBytes;
    code = 'ndjson_queue_limit_exceeded';
    constructor(maxQueuedMessages, maxQueuedBytes, requiredBytes, availableBytes) {
        super(`NDJSON decoded queue is full ` +
            `(required ${requiredBytes} bytes, available ${availableBytes} bytes)`);
        this.maxQueuedMessages = maxQueuedMessages;
        this.maxQueuedBytes = maxQueuedBytes;
        this.requiredBytes = requiredBytes;
        this.availableBytes = availableBytes;
        this.name = 'NdJsonQueueLimitError';
    }
}
export class NdJsonIncompleteFrameError extends Error {
    observedBytes;
    code = 'ndjson_incomplete_frame';
    constructor(observedBytes) {
        super(`NDJSON input ended with an incomplete ${observedBytes}-byte frame`);
        this.observedBytes = observedBytes;
        this.name = 'NdJsonIncompleteFrameError';
    }
}
export class NdJsonUnexpectedEofError extends Error {
    code = 'ndjson_unexpected_eof';
    constructor() {
        super('NDJSON input ended while the bounded transport was active');
        this.name = 'NdJsonUnexpectedEofError';
    }
}
export class NdJsonInvalidMessageError extends Error {
    code;
    observedBytes;
    constructor(code, observedBytes) {
        super(`NDJSON input contains an invalid ${observedBytes}-byte message`);
        this.code = code;
        this.observedBytes = observedBytes;
        this.name = 'NdJsonInvalidMessageError';
    }
}
const MAX_JSON_RPC_METHOD_BYTES = 1024;
const MAX_JSON_RPC_ID_BYTES = 256;
const MAX_JSON_RPC_ERROR_MESSAGE_BYTES = 1024;
const MAX_JSON_DEPTH = 64;
const MAX_JSON_NODES = 10_000;
const MAX_JSON_ARRAY_LENGTH = 4096;
export function ndJsonStream(output, input, hooks, limits, validateInboundMessage, fatalCleanEof = false) {
    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();
    if (limits)
        validateNdJsonStreamLimits(limits);
    const outboundRequests = limits
        ? new BoundedOutstandingRequestLedger(limits)
        : undefined;
    const inboundRequests = limits
        ? new BoundedInboundRequestLedger(limits)
        : undefined;
    const readable = limits
        ? createBoundedReadable(input, textDecoder, hooks, limits, outboundRequests, inboundRequests, validateInboundMessage, fatalCleanEof)
        : createLegacyReadable(input, textDecoder, hooks);
    const writable = new WritableStream({
        async write(message) {
            let writer;
            let expectedResponseId;
            try {
                const content = JSON.stringify(message);
                const payload = textEncoder.encode(content);
                const frameBytes = payload.byteLength + 1;
                if (limits && frameBytes > limits.maxFrameBytes) {
                    throw new NdJsonFrameTooLargeError('sent', limits.maxFrameBytes, frameBytes);
                }
                const frame = new Uint8Array(frameBytes);
                frame.set(payload);
                frame[payload.byteLength] = 0x0a;
                if (outboundRequests && isJsonRpcRequestMessage(message)) {
                    outboundRequests.admit(message.id, frameBytes);
                    expectedResponseId = message.id;
                }
                writer = output.getWriter();
                await writer.write(frame);
                inboundRequests?.release(message);
                callHook(hooks?.onMessageSent, payload.byteLength);
                callHook(hooks?.onMessageObserved, {
                    direction: 'sent',
                    bytes: payload.byteLength,
                    message,
                });
            }
            catch (error) {
                if (expectedResponseId !== undefined) {
                    outboundRequests?.discard(expectedResponseId);
                }
                if (limits)
                    callHook(hooks?.onTransportError, error);
                throw error;
            }
            finally {
                writer?.releaseLock();
            }
        },
    });
    return { readable, writable };
}
function createLegacyReadable(input, textDecoder, hooks) {
    return new ReadableStream({
        async start(controller) {
            const pending = [];
            const reader = input.getReader();
            try {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done)
                        break;
                    if (!value)
                        continue;
                    readLegacyChunk(value, pending, controller, textDecoder, hooks);
                }
            }
            finally {
                reader.releaseLock();
                controller.close();
            }
        },
    });
}
function createBoundedReadable(input, textDecoder, hooks, limits, outboundRequests, inboundRequests, validateInboundMessage, fatalCleanEof) {
    const pending = new BoundedFrameBuffer(limits.maxFrameBytes);
    const minimumQueueCharge = Math.ceil(limits.maxQueuedBytes / limits.maxQueuedMessages);
    let nextQueueCharge = minimumQueueCharge;
    let reader;
    let canceled = false;
    return new ReadableStream({
        start(controller) {
            reader = input.getReader();
            void pumpBoundedInput(reader, pending, controller, textDecoder, hooks, limits, outboundRequests, inboundRequests, validateInboundMessage, fatalCleanEof, minimumQueueCharge, (charge) => {
                nextQueueCharge = charge;
            }, () => canceled);
        },
        async cancel(reason) {
            canceled = true;
            pending.clear();
            if (reader)
                await cancelReader(reader, reason);
        },
    }, {
        highWaterMark: limits.maxQueuedBytes,
        size: () => nextQueueCharge,
    });
}
async function pumpBoundedInput(reader, pending, controller, textDecoder, hooks, limits, outboundRequests, inboundRequests, validateInboundMessage, fatalCleanEof, minimumQueueCharge, setNextQueueCharge, isCanceled) {
    try {
        while (true) {
            const result = await reader.read();
            if (result.done) {
                if (isCanceled())
                    return;
                if (pending.byteLength > 0) {
                    throw new NdJsonIncompleteFrameError(pending.byteLength);
                }
                if (fatalCleanEof)
                    throw new NdJsonUnexpectedEofError();
                controller.close();
                return;
            }
            if (!result.value)
                continue;
            readBoundedChunk(result.value, pending, controller, textDecoder, hooks, limits, outboundRequests, inboundRequests, validateInboundMessage, minimumQueueCharge, setNextQueueCharge);
        }
    }
    catch (error) {
        if (isCanceled())
            return;
        pending.clear();
        callHook(hooks?.onTransportError, error);
        await cancelReader(reader, error);
        // ACP SDK's receive loop closes in `finally` but does not catch a rejected
        // `reader.read()`. Report the typed cause through the lifecycle hook and
        // close here so a transport guard cannot become an unhandled rejection.
        if (!isCanceled())
            controller.close();
    }
    finally {
        pending.clear();
        outboundRequests.clear();
        inboundRequests.clear();
        reader.releaseLock();
    }
}
function readLegacyChunk(chunk, pending, controller, textDecoder, hooks) {
    let start = 0;
    let newline = chunk.indexOf(0x0a, start);
    while (newline !== -1) {
        const lineBytes = takeLegacyLineBytes(pending, chunk.subarray(start, newline));
        handleLegacyLine(lineBytes, controller, textDecoder, hooks);
        start = newline + 1;
        newline = chunk.indexOf(0x0a, start);
    }
    if (start < chunk.length) {
        pending.push(chunk.subarray(start));
    }
}
function readBoundedChunk(chunk, pending, controller, textDecoder, hooks, limits, outboundRequests, inboundRequests, validateInboundMessage, minimumQueueCharge, setNextQueueCharge) {
    let start = 0;
    let newline = chunk.indexOf(0x0a, start);
    while (newline !== -1) {
        const current = chunk.subarray(start, newline);
        const frameBytes = pending.byteLength + current.byteLength + 1;
        assertFrameSize('received', limits.maxFrameBytes, frameBytes);
        if (pending.isJsonWhitespaceLine(current)) {
            pending.clear();
            start = newline + 1;
            newline = chunk.indexOf(0x0a, start);
            continue;
        }
        const queueCharge = Math.max(frameBytes, minimumQueueCharge);
        const availableBytes = controller.desiredSize;
        if (availableBytes === null || queueCharge > availableBytes) {
            throw new NdJsonQueueLimitError(limits.maxQueuedMessages, limits.maxQueuedBytes, queueCharge, Math.max(0, availableBytes ?? 0));
        }
        setNextQueueCharge(queueCharge);
        handleBoundedLine(pending.take(current), controller, textDecoder, hooks, outboundRequests, inboundRequests, validateInboundMessage);
        start = newline + 1;
        newline = chunk.indexOf(0x0a, start);
    }
    if (start < chunk.length)
        pending.append(chunk.subarray(start));
}
function takeLegacyLineBytes(pending, current) {
    if (pending.length === 0)
        return current;
    const totalLength = pending.reduce((sum, part) => sum + part.byteLength, 0) +
        current.byteLength;
    const line = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of pending) {
        line.set(part, offset);
        offset += part.byteLength;
    }
    line.set(current, offset);
    pending.length = 0;
    return line;
}
function handleLegacyLine(lineBytes, controller, textDecoder, hooks) {
    const line = textDecoder.decode(lineBytes);
    const trimmedLine = line.trim();
    if (!trimmedLine)
        return;
    try {
        const message = JSON.parse(trimmedLine);
        controller.enqueue(message);
        reportReceivedMessage(lineBytes, message, hooks);
    }
    catch (err) {
        // eslint-disable-next-line no-console -- match ACP SDK parse-error behavior
        console.error('Failed to parse JSON message:', trimmedLine, err);
    }
}
function handleBoundedLine(lineBytes, controller, textDecoder, hooks, outboundRequests, inboundRequests, validateInboundMessage) {
    const line = textDecoder.decode(lineBytes);
    const trimmedLine = line.trim();
    if (!trimmedLine)
        return;
    let parsed;
    try {
        parsed = JSON.parse(trimmedLine);
    }
    catch {
        throw logBoundedInvalidMessage('ndjson_parse_error', lineBytes);
    }
    if (!isJsonRpcMessage(parsed)) {
        throw logBoundedInvalidMessage('ndjson_invalid_message', lineBytes);
    }
    const isResponse = isJsonRpcResponseMessage(parsed);
    if ((!isResponse && !hasBoundedJsonStructure(parsed)) ||
        (validateInboundMessage && !validateInboundMessage(parsed))) {
        throw logBoundedInvalidMessage('ndjson_invalid_message', lineBytes);
    }
    if (isJsonRpcResponseMessage(parsed) &&
        !outboundRequests?.consumeResponse(parsed.id)) {
        throw logBoundedInvalidMessage('ndjson_invalid_message', lineBytes);
    }
    inboundRequests?.admit(parsed, lineBytes.byteLength + 1);
    const message = installBoundedLogRedaction(parsed);
    controller.enqueue(message);
    reportReceivedMessage(lineBytes, message, hooks);
}
function installBoundedLogRedaction(message) {
    Object.defineProperty(message, inspect.custom, {
        configurable: false,
        enumerable: false,
        value: inspectBoundedJsonRpcMessage,
        writable: false,
    });
    return message;
}
function inspectBoundedJsonRpcMessage() {
    return {
        jsonrpc: '2.0',
        messageType: 'method' in this
            ? 'id' in this
                ? 'request'
                : 'notification'
            : 'response',
        payloadOmitted: true,
    };
}
function isJsonRpcMessage(value) {
    if (!isRecord(value) || value['jsonrpc'] !== '2.0')
        return false;
    const hasMethod = Object.hasOwn(value, 'method');
    const hasId = Object.hasOwn(value, 'id');
    if (hasMethod) {
        return (typeof value['method'] === 'string' &&
            Buffer.byteLength(value['method']) <= MAX_JSON_RPC_METHOD_BYTES &&
            (!hasId || isJsonRpcId(value['id'])));
    }
    if (!hasId || !isJsonRpcId(value['id']))
        return false;
    const hasResult = Object.hasOwn(value, 'result');
    const hasError = Object.hasOwn(value, 'error');
    if (hasResult === hasError)
        return false;
    if (!hasError)
        return true;
    const error = value['error'];
    return (isRecord(error) &&
        typeof error['code'] === 'number' &&
        Number.isFinite(error['code']) &&
        typeof error['message'] === 'string' &&
        Buffer.byteLength(error['message']) <= MAX_JSON_RPC_ERROR_MESSAGE_BYTES);
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function hasBoundedJsonStructure(value) {
    const stack = [{ value, depth: 1 }];
    let nodes = 0;
    while (stack.length > 0) {
        const current = stack.pop();
        nodes++;
        if (nodes > MAX_JSON_NODES || current.depth > MAX_JSON_DEPTH)
            return false;
        if (Array.isArray(current.value)) {
            if (current.value.length > MAX_JSON_ARRAY_LENGTH)
                return false;
            for (let index = current.value.length - 1; index >= 0; index--) {
                if (nodes + stack.length >= MAX_JSON_NODES ||
                    current.depth + 1 > MAX_JSON_DEPTH) {
                    return false;
                }
                stack.push({
                    value: current.value[index],
                    depth: current.depth + 1,
                });
            }
        }
        else if (isRecord(current.value)) {
            for (const key in current.value) {
                if (!Object.hasOwn(current.value, key))
                    continue;
                if (nodes + stack.length >= MAX_JSON_NODES ||
                    current.depth + 1 > MAX_JSON_DEPTH) {
                    return false;
                }
                stack.push({
                    value: current.value[key],
                    depth: current.depth + 1,
                });
            }
        }
    }
    return true;
}
function isJsonRpcId(value) {
    return (value === null ||
        (typeof value === 'string' &&
            Buffer.byteLength(value) <= MAX_JSON_RPC_ID_BYTES) ||
        (typeof value === 'number' && Number.isFinite(value)));
}
function isJsonRpcRequestMessage(value) {
    return ('method' in value &&
        'id' in value &&
        typeof value.method === 'string' &&
        isJsonRpcId(value.id));
}
function isJsonRpcResponseMessage(value) {
    return !('method' in value) && 'id' in value;
}
class BoundedInboundRequestLedger {
    limits;
    requests = new Map();
    retainedBytes = 0;
    constructor(limits) {
        this.limits = limits;
    }
    admit(message, frameBytes) {
        if (!isJsonRpcRequestMessage(message))
            return;
        const availableBytes = Math.max(0, this.limits.maxQueuedBytes - this.retainedBytes);
        if (this.requests.has(message.id) ||
            this.requests.size >= this.limits.maxQueuedMessages ||
            frameBytes > availableBytes) {
            throw new NdJsonQueueLimitError(this.limits.maxQueuedMessages, this.limits.maxQueuedBytes, frameBytes, this.requests.has(message.id) ? 0 : availableBytes);
        }
        this.requests.set(message.id, frameBytes);
        this.retainedBytes += frameBytes;
    }
    release(message) {
        if (!isJsonRpcResponseMessage(message))
            return;
        const frameBytes = this.requests.get(message.id);
        if (frameBytes === undefined)
            return;
        this.requests.delete(message.id);
        this.retainedBytes -= frameBytes;
    }
    clear() {
        this.requests.clear();
        this.retainedBytes = 0;
    }
}
class BoundedOutstandingRequestLedger {
    limits;
    requests = new Map();
    retainedBytes = 0;
    constructor(limits) {
        this.limits = limits;
    }
    admit(id, frameBytes) {
        const availableBytes = Math.max(0, this.limits.maxQueuedBytes - this.retainedBytes);
        if (this.requests.has(id) ||
            this.requests.size >= this.limits.maxQueuedMessages ||
            frameBytes > availableBytes) {
            throw new NdJsonQueueLimitError(this.limits.maxQueuedMessages, this.limits.maxQueuedBytes, frameBytes, this.requests.has(id) ? 0 : availableBytes);
        }
        this.requests.set(id, frameBytes);
        this.retainedBytes += frameBytes;
    }
    consumeResponse(id) {
        return this.discard(id);
    }
    discard(id) {
        const frameBytes = this.requests.get(id);
        if (frameBytes === undefined)
            return false;
        this.requests.delete(id);
        this.retainedBytes -= frameBytes;
        return true;
    }
    clear() {
        this.requests.clear();
        this.retainedBytes = 0;
    }
}
function logBoundedInvalidMessage(errorKind, lineBytes) {
    const bytes = jsonPayloadByteLength(lineBytes);
    const digest = createHash('sha256')
        .update(lineBytes.subarray(0, bytes))
        .digest('hex');
    // eslint-disable-next-line no-console -- bounded metadata only
    console.error('Failed to parse JSON message:', {
        errorKind,
        bytes,
        sha256: digest,
        payloadOmitted: true,
    });
    return new NdJsonInvalidMessageError(errorKind, bytes);
}
function reportReceivedMessage(lineBytes, message, hooks) {
    const bytes = jsonPayloadByteLength(lineBytes);
    callHook(hooks?.onMessageReceived, bytes);
    callHook(hooks?.onMessageObserved, {
        direction: 'received',
        bytes,
        message,
    });
}
function jsonPayloadByteLength(lineBytes) {
    return lineBytes[lineBytes.byteLength - 1] === 0x0d
        ? lineBytes.byteLength - 1
        : lineBytes.byteLength;
}
export function validateNdJsonStreamLimits(limits) {
    const values = [
        ['maxFrameBytes', limits.maxFrameBytes],
        ['maxQueuedMessages', limits.maxQueuedMessages],
        ['maxQueuedBytes', limits.maxQueuedBytes],
    ];
    for (const [name, value] of values) {
        if (!Number.isSafeInteger(value) || value <= 0) {
            throw new RangeError(`${name} must be a positive safe integer`);
        }
    }
}
function assertFrameSize(direction, limitBytes, observedBytes) {
    if (observedBytes > limitBytes) {
        throw new NdJsonFrameTooLargeError(direction, limitBytes, observedBytes);
    }
}
async function cancelReader(reader, reason) {
    try {
        await reader.cancel(reason);
    }
    catch {
        /* preserve the transport error that caused cancellation */
    }
}
function callHook(hook, value) {
    try {
        hook?.(value);
    }
    catch {
        /* metrics and lifecycle hooks must not break the transport */
    }
}
class BoundedFrameBuffer {
    maxFrameBytes;
    buffer;
    length = 0;
    constructor(maxFrameBytes) {
        this.maxFrameBytes = maxFrameBytes;
    }
    get byteLength() {
        return this.length;
    }
    append(bytes) {
        const requiredBytes = this.length + bytes.byteLength;
        assertFrameSize('received', this.maxFrameBytes, requiredBytes);
        if (requiredBytes === 0)
            return;
        if (!this.buffer || this.buffer.byteLength < requiredBytes) {
            const doubledCapacity = Math.min(this.maxFrameBytes, Math.max(1024, (this.buffer?.byteLength ?? 0) * 2));
            const next = new Uint8Array(Math.max(requiredBytes, doubledCapacity));
            if (this.buffer)
                next.set(this.buffer.subarray(0, this.length));
            this.buffer = next;
        }
        this.buffer.set(bytes, this.length);
        this.length = requiredBytes;
    }
    take(current) {
        if (this.length === 0)
            return current;
        const line = new Uint8Array(this.length + current.byteLength);
        line.set(this.buffer.subarray(0, this.length));
        line.set(current, this.length);
        this.clear();
        return line;
    }
    isJsonWhitespaceLine(current) {
        if (this.buffer) {
            for (let index = 0; index < this.length; index++) {
                if (!isJsonWhitespaceByte(this.buffer[index]))
                    return false;
            }
        }
        for (const byte of current) {
            if (!isJsonWhitespaceByte(byte))
                return false;
        }
        return true;
    }
    clear() {
        this.buffer = undefined;
        this.length = 0;
    }
}
function isJsonWhitespaceByte(byte) {
    return byte === 0x20 || byte === 0x09 || byte === 0x0d;
}
//# sourceMappingURL=ndJsonStream.js.map