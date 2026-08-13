import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip';
import { cn } from '../../lib/utils';
import { getAnnotationRectVisual, getAnnotationChipVisual } from './annotation-style-tokens';
import { getAnnotationChipInteraction } from './interaction-policy';
export function AnnotationOverlayLayer({ rects, chips, annotations, getTooltipText, allowChipOpen = true, onChipOpen, }) {
    const annotationMap = React.useMemo(() => {
        return new Map((annotations ?? []).map((annotation) => [annotation.id, annotation]));
    }, [annotations]);
    if (rects.length === 0 && chips.length === 0) {
        return null;
    }
    return (_jsxs("div", { "data-ca-annotation-overlay": true, className: "pointer-events-none absolute inset-0 z-[2]", children: [rects.map((rect, idx) => {
                const rectVisual = getAnnotationRectVisual(rect);
                return (_jsx("div", { className: rectVisual.className, style: {
                        left: rect.left - 4,
                        top: rect.top - 1,
                        width: rect.width + 8,
                        height: rect.height + 2,
                        backgroundColor: rect.color,
                        borderRadius: '4px',
                        ...rectVisual.style,
                    } }, `rect-${rect.id}-${idx}`));
            }), chips.map((chip) => {
                const chipVisual = getAnnotationChipVisual(chip);
                const chipAnnotation = annotationMap.get(chip.id) ?? null;
                const interaction = getAnnotationChipInteraction(chipAnnotation);
                const tooltipText = chipAnnotation && getTooltipText ? getTooltipText(chipAnnotation, chip.index) : '';
                const canOpenChip = allowChipOpen && interaction.clickable;
                const chipButton = (_jsx("button", { type: "button", "data-ca-annotation-id": chip.id, "data-ca-annotation-index": String(chip.index), "aria-disabled": !canOpenChip, onClick: canOpenChip ? (event) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        onChipOpen({
                            annotationId: chip.id,
                            index: chip.index,
                            anchorX: rect.left + rect.width / 2,
                            anchorY: rect.top - 8,
                            mode: interaction.openMode,
                        });
                    } : undefined, className: cn(chipVisual.className, !canOpenChip && 'cursor-default'), style: {
                        left: chip.left,
                        top: chip.top,
                        transform: 'translate(-2px, -8px)',
                        minWidth: '16px',
                        height: '15px',
                        padding: '0 3px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600',
                        lineHeight: '15px',
                        textAlign: 'center',
                        userSelect: 'none',
                        position: 'absolute',
                        ...chipVisual.style,
                    }, children: chip.sentFollowUp ? 'i' : chip.index }));
                if (tooltipText) {
                    return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: chipButton }), _jsx(TooltipContent, { side: "top", className: "max-w-[280px] whitespace-pre-wrap text-xs", children: tooltipText })] }, `chip-${chip.id}`));
                }
                return (_jsx(React.Fragment, { children: chipButton }, `chip-${chip.id}`));
            })] }));
}
//# sourceMappingURL=AnnotationOverlayLayer.js.map