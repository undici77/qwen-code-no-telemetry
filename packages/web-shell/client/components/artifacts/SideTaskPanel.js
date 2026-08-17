import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DaemonSessionProvider,
  useActions,
  useConnection,
  useTranscriptBlocks,
  useTranscriptHistory,
  useWorkspace,
} from '@qwen-code/webui/daemon-react-sdk';
import {
  WEB_SHELL_HISTORY_PAGE_SIZE,
  WEB_SHELL_MAX_TRANSCRIPT_BLOCKS,
} from '../../constants/sessions';
import { useI18n } from '../../i18n';
import { ChatPane } from '../ChatPane';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { useSessionCatalogController } from '../../session-catalog/session-catalog-hooks';
const FIRST_PROMPT_RENAME_ATTEMPTS = 3;
export function SideTaskPanel({
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
}) {
  if (!sessionId) {
    return _jsx(SideTaskCreation, {
      tabId: tabId,
      parentSessionId: parentSessionId,
      title: title,
      createSession: createSession,
      onCreated: onCreated,
      onTitleChange: onTitleChange,
      onError: onError,
    });
  }
  return _jsx(DaemonSessionProvider, {
    sessionId: sessionId,
    workspaceCwd: workspaceCwd,
    clientId: `side-task:${parentSessionId}:${tabId}`,
    autoConnect: true,
    historyPageSize: WEB_SHELL_HISTORY_PAGE_SIZE,
    subagentTranscriptMode: 'summary',
    maxBlocks: WEB_SHELL_MAX_TRANSCRIPT_BLOCKS,
    suppressOwnUserEcho: true,
    children: _jsx(SideTaskSession, {
      tabId: tabId,
      title: title,
      shouldNameFromFirstPrompt: shouldNameFromFirstPrompt,
      initialPrompt: initialPrompt,
      workspaceCwd: workspaceCwd,
      onTitleChange: onTitleChange,
      onRightPanelOpen: onRightPanelOpen,
      onArtifactsChange: onArtifactsChange,
      onError: onError,
      sessionWorkflowEnabled: sessionWorkflowEnabled,
      onImageIngestionNotice: onImageIngestionNotice,
    }),
  });
}
function SideTaskCreation({
  tabId,
  parentSessionId,
  title,
  createSession,
  onCreated,
  onTitleChange,
  onError,
}) {
  const { t } = useI18n();
  const creatingRef = useRef(false);
  const didAttemptCreateRef = useRef(false);
  const [creationError, setCreationError] = useState();
  const create = useCallback(async () => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    setCreationError(undefined);
    try {
      const created = await createSession(tabId, parentSessionId, title);
      onCreated(tabId, created.sessionId);
      if (created.displayName) onTitleChange(tabId, created.displayName);
    } catch (error) {
      setCreationError(error);
      onError?.(error, t('sideTask.createFailed'));
    } finally {
      creatingRef.current = false;
    }
  }, [
    createSession,
    onCreated,
    onError,
    onTitleChange,
    parentSessionId,
    t,
    tabId,
    title,
  ]);
  useEffect(() => {
    if (didAttemptCreateRef.current) return;
    didAttemptCreateRef.current = true;
    void create();
  }, [create]);
  if (creationError) {
    return _jsxs('div', {
      className:
        'flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground',
      children: [
        _jsx('span', { children: t('sideTask.createFailed') }),
        _jsx(Button, {
          type: 'button',
          variant: 'outline',
          onClick: () => void create(),
          children: t('common.retry'),
        }),
      ],
    });
  }
  return _jsxs('div', {
    className:
      'flex h-full items-center justify-center gap-2 text-sm text-muted-foreground',
    role: 'status',
    children: [
      _jsx(Spinner, {}),
      _jsx('span', { children: t('sideTask.creating') }),
    ],
  });
}
function SideTaskSession({
  tabId,
  title,
  shouldNameFromFirstPrompt,
  initialPrompt,
  workspaceCwd,
  onTitleChange,
  onRightPanelOpen,
  onArtifactsChange,
  onError,
  sessionWorkflowEnabled,
  onImageIngestionNotice,
}) {
  const { t } = useI18n();
  const connection = useConnection();
  const actions = useActions();
  const workspace = useWorkspace();
  const sessionCatalogController = useSessionCatalogController(
    workspace.client,
  );
  const blocks = useTranscriptBlocks();
  const transcriptHistory = useTranscriptHistory();
  const catalogOwnerCwd =
    connection.workspaceCwd &&
    workspaceCwd &&
    connection.workspaceCwd !== workspaceCwd
      ? undefined
      : (connection.workspaceCwd ?? workspaceCwd);
  const hasTextualUserPrompt = blocks.some(
    (block) =>
      block.kind === 'user' &&
      (typeof block.text === 'string'
        ? block.text.trim().length > 0
        : !block.images?.length),
  );
  const restoredEmptySession =
    connection.status === 'connected' &&
    !connection.loadingTranscript &&
    !connection.catchingUp &&
    !transcriptHistory.loading &&
    !transcriptHistory.hasMore &&
    !transcriptHistory.capacityReached &&
    !transcriptHistory.paginationError &&
    !hasTextualUserPrompt;
  const canNameFromFirstPrompt =
    !hasTextualUserPrompt &&
    (shouldNameFromFirstPrompt || restoredEmptySession);
  useEffect(() => {
    const displayName = connection.displayName?.trim();
    if (displayName) onTitleChange(tabId, displayName);
  }, [connection.displayName, onTitleChange, tabId]);
  const nameFromFirstPrompt = useCallback(
    (text) => {
      const nextTitle = Array.from(text.trim()).slice(0, 200).join('');
      if (!nextTitle) return;
      onTitleChange(tabId, nextTitle);
      void (async () => {
        let lastError;
        for (
          let attempt = 0;
          attempt < FIRST_PROMPT_RENAME_ATTEMPTS;
          attempt++
        ) {
          try {
            await actions.renameSession(nextTitle);
            if (connection.sessionId && catalogOwnerCwd) {
              sessionCatalogController.renamed(
                catalogOwnerCwd,
                connection.sessionId,
                nextTitle,
              );
            }
            onTitleChange(tabId, nextTitle, true);
            return;
          } catch (error) {
            lastError = error;
          }
        }
        if (catalogOwnerCwd) {
          sessionCatalogController.invalidateWorkspace(catalogOwnerCwd);
        }
        onError?.(lastError, t('sideTask.renameFailed'));
      })();
    },
    [
      actions,
      catalogOwnerCwd,
      connection.sessionId,
      onError,
      onTitleChange,
      sessionCatalogController,
      t,
      tabId,
    ],
  );
  const initialPromptSentRef = useRef(false);
  useEffect(() => {
    const prompt = initialPrompt?.trim();
    if (!prompt || !restoredEmptySession || initialPromptSentRef.current)
      return;
    initialPromptSentRef.current = true;
    actions
      .sendPrompt(prompt, {
        onAdmitted: () => {
          if (connection.sessionId && catalogOwnerCwd) {
            sessionCatalogController.promptAdmitted(
              catalogOwnerCwd,
              connection.sessionId,
            );
          }
          nameFromFirstPrompt(prompt);
        },
      })
      .catch((error) => {
        initialPromptSentRef.current = false;
        onError?.(error, t('sideTask.promptFailed'));
      });
  }, [
    actions,
    catalogOwnerCwd,
    connection.sessionId,
    initialPrompt,
    nameFromFirstPrompt,
    onError,
    restoredEmptySession,
    sessionCatalogController,
    t,
  ]);
  if (!connection.sessionId) {
    return _jsx('div', {
      className: 'flex h-full items-center justify-center',
      children: _jsx(Spinner, {}),
    });
  }
  return _jsx(ChatPane, {
    title: connection.displayName?.trim() || title,
    workspaceCwd: workspaceCwd,
    onError: onError,
    onImageIngestionNotice: onImageIngestionNotice,
    embedded: true,
    onFirstPromptAdmitted: canNameFromFirstPrompt
      ? nameFromFirstPrompt
      : undefined,
    onRightPanelOpen: onRightPanelOpen,
    onPaneArtifactsChange: onArtifactsChange,
    sessionWorkflowEnabled: sessionWorkflowEnabled,
  });
}
//# sourceMappingURL=SideTaskPanel.js.map
