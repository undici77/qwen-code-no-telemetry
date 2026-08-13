import { type DaemonWorkspaceAgentDetail } from '@qwen-code/webui/daemon-react-sdk';
interface AgentCreatePageProps {
    initialScope?: 'workspace' | 'global';
    agent?: DaemonWorkspaceAgentDetail;
    onCancel: () => void;
    onCreated: (name: string) => void;
}
export declare function AgentCreatePage({ initialScope, agent, onCancel, onCreated, }: AgentCreatePageProps): import("react/jsx-runtime").JSX.Element;
export {};
