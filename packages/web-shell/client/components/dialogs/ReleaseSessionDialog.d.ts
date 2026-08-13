interface ReleaseSessionDialogProps {
    onReleased: (sessionId: string) => void;
    onError: (error: unknown) => void;
    onClose: () => void;
    workspaceCwd?: string;
}
export declare function ReleaseSessionDialog({ onReleased, onError, onClose, workspaceCwd, }: ReleaseSessionDialogProps): import("react/jsx-runtime").JSX.Element;
export {};
