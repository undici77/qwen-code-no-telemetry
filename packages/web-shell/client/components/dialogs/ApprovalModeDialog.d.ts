interface ApprovalModeDialogProps {
  currentMode: string;
  sessionWorkflowEnabled?: boolean;
  onSelect: (modeId: string) => void;
}
export declare function ApprovalModeDialog({
  currentMode,
  sessionWorkflowEnabled,
  onSelect,
}: ApprovalModeDialogProps): import('react/jsx-runtime').JSX.Element;
export {};
