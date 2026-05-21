import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { ApprovalMode } from '@qwen-code/qwen-code-core';
import { t } from '../../i18n/index.js';
export const AutoAcceptIndicator = ({ approvalMode, }) => {
    let textColor = '';
    let textContent = '';
    let subText = '';
    const cycleText = process.platform === 'win32'
        ? ` ${t('(tab to cycle)')}`
        : ` ${t('(shift + tab to cycle)')}`;
    switch (approvalMode) {
        case ApprovalMode.PLAN:
            textColor = theme.status.success;
            textContent = t('plan mode');
            subText = cycleText;
            break;
        case ApprovalMode.AUTO_EDIT:
            textColor = theme.status.warning;
            textContent = t('auto-accept edits');
            subText = cycleText;
            break;
        case ApprovalMode.AUTO:
            textColor = theme.status.warning;
            textContent = t('auto mode (classifier-evaluated)');
            subText = cycleText;
            break;
        case ApprovalMode.YOLO:
            textColor = theme.status.error;
            textContent = t('YOLO mode');
            subText = cycleText;
            break;
        case ApprovalMode.DEFAULT:
        default:
            break;
    }
    return (_jsxs(Text, { color: textColor, children: [textContent, subText && _jsx(Text, { color: theme.text.secondary, children: subText })] }));
};
//# sourceMappingURL=AutoAcceptIndicator.js.map