import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useRef } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { sanitizeInput } from '../utils.js';
import { subagentGenerator } from '@qwen-code/qwen-code-core';
import { useKeypress } from '../../../hooks/useKeypress.js';
import { keyMatchers, Command } from '../../../keyMatchers.js';
import { theme } from '../../../semantic-colors.js';
import { TextInput } from '../../shared/TextInput.js';
import { t } from '../../../../i18n/index.js';
/**
 * Step 3: Description input with LLM generation.
 */
export function DescriptionInput({ state, dispatch, onNext, config, }) {
    const abortControllerRef = useRef(null);
    const handleTextChange = useCallback((text) => {
        const sanitized = sanitizeInput(text);
        dispatch({
            type: 'SET_USER_DESCRIPTION',
            description: sanitized,
        });
    }, [dispatch]);
    // TextInput will manage its own buffer; we just pass value and handlers
    const handleGenerate = useCallback(async (userDescription, dispatch, config) => {
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        try {
            const generated = await subagentGenerator(userDescription, config, abortController.signal);
            // Only dispatch if not aborted
            if (!abortController.signal.aborted) {
                dispatch({
                    type: 'SET_GENERATED_CONTENT',
                    name: generated.name,
                    description: generated.description,
                    systemPrompt: generated.systemPrompt,
                });
                onNext();
            }
        }
        finally {
            abortControllerRef.current = null;
        }
    }, [onNext]);
    const handleSubmit = useCallback(async () => {
        if (!state.canProceed || state.isGenerating) {
            return;
        }
        const inputValue = state.userDescription.trim();
        if (!inputValue) {
            return;
        }
        // Start LLM generation
        dispatch({ type: 'SET_GENERATING', isGenerating: true });
        try {
            if (!config) {
                throw new Error('Configuration not available');
            }
            // Use real LLM integration
            await handleGenerate(inputValue, dispatch, config);
        }
        catch (error) {
            dispatch({ type: 'SET_GENERATING', isGenerating: false });
            // Don't show error if it was cancelled by user
            if (error instanceof Error && error.name === 'AbortError') {
                return;
            }
            dispatch({
                type: 'SET_VALIDATION_ERRORS',
                errors: [
                    t('Failed to generate subagent: {{error}}', {
                        error: error instanceof Error ? error.message : 'Unknown error',
                    }),
                ],
            });
        }
    }, [
        state.canProceed,
        state.isGenerating,
        state.userDescription,
        dispatch,
        config,
        handleGenerate,
    ]);
    // Handle keyboard input during generation
    const handleGenerationKeypress = useCallback((key) => {
        if (keyMatchers[Command.ESCAPE](key)) {
            if (abortControllerRef.current) {
                // Cancel the ongoing generation
                abortControllerRef.current.abort();
                dispatch({ type: 'SET_GENERATING', isGenerating: false });
            }
        }
    }, [dispatch]);
    // Use separate keypress handlers for different states
    useKeypress(handleGenerationKeypress, {
        isActive: state.isGenerating,
    });
    const placeholder = t('e.g., Expert code reviewer that reviews code based on best practices...');
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Box, { children: _jsx(Text, { color: theme.text.secondary, children: t('Describe what this subagent should do and when it should be used. (Be comprehensive for best results)') }) }), state.isGenerating ? (_jsxs(Box, { children: [_jsx(Box, { marginRight: 1, children: _jsx(Spinner, {}) }), _jsx(Text, { color: theme.text.accent, children: t('Generating subagent configuration...') })] })) : (_jsx(TextInput, { value: state.userDescription || '', onChange: handleTextChange, onSubmit: handleSubmit, placeholder: placeholder, height: 10, isActive: !state.isGenerating, validationErrors: state.validationErrors }))] }));
}
//# sourceMappingURL=DescriptionInput.js.map