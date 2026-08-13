import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { TrustLevel } from '../../config/trustedFolders.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { useTrustModify } from '../hooks/useTrustModify.js';
import { theme } from '../semantic-colors.js';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';
import { relaunchApp } from '../../utils/processUtils.js';
import {} from '../hooks/useHistoryManager.js';
const TRUST_LEVEL_ITEMS = [
    {
        label: 'Trust this folder',
        value: TrustLevel.TRUST_FOLDER,
        key: TrustLevel.TRUST_FOLDER,
    },
    {
        label: 'Trust parent folder',
        value: TrustLevel.TRUST_PARENT,
        key: TrustLevel.TRUST_PARENT,
    },
    {
        label: "Don't trust",
        value: TrustLevel.DO_NOT_TRUST,
        key: TrustLevel.DO_NOT_TRUST,
    },
];
export function TrustDialog({ onExit, addItem, }) {
    const { cwd, currentTrustLevel, isInheritedTrustFromParent, isInheritedTrustFromIde, needsRestart, updateTrustLevel, commitTrustLevelChange, } = useTrustModify(onExit, addItem);
    useKeypress((key) => {
        if (key.name === 'escape') {
            onExit();
        }
        if (needsRestart && key.name === 'r') {
            if (commitTrustLevelChange()) {
                relaunchApp();
                onExit();
            }
        }
    }, { isActive: true });
    const index = TRUST_LEVEL_ITEMS.findIndex((item) => item.value === currentTrustLevel);
    const initialIndex = index === -1 ? 0 : index;
    return (_jsxs(_Fragment, { children: [_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", padding: 1, children: [_jsxs(Box, { flexDirection: "column", paddingBottom: 1, children: [_jsxs(Text, { bold: true, children: ['> ', "Modify Trust Level"] }), _jsx(Box, { marginTop: 1 }), _jsxs(Text, { children: ["Folder: ", cwd] }), _jsxs(Text, { children: ["Current Level: ", _jsx(Text, { bold: true, children: currentTrustLevel || 'Not Set' })] }), isInheritedTrustFromParent && (_jsx(Text, { color: theme.text.secondary, children: "Note: This folder currently inherits trust from a parent folder. A more-specific trust rule here can override that decision." })), isInheritedTrustFromIde && (_jsx(Text, { color: theme.text.secondary, children: "Note: This folder behaves as a trusted folder because the connected IDE workspace is trusted. It will remain trusted even if you set a different trust level here." }))] }), _jsx(RadioButtonSelect, { items: TRUST_LEVEL_ITEMS, onSelect: updateTrustLevel, isFocused: true, initialIndex: initialIndex }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: "(Use Enter to select)" }) })] }), needsRestart && (_jsx(Box, { marginLeft: 1, marginTop: 1, children: _jsx(Text, { color: theme.status.warning, children: "To apply the trust changes, Qwen Code must be restarted. Press 'r' to restart CLI now." }) }))] }));
}
//# sourceMappingURL=TrustDialog.js.map