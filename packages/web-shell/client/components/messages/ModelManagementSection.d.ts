import type { DaemonWorkspaceProviderStatus } from '@qwen-code/webui/daemon-react-sdk';
export interface ModelDeleteTarget {
    authType: string;
    modelId: string;
    baseUrl?: string;
}
export interface ModelManagementProps {
    providers: DaemonWorkspaceProviderStatus[];
    /** Effective current model id (ACP or base form), for the "current" badge. */
    currentModelId: string | undefined;
    loading: boolean;
    error: Error | undefined;
    /** True while a select/delete request is in flight. */
    busy: boolean;
    onSelectModel: (modelId: string) => void;
    onDeleteModel: (target: ModelDeleteTarget) => void;
    onAddModel: () => void;
}
export declare function ModelManagementSection({ providers, currentModelId, loading, error, busy, onSelectModel, onDeleteModel, onAddModel, }: ModelManagementProps): import("react/jsx-runtime").JSX.Element;
