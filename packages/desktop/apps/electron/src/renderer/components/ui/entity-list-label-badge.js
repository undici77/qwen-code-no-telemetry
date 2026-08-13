import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { parseLabelEntry, formatLabelEntry, formatDisplayValue } from "@craft-agent/shared/labels";
import { resolveEntityColor } from "@craft-agent/shared/colors";
import { useTheme } from "@/context/ThemeContext";
import { LabelValuePopover } from "./label-value-popover";
import { LabelValueTypeIcon } from "./label-icon";
export function EntityListLabelBadge({ label, rawValue, sessionLabels, onLabelsChange }) {
    const [open, setOpen] = useState(false);
    const { isDark } = useTheme();
    const color = label.color ? resolveEntityColor(label.color, isDark) : null;
    const displayValue = rawValue ? formatDisplayValue(rawValue, label.valueType) : undefined;
    return (_jsx(LabelValuePopover, { label: label, value: rawValue, open: open, onOpenChange: setOpen, onValueChange: (newValue) => {
            const updated = sessionLabels.map(entry => {
                const parsed = parseLabelEntry(entry);
                if (parsed.id === label.id)
                    return formatLabelEntry(label.id, newValue);
                return entry;
            });
            onLabelsChange?.(updated);
        }, onRemove: () => {
            const updated = sessionLabels.filter(entry => {
                const parsed = parseLabelEntry(entry);
                return parsed.id !== label.id;
            });
            onLabelsChange?.(updated);
        }, children: _jsxs("div", { role: "button", tabIndex: 0, className: "shrink-0 h-[18px] max-w-[120px] px-1.5 text-[10px] font-medium rounded flex items-center whitespace-nowrap gap-0.5 cursor-pointer", onMouseDown: (e) => { e.stopPropagation(); e.preventDefault(); }, style: color ? {
                backgroundColor: `color-mix(in srgb, ${color} 6%, transparent)`,
                color: `color-mix(in srgb, ${color} 75%, var(--foreground))`,
            } : {
                backgroundColor: 'rgba(var(--foreground-rgb), 0.05)',
                color: 'rgba(var(--foreground-rgb), 0.8)',
            }, children: [label.name, displayValue ? (_jsxs(_Fragment, { children: [_jsx("span", { style: { opacity: 0.4 }, children: "\u00B7" }), _jsx("span", { className: "font-normal truncate min-w-0", style: { opacity: 0.75 }, children: displayValue })] })) : (label.valueType && (_jsxs(_Fragment, { children: [_jsx("span", { style: { opacity: 0.4 }, children: "\u00B7" }), _jsx(LabelValueTypeIcon, { valueType: label.valueType, size: 10 })] })))] }) }));
}
//# sourceMappingURL=entity-list-label-badge.js.map