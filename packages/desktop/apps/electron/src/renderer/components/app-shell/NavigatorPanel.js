import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * NavigatorPanel - Middle panel component for list-based navigation
 *
 * Displays a header with title, optional action buttons, and
 * renders children (SessionList or SourcesListPanel) in a scrollable area.
 *
 * Layout:
 * ┌────────────────────────────┐
 * │ Header (title)             │
 * │ + action buttons           │
 * ├────────────────────────────┤
 * │                            │
 * │   children (list content)  │
 * │                            │
 * └────────────────────────────┘
 */
import * as React from 'react';
import { Panel } from './Panel';
import { PanelHeader } from './PanelHeader';
import { cn } from '@/lib/utils';
export function NavigatorPanel({ title, width, headerActions, children, className, }) {
    return (_jsxs(Panel, { variant: "shrink", width: width, className: className, children: [_jsx(PanelHeader, { title: title, actions: headerActions }), children] }));
}
//# sourceMappingURL=NavigatorPanel.js.map