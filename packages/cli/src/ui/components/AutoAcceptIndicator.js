import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { ApprovalMode } from '@qwen-code/qwen-code-core';
import { t } from '../../i18n/index.js';
import { getApprovalModeIndicatorColor } from './approvalModeVisuals.js';
export const AutoAcceptIndicator = ({ approvalMode, }) => {
    const textColor = getApprovalModeIndicatorColor(approvalMode) ?? '';
    let textContent = '';
    let subText = '';
    const cycleText = process.platform === 'win32'
        ? ` ${t('(tab to cycle)')}`
        : ` ${t('(shift + tab to cycle)')}`;
    switch (approvalMode) {
        case ApprovalMode.PLAN:
            textContent = t('plan mode');
            subText = cycleText;
            break;
        case ApprovalMode.AUTO_EDIT:
            textContent = t('auto-accept edits');
            subText = cycleText;
            break;
        case ApprovalMode.AUTO:
            textContent = t('Auto mode');
            subText = cycleText;
            break;
        case ApprovalMode.YOLO:
            textContent = t('YOLO mode');
            subText = cycleText;
            break;
        case ApprovalMode.DEFAULT:
            textContent = `⏸ ${t('Ask permissions')}`;
            subText = cycleText;
            break;
        default:
            break;
    }
    return (_jsxs(Text, { color: textColor, children: [textContent, subText && _jsx(Text, { color: theme.text.secondary, children: subText })] }));
};
//# sourceMappingURL=AutoAcceptIndicator.js.map