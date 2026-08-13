import { jsx as _jsx } from "react/jsx-runtime";
/**
 * DataTableOverlay - Fullscreen/modal overlay for viewing data tables
 *
 * Uses PreviewOverlay as the base for consistent modal/fullscreen behavior.
 * Renders children (typically a data table) without scroll constraints,
 * allowing the full table to be visible in an expanded view.
 */
import * as React from 'react';
import { Table2 } from 'lucide-react';
import { PreviewOverlay } from './PreviewOverlay';
export function DataTableOverlay({ isOpen, onClose, title, subtitle, theme, badgeVariant = 'gray', headerActions, children, }) {
    return (_jsx(PreviewOverlay, { isOpen: isOpen, onClose: onClose, theme: theme, typeBadge: {
            icon: Table2,
            label: 'Table',
            variant: badgeVariant,
        }, title: title, subtitle: subtitle, headerActions: headerActions, children: _jsx("div", { children: children }) }));
}
//# sourceMappingURL=DataTableOverlay.js.map