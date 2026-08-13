import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Check } from 'lucide-react';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose, } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { PERMISSION_MODE_CONFIG, PERMISSION_MODE_ORDER, } from '@craft-agent/shared/agent/modes';
// ============================================================================
// Mode Icon (same SVG pattern as ActiveOptionBadges.PermissionModeIcon)
// ============================================================================
function ModeIcon({ mode, className }) {
    const config = PERMISSION_MODE_CONFIG[mode];
    return (_jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className: className, children: _jsx("path", { d: config.svgPath }) }));
}
// ============================================================================
// Trigger chip styling per mode (matches desktop PermissionModeDropdown)
// ============================================================================
const MODE_STYLES = {
    'allow-all': {
        className: 'bg-accent/5 text-accent',
        shadowVar: 'var(--accent-rgb)',
    },
    safe: {
        className: 'bg-foreground/5 text-foreground/60',
        shadowVar: 'var(--foreground-rgb)',
    },
    ask: {
        className: 'bg-info/10 text-info',
        shadowVar: 'var(--info-rgb)',
    },
    'auto-edit': {
        className: 'bg-success/10 text-success',
        shadowVar: 'var(--success-rgb)',
    },
};
export function CompactPermissionModeSelector({ permissionMode, onPermissionModeChange, }) {
    const [open, setOpen] = React.useState(false);
    // Optimistic local state — updates immediately, syncs with prop
    const [optimisticMode, setOptimisticMode] = React.useState(permissionMode);
    React.useEffect(() => {
        setOptimisticMode(permissionMode);
    }, [permissionMode]);
    const handleSelect = React.useCallback((mode) => {
        setOptimisticMode(mode);
        onPermissionModeChange?.(mode);
        setOpen(false);
    }, [onPermissionModeChange]);
    const config = PERMISSION_MODE_CONFIG[optimisticMode];
    const style = MODE_STYLES[optimisticMode];
    return (_jsxs(Drawer, { open: open, onOpenChange: setOpen, children: [_jsx(DrawerTrigger, { asChild: true, children: _jsxs("button", { type: "button", "aria-label": `Permission mode: ${config.displayName}`, className: cn("h-7 pl-2 pr-2.5 text-xs font-medium rounded-[6px] flex items-center gap-1.5 shadow-tinted outline-none select-none shrink-0", style.className), style: { '--shadow-color': style.shadowVar }, children: [_jsx(ModeIcon, { mode: optimisticMode, className: "h-3.5 w-3.5" }), _jsx("span", { children: config.shortName })] }) }), _jsxs(DrawerContent, { children: [_jsx(DrawerHeader, { children: _jsx(DrawerTitle, { children: "Permission Mode" }) }), _jsx("div", { className: "px-4 pb-6 flex flex-col gap-1", children: PERMISSION_MODE_ORDER.map((mode) => {
                            const modeConfig = PERMISSION_MODE_CONFIG[mode];
                            const isSelected = mode === optimisticMode;
                            return (_jsx(DrawerClose, { asChild: true, children: _jsxs("button", { type: "button", className: cn("flex items-center gap-3 w-full px-3 py-3 rounded-lg text-left transition-colors", isSelected ? "bg-foreground/5" : "hover:bg-foreground/5"), onClick: () => handleSelect(mode), children: [_jsx("span", { className: cn("shrink-0", PERMISSION_MODE_CONFIG[mode].colorClass.text), children: _jsx(ModeIcon, { mode: mode, className: "h-5 w-5" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-sm font-medium", children: modeConfig.displayName }), _jsx("div", { className: "text-xs text-muted-foreground", children: modeConfig.description })] }), isSelected && (_jsx(Check, { className: "h-4 w-4 shrink-0 text-foreground/60" }))] }) }, mode));
                        }) })] })] }));
}
//# sourceMappingURL=CompactPermissionModeSelector.js.map