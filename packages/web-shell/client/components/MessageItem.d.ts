import type { Message, PermissionRequest } from '../adapters/types';
import type { WebShellAssistantTurnFooterRenderInfo } from '../customization';
import { type SessionContentGenerator } from './messages/AssistantMessage';
interface MessageItemProps {
    message: Message;
    pendingApproval?: PermissionRequest | null;
    /** Run /context detail, exactly like typing it (context-usage panels). */
    onShowContextDetail?: () => void;
    /** Click an uploaded image in a user message to preview it in the right panel. */
    onImagePreview?: (src: string, alt?: string) => void;
    workspaceCwd?: string;
    isLatest?: boolean;
    showRetryHint?: boolean;
    onRetryClick?: () => void;
    sendFailed?: boolean;
    onRetrySend?: () => void;
    onBranchSession?: () => void;
    showAssistantActions?: boolean;
    showAssistantBranch?: boolean;
    isLocateFlashing?: boolean;
    assistantTurnFooterInfo?: WebShellAssistantTurnFooterRenderInfo;
    generateContent?: SessionContentGenerator;
}
export declare const MessageItem: import("react").NamedExoticComponent<MessageItemProps>;
export {};
