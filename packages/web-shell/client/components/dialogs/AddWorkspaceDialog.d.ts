export interface WorkspacePathSuggestion {
    name: string;
    path: string;
}
export interface WorkspacePathSuggestions {
    dir: string;
    sep: string;
    suggestions: WorkspacePathSuggestion[];
    truncated: boolean;
}
interface AddWorkspaceDialogProps {
    onClose: () => void;
    onAdd: (cwd: string, persist: boolean, displayName?: string) => Promise<void>;
    displayNameEnabled?: boolean;
    /**
     * Directory autocomplete backend. When provided, typing an absolute path
     * surfaces matching subdirectories in a listbox under the input.
     */
    onSuggest?: (prefix: string) => Promise<WorkspacePathSuggestions>;
    onPick?: () => Promise<string | undefined>;
    persistenceSupported?: boolean;
}
export declare function AddWorkspaceDialog({ onClose, onAdd, displayNameEnabled, onSuggest, onPick, persistenceSupported, }: AddWorkspaceDialogProps): import("react/jsx-runtime").JSX.Element;
export {};
