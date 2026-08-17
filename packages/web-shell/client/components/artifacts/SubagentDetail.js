import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useEffect, useMemo, useState } from 'react';
import {
  DaemonSessionProvider,
  useConnection,
  useWorkspace,
} from '@qwen-code/webui/daemon-react-sdk';
import { useAnimationFrameTranscriptBlocks } from '../../hooks/useAnimationFrameTranscriptBlocks';
import { useMessagesFromBlocks } from '../../hooks/useMessages';
import { useSessionArtifacts } from '../../hooks/useSessionArtifacts';
import { useI18n } from '../../i18n';
import { MessageList } from '../MessageList';
import { getAgentDescription } from '../messages/toolFormatting';
import { Badge } from '../ui/badge';
import {
  getArtifactsByTurn,
  getFileChangesByTurn,
} from './turnOutputSelectors';
import styles from './SubagentDetail.module.css';
function getSubagentMetrics(rootTool, resolution) {
  const raw =
    typeof rootTool.rawOutput === 'object' && rootTool.rawOutput !== null
      ? rootTool.rawOutput
      : undefined;
  const summary =
    typeof raw?.['executionSummary'] === 'object' &&
    raw['executionSummary'] !== null
      ? raw['executionSummary']
      : undefined;
  const summaryDuration = summary?.['totalDurationMs'];
  const inputTokens = summary?.['inputTokens'];
  const outputTokens = summary?.['outputTokens'];
  const cachedTokens = summary?.['cachedTokens'];
  return {
    status: resolution.status,
    durationMs:
      typeof summaryDuration === 'number'
        ? summaryDuration
        : rootTool.endTime && rootTool.startTime
          ? Math.max(0, rootTool.endTime - rootTool.startTime)
          : resolution.durationMs,
    inputTokens:
      typeof inputTokens === 'number' ? inputTokens : resolution.inputTokens,
    outputTokens:
      typeof outputTokens === 'number' ? outputTokens : resolution.outputTokens,
    cachedTokens:
      typeof cachedTokens === 'number' ? cachedTokens : resolution.cachedTokens,
  };
}
function createDetailClientId() {
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `subagent-detail:${suffix}`;
}
export function findSubagentRootTool(messages, rootToolCallId) {
  for (const message of messages) {
    if (message.role !== 'tool_group') continue;
    const tool = message.tools.find(
      (candidate) => candidate.callId === rootToolCallId,
    );
    if (tool) return tool;
  }
  return undefined;
}
export function getSubagentPrompt(messages, rootTool) {
  const firstUserMessage = messages.find((message) => message.role === 'user');
  return (
    (firstUserMessage?.role === 'user' ? firstUserMessage.content : '') ||
    (typeof rootTool.args?.prompt === 'string' ? rootTool.args.prompt : '')
  );
}
function statusLabel(status, t) {
  switch (status) {
    case 'completed':
    case 'success':
      return t('subagent.completed');
    case 'failed':
    case 'error':
      return t('subagent.failed');
    case 'cancelled':
    case 'canceled':
      return t('subagent.cancelled');
    case 'paused':
      return t('subagent.paused');
    default:
      return t('subagent.running');
  }
}
function SubagentDetailContent({
  rootTool,
  resolution,
  onStop,
  onRightPanelOpen,
  onArtifactsChange,
  onError,
}) {
  const { t } = useI18n();
  const connection = useConnection();
  const blocks = useAnimationFrameTranscriptBlocks();
  const messages = useMessagesFromBlocks(t, blocks);
  const { artifacts } = useSessionArtifacts();
  const artifactsByTurn = useMemo(
    () =>
      getArtifactsByTurn(messages, artifacts, connection.workspaceCwd || ''),
    [artifacts, connection.workspaceCwd, messages],
  );
  const fileChangesByTurn = useMemo(
    () =>
      getFileChangesByTurn(
        messages,
        artifactsByTurn,
        connection.workspaceCwd || '',
      ),
    [artifactsByTurn, connection.workspaceCwd, messages],
  );
  const description = getAgentDescription(rootTool);
  const prompt = getSubagentPrompt(messages, rootTool);
  const metrics = useMemo(
    () => getSubagentMetrics(rootTool, resolution),
    [resolution, rootTool],
  );
  const isRunning =
    metrics.status === 'running' || metrics.status === 'in_progress';
  const [stopping, setStopping] = useState(false);
  const [stopError, setStopError] = useState('');
  useEffect(() => {
    const sessionId = connection.sessionId;
    if (!sessionId) return;
    onArtifactsChange?.(sessionId, artifacts);
    return () => {
      onArtifactsChange?.(sessionId, []);
    };
  }, [artifacts, connection.sessionId, onArtifactsChange]);
  const handleRightPanelOpen = (request) => {
    onRightPanelOpen?.({
      ...request,
      sourceSessionId: connection.sessionId,
    });
  };
  useEffect(() => {
    if (isRunning) return;
    setStopping(false);
    setStopError('');
  }, [isRunning]);
  const handleStop = async () => {
    if (stopping) return;
    setStopping(true);
    setStopError('');
    try {
      const result = await onStop();
      if (!result.cancelled) {
        setStopping(false);
      }
    } catch {
      setStopping(false);
      setStopError(t('tasks.cancelFailed'));
    }
  };
  return _jsxs('div', {
    className: styles.detail,
    children: [
      _jsxs('div', {
        className: styles.overview,
        children: [
          _jsxs('div', {
            className: styles.descriptionRow,
            children: [
              description &&
                _jsx('div', {
                  className: styles.description,
                  children: description,
                }),
              _jsxs('div', {
                className: styles.statusActions,
                children: [
                  _jsx(Badge, {
                    variant: 'outline',
                    className: styles.statusTag,
                    'data-status': metrics.status,
                    children: statusLabel(metrics.status, t),
                  }),
                  isRunning &&
                    _jsx('button', {
                      type: 'button',
                      className: styles.stopButton,
                      disabled: stopping,
                      onClick: () => void handleStop(),
                      children: stopping
                        ? t('common.loading')
                        : t('tasks.action.stop'),
                    }),
                ],
              }),
            ],
          }),
          stopError &&
            _jsx('div', { className: styles.stopError, children: stopError }),
          prompt && _jsx('pre', { className: styles.prompt, children: prompt }),
        ],
      }),
      _jsx('div', {
        className: styles.transcript,
        children: _jsx(MessageList, {
          messages: messages,
          pendingApproval: null,
          loadingTranscript: connection.loadingTranscript,
          catchingUp: connection.catchingUp,
          isResponding: isRunning,
          activeTurnStartedAt: isRunning ? rootTool.startTime : undefined,
          workspaceCwd: connection.workspaceCwd || '',
          hideSessionTimeline: true,
          hideFirstUserMessage: true,
          firstTurnMetrics: metrics,
          includeSubagentToolUsageInMetrics: false,
          turnFileChanges: fileChangesByTurn,
          turnArtifacts: artifactsByTurn,
          onTurnOutputOpen: handleRightPanelOpen,
          onError: onError,
        }),
      }),
    ],
  });
}
export function SubagentDetail({
  sessionId,
  rootToolCallId,
  initialRootTool,
  workspaceCwd,
  onRightPanelOpen,
  onArtifactsChange,
  onError,
}) {
  const { t } = useI18n();
  const workspace = useWorkspace();
  const parentConnection = useConnection();
  const parentBlocks = useAnimationFrameTranscriptBlocks();
  const parentMessages = useMessagesFromBlocks(t, parentBlocks);
  const rootTool =
    (parentConnection.sessionId === sessionId
      ? findSubagentRootTool(parentMessages, rootToolCallId)
      : undefined) ?? initialRootTool;
  const [instance, setInstance] = useState(() => ({
    key: 0,
    clientId: createDetailClientId(),
  }));
  const [resolution, setResolution] = useState();
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let hasResolved = false;
    let retryCount = 0;
    let refreshTimer;
    setResolution(undefined);
    setLoadError(false);
    const refresh = async () => {
      try {
        const resolved = await workspace.client.resolveSubagentSession(
          sessionId,
          rootToolCallId,
        );
        if (cancelled) return;
        hasResolved = true;
        setResolution(resolved);
        if (resolved.status === 'running') {
          refreshTimer = setTimeout(() => void refresh(), 3_000);
        }
      } catch {
        if (cancelled) return;
        if (!hasResolved && retryCount < 3) {
          retryCount += 1;
          refreshTimer = setTimeout(() => void refresh(), 3_000);
        } else if (!hasResolved) {
          setLoadError(true);
        } else {
          refreshTimer = setTimeout(() => void refresh(), 3_000);
        }
      }
    };
    void refresh();
    return () => {
      cancelled = true;
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, [instance.key, rootToolCallId, sessionId, workspace.client]);
  if (loadError) {
    return _jsxs('div', {
      className: styles.state,
      children: [
        _jsx('div', { children: t('subagent.detailsLoadFailed') }),
        _jsx('button', {
          type: 'button',
          className: styles.retry,
          onClick: () =>
            setInstance((current) => ({
              key: current.key + 1,
              clientId: createDetailClientId(),
            })),
          children: t('common.retry'),
        }),
      ],
    });
  }
  if (!resolution) {
    return _jsx('div', {
      className: styles.state,
      children: t('subagent.detailsLoading'),
    });
  }
  return _jsx(
    DaemonSessionProvider,
    {
      sessionId: resolution.sessionId,
      workspaceCwd: workspaceCwd,
      clientId: instance.clientId,
      maxQueued: 256,
      subagentTranscriptMode: 'full',
      suppressOwnUserEcho: true,
      children: _jsx(SubagentDetailContent, {
        rootTool: rootTool,
        resolution: resolution,
        onRightPanelOpen: onRightPanelOpen,
        onArtifactsChange: onArtifactsChange,
        onError: onError,
        onStop: () =>
          workspace.client.cancelSubagentSession(sessionId, rootToolCallId),
      }),
    },
    `${instance.key}:${resolution.sessionId}`,
  );
}
//# sourceMappingURL=SubagentDetail.js.map
