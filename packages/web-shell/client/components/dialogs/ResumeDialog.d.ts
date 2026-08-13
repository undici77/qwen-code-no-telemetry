interface ResumeDialogProps {
    onSelect: (sessionId: string) => void;
    onClose: () => void;
    workspaceCwd?: string;
}
export declare function ResumeDialog({ onSelect, onClose, workspaceCwd, }: ResumeDialogProps): import("react/jsx-runtime").JSX.Element;
export {};
