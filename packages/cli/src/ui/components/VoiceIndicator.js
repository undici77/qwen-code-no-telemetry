import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { t } from '../../i18n/index.js';
import { escapeAnsiCtrlCodes } from '../utils/textUtils.js';
const METER_WIDTH = 16;
// Speech mean-abs level is small (~0.03–0.1 of full scale); amplify for display.
const LEVEL_GAIN = 12;
function meter(level) {
    if (!Number.isFinite(level))
        level = 0;
    const norm = Math.max(0, Math.min(1, level * LEVEL_GAIN));
    const filled = Math.round(norm * METER_WIDTH);
    return '█'.repeat(filled) + '░'.repeat(METER_WIDTH - filled);
}
/** Live voice dictation indicator: state, input-level meter, and partial text. */
export function VoiceIndicator({ status, interimText, audioLevel = 0, }) {
    if (status === 'idle') {
        return null;
    }
    return (_jsxs(Box, { flexDirection: "column", paddingLeft: 1, children: [_jsx(Box, { children: status === 'recording' ? (_jsxs(_Fragment, { children: [_jsx(Text, { color: "redBright", children: '● ' }), _jsx(Text, { color: "cyan", children: meter(audioLevel) }), _jsx(Text, { color: "gray", children: '  ' + t('listening…') })] })) : status === 'refining' ? (_jsx(Text, { color: "yellow", children: '◆ ' + t('refining…') })) : (_jsx(Text, { color: "yellow", children: '◆ ' + t('transcribing…') })) }), interimText ? (_jsx(Text, { dimColor: true, wrap: "truncate-end", children: escapeAnsiCtrlCodes(interimText) })) : null] }));
}
//# sourceMappingURL=VoiceIndicator.js.map