import type { DaemonSessionSummary } from '@qwen-code/sdk/daemon';
interface SessionDetailsSubmenuProps {
    session: DaemonSessionSummary;
    label: string;
    completedUnread: boolean;
    onError: (error: unknown, fallback: string) => void;
    getCollisionBoundary: () => HTMLElement | null;
}
export declare function SessionDetailsSubmenu({ session, label, completedUnread, onError, getCollisionBoundary, }: SessionDetailsSubmenuProps): import("react/jsx-runtime").JSX.Element;
export {};
