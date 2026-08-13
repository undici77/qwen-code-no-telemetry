import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '../../lib/utils';
import { Markdown } from '../markdown';
// Style configuration for each message type
// Error and warning use shadow-tinted with subtle bg, others use bordered style
const MESSAGE_STYLES = {
    error: {
        // Uses -text variant (mixed with foreground) for better text contrast
        className: 'text-[var(--destructive-text)] shadow-tinted',
        useTintedShadow: true,
        shadowColor: 'var(--destructive-rgb)',
        bgStyle: { backgroundColor: 'oklch(from var(--destructive) l c h / 0.03)' },
    },
    warning: {
        // Uses -text variant (mixed with foreground) for better text contrast
        className: 'text-[var(--info-text)] shadow-tinted',
        useTintedShadow: true,
        shadowColor: 'var(--info-rgb)',
        bgStyle: { backgroundColor: 'oklch(from var(--info) l c h / 0.03)' },
    },
    info: {
        className: 'text-muted-foreground border border-muted bg-muted/30',
        useTintedShadow: false,
    },
    system: {
        className: 'text-muted-foreground border border-muted bg-muted/30',
        useTintedShadow: false,
    },
};
/**
 * SystemMessage - Renders a styled message bubble based on type
 */
export function SystemMessage({ content, type, className, }) {
    const style = MESSAGE_STYLES[type];
    return (_jsx("div", { className: cn("px-4 py-2", className), children: _jsx("div", { className: cn("text-sm px-3 py-2 rounded-md", style.className), style: {
                ...style.bgStyle,
                ...(style.useTintedShadow && style.shadowColor
                    ? { '--shadow-color': style.shadowColor }
                    : {}),
            }, children: _jsx(Markdown, { mode: "minimal", children: content }) }) }));
}
//# sourceMappingURL=SystemMessage.js.map