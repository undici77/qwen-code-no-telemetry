import { jsx as _jsx } from "react/jsx-runtime";
/**
 * EntityPanel<T> — Config-driven entity list with built-in keyboard nav + multi-select.
 *
 * Wraps EntityList + EntityRow + useEntityListInteractions so consumers
 * only provide a data mapping via `mapItem`.
 */
import * as React from 'react';
import { useAction } from '@/actions';
import { EntityList } from './entity-list';
import { EntityRow } from './entity-row';
import { useEntityListInteractions } from '@/hooks/useEntityListInteractions';
export function EntityPanel({ items, groups, getId, mapItem, selection, onItemClick, selectedId, emptyState, className, }) {
    const interactionItems = groups?.length
        ? groups.flatMap((group) => group.items)
        : items;
    const selectionStore = selection.useSelectionStore();
    const interactions = useEntityListInteractions({
        items: interactionItems,
        getId,
        keyboard: {
            onNavigate: (item) => onItemClick(item),
            onActivate: (item) => onItemClick(item),
        },
        multiSelect: true,
        selectionStore,
    });
    useAction('navigator.clearSelection', () => {
        interactions.selection.clear();
    }, {
        enabled: () => interactions.selection.isMultiSelectActive,
    }, [interactions.selection]);
    return (_jsx(EntityList, { items: items, groups: groups, getKey: getId, containerRef: interactions.listProps.containerRef, containerProps: interactions.listProps.containerProps, className: className, emptyState: emptyState, renderItem: (item, index, isFirst) => {
            const mapped = mapItem(item);
            const interactionIndex = groups?.length
                ? interactionItems.findIndex((candidate) => getId(candidate) === getId(item))
                : index;
            const rowProps = interactions.getRowProps(item, interactionIndex);
            return (_jsx(EntityRow, { icon: mapped.icon, title: mapped.title, badges: mapped.badges, trailing: mapped.trailing, controls: mapped.controls, isSelected: selectedId === getId(item), isInMultiSelect: rowProps.isInMultiSelect, showSeparator: !isFirst, onMouseDown: (e) => {
                    rowProps.onMouseDown(e);
                    if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button !== 2) {
                        onItemClick(item);
                    }
                }, buttonProps: rowProps.buttonProps, menuContent: mapped.menu, hideMoreButton: mapped.hideMoreButton, dataAttributes: mapped.dataAttributes }));
        } }));
}
//# sourceMappingURL=entity-panel.js.map