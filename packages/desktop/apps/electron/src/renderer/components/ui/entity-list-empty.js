import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * EntityListEmptyScreen — Unified empty state for entity lists.
 *
 * Wraps the Empty primitives into a single configurable component
 * used by SessionList, SourcesListPanel, and SkillsListPanel.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from './empty';
import { getDocUrl } from '@craft-agent/shared/docs/doc-links';
export function EntityListEmptyScreen({ icon, title, description, docKey, children, className = 'flex-1', }) {
    const { t } = useTranslation();
    const hasActions = docKey || children;
    return (_jsxs(Empty, { className: className, children: [_jsxs(EmptyHeader, { children: [_jsx(EmptyMedia, { variant: "icon", children: icon }), _jsx(EmptyTitle, { children: title }), _jsx(EmptyDescription, { children: description })] }), hasActions && (_jsxs(EmptyContent, { children: [docKey && (_jsx("button", { onClick: () => window.electronAPI.openUrl(getDocUrl(docKey)), className: "inline-flex items-center h-7 px-3 text-xs font-medium rounded-[8px] bg-foreground/[0.02] shadow-minimal hover:bg-foreground/[0.05] transition-colors", children: t("common.learnMore") })), children] }))] }));
}
//# sourceMappingURL=entity-list-empty.js.map