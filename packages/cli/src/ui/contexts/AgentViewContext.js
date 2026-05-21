import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview AgentViewContext — React context for in-process agent view switching.
 *
 * Tracks which view is active (main or an agent tab) and the set of registered
 * AgentInteractive instances. Consumed by AgentTabBar, AgentChatView, and
 * DefaultAppLayout to implement tab-based agent navigation.
 *
 * Kept separate from UIStateContext to avoid bloating the main state with
 * in-process-only concerns and to make the feature self-contained.
 */
import { createContext, useContext, useCallback, useMemo, useState, } from 'react';
import {} from '@qwen-code/qwen-code-core';
import { useArenaInProcess } from '../hooks/useArenaInProcess.js';
// ─── Context ────────────────────────────────────────────────
const AgentViewStateContext = createContext(null);
const AgentViewActionsContext = createContext(null);
// ─── Defaults (used when no provider is mounted) ────────────
const DEFAULT_STATE = {
    activeView: 'main',
    agents: new Map(),
    agentShellFocused: false,
    agentInputBufferText: '',
    agentTabBarFocused: false,
    agentApprovalModes: new Map(),
};
const noop = () => { };
const DEFAULT_ACTIONS = {
    switchToMain: noop,
    switchToAgent: noop,
    switchToNext: noop,
    switchToPrevious: noop,
    registerAgent: noop,
    unregisterAgent: noop,
    unregisterAll: noop,
    setAgentShellFocused: noop,
    setAgentInputBufferText: noop,
    setAgentTabBarFocused: noop,
    setAgentApprovalMode: noop,
};
// ─── Hook: useAgentViewState ────────────────────────────────
export function useAgentViewState() {
    return useContext(AgentViewStateContext) ?? DEFAULT_STATE;
}
// ─── Hook: useAgentViewActions ──────────────────────────────
export function useAgentViewActions() {
    return useContext(AgentViewActionsContext) ?? DEFAULT_ACTIONS;
}
export function AgentViewProvider({ config, children, }) {
    const [activeView, setActiveView] = useState('main');
    const [agents, setAgents] = useState(() => new Map());
    const [agentShellFocused, setAgentShellFocused] = useState(false);
    const [agentInputBufferText, setAgentInputBufferText] = useState('');
    const [agentTabBarFocused, setAgentTabBarFocused] = useState(false);
    const [agentApprovalModes, setAgentApprovalModes] = useState(() => new Map());
    // ── Navigation ──
    const switchToMain = useCallback(() => {
        setActiveView('main');
        setAgentTabBarFocused(false);
    }, []);
    const switchToAgent = useCallback((agentId) => {
        if (agents.has(agentId)) {
            setActiveView(agentId);
        }
    }, [agents]);
    const switchToNext = useCallback(() => {
        const ids = ['main', ...agents.keys()];
        const currentIndex = ids.indexOf(activeView);
        const nextIndex = (currentIndex + 1) % ids.length;
        setActiveView(ids[nextIndex]);
    }, [agents, activeView]);
    const switchToPrevious = useCallback(() => {
        const ids = ['main', ...agents.keys()];
        const currentIndex = ids.indexOf(activeView);
        const prevIndex = (currentIndex - 1 + ids.length) % ids.length;
        setActiveView(ids[prevIndex]);
    }, [agents, activeView]);
    // ── Registration ──
    const registerAgent = useCallback((agentId, interactiveAgent, modelId, color, modelName) => {
        setAgents((prev) => {
            const next = new Map(prev);
            next.set(agentId, {
                interactiveAgent,
                modelId,
                color,
                modelName,
            });
            return next;
        });
        // Seed approval mode from the agent's own config
        const mode = interactiveAgent.getCore().runtimeContext.getApprovalMode();
        setAgentApprovalModes((prev) => {
            const next = new Map(prev);
            next.set(agentId, mode);
            return next;
        });
    }, []);
    const unregisterAgent = useCallback((agentId) => {
        setAgents((prev) => {
            if (!prev.has(agentId))
                return prev;
            const next = new Map(prev);
            next.delete(agentId);
            return next;
        });
        setAgentApprovalModes((prev) => {
            if (!prev.has(agentId))
                return prev;
            const next = new Map(prev);
            next.delete(agentId);
            return next;
        });
        setActiveView((current) => (current === agentId ? 'main' : current));
    }, []);
    const unregisterAll = useCallback(() => {
        setAgents(new Map());
        setAgentApprovalModes(new Map());
        setActiveView('main');
        setAgentTabBarFocused(false);
    }, []);
    const setAgentApprovalMode = useCallback((agentId, mode) => {
        // Update the agent's runtime config so tool scheduling picks it up
        const agent = agents.get(agentId);
        if (agent) {
            agent.interactiveAgent.getCore().runtimeContext.setApprovalMode(mode);
        }
        // Update UI state
        setAgentApprovalModes((prev) => {
            const next = new Map(prev);
            next.set(agentId, mode);
            return next;
        });
    }, [agents]);
    // ── Memoized values ──
    const state = useMemo(() => ({
        activeView,
        agents,
        agentShellFocused,
        agentInputBufferText,
        agentTabBarFocused,
        agentApprovalModes,
    }), [
        activeView,
        agents,
        agentShellFocused,
        agentInputBufferText,
        agentTabBarFocused,
        agentApprovalModes,
    ]);
    const actions = useMemo(() => ({
        switchToMain,
        switchToAgent,
        switchToNext,
        switchToPrevious,
        registerAgent,
        unregisterAgent,
        unregisterAll,
        setAgentShellFocused,
        setAgentInputBufferText,
        setAgentTabBarFocused,
        setAgentApprovalMode,
    }), [
        switchToMain,
        switchToAgent,
        switchToNext,
        switchToPrevious,
        registerAgent,
        unregisterAgent,
        unregisterAll,
        setAgentShellFocused,
        setAgentInputBufferText,
        setAgentTabBarFocused,
        setAgentApprovalMode,
    ]);
    // ── Arena in-process bridge ──
    // Bridge arena manager events to agent registration. The hook is kept
    // in its own file for separation of concerns; it's called here so the
    // provider is the single owner of agent tab lifecycle.
    useArenaInProcess(config ?? null, actions);
    return (_jsx(AgentViewStateContext.Provider, { value: state, children: _jsx(AgentViewActionsContext.Provider, { value: actions, children: children }) }));
}
//# sourceMappingURL=AgentViewContext.js.map