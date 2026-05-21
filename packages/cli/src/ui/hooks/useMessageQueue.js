/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useRef, useState } from 'react';
import { isSlashCommand } from '../utils/commandUtils.js';
export function useMessageQueue() {
    const [messageQueue, setMessageQueue] = useState([]);
    // Synchronous mirror so non-React callbacks see the latest queue.
    const queueRef = useRef([]);
    const addMessage = useCallback((message) => {
        const trimmedMessage = message.trim();
        if (trimmedMessage.length > 0) {
            queueRef.current = [...queueRef.current, trimmedMessage];
            setMessageQueue(queueRef.current);
        }
    }, []);
    const clearQueue = useCallback(() => {
        queueRef.current = [];
        setMessageQueue([]);
    }, []);
    const getQueuedMessagesText = useCallback(() => {
        if (messageQueue.length === 0)
            return '';
        return messageQueue.join('\n\n');
    }, [messageQueue]);
    const popAllMessages = useCallback(() => {
        const current = queueRef.current;
        if (current.length === 0)
            return null;
        queueRef.current = [];
        setMessageQueue([]);
        return current.join('\n\n');
    }, []);
    const drainQueue = useCallback(() => {
        const current = queueRef.current;
        if (current.length === 0)
            return [];
        const drained = current.filter((message) => !isSlashCommand(message));
        if (drained.length === 0)
            return [];
        const rest = current.filter((message) => isSlashCommand(message));
        queueRef.current = rest;
        setMessageQueue(rest);
        return drained;
    }, []);
    const popNextSegment = useCallback(() => {
        const current = queueRef.current;
        if (current.length === 0)
            return null;
        const [head, ...rest] = current;
        queueRef.current = rest;
        setMessageQueue(rest);
        return head;
    }, []);
    return {
        messageQueue,
        addMessage,
        clearQueue,
        getQueuedMessagesText,
        popAllMessages,
        drainQueue,
        popNextSegment,
    };
}
//# sourceMappingURL=useMessageQueue.js.map