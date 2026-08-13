import { type Ref } from 'react';
import type { SerializedMcpStatusMessage } from '../messages/McpStatusMessage';
interface PluginManagerPageProps {
    mcpMessage: SerializedMcpStatusMessage | null;
    loadMcpMessage: () => Promise<void>;
    onClose: () => void;
    onUseSkill: (name: string) => void;
    initialFocusRef?: Ref<HTMLButtonElement>;
}
export declare function PluginManagerPage({ mcpMessage, loadMcpMessage, onClose, onUseSkill, initialFocusRef, }: PluginManagerPageProps): import("react/jsx-runtime").JSX.Element;
export {};
