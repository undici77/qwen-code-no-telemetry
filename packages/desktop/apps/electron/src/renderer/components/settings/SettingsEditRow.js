import { jsx as _jsx } from "react/jsx-runtime";
/**
 * SettingsEditRow
 *
 * A settings row with an Edit button that opens an EditPopover.
 * When the user submits their edit request, a new focused chat window
 * opens with context pre-filled for fast execution.
 */
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { EditPopover } from '@/components/ui/EditPopover';
import { SettingsRow } from './SettingsRow';
export function SettingsEditRow({ label, description, value, editContext, editExample, inCard = true, className, }) {
    const { t } = useTranslation();
    return (_jsx(SettingsRow, { label: label, description: description, inCard: inCard, className: className, action: _jsx(EditPopover, { trigger: _jsx(Button, { variant: "ghost", size: "sm", className: "h-7 px-2.5 rounded-[6px] bg-background shadow-minimal", children: t("common.edit") }), example: editExample, context: editContext }), children: value }));
}
//# sourceMappingURL=SettingsEditRow.js.map