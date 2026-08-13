import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import { actions } from './definitions';
import { isMac } from '@/lib/platform';
import { getKeybindingContext, evaluateWhen } from './keybinding-context';
const ActionRegistryContext = createContext(null);
export function ActionRegistryProvider({ children }) {
    const handlersRef = useRef(new Map());
    const userOverrides = useRef(new Map());
    // Register a handler
    const register = useCallback((handler) => {
        const handlers = handlersRef.current.get(handler.actionId) || [];
        handlers.push(handler);
        handlersRef.current.set(handler.actionId, handlers);
        // Return cleanup function
        return () => {
            const handlers = handlersRef.current.get(handler.actionId) || [];
            const index = handlers.indexOf(handler);
            if (index > -1)
                handlers.splice(index, 1);
        };
    }, []);
    // Execute an action
    const execute = useCallback((actionId) => {
        const handlers = handlersRef.current.get(actionId) || [];
        for (const handler of handlers) {
            if (!handler.enabled || handler.enabled()) {
                handler.handler();
                break; // Only execute first enabled handler
            }
        }
    }, []);
    // Get hotkey for action
    const getHotkey = useCallback((actionId) => {
        // Check user overrides first
        if (userOverrides.current.has(actionId)) {
            return userOverrides.current.get(actionId) ?? null;
        }
        return actions[actionId].defaultHotkey;
    }, []);
    // Get display string
    const getHotkeyDisplay = useCallback((actionId) => {
        const hotkey = getHotkey(actionId);
        if (!hotkey)
            return null;
        return formatHotkeyDisplay(hotkey);
    }, [getHotkey]);
    // Get action definition
    const getAction = useCallback((actionId) => {
        return actions[actionId];
    }, []);
    // Set up global hotkey listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Build context snapshot from DOM state at event time
            const context = getKeybindingContext(e);
            // Check all actions for matching hotkey
            for (const [actionId, action] of Object.entries(actions)) {
                const hotkey = getHotkey(actionId);
                if (!hotkey || !matchesHotkey(e, hotkey))
                    continue;
                // Evaluate when-clause against current context
                if (!evaluateWhen(action.when, context))
                    continue;
                const handlers = handlersRef.current.get(actionId) || [];
                for (const handler of handlers) {
                    if (!handler.enabled || handler.enabled()) {
                        e.preventDefault();
                        e.stopPropagation();
                        handler.handler();
                        return;
                    }
                }
            }
        };
        // Capture phase for reliable interception
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [getHotkey]);
    const value = {
        register,
        execute,
        getHotkey,
        getHotkeyDisplay,
        getAction,
        userOverrides: userOverrides.current,
    };
    return (_jsx(ActionRegistryContext.Provider, { value: value, children: children }));
}
export function useActionRegistry() {
    const context = useContext(ActionRegistryContext);
    if (!context) {
        throw new Error('useActionRegistry must be used within ActionRegistryProvider');
    }
    return context;
}
// ─────────────────────────────────────────────
// Utility functions
// ─────────────────────────────────────────────
function matchesHotkey(e, hotkey) {
    const parts = hotkey.toLowerCase().split('+');
    const key = parts[parts.length - 1];
    const needsMod = parts.includes('mod');
    const needsShift = parts.includes('shift');
    const needsAlt = parts.includes('alt');
    const modPressed = isMac ? e.metaKey : e.ctrlKey;
    const logicalKeyMatches = e.key.toLowerCase() === key;
    // Handle special keys via physical code where logical values can vary by layout.
    const specialKeys = {
        '[': 'BracketLeft',
        ']': 'BracketRight',
        ',': 'Comma',
        '.': 'Period',
        'left': 'ArrowLeft',
        'right': 'ArrowRight',
        'up': 'ArrowUp',
        'down': 'ArrowDown',
        'escape': 'Escape',
        'tab': 'Tab',
    };
    const specialCode = specialKeys[key];
    // Important: for text shortcuts (A-Z/0-9), match logical key only.
    // Mixing in physical code (e.g. KeyQ) causes AZERTY/QWERTZ collisions such as
    // Cmd+A incorrectly matching a Cmd+Q binding.
    const codeMatches = specialCode
        ? e.code === specialCode
        : logicalKeyMatches;
    // Check modifier requirements
    const modCorrect = needsMod ? modPressed : !modPressed;
    const shiftCorrect = needsShift ? e.shiftKey : !e.shiftKey;
    const altCorrect = needsAlt ? e.altKey : !e.altKey;
    return codeMatches && modCorrect && shiftCorrect && altCorrect;
}
function formatHotkeyDisplay(hotkey) {
    const parts = hotkey.toLowerCase().split('+');
    const symbols = parts.map(part => {
        if (part === 'mod')
            return isMac ? '⌘' : 'Ctrl';
        if (part === 'shift')
            return isMac ? '⇧' : 'Shift';
        if (part === 'alt')
            return isMac ? '⌥' : 'Alt';
        if (part === 'escape')
            return 'Esc';
        if (part === 'tab')
            return 'Tab';
        if (part === 'left')
            return '←';
        if (part === 'right')
            return '→';
        if (part === '[')
            return '[';
        if (part === ']')
            return ']';
        return part.toUpperCase();
    });
    return isMac ? symbols.join('') : symbols.join('+');
}
//# sourceMappingURL=registry.js.map