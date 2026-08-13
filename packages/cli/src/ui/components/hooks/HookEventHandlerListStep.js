import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { HookEventHeader } from './HookEventHeader.js';
import { HandlerListBody } from './HandlerListBody.js';
import { getAllConfigs } from './matcherGrouping.js';
import { t } from '../../../i18n/index.js';
export function HookEventHandlerListStep({ hook, selectedIndex, }) {
    const flatConfigs = getAllConfigs(hook);
    const hasConfigs = flatConfigs.length > 0;
    return (_jsxs(Box, { flexDirection: "column", paddingX: 1, children: [_jsx(HookEventHeader, { title: hook.event, description: hook.description, exitCodes: hook.exitCodes }), hasConfigs ? (_jsx(HandlerListBody, { configs: flatConfigs, selectedIndex: selectedIndex })) : (_jsxs(_Fragment, { children: [_jsx(Box, { children: _jsx(Text, { color: theme.text.secondary, children: t('No hooks configured for this event.') }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('To add hooks, edit settings.json directly or ask Qwen.') }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Esc to go back') }) })] }))] }));
}
//# sourceMappingURL=HookEventHandlerListStep.js.map