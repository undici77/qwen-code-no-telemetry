/**
 * Panel Stack State
 *
 * Single-lane panel model for side-by-side content panels.
 */
import { atom } from 'jotai';
import { parseRouteToNavigationState } from '../../shared/route-parser';
let nextPanelId = 0;
function generatePanelId() {
    return `panel-${++nextPanelId}-${Date.now()}`;
}
export const PANEL_LANE_POLICIES = {
    main: {
        id: 'main',
        order: 0,
        allowedTypes: [
            'session',
            'source',
            'settings',
            'skills',
            'skillMarketplace',
            'other',
        ],
        locked: false,
        singleton: false,
    },
};
export const panelStackAtom = atom([]);
export const focusedPanelIdAtom = atom(null);
export const panelCountAtom = atom((get) => get(panelStackAtom).length);
export const focusedPanelIndexAtom = atom((get) => {
    const stack = get(panelStackAtom);
    const focusedId = get(focusedPanelIdAtom);
    if (!focusedId)
        return 0;
    const idx = stack.findIndex((p) => p.id === focusedId);
    return idx === -1 ? 0 : idx;
});
export const focusedPanelRouteAtom = atom((get) => {
    const stack = get(panelStackAtom);
    const idx = get(focusedPanelIndexAtom);
    return stack[idx]?.route ?? null;
});
export function getPanelTypeFromRoute(route) {
    const navState = parseRouteToNavigationState(route);
    if (!navState)
        return 'other';
    switch (navState.navigator) {
        case 'sessions':
            return 'session';
        case 'sources':
            return 'source';
        case 'settings':
            return 'settings';
        case 'skills':
            return 'skills';
        case 'skillMarketplace':
            return 'skillMarketplace';
        default:
            return 'other';
    }
}
export function getDefaultLaneForType(_type) {
    return 'main';
}
function createEntry(route, proportion, id) {
    const panelType = getPanelTypeFromRoute(route);
    return {
        id: id ?? generatePanelId(),
        route,
        proportion,
        panelType,
        laneId: 'main',
    };
}
function normalizeProportions(stack) {
    if (stack.length === 0)
        return stack;
    const total = stack.reduce((sum, p) => sum + p.proportion, 0);
    if (total <= 0) {
        const equal = 1 / stack.length;
        return stack.map((p) => ({ ...p, proportion: equal }));
    }
    return stack.map((p) => ({ ...p, proportion: p.proportion / total }));
}
export function parseSessionIdFromRoute(route) {
    const segments = route.split('/');
    const idx = segments.indexOf('session');
    if (idx >= 0 && idx + 1 < segments.length) {
        return segments[idx + 1];
    }
    return null;
}
export const focusedSessionIdAtom = atom((get) => {
    const route = get(focusedPanelRouteAtom);
    if (!route)
        return null;
    return parseSessionIdFromRoute(route);
});
export const pushPanelAtom = atom(null, (get, set, { route, afterIndex, }) => {
    const stack = get(panelStackAtom);
    let insertAt = stack.length;
    if (afterIndex !== undefined &&
        afterIndex >= 0 &&
        afterIndex < stack.length) {
        insertAt = afterIndex + 1;
    }
    const newEntry = createEntry(route, 0);
    const newStack = [
        ...stack.slice(0, insertAt),
        newEntry,
        ...stack.slice(insertAt),
    ];
    const normalized = normalizeProportions(newStack);
    set(panelStackAtom, normalized);
    set(focusedPanelIdAtom, newEntry.id);
});
export const closePanelAtom = atom(null, (get, set, id) => {
    const stack = get(panelStackAtom);
    const idx = stack.findIndex((p) => p.id === id);
    if (idx === -1)
        return;
    const remaining = [...stack.slice(0, idx), ...stack.slice(idx + 1)];
    set(panelStackAtom, normalizeProportions(remaining));
    if (get(focusedPanelIdAtom) === id) {
        const newIdx = Math.min(idx, remaining.length - 1);
        set(focusedPanelIdAtom, remaining[newIdx]?.id ?? null);
    }
});
export const reconcilePanelStackAtom = atom(null, (get, set, { entries, focusedIndex, }) => {
    if (entries.length === 0)
        return false;
    const current = get(panelStackAtom);
    const used = new Set();
    const requestedFocusIndex = Math.min(focusedIndex ?? 0, entries.length - 1);
    const requestedFocusRoute = entries[requestedFocusIndex]?.route ?? entries[0].route;
    const newStack = entries.map((target, i) => {
        const positional = current[i];
        if (positional &&
            positional.route === target.route &&
            !used.has(positional.id)) {
            used.add(positional.id);
            const updated = createEntry(target.route, target.proportion, positional.id);
            return { ...updated, proportion: target.proportion };
        }
        const any = current.find((c) => c.route === target.route && !used.has(c.id));
        if (any) {
            used.add(any.id);
            const updated = createEntry(target.route, target.proportion, any.id);
            return { ...updated, proportion: target.proportion };
        }
        if (positional && !used.has(positional.id)) {
            used.add(positional.id);
            const updated = createEntry(target.route, target.proportion, positional.id);
            return { ...updated, proportion: target.proportion };
        }
        return createEntry(target.route, target.proportion);
    });
    const normalized = normalizeProportions(newStack);
    if (normalized.length === current.length &&
        normalized.every((p, i) => p.id === current[i].id &&
            p.route === current[i].route &&
            p.laneId === current[i].laneId &&
            p.panelType === current[i].panelType &&
            Math.abs(p.proportion - current[i].proportion) < 0.001)) {
        const targetFocusId = normalized[Math.min(requestedFocusIndex, normalized.length - 1)]?.id ??
            normalized.find((p) => p.route === requestedFocusRoute)?.id ??
            null;
        if (get(focusedPanelIdAtom) !== targetFocusId) {
            set(focusedPanelIdAtom, targetFocusId);
        }
        return false;
    }
    set(panelStackAtom, normalized);
    const focusId = normalized[Math.min(requestedFocusIndex, normalized.length - 1)]?.id ??
        normalized.find((p) => p.route === requestedFocusRoute)?.id ??
        null;
    set(focusedPanelIdAtom, focusId);
    return true;
});
export const resizePanelsAtom = atom(null, (get, set, { leftIndex, rightIndex, leftProportion, rightProportion, }) => {
    const stack = get(panelStackAtom);
    if (leftIndex < 0 || rightIndex >= stack.length)
        return;
    const newStack = stack.map((p, i) => {
        if (i === leftIndex)
            return { ...p, proportion: leftProportion };
        if (i === rightIndex)
            return { ...p, proportion: rightProportion };
        return p;
    });
    set(panelStackAtom, newStack);
});
export const updateFocusedPanelRouteAtom = atom(null, (get, set, route) => {
    const stack = get(panelStackAtom);
    if (stack.length === 0) {
        const newEntry = createEntry(route, 1);
        set(panelStackAtom, [newEntry]);
        set(focusedPanelIdAtom, newEntry.id);
        return;
    }
    const focusedId = get(focusedPanelIdAtom);
    const focused = stack.find((p) => p.id === focusedId) ?? stack[0];
    const updated = stack.map((p) => p.id === focused.id
        ? {
            ...createEntry(route, p.proportion, p.id),
            proportion: p.proportion,
        }
        : p);
    set(panelStackAtom, updated);
    set(focusedPanelIdAtom, focused.id);
});
export const focusNextPanelAtom = atom(null, (get, set) => {
    const stack = get(panelStackAtom);
    if (stack.length <= 1)
        return;
    const currentIdx = get(focusedPanelIndexAtom);
    const nextIdx = (currentIdx + 1) % stack.length;
    set(focusedPanelIdAtom, stack[nextIdx].id);
});
export const focusPrevPanelAtom = atom(null, (get, set) => {
    const stack = get(panelStackAtom);
    if (stack.length <= 1)
        return;
    const currentIdx = get(focusedPanelIndexAtom);
    const prevIdx = (currentIdx - 1 + stack.length) % stack.length;
    set(focusedPanelIdAtom, stack[prevIdx].id);
});
//# sourceMappingURL=panel-stack.js.map