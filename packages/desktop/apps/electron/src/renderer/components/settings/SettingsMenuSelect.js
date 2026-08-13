import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SettingsMenuSelect
 *
 * Menu-style dropdown select with support for option descriptions.
 * Uses Radix Popover for collision detection and accessibility.
 * Includes search/filter when options exceed threshold.
 */
import * as React from 'react';
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { settingsUI } from './SettingsUIConstants';
/**
 * SettingsMenuSelect - Menu-style dropdown with descriptions
 *
 * Uses Radix Popover for automatic collision detection and positioning.
 * Trigger styled like the model selector in FreeFormInput.
 * Includes search filter when options exceed 8 or searchable prop is true.
 */
export function SettingsMenuSelect({ value, onValueChange, options, placeholder, disabled, className, menuWidth = 280, onHover, searchable, searchPlaceholder, }) {
    const { t } = useTranslation();
    const effectiveSearchPlaceholder = searchPlaceholder ?? t("common.search");
    const effectivePlaceholder = placeholder ?? t("common.select");
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const searchInputRef = React.useRef(null);
    const selectedOption = options.find((o) => o.value === value);
    // Show search when explicitly enabled or when there are many options
    const showSearch = searchable ?? options.length > 8;
    // Filter options based on search query
    const filteredOptions = React.useMemo(() => {
        if (!searchQuery.trim())
            return options;
        const query = searchQuery.toLowerCase();
        return options.filter((option) => option.label.toLowerCase().includes(query) ||
            option.value.toLowerCase().includes(query) ||
            option.description?.toLowerCase().includes(query));
    }, [options, searchQuery]);
    const handleSelect = (optionValue) => {
        onValueChange(optionValue);
        setIsOpen(false);
        setSearchQuery('');
        // Clear preview on selection since the actual value is now set
        onHover?.(null);
    };
    // Clear preview when popover closes (via click outside, escape, etc.)
    const handleOpenChange = (open) => {
        setIsOpen(open);
        if (!open) {
            onHover?.(null);
            setSearchQuery('');
        }
        else if (showSearch) {
            // Focus search input when opening
            setTimeout(() => searchInputRef.current?.focus(), 0);
        }
    };
    return (_jsxs(Popover, { open: isOpen, onOpenChange: handleOpenChange, children: [_jsx(PopoverTrigger, { asChild: true, disabled: disabled, children: _jsxs("button", { type: "button", className: cn('inline-flex items-center h-8 px-3 gap-1 text-sm rounded-lg', 'bg-background shadow-minimal', 'hover:bg-foreground/[0.02] transition-colors', 'disabled:cursor-not-allowed disabled:opacity-50', isOpen && 'bg-foreground/[0.02]', className), children: [_jsx("span", { className: "truncate", children: selectedOption?.label || effectivePlaceholder }), _jsx(ChevronDown, { className: "opacity-50 shrink-0 size-3.5" })] }) }), _jsxs(PopoverContent, { align: "end", sideOffset: 4, collisionPadding: 8, className: "p-1.5", style: { width: menuWidth }, onMouseLeave: () => onHover?.(null), children: [showSearch && (_jsxs("div", { className: "relative mb-1.5", children: [_jsx(Search, { className: "absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" }), _jsx("input", { ref: searchInputRef, type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: effectiveSearchPlaceholder, className: cn('w-full h-8 pl-8 pr-3 text-sm rounded-md', 'bg-foreground/5 border-0', 'placeholder:text-muted-foreground/50', 'focus:outline-none focus:ring-1 focus:ring-foreground/20') })] })), _jsx("div", { className: "space-y-0.5 max-h-64 overflow-auto", children: filteredOptions.length === 0 ? (_jsx("div", { className: "px-2.5 py-3 text-sm text-muted-foreground text-center", children: t("common.noResultsFound") })) : (filteredOptions.map((option) => {
                            const isSelected = value === option.value;
                            return (_jsxs("button", { type: "button", onClick: () => handleSelect(option.value), onMouseEnter: () => onHover?.(option.value), className: cn('w-full flex items-center justify-between px-2.5 py-2 rounded-lg', 'hover:bg-foreground/5 transition-colors text-left', isSelected && 'bg-foreground/3'), children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: settingsUI.label, children: option.label }), option.description && (_jsx("div", { className: cn(settingsUI.descriptionSmall, settingsUI.labelDescriptionGap), children: option.description }))] }), isSelected && (_jsx(Check, { className: "size-4 text-foreground shrink-0 ml-3" }))] }, option.value));
                        })) })] })] }));
}
export function SettingsMenuSelectRow({ label, description, value, onValueChange, options, placeholder, disabled, className, inCard = true, menuWidth = 280, onHover, searchable, searchPlaceholder, }) {
    return (_jsxs("div", { "data-layout": "settings-row", className: cn('flex items-center justify-between', inCard ? 'px-4 py-3.5' : 'py-3', className), children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: settingsUI.label, children: label }), description && (_jsx("p", { className: cn(settingsUI.description, settingsUI.labelDescriptionGap), children: description }))] }), _jsx("div", { "data-layout": "settings-control", className: "ml-4 shrink-0", children: _jsx(SettingsMenuSelect, { value: value, onValueChange: onValueChange, options: options, placeholder: placeholder, disabled: disabled, menuWidth: menuWidth, onHover: onHover, searchable: searchable, searchPlaceholder: searchPlaceholder }) })] }));
}
//# sourceMappingURL=SettingsMenuSelect.js.map