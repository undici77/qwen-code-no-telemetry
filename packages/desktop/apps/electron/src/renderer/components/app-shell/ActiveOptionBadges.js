import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { useTranslation } from "react-i18next";
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SlashCommandMenu, DEFAULT_SLASH_COMMAND_GROUPS } from '@/components/ui/slash-command-menu';
import { ChevronDown, Info } from 'lucide-react';
import { PERMISSION_MODE_CONFIG, PERMISSION_MODE_ORDER } from '@craft-agent/shared/agent/modes';
import { LabelIcon, LabelValueTypeIcon } from '@/components/ui/label-icon';
import { LabelValuePopover } from '@/components/ui/label-value-popover';
import { flattenLabels, parseLabelEntry, formatLabelEntry } from '@craft-agent/shared/labels';
import { resolveEntityColor } from '@craft-agent/shared/colors';
import { useTheme } from '@/context/ThemeContext';
import { useDynamicStack } from '@/hooks/useDynamicStack';
import { getState } from '@/config/session-status-config';
import { SessionStatusMenu } from '@/components/ui/session-status-menu';
import { MetadataBadge } from '@/components/ui/metadata-badge';
import { SessionInfoPopover } from './SessionInfoPopover';
// ============================================================================
// Permission Mode Icon Component
// ============================================================================
function PermissionModeIcon({ mode, className }) {
    const config = PERMISSION_MODE_CONFIG[mode];
    return (_jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className: className, children: _jsx("path", { d: config.svgPath }) }));
}
export function ActiveOptionBadges({ permissionMode = 'ask', onPermissionModeChange, tasks = [], sessionId, sessionFolderPath, onKillTask, onInsertMessage, sessionLabels = [], labels = [], onRemoveLabel, onLabelsChange, autoOpenLabelId, onAutoOpenConsumed, sessionStatuses = [], currentSessionStatus, onSessionStatusChange, className, }) {
    // Resolve session label entries to their config objects + parsed values.
    // Entries may be bare IDs ("bug") or valued ("priority::3").
    // Preserves the raw value and original index for editing/removal.
    const resolvedLabels = React.useMemo(() => {
        if (sessionLabels.length === 0 || labels.length === 0)
            return [];
        const flat = flattenLabels(labels);
        const result = [];
        for (let i = 0; i < sessionLabels.length; i++) {
            const parsed = parseLabelEntry(sessionLabels[i]);
            const config = flat.find(l => l.id === parsed.id);
            if (config) {
                result.push({ config, rawValue: parsed.rawValue, index: i });
            }
        }
        return result;
    }, [sessionLabels, labels]);
    const hasLabels = resolvedLabels.length > 0;
    // Resolve the current state from sessionStatuses for the badge display.
    // Every session always has a state — fall back to the default state (or 'todo')
    // when currentSessionStatus isn't explicitly set, matching SessionList's behavior.
    const effectiveStateId = currentSessionStatus || 'todo';
    const resolvedState = sessionStatuses.length > 0 ? getState(effectiveStateId, sessionStatuses) : undefined;
    const hasState = !!resolvedState;
    // Show the stacking container when there are labels (state badge is now rendered standalone on the left)
    const hasStackContent = hasLabels;
    // Dynamic stacking with equal visible strips: ResizeObserver computes per-badge
    // margins directly on children. Wider badges get more negative margins so each
    // shows the same visible strip when stacked. No React re-renders needed.
    const stackRef = useDynamicStack({ gap: 8, minVisible: 20, reservedStart: 0 });
    // Only render if badges or tasks are active
    if (!permissionMode && tasks.length === 0 && !hasState && !hasStackContent) {
        return null;
    }
    return (_jsxs("div", { className: cn("flex items-start gap-2 mb-2 px-px pt-px pb-0.5", className), children: [_jsxs("div", { className: "flex items-start gap-2 min-w-0 flex-1", children: [permissionMode && (_jsx("div", { className: "shrink-0", children: _jsx(PermissionModeDropdown, { permissionMode: permissionMode, onPermissionModeChange: onPermissionModeChange, sessionId: sessionId }) })), hasState && resolvedState && (_jsx("div", { className: "shrink-0", children: _jsx(StateBadge, { state: resolvedState, sessionStatuses: sessionStatuses, onSessionStatusChange: onSessionStatusChange, sessionId: sessionId }) })), hasStackContent && (_jsx("div", { className: "flex-1 min-w-0 max-w-full py-0.5 -my-0.5", style: {
                            // shadow-minimal replicated as drop-shadow (traces masked alpha, no clipping).
                            // Ring uses higher blur+opacity for visible border feel (hard 1px ring can't be replicated exactly).
                            // Blur shadows use reduced blur+opacity to stay tight (accounting for no negative spread in drop-shadow).
                            filter: 'drop-shadow(0px 0px 0.5px rgba(var(--foreground-rgb), 0.3)) drop-shadow(0px 1px 0.1px rgba(0,0,0,0.04)) drop-shadow(0px 3px 0.2px rgba(0,0,0,0.03))',
                        }, children: _jsx("div", { ref: stackRef, className: "flex items-center min-w-0 py-1 -my-1", style: { overflow: 'clip' }, children: resolvedLabels.map(({ config, rawValue, index }) => (_jsx(LabelBadge, { label: config, value: rawValue, autoOpen: config.id === autoOpenLabelId, onAutoOpenConsumed: onAutoOpenConsumed, sessionId: sessionId, onValueChange: (newValue) => {
                                    // Rebuild the sessionLabels array with the updated entry
                                    const updated = [...sessionLabels];
                                    updated[index] = formatLabelEntry(config.id, newValue);
                                    onLabelsChange?.(updated);
                                }, onRemove: () => {
                                    if (onLabelsChange) {
                                        onLabelsChange(sessionLabels.filter((_, i) => i !== index));
                                    }
                                    else {
                                        onRemoveLabel?.(config.id);
                                    }
                                } }, `${config.id}-${index}`))) }) }))] }), _jsx("div", { className: "shrink-0", children: _jsx(FilesPopoverButton, { sessionId: sessionId, sessionFolderPath: sessionFolderPath }) })] }));
}
// ============================================================================
// Label Badge Component
// ============================================================================
/**
 * Format a raw value for display based on the label's valueType.
 * Dates render as locale short format; numbers and strings pass through.
 */
