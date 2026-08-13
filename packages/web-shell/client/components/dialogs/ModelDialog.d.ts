export type ModelDialogMode = 'main' | 'fast' | 'voice' | 'vision';
interface ModelDialogProps {
    mode?: ModelDialogMode;
    onSelect: (modelId: string) => void;
    models?: ModelDialogModel[];
    currentModelId?: string;
}
interface ModelDialogModel {
    id: string;
    baseModelId?: string;
    label?: string;
    authType?: string;
    contextWindow?: number;
    modalities?: {
        image?: boolean;
        pdf?: boolean;
        audio?: boolean;
        video?: boolean;
    };
    baseUrl?: string;
    envKey?: string;
    isRuntime?: boolean;
}
export declare function ModelDialog({ mode, onSelect, models, currentModelId, }: ModelDialogProps): import("react/jsx-runtime").JSX.Element;
export {};
