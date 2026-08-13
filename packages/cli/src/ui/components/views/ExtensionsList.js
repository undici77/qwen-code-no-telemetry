import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { useUIState } from '../../contexts/UIStateContext.js';
import { ExtensionUpdateState } from '../../state/extensions.js';
import { createDebugLogger, getExtensionDisplayName, } from '@qwen-code/qwen-code-core';
import { getCurrentLanguage } from '../../../i18n/index.js';
const debugLogger = createDebugLogger('EXTENSIONS_LIST');
export const ExtensionsList = () => {
    const { extensionsUpdateState, commandContext } = useUIState();
    const extensions = commandContext.services.config?.getExtensions() || [];
    if (extensions.length === 0) {
        return _jsx(Text, { children: "No extensions installed." });
    }
    return (_jsxs(Box, { flexDirection: "column", marginTop: 1, marginBottom: 1, children: [_jsx(Text, { children: "Installed extensions:" }), _jsx(Box, { flexDirection: "column", paddingLeft: 2, children: extensions.map((ext) => {
                    const state = extensionsUpdateState.get(ext.name);
                    const isActive = ext.isActive;
                    const activeString = isActive ? 'active' : 'disabled';
                    const activeColor = isActive ? 'green' : 'grey';
                    let stateColor = 'gray';
                    const stateText = state || 'unknown state';
                    switch (state) {
                        case ExtensionUpdateState.CHECKING_FOR_UPDATES:
                        case ExtensionUpdateState.UPDATING:
                            stateColor = 'cyan';
                            break;
                        case ExtensionUpdateState.UPDATE_AVAILABLE:
                        case ExtensionUpdateState.UPDATED_NEEDS_RESTART:
                        case ExtensionUpdateState.UPDATED_WITH_WARNINGS:
                            stateColor = 'yellow';
                            break;
                        case ExtensionUpdateState.ERROR:
                            stateColor = 'red';
                            break;
                        case ExtensionUpdateState.UP_TO_DATE:
                        case ExtensionUpdateState.NOT_UPDATABLE:
                        case ExtensionUpdateState.UPDATED:
                            stateColor = 'green';
                            break;
                        default:
                            debugLogger.error(`Unhandled ExtensionUpdateState ${state}`);
                            break;
                    }
                    return (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsxs(Text, { children: [_jsx(Text, { color: "cyan", children: `${getExtensionDisplayName(ext, getCurrentLanguage())} (v${ext.version})` }), _jsx(Text, { color: activeColor, children: ` - ${activeString}` }), _jsx(Text, { color: stateColor, children: ` (${stateText})` })] }), ext.resolvedSettings && ext.resolvedSettings.length > 0 && (_jsxs(Box, { flexDirection: "column", paddingLeft: 2, children: [_jsx(Text, { children: "settings:" }), ext.resolvedSettings.map((setting) => (_jsxs(Text, { children: ["- ", setting.name, ": ", setting.value] }, setting.name)))] }))] }, ext.name));
                }) })] }));
};
//# sourceMappingURL=ExtensionsList.js.map