export interface FallbackModelOption {
    /** Base model id persisted in the modelFallbacks setting. */
    baseId: string;
    label: string;
}
export interface ModelFallbacksDialogProps {
    models: FallbackModelOption[];
    /** Currently configured fallback base ids, in priority order. */
    current: string[];
    max: number;
    onConfirm: (baseIds: string[]) => void;
    onClose: () => void;
}
export declare function ModelFallbacksDialog({ models, current, max, onConfirm, onClose, }: ModelFallbacksDialogProps): import("react/jsx-runtime").JSX.Element;
