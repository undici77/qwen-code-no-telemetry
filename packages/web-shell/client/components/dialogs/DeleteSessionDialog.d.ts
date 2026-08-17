interface DeleteSessionDialogProps {
  onDeleted: (sessionIds: string[]) => void;
  onError: (error: unknown) => void;
  onClose: () => void;
  workspaceCwd?: string;
}
export declare function DeleteSessionDialog({
  onDeleted,
  onError,
  onClose,
  workspaceCwd,
}: DeleteSessionDialogProps): import('react/jsx-runtime').JSX.Element;
export {};
