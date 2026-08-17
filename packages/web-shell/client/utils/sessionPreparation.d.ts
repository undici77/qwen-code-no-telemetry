import { type DaemonApprovalMode } from '@qwen-code/webui/daemon-react-sdk';
type PromptSessionActions = {
  createSession: (options?: {
    workspaceCwd?: string;
    approvalMode?: DaemonApprovalMode;
    sourceType?: string;
    worktree?: {
      slug?: string;
    };
    branch?: {
      name: string;
    };
  }) => Promise<{
    sessionId: string;
    worktree?: {
      slug: string;
      path: string;
      branch: string;
    };
    branch?: {
      name: string;
      baseBranch: string;
    };
  }>;
  attachSession: () => Promise<void>;
  clearSession: () => Promise<void>;
  releaseSession: (sessionId: string) => Promise<void>;
  setModel: (modelId: string) => Promise<unknown>;
};
export declare function isDaemonApprovalMode(
  mode: string,
): mode is DaemonApprovalMode;
export declare function createAndAttachSessionForPrompt({
  sessionActions,
  modelId,
  modeId,
  workspaceCwd,
  worktree,
  branch,
  onSessionCreated,
  onSessionAllocated,
  getCurrentSessionId,
  warn,
}: {
  sessionActions: PromptSessionActions;
  modelId?: string;
  modeId?: string;
  workspaceCwd?: string;
  worktree?: {
    slug?: string;
  };
  branch?: {
    name: string;
  };
  onSessionCreated?: (sessionId: string) => Promise<void> | void;
  onSessionAllocated?: (sessionId: string) => void;
  getCurrentSessionId: () => string | undefined;
  warn?: (message?: unknown, ...optionalParams: unknown[]) => void;
}): Promise<{
  worktree?: {
    slug: string;
    path: string;
    branch: string;
  };
  branch?: {
    name: string;
    baseBranch: string;
  };
}>;
export {};