function formatDisplayValue(rawValue, valueType) {
    if (valueType === 'date') {
        const date = new Date(rawValue.includes('T') ? rawValue + ':00Z' : rawValue + 'T00:00:00Z');
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    }
    return rawValue;
}
/**
 * Renders a single label badge with LabelValuePopover for editing/removal.
 * No box-shadow on the badge itself — all shadows come from the parent
 * wrapper's drop-shadow filter (traces masked alpha without clipping).
 * Shows: [color circle] [name] [· value in mono] [chevron]
 */
function LabelBadge({ label, value, autoOpen, onAutoOpenConsumed, onValueChange, onRemove, sessionId, }) {
    const { isDark } = useTheme();
    const [open, setOpen] = React.useState(false);
    // Auto-open the value popover when this label was just added via # menu
    // and has a valueType. Opens exactly once, then clears the signal.
    React.useEffect(() => {
        if (autoOpen && label.valueType) {
            setOpen(true);
            onAutoOpenConsumed?.();
        }
    }, [autoOpen, label.valueType, onAutoOpenConsumed]);
    // Resolve label color for tinting background and text via CSS color-mix
    const resolvedColor = label.color
        ? resolveEntityColor(label.color, isDark)
        : 'var(--foreground)';
    const displayValue = value ? formatDisplayValue(value, label.valueType) : undefined;
    return (_jsx(LabelValuePopover, { label: label, value: value, open: open, onOpenChange: setOpen, onValueChange: onValueChange, onRemove: onRemove, sessionId: sessionId, children: _jsx(MetadataBadge, { label: label.name, value: displayValue, icon: _jsx(LabelIcon, { label: label, size: "lg" }), valueHintIcon: label.valueType ? _jsx(LabelValueTypeIcon, { valueType: label.valueType }) : undefined, badgeColor: resolvedColor, interactive: true, isActive: open, showChevron: true, shadow: "none", className: "relative" }) }));
}
// ============================================================================
// State Badge Component
// ============================================================================
/**
 * Renders the current workflow state as a badge in the dynamic stacking container.
 * Click opens a SessionStatusMenu popover for changing the state.
 * Styled consistently with label badges (h-[30px], rounded-[8px], color-mix tinting).
 */
