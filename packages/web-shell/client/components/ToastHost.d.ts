export type ToastTone = 'info' | 'warning' | 'error' | 'success';
export interface WebShellToast {
    id: string;
    tone: ToastTone;
    message: string;
    /** Epoch ms when the toast auto-dismisses; survives host remounts. */
    dismissAt: number;
}
interface ToastHostProps {
    toasts: readonly WebShellToast[];
    onDismiss: (id: string) => void;
    /** Paint above dialog-backdrop-tier surfaces (fullscreen artifact panel). */
    elevated?: boolean;
}
export declare function ToastHost({ toasts, onDismiss, elevated, }: ToastHostProps): import("react/jsx-runtime").JSX.Element | null;
export {};
