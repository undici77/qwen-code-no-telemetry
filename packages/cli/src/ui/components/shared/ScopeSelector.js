import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { getScopeItems } from '../../../utils/dialogScopeUtils.js';
import { RadioButtonSelect } from './RadioButtonSelect.js';
import { t } from '../../../i18n/index.js';
export function ScopeSelector({ onSelect, onHighlight, isFocused, initialScope, }) {
    const scopeItems = getScopeItems().map((item) => ({
        ...item,
        label: t(item.label),
        key: item.value,
    }));
    const initialIndex = scopeItems.findIndex((item) => item.value === initialScope);
    const safeInitialIndex = initialIndex >= 0 ? initialIndex : 0;
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { bold: isFocused, wrap: "truncate", children: [isFocused ? '> ' : '  ', t('Apply To')] }), _jsx(Box, { height: 1 }), _jsx(RadioButtonSelect, { items: scopeItems, initialIndex: safeInitialIndex, onSelect: onSelect, onHighlight: onHighlight, isFocused: isFocused, showNumbers: isFocused })] }));
}
//# sourceMappingURL=ScopeSelector.js.map