import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
const CollapsibleMarkdownContext = React.createContext(null);
/**
 * Hook to access collapsible markdown context.
 * Returns null if not within a provider (for non-collapsible mode).
 */
export function useCollapsibleMarkdown() {
    return React.useContext(CollapsibleMarkdownContext);
}
/**
 * CollapsibleMarkdownProvider
 *
 * Provides state management for collapsible markdown sections.
 * All sections start expanded (empty collapsed set).
 */
export function CollapsibleMarkdownProvider({ children }) {
    const [collapsedSections, setCollapsedSections] = React.useState(() => new Set());
    const toggleSection = React.useCallback((sectionId) => {
        setCollapsedSections(prev => {
            const next = new Set(prev);
            if (next.has(sectionId)) {
                next.delete(sectionId);
            }
            else {
                next.add(sectionId);
            }
            return next;
        });
    }, []);
    const expandAll = React.useCallback(() => {
        setCollapsedSections(new Set());
    }, []);
    const value = React.useMemo(() => ({ collapsedSections, toggleSection, expandAll }), [collapsedSections, toggleSection, expandAll]);
    return (_jsx(CollapsibleMarkdownContext.Provider, { value: value, children: children }));
}
//# sourceMappingURL=CollapsibleMarkdownContext.js.map