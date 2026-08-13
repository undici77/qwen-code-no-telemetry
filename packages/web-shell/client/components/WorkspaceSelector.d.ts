export interface WorkspaceSelectorOption {
    id: string;
    cwd: string;
    label: string;
    primary: boolean;
    trusted: boolean;
}
interface WorkspaceSelectorProps {
    workspaces: WorkspaceSelectorOption[];
    selectedWorkspaceCwd?: string;
    disabled?: boolean;
    busy?: boolean;
    scratchSupported: boolean;
    existingFolderSupported: boolean;
    className?: string;
    onSelectWorkspace: (cwd: string | undefined) => void;
    onCreateScratch: () => void;
    onOpenExistingFolder: () => void;
}
/**
 * Composer workspace menu. Capability-gated creation actions and disabled
 * untrusted entries keep presentation aligned with daemon authorization.
 */
export declare function WorkspaceSelector({ workspaces, selectedWorkspaceCwd, disabled, busy, scratchSupported, existingFolderSupported, className, onSelectWorkspace, onCreateScratch, onOpenExistingFolder, }: WorkspaceSelectorProps): import("react/jsx-runtime").JSX.Element | null;
export {};
