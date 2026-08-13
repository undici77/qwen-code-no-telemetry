import { type WebShellProps } from '../App';
interface WorkspaceSessionProviderProps {
    sessionId?: string;
    workspaceId?: string;
    workspaceCwd?: string;
    lockWorkspaceCwd?: string;
    clientId?: string;
    restartSseOnPrompt?: boolean;
    historyPageSize?: number;
    webShellProps: WebShellProps;
}
export declare function WorkspaceSessionProvider({ sessionId, workspaceId, workspaceCwd, lockWorkspaceCwd, clientId, restartSseOnPrompt, historyPageSize, webShellProps, }: WorkspaceSessionProviderProps): import("react/jsx-runtime").JSX.Element;
export {};
