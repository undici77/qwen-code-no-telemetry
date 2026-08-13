import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
const STORAGE_KEY = 'playground-expanded-categories';
export function Sidebar({ categories, selectedId, onSelect }) {
    const [expandedCategories, setExpandedCategories] = React.useState(() => {
        // Try to restore from localStorage, otherwise collapse all by default
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return new Set(parsed);
            }
        }
        catch {
            // Ignore parse errors
        }
        return new Set();
    });
    // Persist expanded categories to localStorage
    React.useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...expandedCategories]));
        }
        catch {
            // Ignore storage errors
        }
    }, [expandedCategories]);
    const toggleCategory = (name) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(name)) {
                next.delete(name);
            }
            else {
                next.add(name);
            }
            return next;
        });
    };
    return (_jsx("nav", { className: "w-56 shrink-0 border-r border-border bg-background overflow-y-auto", children: _jsx("div", { className: "p-3 space-y-1", children: categories.map(category => {
                const isExpanded = expandedCategories.has(category.name);
                return (_jsxs("div", { children: [_jsxs("button", { onClick: () => toggleCategory(category.name), className: "w-full flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors", children: [_jsx(ChevronRight, { className: cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-90') }), category.name, _jsx("span", { className: "ml-auto text-[10px] font-normal opacity-60", children: category.components.length })] }), isExpanded && (_jsx("div", { className: "ml-2 space-y-0.5", children: category.components.map(component => (_jsx("button", { onClick: () => onSelect(component.id), className: cn('w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors', selectedId === component.id
                                    ? 'bg-foreground/10 text-foreground font-medium'
                                    : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'), children: component.name }, component.id))) }))] }, category.name));
            }) }) }));
}
//# sourceMappingURL=Sidebar.js.map