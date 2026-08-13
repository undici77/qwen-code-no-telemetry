import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SearchableModelInput
 *
 * Input field with a dropdown button that shows a searchable list of models.
 * Used for custom model name configuration in API settings.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@craft-agent/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
export function SearchableModelInput({ value, onChange, onBlur, placeholder = 'e.g., qwen3-coder-flash', models, isLoading, onFetchModels, fetchDisabled, className, }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const searchInputRef = React.useRef(null);
    // Filter models based on search query
    const filteredModels = React.useMemo(() => {
        if (!searchQuery.trim())
            return models;
        const query = searchQuery.toLowerCase();
        return models.filter((model) => model.id.toLowerCase().includes(query) ||
            model.name?.toLowerCase().includes(query));
    }, [models, searchQuery]);
    const handleSelect = (modelId) => {
        onChange(modelId);
        setIsOpen(false);
        setSearchQuery('');
        onBlur?.();
    };
    const handleFetchClick = async () => {
        if (onFetchModels) {
            await onFetchModels();
            setIsOpen(true);
            // Focus search input after models load
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
    };
    const handleOpenChange = (open) => {
        setIsOpen(open);
        if (!open) {
            setSearchQuery('');
        }
        else if (models.length > 0) {
            // Focus search input when opening
            setTimeout(() => searchInputRef.current?.focus(), 0);
        }
    };
    return (_jsxs("div", { className: cn('relative', className), children: [_jsx(Input, { placeholder: placeholder, value: value, onChange: (e) => onChange(e.target.value), onBlur: onBlur, className: "pr-12" }), _jsxs(Popover, { open: isOpen, onOpenChange: handleOpenChange, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(Button, { variant: "outline", size: "sm", className: "absolute right-1 top-1 h-7", onClick: handleFetchClick, disabled: fetchDisabled || isLoading, children: isLoading ? _jsx(Spinner, { className: "size-3" }) : '▼' }) }), models.length > 0 && (_jsxs(PopoverContent, { align: "end", sideOffset: 4, collisionPadding: 8, className: "p-1.5 w-[var(--radix-popover-trigger-width)]", style: { minWidth: 280 }, children: [_jsxs("div", { className: "relative mb-1.5", children: [_jsx(Search, { className: "absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" }), _jsx("input", { ref: searchInputRef, type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: t("apiSetup.searchModels"), className: cn('w-full h-8 pl-8 pr-3 text-sm rounded-md', 'bg-foreground/5 border-0', 'placeholder:text-muted-foreground/50', 'focus:outline-none focus:ring-1 focus:ring-foreground/20') })] }), _jsx("div", { className: "max-h-64 overflow-auto space-y-0.5", children: filteredModels.length === 0 ? (_jsx("div", { className: "px-2.5 py-3 text-sm text-muted-foreground text-center", children: t("settings.ai.noModelsFound") })) : (filteredModels.map((model) => (_jsx("button", { type: "button", className: cn('w-full px-2.5 py-2 text-left text-sm rounded-lg', 'hover:bg-foreground/5 transition-colors', value === model.id && 'bg-foreground/3'), onClick: () => handleSelect(model.id), children: model.name || model.id }, model.id)))) })] }))] })] }));
}
//# sourceMappingURL=SearchableModelInput.js.map