import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * LabelValuePopover - Popover for editing a label's typed value or removing it.
 *
 * Opens when clicking a LabelBadge. Shows:
 * - Value editor input adapted to the label's valueType (number/string/date)
 * - "Remove" button to detach the label from the session
 *
 * Value changes are committed on Enter or blur; Escape cancels and closes.
 * Boolean labels (no valueType) show only the remove button.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, CalendarDays } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import { Calendar } from './calendar';
import { cn } from '@/lib/utils';
import { parseDate } from 'chrono-node';
import { format, parse } from 'date-fns';
export function LabelValuePopover({ label, value, onValueChange, onRemove, open, onOpenChange, sessionId, children, }) {
    const { t } = useTranslation();
    // Local draft value — resets to prop value when popover opens
    const [draft, setDraft] = React.useState(value ?? '');
    // Whether the inline calendar picker is visible (date labels only)
    const [calendarOpen, setCalendarOpen] = React.useState(false);
    const inputRef = React.useRef(null);
    const removeButtonRef = React.useRef(null);
    // Sync draft when popover opens or value prop changes.
    // For date labels with an existing YYYY-MM-DD value, show a human-readable form.
    React.useEffect(() => {
        if (open) {
            setCalendarOpen(false);
            if (label.valueType === 'date' && value) {
                try {
                    const parsed = parse(value, 'yyyy-MM-dd', new Date());
                    setDraft(format(parsed, 'MMMM d, yyyy'));
                }
                catch {
                    setDraft(value);
                }
            }
            else {
                setDraft(value ?? '');
            }
        }
    }, [open, value, label.valueType]);
    /** Move focus into the popover when it opens.
     *  Labels with valueType → focus the value input; boolean labels → focus remove button.
     *  Prevents Radix default so we control exactly what gets focused. */
    const handleOpenAutoFocus = React.useCallback((e) => {
        e.preventDefault();
        if (label.valueType) {
            inputRef.current?.focus();
        }
        else {
            removeButtonRef.current?.focus();
        }
    }, [label.valueType]);
    /** Restore focus to chat input after popover closes.
     *  Matches the pattern used in ActiveOptionBadges. */
    const handleCloseAutoFocus = React.useCallback((e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('craft:focus-input', {
            detail: { sessionId }
        }));
    }, [sessionId]);
    /** Commit the current draft value */
    const commitValue = React.useCallback(() => {
        const trimmed = draft.trim();
        // Empty string means remove value (label becomes boolean-only)
        onValueChange?.(trimmed || undefined);
    }, [draft, onValueChange]);
    /** Handle keyboard in the value input */
    const handleKeyDown = React.useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commitValue();
            onOpenChange(false);
        }
        else if (e.key === 'Escape') {
            e.preventDefault();
            setDraft(value ?? '');
            onOpenChange(false);
        }
    }, [commitValue, onOpenChange, value]);
    /**
     * For date labels: parse the draft text with chrono-node to get a resolved Date.
     * Returns null if the text can't be parsed as a date.
     */
    const parsedDate = React.useMemo(() => {
        if (label.valueType !== 'date' || !draft.trim())
            return null;
        return parseDate(draft.trim());
    }, [label.valueType, draft]);
    // The date to highlight in the calendar: prefer the live-parsed draft,
    // fall back to the committed value prop (YYYY-MM-DD format).
    const calendarDate = React.useMemo(() => {
        if (parsedDate)
            return parsedDate;
        if (label.valueType === 'date' && value) {
            try {
                return parse(value, 'yyyy-MM-dd', new Date());
            }
            catch {
                return undefined;
            }
        }
        return undefined;
    }, [parsedDate, label.valueType, value]);
    /** Handle keyboard in the date input */
    const handleDateKeyDown = React.useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (parsedDate) {
                // Commit the resolved date and close
                onValueChange?.(format(parsedDate, 'yyyy-MM-dd'));
                onOpenChange(false);
            }
            else if (!draft.trim()) {
                // Empty input clears the value
                onValueChange?.(undefined);
                onOpenChange(false);
            }
            // If unparseable non-empty text, keep popover open
        }
        else if (e.key === 'Escape') {
            e.preventDefault();
            setDraft(value ?? '');
            onOpenChange(false);
        }
    }, [parsedDate, draft, onOpenChange, onValueChange, value]);
    return (_jsxs(Popover, { open: open, onOpenChange: onOpenChange, children: [_jsx(PopoverTrigger, { asChild: true, children: children }), _jsxs(PopoverContent, { side: "top", align: "start", sideOffset: 6, collisionPadding: 12, className: "w-56 p-0", onOpenAutoFocus: handleOpenAutoFocus, onCloseAutoFocus: handleCloseAutoFocus, 
                // Stop pointer events from bubbling through React's synthetic event system.
                // Without this, events inside the portaled popover bubble up the React tree
                // to the session button's onMouseDown handler, causing unintended session selection.
                onPointerDown: (e) => e.stopPropagation(), children: [label.valueType === 'date' && (_jsxs("div", { className: "px-1.5 py-1.5 border-b border-border/50", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("input", { ref: inputRef, type: "text", value: draft, onChange: (e) => {
                                            setDraft(e.target.value);
                                        }, onKeyDown: (e) => {
                                            // ArrowDown opens the calendar (matches shadcn pattern)
                                            if (e.key === 'ArrowDown') {
                                                e.preventDefault();
                                                setCalendarOpen(true);
                                            }
                                            else {
                                                handleDateKeyDown(e);
                                            }
                                        }, onBlur: () => {
                                            // Commit parsed date on blur, or clear if empty
                                            if (parsedDate) {
                                                onValueChange?.(format(parsedDate, 'yyyy-MM-dd'));
                                            }
                                            else if (!draft.trim()) {
                                                onValueChange?.(undefined);
                                            }
                                        }, placeholder: "tomorrow, next friday...", className: cn('flex-1 h-7 px-2 text-[13px]', 'bg-transparent', 'text-foreground placeholder:text-foreground/30', 'outline-none') }), _jsxs(Popover, { open: calendarOpen, onOpenChange: setCalendarOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx("button", { type: "button", "aria-label": "Select date", className: cn('flex items-center justify-center w-7 h-7 rounded-[5px]', 'hover:bg-foreground/5 transition-colors cursor-pointer', 'outline-none', calendarOpen && 'bg-foreground/5'), children: _jsx(CalendarDays, { className: "w-3.5 h-3.5 text-foreground/50" }) }) }), _jsx(PopoverContent, { className: "w-[220px] overflow-hidden p-0", side: "top", align: "end", sideOffset: 8, children: _jsx(Calendar, { mode: "single", selected: calendarDate, captionLayout: "dropdown", defaultMonth: calendarDate, onSelect: (date) => {
                                                        if (date) {
                                                            // Commit directly and update draft for display
                                                            onValueChange?.(format(date, 'yyyy-MM-dd'));
                                                            setDraft(format(date, 'MMMM d, yyyy'));
                                                            setCalendarOpen(false);
                                                        }
                                                    } }) })] })] }), parsedDate && (_jsx("div", { className: "px-2 text-[11px] text-foreground/50", children: format(parsedDate, 'EEE, MMM d, yyyy') }))] })), label.valueType && label.valueType !== 'date' && (_jsx("div", { className: "px-1.5 py-1.5 border-b border-border/50", children: _jsx("input", { ref: inputRef, type: label.valueType === 'number' ? 'number' : 'text', step: label.valueType === 'number' ? 'any' : undefined, value: draft, onChange: (e) => setDraft(e.target.value), onKeyDown: handleKeyDown, onBlur: commitValue, placeholder: label.valueType === 'number' ? 'Enter number...' : 'Enter value...', className: cn('w-full h-7 px-2 text-[13px]', 'bg-transparent', 'text-foreground placeholder:text-foreground/30', 'outline-none') }) })), _jsx("div", { className: "p-1", children: _jsxs("button", { ref: removeButtonRef, type: "button", onClick: () => {
                                onRemove?.();
                                onOpenChange(false);
                            }, className: cn('w-full flex items-center gap-2 px-2 py-1.5 rounded-[4px]', 'text-[13px] text-destructive', 'hover:bg-foreground/[0.03] focus:bg-foreground/[0.03]', 'transition-colors cursor-pointer outline-none'), children: [_jsx(Trash2, { className: "w-3.5 h-3.5" }), _jsx("span", { children: t('common.remove') })] }) })] })] }));
}
//# sourceMappingURL=label-value-popover.js.map