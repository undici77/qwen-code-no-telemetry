import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { REASONING_EFFORT_TIERS, } from '@qwen-code/qwen-code-core';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { t } from '../../i18n/index.js';
const EFFORT_DESCRIPTIONS = {
    low: 'Fastest and cheapest; least reasoning.',
    medium: 'Balanced speed, cost, and reasoning.',
    high: 'Default — strong reasoning for hard tasks.',
    xhigh: 'Extended reasoning for agentic/coding work.',
    max: 'Maximum reasoning; highest cost and latency.',
};
export function EffortDialog({ onSelect, currentEffort, }) {
    const items = REASONING_EFFORT_TIERS.map((tier) => ({
        label: `${tier} — ${t(EFFORT_DESCRIPTIONS[tier])}`,
        value: tier,
        key: tier,
    }));
    // Only pre-select when an effort is actually configured. When it's unset,
    // start the cursor at the top (index 0) rather than highlighting 'high',
    // which would mislead the user into thinking 'high' is their current setting
    // when in fact the model/provider default applies.
    const initialIndex = currentEffort
        ? Math.max(0, REASONING_EFFORT_TIERS.indexOf(currentEffort))
        : 0;
    const handleSelect = useCallback((effort) => {
        onSelect(effort);
    }, [onSelect]);
    useKeypress((key) => {
        if (key.name === 'escape') {
            onSelect(undefined);
        }
    }, { isActive: true });
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", padding: 1, width: "100%", children: [_jsxs(Text, { bold: true, children: ['> ', t('Reasoning Effort'), ' ', _jsx(Text, { color: theme.text.secondary, children: t('(applied across all providers; clamped per model)') })] }), _jsx(Box, { height: 1 }), _jsx(RadioButtonSelect, { items: items, initialIndex: initialIndex, onSelect: handleSelect, isFocused: true, showNumbers: true }), !currentEffort && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, wrap: "truncate", children: t('No effort configured — using the model/provider default.') }) })), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, wrap: "truncate", children: t('(Use Enter to select, Esc to cancel)') }) })] }));
}
//# sourceMappingURL=EffortDialog.js.map