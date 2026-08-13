import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { resolveEntityColor } from '@craft-agent/shared/colors';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import { Hash, CalendarDays, Type } from 'lucide-react';
/** Circle diameter in pixels for each icon size */
const CIRCLE_SIZES = {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 10,
    xl: 12,
};
export function LabelIcon({ label, size = 'sm', hasChildren, className }) {
    const { isDark } = useTheme();
    // Resolve the label's color for inline styling
    const resolvedColor = label.color
        ? resolveEntityColor(label.color, isDark)
        : undefined;
    // All labels use the same diameter for consistent spacing
    const diameter = CIRCLE_SIZES[size];
    const padding = 1; // Internal padding around the circle
    const center = diameter / 2;
    const outerRadius = center - padding;
    const dotRadius = 1; // 2px diameter inner dot
    const fillColor = resolvedColor || 'currentColor';
    return (_jsxs("svg", { width: diameter, height: diameter, viewBox: `0 0 ${diameter} ${diameter}`, className: cn('shrink-0', className), style: { opacity: resolvedColor ? 1 : 0.4 }, children: [_jsx("circle", { cx: center, cy: center, r: outerRadius, fill: fillColor }), hasChildren && (_jsx("circle", { cx: center, cy: center, r: dotRadius, style: {
                    fill: `color-mix(in srgb, var(--background) 85%, ${fillColor} 15%)`,
                } }))] }));
}
/**
 * LabelValueTypeIcon - Renders a placeholder icon for typed labels with no value set.
 *
 * Maps valueType to a Lucide icon:
 *   - number → Hash
 *   - date   → CalendarDays
 *   - string → Type
 *
 * Returns null if the label has no valueType (boolean/presence-only labels).
 * Used in label badge rows and ActiveOptionBadges to indicate a typed label awaiting a value.
 */
const VALUE_TYPE_ICONS = {
    number: Hash,
    date: CalendarDays,
    string: Type,
};
export function LabelValueTypeIcon({ valueType, size = 11, className }) {
    if (!valueType)
        return null;
    const IconComponent = VALUE_TYPE_ICONS[valueType];
    if (!IconComponent)
        return null;
    return _jsx(IconComponent, { size: size, className: cn('shrink-0 opacity-45', className) });
}
//# sourceMappingURL=label-icon.js.map