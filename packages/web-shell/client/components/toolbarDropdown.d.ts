export interface ToolbarDropdownItem {
    id: string;
    label: string;
    searchText?: string;
}
export declare function filterToolbarDropdownItems<T extends ToolbarDropdownItem>(items: readonly T[], query: string): T[];
export declare function getToolbarItemVisibility({ availableWidth, items, }: {
    availableWidth: number;
    items: ReadonlyArray<{
        id: string;
        expansionWidth: number;
        ready?: boolean;
    }>;
}): Record<string, boolean>;
export declare function getToolbarItemVisibilityWithHysteresis({ availableWidth, items, currentVisibility, expansionMargin, }: {
    availableWidth: number;
    items: ReadonlyArray<{
        id: string;
        expansionWidth: number;
        ready?: boolean;
    }>;
    currentVisibility: Readonly<Record<string, boolean>>;
    expansionMargin: number;
}): Record<string, boolean>;
export declare function getToolbarExpansionBudget({ toolbarWidth, leadingWidth, rightWidth, currentExpansionWidth, gap, }: {
    toolbarWidth: number;
    leadingWidth: number;
    rightWidth: number;
    currentExpansionWidth: number;
    gap: number;
}): number;
export declare function resolveToolbarModelLabel({ currentModelLabel, lastConfirmedModelLabel, }: {
    currentModelLabel: string;
    lastConfirmedModelLabel: string;
}): {
    modelLabel: string;
    modelLabelReady: boolean;
    nextConfirmedModelLabel: string;
};
