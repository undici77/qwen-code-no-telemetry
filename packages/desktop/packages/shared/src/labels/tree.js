/**
 * Label Tree Utilities
 *
 * The label config IS a nested JSON tree — no conversion from flat list needed.
 * These utilities provide recursive operations on the tree:
 * - flattenLabels: collect all labels into a flat array (for ID lookups, validation)
 * - sortLabelsForDisplay: recursively alphabetize a copy of the tree for UI display
 * - flattenLabelsWithParentPath: flatten labels while preserving parent breadcrumbs
 * - findLabelById: locate a label node anywhere in the tree
 * - getDescendantIds: get all child/grandchild IDs (for hierarchical filtering)
 * - findParent: find the parent label of a given label ID
 *
 * Sessions reference labels by simple slug IDs (e.g., ["react", "bug"]).
 * Filtering by a parent includes all descendants.
 */
const labelNameCollator = new Intl.Collator(undefined, { sensitivity: 'base' });
/**
 * Compare label display names consistently for UI ordering.
 * Uses case-insensitive locale-aware comparison so all label surfaces can share
 * the same rule instead of mixing lowercase normalization and raw localeCompare.
 */
export function compareLabelNamesForDisplay(a, b) {
    return labelNameCollator.compare(a.name, b.name);
}
/**
 * Flatten the entire label tree into a one-dimensional array.
 * Useful for ID lookups, uniqueness validation, and session label checks.
 * Traverses depth-first (parent before children).
 */
export function flattenLabels(labels) {
    const result = [];
    function walk(nodes) {
        for (const node of nodes) {
            result.push(node);
            if (node.children && node.children.length > 0) {
                walk(node.children);
            }
        }
    }
    walk(labels);
    return result;
}
/**
 * Return a recursively sorted copy of the label tree for user-facing display.
 * Does not mutate the original config tree.
 */
export function sortLabelsForDisplay(labels) {
    return [...labels]
        .map((label) => ({
        ...label,
        children: label.children && label.children.length > 0
            ? sortLabelsForDisplay(label.children)
            : label.children,
    }))
        .sort(compareLabelNamesForDisplay);
}
/**
 * Flatten labels while preserving parent breadcrumb names for display/search UIs.
 * Ordering follows the provided tree order so callers can choose whether to feed
 * raw config order or a recursively display-sorted tree.
 */
export function flattenLabelsWithParentPath(labels) {
    const result = [];
    function walk(nodes, parentNames) {
        for (const node of nodes) {
            result.push({
                label: node,
                parentNames,
                parentPath: parentNames.length > 0 ? `${parentNames.join(' / ')} / ` : undefined,
            });
            if (node.children && node.children.length > 0) {
                walk(node.children, [...parentNames, node.name]);
            }
        }
    }
    walk(labels, []);
    return result;
}
/**
 * Find a label by ID anywhere in the tree.
 * Returns the label config or undefined if not found.
 */
export function findLabelById(labels, id) {
    for (const node of labels) {
        if (node.id === id)
            return node;
        if (node.children && node.children.length > 0) {
            const found = findLabelById(node.children, id);
            if (found)
                return found;
        }
    }
    return undefined;
}
/**
 * Get all descendant label IDs for a given label.
 * Used for hierarchical filtering — clicking a parent label shows sessions
 * tagged with it OR any of its descendants.
 * Does NOT include the label itself, only its children/grandchildren.
 */
export function getDescendantIds(labels, parentId) {
    // First find the parent node in the tree
    const parent = findLabelById(labels, parentId);
    if (!parent || !parent.children || parent.children.length === 0) {
        return [];
    }
    // Collect all descendant IDs recursively
    const result = [];
    function collectIds(nodes) {
        for (const node of nodes) {
            result.push(node.id);
            if (node.children && node.children.length > 0) {
                collectIds(node.children);
            }
        }
    }
    collectIds(parent.children);
    return result;
}
/**
 * Find the parent of a given label ID in the tree.
 * Returns the parent LabelConfig or undefined if the label is at root level.
 */
export function findParent(labels, targetId) {
    for (const node of labels) {
        if (node.children) {
            // Check if any direct child matches
            if (node.children.some(child => child.id === targetId)) {
                return node;
            }
            // Recurse into children
            const found = findParent(node.children, targetId);
            if (found)
                return found;
        }
    }
    return undefined;
}
/**
 * Collect all IDs that exist in the tree.
 * Convenience wrapper around flattenLabels for quick membership checks.
 */
export function collectAllIds(labels) {
    return new Set(flattenLabels(labels).map(l => l.id));
}
/**
 * Convert a LabelConfig[] tree into LabelTreeNode[] for the UI.
 * Since the config is already a nested tree, this maps each node
 * to the UI shape with fullId/segment fields.
 */
export function buildLabelTree(labels) {
    return labels.map(label => ({
        fullId: label.id,
        segment: label.id,
        label,
        children: label.children ? buildLabelTree(label.children) : [],
    }));
}
/**
 * Get the display name for a label by its ID.
 * Falls back to titlecased slug if label not found in the tree.
 */
export function getLabelDisplayName(labels, labelId) {
    const label = findLabelById(labels, labelId);
    if (label)
        return label.name;
    return labelId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
//# sourceMappingURL=tree.js.map