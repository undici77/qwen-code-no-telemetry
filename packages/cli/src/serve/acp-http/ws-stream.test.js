/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'node:events';
import { WsStream } from './ws-stream.js';
// Minimal WebSocket mock that implements the surface WsStream uses.
class MockWebSocket extends EventEmitter {
    OPEN = 1;
    readyState = 1; // OPEN
    sent = [];
    pinged = 0;
    closed = false;
    closeCode;
    send(data, cb) {
        this.sent.push(data);
        cb?.();
    }
    ping() {
        this.pinged++;
    }
    close(code) {
        this.closed = true;
        this.closeCode = code;
    }
}
describe('WsStream', () => {
    let ws;
    beforeEach(() => {
        ws = new MockWebSocket();
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    it('send() serializes message as JSON and delivers via ws.send', async () => {
        const stream = new WsStream(ws);
        await stream.send({ hello: 'world' });
        expect(ws.sent).toEqual(['{"hello":"world"}']);
        stream.close();
    });
    it('send() ignores the bus event id — no SSE `id:` framing on the WS wire', async () => {
        // WsStream.send accepts `id` only for TransportStream parity; WebSocket is
        // stateful and has no Last-Event-ID replay. The wire payload must be the
        // bare JSON message — if a refactor ever let the id leak into the frame it
        // would corrupt the WS protocol with SSE-specific framing.
        const stream = new WsStream(ws);
        await stream.send({ data: 1 }, 42);
        expect(ws.sent).toEqual(['{"data":1}']);
        expect(ws.sent[0]).not.toContain('id:');
        expect(ws.sent[0]).not.toContain('42');
        stream.close();
    });
    it('send() serializes writes sequentially (no interleaving)', async () => {
        const stream = new WsStream(ws);
        const p1 = stream.send({ seq: 1 });
        const p2 = stream.send({ seq: 2 });
        await Promise.all([p1, p2]);
        expect(ws.sent).toEqual(['{"seq":1}', '{"seq":2}']);
        stream.close();
    });
    it('send() resolves even after close (no hang)', async () => {
        const stream = new WsStream(ws);
        stream.close();
        // Should not hang or throw
        await stream.send({ after: 'close' });
        // Message not delivered (closed)
        expect(ws.sent).toEqual([]);
    });
    it('isClosed starts false, becomes true after close()', () => {
        const stream = new WsStream(ws);
        expect(stream.isClosed).toBe(false);
        stream.close();
        expect(stream.isClosed).toBe(true);
    });
    it('close() is idempotent', () => {
        const onClose = vi.fn();
        const stream = new WsStream(ws, onClose);
        stream.close();
        stream.close();
        stream.close();
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(ws.closeCode).toBe(1000);
    });
    it('close() calls onClose callback', () => {
        const onClose = vi.fn();
        const stream = new WsStream(ws, onClose);
        stream.close();
        expect(onClose).toHaveBeenCalledTimes(1);
    });
    it('close() does not call ws.close if not OPEN', () => {
        ws.readyState = 3; // CLOSED
        const stream = new WsStream(ws);
        stream.close();
        expect(ws.closed).toBe(false);
    });
    it('ws "close" event triggers stream close', () => {
        const onClose = vi.fn();
        void new WsStream(ws, onClose);
        ws.emit('close');
        expect(onClose).toHaveBeenCalledTimes(1);
    });
    it('ws "error" event triggers stream close', () => {
        const onClose = vi.fn();
        void new WsStream(ws, onClose);
        ws.emit('error', new Error('test error'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
    it('heartbeat sends ping every 15s and calls onHeartbeat', () => {
        const onHeartbeat = vi.fn();
        const _stream = new WsStream(ws, undefined, onHeartbeat);
        expect(ws.pinged).toBe(0);
        vi.advanceTimersByTime(15_000);
        expect(ws.pinged).toBe(1);
        expect(onHeartbeat).toHaveBeenCalledTimes(1);
        // Simulate pong to keep alive for next tick
        ws.emit('pong');
        vi.advanceTimersByTime(15_000);
        expect(ws.pinged).toBe(2);
        _stream.close();
    });
    it('heartbeat stops after close', () => {
        const stream = new WsStream(ws);
        stream.close();
        vi.advanceTimersByTime(30_000);
        expect(ws.pinged).toBe(0);
    });
    it('dead connection detected via ping/pong (no pong → close)', () => {
        const onClose = vi.fn();
        void new WsStream(ws, onClose);
        // First tick: ping sent, alive flag set to false
        vi.advanceTimersByTime(15_000);
        expect(ws.pinged).toBe(1);
        // No pong received → second tick closes
        vi.advanceTimersByTime(15_000);
        expect(onClose).toHaveBeenCalled();
    });
    it('pong keeps connection alive', () => {
        const onClose = vi.fn();
        const _stream = new WsStream(ws, onClose);
        vi.advanceTimersByTime(15_000);
        expect(ws.pinged).toBe(1);
        // Simulate pong
        ws.emit('pong');
        vi.advanceTimersByTime(15_000);
        // Should NOT close — pong was received
        expect(onClose).not.toHaveBeenCalled();
        expect(ws.pinged).toBe(2);
        _stream.close();
    });
    it('send() failure closes stream', async () => {
        const onClose = vi.fn();
        ws.send = (_data, cb) => {
            cb?.(new Error('write failed'));
        };
        const stream = new WsStream(ws, onClose);
        await stream.send({ fail: true });
        expect(onClose).toHaveBeenCalled();
        expect(stream.isClosed).toBe(true);
    });
});
//# sourceMappingURL=ws-stream.test.js.map