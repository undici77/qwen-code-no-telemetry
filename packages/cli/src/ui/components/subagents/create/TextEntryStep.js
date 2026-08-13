import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../../semantic-colors.js';
import { TextInput } from '../../shared/TextInput.js';
export function TextEntryStep({ state, dispatch, onNext, description, placeholder, height = 1, initialText = '', onChange, validate, }) {
    const submit = useCallback(() => {
        const value = initialText ? initialText.trim() : '';
        const error = validate
            ? validate(value)
            : value.length === 0
                ? 'Please enter a value.'
                : null;
        if (error) {
            dispatch({ type: 'SET_VALIDATION_ERRORS', errors: [error] });
            return;
        }
        dispatch({ type: 'SET_VALIDATION_ERRORS', errors: [] });
        onNext();
    }, [dispatch, onNext, validate, initialText]);
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [description && (_jsx(Box, { children: _jsx(Text, { color: theme.text.secondary, children: description }) })), _jsx(TextInput, { value: initialText, onChange: onChange, onSubmit: submit, placeholder: placeholder, height: height, isActive: !state.isGenerating, validationErrors: state.validationErrors })] }));
}
//# sourceMappingURL=TextEntryStep.js.map