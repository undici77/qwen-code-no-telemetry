import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Minus, Plus, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';
function ZoomDropdown({ zoomPercent, activePreset, zoomPresets, onZoomToFit, onZoomToPreset, }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef(null);
    React.useEffect(() => {
        if (!isOpen)
            return;
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);
    return (_jsxs("div", { ref: dropdownRef, className: "relative", children: [_jsxs("button", { onClick: () => setIsOpen(prev => !prev), className: "flex items-center gap-0.5 px-1 py-1 hover:bg-foreground/5 text-[13px] tabular-nums min-w-[4rem] justify-center transition-colors", title: t('overlay.zoomPresets'), children: [zoomPercent, "%"] }), isOpen && (_jsxs("div", { className: cn('absolute top-full right-0 mt-1 min-w-[140px] p-1', 'bg-background rounded-[8px] shadow-strong border border-border/50', 'animate-in fade-in-0 zoom-in-95 duration-100'), children: [_jsx("button", { type: "button", onClick: () => { onZoomToFit(); setIsOpen(false); }, className: "flex items-center gap-2 w-full px-2.5 py-1.5 text-left text-[13px] rounded-[4px] hover:bg-foreground/[0.05] transition-colors", children: t('overlay.zoomToFit') }), _jsx("div", { className: "h-px bg-foreground/5 my-1" }), zoomPresets.map(preset => (_jsxs("button", { type: "button", onClick: () => { onZoomToPreset(preset); setIsOpen(false); }, className: "flex items-center gap-2 w-full px-2.5 py-1.5 text-left text-[13px] rounded-[4px] hover:bg-foreground/[0.05] transition-colors", children: [_jsx("span", { className: "w-3.5 h-3.5 flex items-center justify-center shrink-0", children: activePreset === preset && _jsx(Check, { className: "w-3.5 h-3.5" }) }), _jsxs("span", { className: activePreset === preset ? 'font-medium' : '', children: [preset, "%"] })] }, preset)))] }))] }));
}
export function ZoomControls({ scale, minScale, maxScale, zoomPresets, onZoomIn, onZoomOut, onZoomToPreset, onZoomToFit, onReset, resetDisabled, className, }) {
    const { t } = useTranslation();
    const zoomPercent = Math.round(scale * 100);
    const activePreset = zoomPresets.find(p => p === zoomPercent);
    const resetBtnClass = cn('p-1.5 rounded-[6px] bg-background shadow-minimal cursor-pointer', 'opacity-70 hover:opacity-100 transition-opacity', 'disabled:opacity-30 disabled:cursor-not-allowed', 'focus:outline-none focus-visible:ring-1 focus-visible:ring-ring');
    return (_jsxs("div", { className: cn('flex items-center gap-1.5', className), children: [_jsxs("div", { className: "flex items-center gap-px bg-background shadow-minimal rounded-[6px]", children: [_jsx("button", { onClick: onZoomOut, disabled: scale <= minScale, className: cn('p-1.5 rounded-l-[6px] cursor-pointer', 'opacity-70 hover:opacity-100 transition-opacity', 'disabled:opacity-30 disabled:cursor-not-allowed'), title: t('overlay.zoomOut'), children: _jsx(Minus, { className: "w-3.5 h-3.5" }) }), _jsx(ZoomDropdown, { zoomPercent: zoomPercent, activePreset: activePreset, zoomPresets: zoomPresets, onZoomToFit: onZoomToFit, onZoomToPreset: onZoomToPreset }), _jsx("button", { onClick: onZoomIn, disabled: scale >= maxScale, className: cn('p-1.5 rounded-r-[6px] cursor-pointer', 'opacity-70 hover:opacity-100 transition-opacity', 'disabled:opacity-30 disabled:cursor-not-allowed'), title: t('overlay.zoomIn'), children: _jsx(Plus, { className: "w-3.5 h-3.5" }) })] }), _jsx("button", { onClick: onReset, disabled: resetDisabled, className: resetBtnClass, title: t('overlay.zoomReset'), children: _jsx(RotateCcw, { className: "w-3.5 h-3.5" }) })] }));
}
//# sourceMappingURL=ZoomControls.js.map