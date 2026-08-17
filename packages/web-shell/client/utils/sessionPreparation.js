import { DAEMON_APPROVAL_MODES } from '@qwen-code/webui/daemon-react-sdk';
import { WEB_SHELL_SESSION_SOURCE_TYPE } from '../constants/sessions';
const SESSION_CREATED_CALLBACK_TIMEOUT_MS = 30_000;
export function isDaemonApprovalMode(mode) {
  return DAEMON_APPROVAL_MODES.includes(mode);
}
export async function createAndAttachSessionForPrompt({
  sessionActions,
  modelId,
  modeId,
  workspaceCwd,
  worktree,
  branch,
  onSessionCreated,
  onSessionAllocated,
  getCurrentSessionId,
  warn = console.warn,
}) {
  // Seed the approval mode in the create request itself so the daemon applies
  // it atomically at spawn (`POST /session` → `spawnOrAttach({ approvalMode })`),
  // saving a follow-up round-trip. Approval mode is fail-closed at spawn: if the
  // requested mode can't be applied the session is not created (this call
  // rejects), rather than silently running in a different mode than requested.
  // The model, by contrast, stays a best-effort follow-up below.
  const approvalMode =
    modeId && isDaemonApprovalMode(modeId) ? modeId : undefined;
  const {
    sessionId,
    worktree: worktreeInfo,
    branch: branchInfo,
  } = await sessionActions.createSession({
    workspaceCwd,
    sourceType: WEB_SHELL_SESSION_SOURCE_TYPE,
    ...(approvalMode ? { approvalMode } : {}),
    ...(worktree ? { worktree } : {}),
    ...(branch ? { branch } : {}),
  });
  onSessionAllocated?.(sessionId);
  let preparationStep = 'prepare new session';
  try {
    if (onSessionCreated) {
      preparationStep = 'run onSessionCreated';
      let timeout;
      try {
        await Promise.race([
          onSessionCreated(sessionId),
          new Promise((_, reject) => {
            timeout = setTimeout(
              () => reject(new Error('onSessionCreated timed out')),
              SESSION_CREATED_CALLBACK_TIMEOUT_MS,
            );
          }),
        ]);
      } finally {
        clearTimeout(timeout);
      }
    }
    preparationStep = 'verify session identity';
    const sessionIdBeforeAttach = getCurrentSessionId();
    if (
      sessionIdBeforeAttach !== undefined &&
      sessionIdBeforeAttach !== sessionId
    ) {
      throw new Error(
        `Session changed before attach: expected ${sessionId}, found ${sessionIdBeforeAttach}`,
      );
    }
    preparationStep = 'attach new session';
    await sessionActions.attachSession();
    preparationStep = 'verify attached session';
    const sessionIdAfterAttach = getCurrentSessionId();
    if (
      sessionIdAfterAttach !== undefined &&
      sessionIdAfterAttach !== sessionId
    ) {
      throw new Error(
        `Session changed while attaching: expected ${sessionId}, found ${sessionIdAfterAttach}`,
      );
    }
  } catch (error) {
    warn(`[WebShell] failed to ${preparationStep}:`, error);
    await sessionActions.releaseSession(sessionId).catch((releaseError) => {
      warn('[WebShell] failed to release unattached session:', releaseError);
    });
    const currentSessionId = getCurrentSessionId();
    if (currentSessionId === undefined || currentSessionId === sessionId) {
      await sessionActions.clearSession().catch((clearError) => {
        warn('[WebShell] failed to clear unattached session:', clearError);
      });
    } else {
      warn(
        `[WebShell] skipping clearSession: expected ${sessionId}, found ${currentSessionId}`,
      );
    }
    throw error;
  }
  // The model still needs a post-create call: `POST /session` only accepts a
  // `modelServiceId`, whereas the composer selects a plain `modelId`. The
  // `POST /session/:id/model` route now resolves the owning workspace runtime,
  // so this succeeds for non-primary workspaces too.
  if (modelId) {
    await sessionActions.setModel(modelId).catch((error) => {
      warn('[WebShell] failed to set model for new session:', error);
    });
  }
  return {
    ...(worktreeInfo ? { worktree: worktreeInfo } : {}),
    ...(branchInfo ? { branch: branchInfo } : {}),
  };
}
//# sourceMappingURL=sessionPreparation.js.map
