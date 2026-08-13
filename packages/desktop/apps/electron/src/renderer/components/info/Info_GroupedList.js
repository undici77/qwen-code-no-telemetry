import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Info_GroupedList
 *
 * Lists with colored group headers (e.g., for MCP tools display).
 * Supports loading, error, and empty states.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cva } from 'class-variance-authority';
import { Spinner } from '@craft-agent/ui';
import { cn } from '@/lib/utils';
const groupHeaderVariants = cva('px-4 py-2 border-b border-border/30 text-xs font-semibold uppercase tracking-wide', {
    variants: {
        variant: {
            success: 'bg-success/5 text-success',
            info: 'bg-info/5 text-info',
            warning: 'bg-warning/5 text-warning',
            muted: 'bg-foreground/5 text-muted-foreground',
        },
    },
    defaultVariants: {
        variant: 'muted',
    },
});
function Info_GroupedListRoot({ children, loading, error, empty, className, }) {
    const { t } = useTranslation();
    if (loading) {
        return (_jsx("div", { className: cn('flex items-center justify-center py-8', className), children: _jsx(Spinner, { className: "text-muted-foreground" }) }));
    }
    if (error) {
        return (_jsx("div", { className: cn('px-4 py-4 text-sm text-muted-foreground', className), children: error === 'Source requires authentication' ? (_jsx("span", { children: t('sourceInfo.authenticateToViewTools') })) : (_jsx("span", { children: error })) }));
    }
    // Check if there are any items
    const hasItems = React.Children.toArray(children).some((child) => {
        if (React.isValidElement(child) && child.type === Info_GroupedListGroup) {
            return React.Children.count(child.props.children) > 0;
        }
        return false;
    });
    if (!hasItems && empty) {
        return (_jsx("div", { className: cn('px-4 py-4 text-sm text-muted-foreground', className), children: empty }));
    }
    return _jsx("div", { className: className, children: children });
}
function Info_GroupedListGroup({ children, label, variant, count, className, }) {
    if (React.Children.count(children) === 0) {
        return null;
    }
    return (_jsxs("div", { className: cn('border-t border-border/30 first:border-t-0', className), children: [_jsxs("div", { className: groupHeaderVariants({ variant }), children: [label, count !== undefined && ` (${count})`] }), _jsx("div", { className: "divide-y divide-border/30", children: children })] }));
}
function Info_GroupedListItem({ children, className }) {
    return _jsx("div", { className: cn('px-4 py-2', className), children: children });
}
export const Info_GroupedList = Object.assign(Info_GroupedListRoot, {
    Group: Info_GroupedListGroup,
    Item: Info_GroupedListItem,
});
//# sourceMappingURL=Info_GroupedList.js.map