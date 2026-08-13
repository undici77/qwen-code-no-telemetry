import type { DaemonWorkspaceMcpToolStatus, DaemonWorkspaceToolStatus } from '@qwen-code/webui/daemon-react-sdk';
export declare function canAddSelection(selection: ReadonlySet<string>, value: string): boolean;
export declare function selectBuiltInTools(tools: DaemonWorkspaceToolStatus[], mcpTools: Record<string, DaemonWorkspaceMcpToolStatus[]>): DaemonWorkspaceToolStatus[];
export declare function selectDiscoverableMcpServerNames(servers: Array<{
    name: string;
    disabled: boolean;
    status: string;
    mcpStatus?: 'connected' | 'connecting' | 'disconnected';
}>): string[];
