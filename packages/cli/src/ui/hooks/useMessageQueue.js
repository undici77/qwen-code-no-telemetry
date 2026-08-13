/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { randomUUID } from 'node:crypto';
import { useCallback, useRef, useState } from 'react';
import { isSlashCommand } from '../utils/commandUtils.js';
export const GOAL_COMMAND_RE = /^\/goal(?:\s|$)/;
function aggregateUserMessages(messages) {
    const text = messages.map((message) => message.text).join('\n\n');
    const submittedPrompts = messages.map((message) => message.submittedPrompt);
    return {
        kind: 'user',
        modelText: text,
        turnKey: messages[0].key,
        ...(submittedPrompts.every((submittedPrompt) => submittedPrompt !== undefined)
            ? { submittedPrompt: submittedPrompts.join('\n\n') }
            : {}),
    };
}
export function useMessageQueue() {
    const [queuedMessages, setQueuedMessages] = useState([]);
    const [queuedGoalTurns, setQueuedGoalTurns] = useState([]);
    const queueRef = useRef([]);
    const goalQueueRef = useRef([]);
    const nextMessageKey = useCallback(() => `message-queue:${randomUUID()}`, []);
    const addMessage = useCallback((message, deferUntilIdle = false, submittedPrompt) => {
        const text = message.trim();
        if (!text)
            return;
        queueRef.current = [
            ...queueRef.current,
            {
                key: nextMessageKey(),
                text,
                deferUntilIdle,
                submittedPrompt,
            },
        ];
        setQueuedMessages(queueRef.current);
    }, [nextMessageKey]);
    const enqueueGoalTurn = useCallback((input) => {
        if (goalQueueRef.current.some(({ permit }) => permit.turnId === input.permit.turnId)) {
            return;
        }
        const entry = {
            kind: 'goal',
            permit: { ...input.permit },
            turnKey: `goal-runtime:${input.permit.turnId}`,
            continuationContext: input.continuationContext,
            ...(input.verifierFeedback
                ? { verifierFeedback: input.verifierFeedback }
                : {}),
        };
        goalQueueRef.current = [...goalQueueRef.current, entry];
        setQueuedGoalTurns(goalQueueRef.current);
    }, []);
    const peekNextUserBatchKey = useCallback((goalTurnActive = false) => goalTurnActive
        ? undefined
        : queueRef.current.find(({ text }) => !isSlashCommand(text))?.key, []);
    const hasQueuedUserMessages = useCallback(() => queueRef.current.length > 0, []);
    const getPendingSubmissionCount = useCallback(() => queueRef.current.length + goalQueueRef.current.length, []);
    const claimGoalTurn = useCallback(() => {
        const [goal, ...remainingGoals] = goalQueueRef.current;
        if (goal) {
            goalQueueRef.current = remainingGoals;
            setQueuedGoalTurns(remainingGoals);
        }
        return goal;
    }, []);
    const claimDirectUserAdmission = useCallback(() => {
        const goal = claimGoalTurn();
        return {
            turnKey: nextMessageKey(),
            ...(goal ? { goal } : {}),
        };
    }, [claimGoalTurn, nextMessageKey]);
    const removeGoalTurns = useCallback(() => {
        const keys = goalQueueRef.current.map(({ turnKey }) => turnKey);
        if (keys.length === 0)
            return [];
        goalQueueRef.current = [];
        setQueuedGoalTurns([]);
        return keys;
    }, []);
    const popNextSubmission = useCallback((goalControlMode = 'normal') => {
        if (goalControlMode !== 'normal') {
            const goalCommandIndex = queueRef.current.findIndex(({ text }) => GOAL_COMMAND_RE.test(text));
            if (goalCommandIndex >= 0) {
                const goalCommand = queueRef.current[goalCommandIndex];
                queueRef.current = [
                    ...queueRef.current.slice(0, goalCommandIndex),
                    ...queueRef.current.slice(goalCommandIndex + 1),
                ];
                setQueuedMessages(queueRef.current);
                return aggregateUserMessages([goalCommand]);
            }
            if (goalControlMode === 'priority') {
                return claimGoalTurn() ?? null;
            }
            if (goalControlMode === 'only')
                return null;
        }
        const plainMessages = queueRef.current.filter(({ text }) => !isSlashCommand(text));
        if (plainMessages.length > 0) {
            queueRef.current = queueRef.current.filter(({ text }) => isSlashCommand(text));
            setQueuedMessages(queueRef.current);
            return aggregateUserMessages(plainMessages);
        }
        const [userHead, ...userRest] = queueRef.current;
        if (userHead) {
            queueRef.current = userRest;
            setQueuedMessages(userRest);
            return aggregateUserMessages([userHead]);
        }
        return claimGoalTurn() ?? null;
    }, [claimGoalTurn]);
    const clearQueue = useCallback(() => {
        queueRef.current = [];
        setQueuedMessages([]);
    }, []);
    const getQueuedMessagesText = useCallback(() => {
        if (queuedMessages.length === 0)
            return '';
        return queuedMessages.map(({ text }) => text).join('\n\n');
    }, [queuedMessages]);
    const popAllMessages = useCallback((onRemoved) => {
        const current = queueRef.current;
        if (current.length === 0)
            return null;
        queueRef.current = [];
        setQueuedMessages([]);
        onRemoved?.(current.map(({ key }) => key));
        return aggregateUserMessages(current);
    }, []);
    const restoreMessages = useCallback((messages, submittedPrompt) => {
        const restored = messages
            .map((text) => text.trim())
            .filter(Boolean)
            .map((text) => ({
            key: nextMessageKey(),
            text,
            ...(messages.length === 1 && submittedPrompt !== undefined
                ? { submittedPrompt }
                : {}),
            deferUntilIdle: false,
        }));
        if (restored.length === 0)
            return;
        queueRef.current = [...restored, ...queueRef.current];
        setQueuedMessages(queueRef.current);
    }, [nextMessageKey]);
    const drainQueue = useCallback((includeDeferred = false, goalTurnActive = false) => {
        const current = queueRef.current;
        if (current.length === 0)
            return [];
        const shouldDrain = (message) => (goalTurnActive
            ? GOAL_COMMAND_RE.test(message.text)
            : !isSlashCommand(message.text)) &&
            (includeDeferred || !message.deferUntilIdle);
        const drained = current.filter(shouldDrain);
        if (drained.length === 0)
            return [];
        const rest = current.filter((message) => !shouldDrain(message));
        queueRef.current = rest;
        setQueuedMessages(rest);
        return drained.map(({ text }) => text);
    }, []);
    return {
        messageQueue: queuedMessages.map(({ text }) => text),
        pendingSubmissionCount: queuedMessages.length + queuedGoalTurns.length,
        addMessage,
        enqueueGoalTurn,
        peekNextUserBatchKey,
        hasQueuedUserMessages,
        getPendingSubmissionCount,
        claimGoalTurn,
        claimDirectUserAdmission,
        removeGoalTurns,
        popNextSubmission,
        clearQueue,
        getQueuedMessagesText,
        popAllMessages,
        restoreMessages,
        drainQueue,
    };
}
//# sourceMappingURL=useMessageQueue.js.map