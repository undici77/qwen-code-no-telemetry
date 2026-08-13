import i18n from 'i18next';
import { coerceInputText } from '@/lib/input-text';
function normalizeDraftInput(input) {
    return coerceInputText(input).trim();
}
export function buildPlanApprovalMessage(options = {}) {
    const draftInput = normalizeDraftInput(options.draftInput);
    const sections = [i18n.t('plan.approved')];
    if (draftInput.length > 0) {
        sections.push(['---', `**${i18n.t('plan.additionalUserContext')}**`, draftInput].join('\n\n'));
    }
    return sections.join('\n\n');
}
//# sourceMappingURL=plan-approval-message.js.map