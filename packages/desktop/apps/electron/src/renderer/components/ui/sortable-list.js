import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Sortable List - Flat list drag-and-drop reordering
 *
 * Uses @dnd-kit for polished DnD with:
 * - SmartPointerSensor (5px activation distance, skips data-no-dnd elements)
 * - KeyboardSensor for accessibility
 * - DragOverlay (position:fixed) for proper z-index layering above all panels
 * - Crossfade drop animation: overlay fades out while ghost fades in
 * - Smooth sibling reflow via CSS transforms
 *
 * Usage:
 *   <SortableList items={items} onReorder={handleReorder} renderItem={renderItem} />
 */
import * as React from 'react';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragOverlay, MeasuringStrategy, } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
// ============================================================
// Custom PointerSensor — skips drag activation on elements with data-no-dnd
// This allows interactive elements (e.g., chevron toggles) to receive clicks
// even when nested inside a draggable container.
// ============================================================
function hasNoDndAncestor(element) {
    while (element) {
        if (element.dataset?.noDnd === 'true')
            return true;
        element = element.parentElement;
    }
    return false;
}
export class SmartPointerSensor extends PointerSensor {
    static activators = [
        {
            eventName: 'onPointerDown',
            handler: ({ nativeEvent }) => {
                // Skip drag activation if click target has data-no-dnd="true" (or any ancestor does)
                if (hasNoDndAncestor(nativeEvent.target)) {
                    return false;
                }
                return true;
            },
        },
    ];
}
// ============================================================
// Drop Animation Config
// Crossfade: overlay fades out at final position while ghost fades in.
// Creates a smooth "settle into place" feel.
// ============================================================
const DROP_DURATION = 250;
const dropAnimationConfig = {
    keyframes({ transform }) {
        return [
            { opacity: 1, transform: CSS.Transform.toString(transform.initial) },
            { opacity: 0, transform: CSS.Transform.toString(transform.final) },
        ];
    },
    duration: DROP_DURATION,
    easing: 'ease',
    sideEffects({ active }) {
        // Ghost fades in at new position simultaneously
        active.node.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: DROP_DURATION,
            easing: 'ease',
        });
    },
};
// Measuring config: always re-measure to support animated layouts
const measuringConfig = {
    droppable: {
        strategy: MeasuringStrategy.Always,
    },
};
// ============================================================
// SortableList Component
// ============================================================
export function SortableList({ items, onReorder, renderItem, renderOverlay, showOverlay = true, className, }) {
    const [activeId, setActiveId] = React.useState(null);
    // Sensors: SmartPointerSensor skips data-no-dnd elements, 5px distance threshold
    const sensors = useSensors(useSensor(SmartPointerSensor, {
        activationConstraint: { distance: 5 },
    }), useSensor(KeyboardSensor));
    const activeItem = React.useMemo(() => items.find(item => item.id === activeId), [items, activeId]);
    const handleDragStart = React.useCallback((event) => {
        setActiveId(String(event.active.id));
    }, []);
    const handleDragEnd = React.useCallback((event) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over || active.id === over.id)
            return;
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
            onReorder(arrayMove(items, oldIndex, newIndex));
        }
    }, [items, onReorder]);
    const handleDragCancel = React.useCallback(() => {
        setActiveId(null);
    }, []);
    return (_jsxs(DndContext, { sensors: sensors, collisionDetection: closestCenter, onDragStart: handleDragStart, onDragEnd: handleDragEnd, onDragCancel: handleDragCancel, measuring: measuringConfig, children: [_jsx(SortableContext, { items: items, strategy: verticalListSortingStrategy, children: _jsx("div", { className: className, children: items.map(item => (_jsx(SortableItemWrapper, { id: item.id, isDragActive: activeId === item.id, hideWhileDragging: showOverlay, children: renderItem(item, activeId === item.id, activeId !== null) }, item.id))) }) }), showOverlay && (_jsx(DragOverlay, { dropAnimation: dropAnimationConfig, style: { zIndex: 'var(--z-floating-menu, 400)' }, children: activeItem ? (_jsx("div", { className: "sortable-overlay rounded-[6px] bg-background", style: {
                        boxShadow: '0 0 0 1px rgba(63, 63, 68, 0.05), 0px 15px 15px 0 rgba(34, 33, 81, 0.25)',
                    }, children: renderOverlay ? renderOverlay(activeItem) : renderItem(activeItem, false, true) })) : null }))] }));
}
function SortableItemWrapper({ id, isDragActive, hideWhileDragging, children }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        // Hide ghost only when DragOverlay is enabled
        opacity: isDragging && hideWhileDragging ? 0 : 1,
        cursor: isDragActive ? 'grabbing' : 'grab',
    };
    return (_jsx("div", { ref: setNodeRef, style: style, ...attributes, ...listeners, children: children }));
}
export { arrayMove } from '@dnd-kit/sortable';
//# sourceMappingURL=sortable-list.js.map