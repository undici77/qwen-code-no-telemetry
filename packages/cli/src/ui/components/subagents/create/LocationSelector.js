import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box } from 'ink';
import { RadioButtonSelect } from '../../shared/RadioButtonSelect.js';
import { t } from '../../../../i18n/index.js';
const locationOptions = [
    {
        get label() {
            return t('Project Level (.qwen/agents/)');
        },
        value: 'project',
    },
    {
        get label() {
            return t('User Level (~/.qwen/agents/)');
        },
        value: 'user',
    },
];
/**
 * Step 1: Location selection for subagent storage.
 */
export function LocationSelector({ state, dispatch, onNext }) {
    const handleSelect = (selectedValue) => {
        const location = selectedValue;
        dispatch({ type: 'SET_LOCATION', location });
        onNext();
    };
    return (_jsx(Box, { flexDirection: "column", children: _jsx(RadioButtonSelect, { items: locationOptions.map((option) => ({
                key: option.value,
                label: option.label,
                value: option.value,
            })), initialIndex: locationOptions.findIndex((opt) => opt.value === state.location), onSelect: handleSelect, isFocused: true }) }));
}
//# sourceMappingURL=LocationSelector.js.map