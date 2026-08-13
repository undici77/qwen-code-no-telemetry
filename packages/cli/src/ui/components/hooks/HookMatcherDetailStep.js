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
import { t } from '../../../i18n/index.js';
export function HookMatcherDetailStep({ hookEvent, matcherGroup, selectedIndex, }) {
    const hasConfigs = matcherGroup.configs.length > 0;
    return (_jsxs(Box, { flexDirection: "column", paddingX: 1, children: [_jsx(HookEventHeader, { title: `${hookEvent.event} - ${t('Matcher:')} ${matcherGroup.matcher}`, description: hookEvent.description, exitCodes: hookEvent.exitCodes }), hasConfigs ? (_jsx(HandlerListBody, { configs: matcherGroup.configs, selectedIndex: selectedIndex })) : (_jsxs(_Fragment, { children: [_jsx(Box, { children: _jsx(Text, { color: theme.text.secondary, children: t('No hooks configured for this matcher.') }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Esc to go back') }) })] }))] }));
}
//# sourceMappingURL=HookMatcherDetailStep.js.map