function StateBadge({ state, sessionStatuses, onSessionStatusChange, sessionId, }) {
    const { t } = useTranslation();
    const [open, setOpen] = React.useState(false);
    const handleSelect = React.useCallback((stateId) => {
        setOpen(false);
        onSessionStatusChange?.(stateId);
    }, [onSessionStatusChange]);
    // Use the state's resolved color for tinting (same color-mix pattern as labels)
    const badgeColor = state.resolvedColor || 'var(--foreground)';
    const applyColor = state.iconColorable;
    const DEFAULT_STATUS_IDS = new Set(['backlog', 'todo', 'needs-review', 'done', 'cancelled']);
    const stateLabel = DEFAULT_STATUS_IDS.has(state.id) ? t(`status.${state.id}`, state.label) : state.label;
    return (_jsxs(Popover, { open: open, onOpenChange: setOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(MetadataBadge, { label: stateLabel, badgeColor: badgeColor, interactive: true, isActive: open, showChevron: true, icon: (_jsx("span", { className: "shrink-0 flex items-center w-3.5 h-3.5 [&>svg]:w-full [&>svg]:h-full [&>img]:w-full [&>img]:h-full [&>span]:text-xs", style: applyColor ? { color: state.resolvedColor } : undefined, children: state.icon })), className: "pl-2.5" }) }), _jsx(PopoverContent, { className: "w-auto p-0 border-0 shadow-none bg-transparent", side: "top", align: "end", sideOffset: 4, onCloseAutoFocus: (e) => {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent('craft:focus-input', {
                        detail: { sessionId }
                    }));
                }, children: _jsx(SessionStatusMenu, { activeState: state.id, onSelect: handleSelect, states: sessionStatuses }) })] }));
}
function FilesPopoverButton({ sessionId, sessionFolderPath }) {
    const { t } = useTranslation();
    const [open, setOpen] = React.useState(false);
    if (!sessionId)
        return null;
    return (_jsx(SessionInfoPopover, { sessionId: sessionId, sessionFolderPath: sessionFolderPath, trigger: (_jsxs("button", { type: "button", className: cn("h-[30px] pl-[12px] pr-[14px] text-xs font-medium rounded-[8px] flex items-center gap-1.5 shrink-0", "outline-none select-none transition-colors shadow-minimal", "hover:bg-foreground/5 data-[state=open]:bg-foreground/5", "bg-[color-mix(in_srgb,var(--background)_97%,var(--foreground)_3%)]", "text-foreground/80"), children: [_jsx(Info, { className: "h-3.5 w-3.5 shrink-0" }), _jsx("span", { className: "whitespace-nowrap", children: t("common.info") })] })) }));
}
function PermissionModeDropdown({ permissionMode, onPermissionModeChange, sessionId }) {
    const { t } = useTranslation();
    const [open, setOpen] = React.useState(false);
    // Optimistic local state - updates immediately, syncs with prop
    const [optimisticMode, setOptimisticMode] = React.useState(permissionMode);
    // Sync optimistic state when prop changes (confirmation from backend)
    React.useEffect(() => {
        setOptimisticMode(permissionMode);
    }, [permissionMode]);
    const activeCommands = React.useMemo(() => {
        return [optimisticMode];
    }, [optimisticMode]);
    // Handle command selection from dropdown
    const handleSelect = React.useCallback((commandId) => {
        if (PERMISSION_MODE_ORDER.includes(commandId)) {
            const mode = commandId;
            setOptimisticMode(mode);
            onPermissionModeChange?.(mode);
        }
        setOpen(false);
    }, [onPermissionModeChange]);
    // Get config for current mode (use optimistic state for instant UI update)
    const config = PERMISSION_MODE_CONFIG[optimisticMode];
    // Mode-specific styling using CSS variables (theme-aware)
    // - allow-all (YOLO): accent color - full autonomy
    // - safe (Plan mode): foreground at 60% opacity - subtle, planning feel
    // - ask (Ask before edits): info color - prompts for edits
    // - auto-edit (Edit automatically): success color - edits flow through
    const modeStyles = {
        'allow-all': {
            className: 'bg-accent/5 text-accent',
            shadowVar: 'var(--accent-rgb)',
        },
        'safe': {
            className: 'bg-foreground/5 text-foreground/60',
            shadowVar: 'var(--foreground-rgb)',
        },
        'ask': {
            className: 'bg-info/10 text-info',
            shadowVar: 'var(--info-rgb)',
        },
        'auto-edit': {
            className: 'bg-success/10 text-success',
            shadowVar: 'var(--success-rgb)',
        },
    };
    const currentStyle = modeStyles[optimisticMode];
    return (_jsxs(Popover, { open: open, onOpenChange: setOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs("button", { type: "button", "data-tutorial": "permission-mode-dropdown", className: cn("h-[30px] pl-2.5 pr-2 text-xs font-medium rounded-[8px] flex items-center gap-1.5 shadow-tinted outline-none select-none", currentStyle.className), style: { '--shadow-color': currentStyle.shadowVar }, children: [_jsx(PermissionModeIcon, { mode: optimisticMode, className: "h-3.5 w-3.5" }), _jsx("span", { children: t(`mode.${optimisticMode}`) }), _jsx(ChevronDown, { className: "h-3.5 w-3.5 opacity-60" })] }) }), _jsx(PopoverContent, { className: "w-auto p-0 rounded-[8px] bg-background text-foreground shadow-modal-small", side: "top", align: "start", sideOffset: 4, onCloseAutoFocus: (e) => {
                    e.preventDefault();
                    // Don't auto-focus the text input on touch devices — it pulls up the virtual keyboard
                    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
                    if (!isTouchDevice) {
                        window.dispatchEvent(new CustomEvent('craft:focus-input', {
                            detail: { sessionId }
                        }));
                    }
                }, children: _jsx(SlashCommandMenu, { commandGroups: DEFAULT_SLASH_COMMAND_GROUPS, activeCommands: activeCommands, onSelect: handleSelect }) })] }));
}
//# sourceMappingURL=ActiveOptionBadges.js.map