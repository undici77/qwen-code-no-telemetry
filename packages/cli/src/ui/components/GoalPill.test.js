import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { act } from '@testing-library/react';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigContext } from '../contexts/ConfigContext.js';
import { GoalPill, useFooterGoalState, } from './GoalPill.js';
const NOW = 10_000;
function snapshot(status, activity = 'idle', overrides = {}) {
    return {
        v: 2,
        activity,
        goal: {
            goalId: 'goal-1',
            revision: 1,
            objective: 'finish the refactor',
            status,
            evidenceCursor: { recordId: null },
            turnCount: 3,
            activeTimeMs: 2_000,
            createdAt: 1_000,
            updatedAt: 7_000,
            ...overrides,
        },
    };
}
const noGoalSnapshot = {
    v: 2,
    activity: 'idle',
    goal: null,
};
function renderPill(props) {
    return render(_jsx(GoalPill, { ...props }));
}
function createRuntime(initial) {
    let current = initial;
    const listeners = new Set();
    const unsubscribe = vi.fn();
    const runtime = {
        getSnapshot: () => structuredClone(current),
        subscribe: (listener) => {
            listeners.add(listener);
            return () => {
                unsubscribe();
                listeners.delete(listener);
            };
        },
    };
    return {
        runtime,
        unsubscribe,
        emit(next) {
            current = next;
            for (const listener of listeners)
                listener(structuredClone(next));
        },
    };
}
const GoalProbe = () => {
    const goalState = useFooterGoalState();
    return goalState ? _jsx(GoalPill, { snapshot: goalState }) : _jsx(Text, {});
};
describe('GoalPill', () => {
    afterEach(() => {
        vi.useRealTimers();
    });
    it.each([
        ['no goal', noGoalSnapshot, ''],
        ['active and idle', snapshot('active', 'idle'), '◎\uFE0E /goal active'],
        [
            'active and running',
            snapshot('active', 'running'),
            '◎\uFE0E /goal active',
        ],
        [
            'active and verifying',
            snapshot('active', 'verifying'),
            '○\uFE0E /goal checking',
        ],
        ['paused', snapshot('paused'), '! /goal paused'],
        ['blocked', snapshot('blocked'), '✖\uFE0E /goal blocked'],
        ['usage limited', snapshot('usage_limited'), '! /goal usage limited'],
        ['complete', snapshot('complete'), ''],
    ])('renders accessible lifecycle text for %s', (_name, value, expected) => {
        vi.setSystemTime(NOW);
        const { lastFrame, unmount } = renderPill({ snapshot: value });
        if (expected) {
            expect(lastFrame()).toContain(expected);
            expect(lastFrame()).not.toContain('finish the refactor');
            expect(lastFrame()).not.toContain('turn');
        }
        else {
            expect(lastFrame()).toBe('');
        }
        // Active snapshots start a real elapsed-time interval; unmount clears it.
        unmount();
    });
    it('adds the current active span to persisted active time', () => {
        vi.setSystemTime(NOW);
        const { lastFrame, unmount } = renderPill({
            snapshot: snapshot('active', 'running'),
        });
        expect(lastFrame()).toContain('(5s)');
        unmount();
    });
    it('keeps paused elapsed time frozen while wall clock advances', () => {
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
        const paused = snapshot('paused');
        const { lastFrame, rerender } = renderPill({ snapshot: paused });
        expect(lastFrame()).toContain('(2s)');
        act(() => {
            vi.advanceTimersByTime(60_000);
        });
        rerender(_jsx(GoalPill, { snapshot: paused }));
        expect(lastFrame()).toContain('(2s)');
        expect(lastFrame()).not.toContain('1m');
    });
    it('subscribes once and re-subscribes when Config changes sessions', () => {
        const first = createRuntime(snapshot('active', 'running'));
        const second = createRuntime(snapshot('paused'));
        let sessionId = 'session-1';
        let runtime = first.runtime;
        const config = {
            getSessionId: () => sessionId,
            getGoalRuntime: () => runtime,
        };
        const tree = () => (_jsx(ConfigContext.Provider, { value: config, children: _jsx(GoalProbe, {}) }));
        const { lastFrame, rerender, unmount } = render(tree());
        expect(lastFrame()).toContain('/goal active');
        act(() => first.emit(snapshot('active', 'verifying')));
        expect(lastFrame()).toContain('/goal checking');
        sessionId = 'session-2';
        runtime = second.runtime;
        rerender(tree());
        expect(first.unsubscribe).toHaveBeenCalledOnce();
        expect(lastFrame()).toContain('/goal paused');
        act(() => first.emit(snapshot('blocked')));
        expect(lastFrame()).toContain('/goal paused');
        unmount();
        expect(second.unsubscribe).toHaveBeenCalledOnce();
    });
});
//# sourceMappingURL=GoalPill.test.js.map