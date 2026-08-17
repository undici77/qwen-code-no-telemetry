import type { TurnOutputOpenRequest } from './TurnOutputs';
import type { DaemonSessionArtifact } from '@qwen-code/sdk/daemon';
interface SideTaskPanelProps {
  tabId: string;
  sessionId?: string;
  parentSessionId: string;
  workspaceCwd?: string;
  title: string;
  shouldNameFromFirstPrompt?: boolean;
  initialPrompt?: string;
  createSession: (
    tabId: string,
    parentSessionId: string,
    title: string,
  ) => Promise<{
    sessionId: string;
    displayName?: string;
  }>;
  onCreated: (tabId: string, sessionId: string) => void;
  onTitleChange: (
    tabId: string,
    title: string,
    fromFirstPrompt?: boolean,
  ) => void;
  onRightPanelOpen?: (request: TurnOutputOpenRequest) => void;
  onArtifactsChange?: (
    sessionId: string,
    artifacts: readonly DaemonSessionArtifact[],
  ) => void;
  onError?: (error: unknown, fallback: string) => void;
  sessionWorkflowEnabled?: boolean;
  onImageIngestionNotice?: (tone: 'warning' | 'error', message: string) => void;
}
export declare function SideTaskPanel({
  tabId,
  sessionId,
  parentSessionId,
  workspaceCwd,
  title,
  shouldNameFromFirstPrompt,
  initialPrompt,
  createSession,
  onCreated,
  onTitleChange,
  onRightPanelOpen,
  onArtifactsChange,
  onError,
  sessionWorkflowEnabled,
  onImageIngestionNotice,
}: SideTaskPanelProps): import('react/jsx-runtime').JSX.Element;
export {};
