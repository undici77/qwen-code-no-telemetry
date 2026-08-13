import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Info_StatusBadge
 *
 * Status badge for permission states using Info_Badge.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Info_Badge } from './Info_Badge';
const statusColors = {
    allowed: 'success',
    blocked: 'destructive',
    'requires-permission': 'warning',
};
const statusI18nKeys = {
    allowed: 'table.statusAllowed',
    blocked: 'table.statusBlocked',
    'requires-permission': 'table.statusAsk',
};
export function Info_StatusBadge({ status, label, ...props }) {
    const { t } = useTranslation();
    const key = status ?? 'allowed';
    const displayLabel = label ?? t(statusI18nKeys[key]);
    return (_jsx(Info_Badge, { ...props, color: statusColors[key], children: displayLabel }));
}
//# sourceMappingURL=Info_StatusBadge.js.map