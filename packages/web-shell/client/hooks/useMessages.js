import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useConnection,
  useTranscriptBlocks,
  useWorkspace,
} from '@qwen-code/webui/daemon-react-sdk';
import { transcriptBlocksToDaemonMessages } from '../adapters/transcriptToMessages';
import {
  isActiveToolStatus,
  isBackgroundSubAgentToolCall,
} from '../adapters/toolClassification';
export function transcriptBlocksToLocalizedMessages(blocks, t) {
  return transcriptBlocksToDaemonMessages(blocks, {
    labels: {
      promptCancelled: t('request.cancelled'),
      branchSuccess: (name) => t('branch.success', { name }),
      midTurnInserted: (message) => t('midTurn.inserted', { message }),
      modelStreamInterrupted: t('error.modelStreamInterrupted'),
    },
  });
}
function isTerminalBackgroundAgentStatus(status) {
  return (
    status === 'completed' ||
    status === 'failed' ||
    status === 'cancelled' ||
    status === 'canceled'
  );
}
function getRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value
    : undefined;
}
export function getBackgroundAgentNotificationKey(blocks) {
  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    const block = blocks[index];
    if (block.kind !== 'assistant') continue;
    const meta = getRecord(block.meta);
    const task = getRecord(meta?.['backgroundTask']);
    const status = task?.['status'];
    if (
      meta?.['source'] === 'background_notification' &&
      task?.['kind'] === 'agent' &&
      typeof status === 'string' &&
      isTerminalBackgroundAgentStatus(status)
    ) {
      return `${block.id}:${status}`;
    }
  }
  return '';
}
export function getPendingBackgroundAgentKey(messages) {
  const callIds = [];
  for (const message of messages) {
    if (message.role !== 'tool_group') continue;
    for (const tool of message.tools) {
      if (
        isActiveToolStatus(tool.status) &&
        isBackgroundSubAgentToolCall(tool)
      ) {
        callIds.push(tool.callId);
      }
    }
  }
  return callIds.join('|');
}
export function reconcileBackgroundAgentResolutions(messages, resolutions) {
  if (resolutions.size === 0) return messages;
  let changed = false;
  const reconciled = messages.map((message) => {
    if (message.role !== 'tool_group') return message;
    let toolsChanged = false;
    const tools = message.tools.map((tool) => {
      const resolution = resolutions.get(tool.callId);
      if (
        !resolution ||
        !isTerminalBackgroundAgentStatus(resolution.status) ||
        !isActiveToolStatus(tool.status) ||
        !isBackgroundSubAgentToolCall(tool)
      ) {
        return tool;
      }
      toolsChanged = true;
      const cancelled =
        resolution.status === 'cancelled' || resolution.status === 'canceled';
      const status = resolution.status === 'failed' ? 'failed' : 'completed';
      return {
        ...tool,
        status,
        ...(tool.startTime !== undefined
          ? { endTime: tool.startTime + (resolution.durationMs ?? 0) }
          : {}),
        ...(cancelled
          ? {
              rawOutput: {
                ...(typeof tool.rawOutput === 'object' &&
                tool.rawOutput !== null &&
                !Array.isArray(tool.rawOutput)
                  ? tool.rawOutput
                  : {}),
                status: 'cancelled',
              },
            }
          : {}),
      };
    });
    if (!toolsChanged) return message;
    changed = true;
    return { ...message, tools };
  });
  return changed ? reconciled : messages;
}
export function useMessagesFromBlocks(t, blocks) {
  const workspace = useWorkspace();
  const connection = useConnection();
  const messages = useMemo(
    () => transcriptBlocksToLocalizedMessages(blocks, t),
    [blocks, t],
  );
  const pendingBackgroundAgentKey = useMemo(
    () => getPendingBackgroundAgentKey(messages),
    [messages],
  );
  const backgroundAgentNotificationKey = useMemo(
    () => getBackgroundAgentNotificationKey(blocks),
    [blocks],
  );
  const [resolutionSnapshot, setResolutionSnapshot] = useState();
  const reconciliationRequestRef = useRef(undefined);
  useEffect(() => {
    const sessionId = connection.sessionId;
    if (
      !sessionId ||
      connection.status !== 'connected' ||
      connection.loadingTranscript ||
      connection.catchingUp ||
      !pendingBackgroundAgentKey
    ) {
      if (
        !sessionId ||
        connection.status !== 'connected' ||
        connection.loadingTranscript ||
        connection.catchingUp
      ) {
        reconciliationRequestRef.current = undefined;
      }
      return;
    }
    const requestKey = `${sessionId}:${pendingBackgroundAgentKey}:${backgroundAgentNotificationKey}`;
    const existingRequest = reconciliationRequestRef.current;
    const callIds = pendingBackgroundAgentKey.split('|');
    const request =
      existingRequest?.key === requestKey
        ? existingRequest.request
        : Promise.allSettled(
            callIds.map(async (callId) => {
              const resolution = await workspace.client.resolveSubagentSession(
                sessionId,
                callId,
              );
              return [callId, resolution];
            }),
          ).then((results) => {
            const resolutions = new Map();
            results.forEach((result) => {
              if (
                result.status === 'fulfilled' &&
                isTerminalBackgroundAgentStatus(result.value[1].status)
              ) {
                resolutions.set(...result.value);
              }
            });
            return resolutions;
          });
    reconciliationRequestRef.current = { key: requestKey, request };
    let active = true;
    request
      .then((resolutions) => {
        if (active) {
          setResolutionSnapshot((current) => ({
            sessionId,
            resolutions: new Map([
              ...(current?.sessionId === sessionId ? current.resolutions : []),
              ...resolutions,
            ]),
          }));
        }
      })
      .catch(() => {
        if (reconciliationRequestRef.current?.request === request) {
          reconciliationRequestRef.current = undefined;
        }
      });
    return () => {
      active = false;
    };
  }, [
    backgroundAgentNotificationKey,
    connection.catchingUp,
    connection.loadingTranscript,
    connection.sessionId,
    connection.status,
    pendingBackgroundAgentKey,
    workspace.client,
  ]);
  return useMemo(() => {
    if (
      !resolutionSnapshot ||
      resolutionSnapshot.sessionId !== connection.sessionId
    ) {
      return messages;
    }
    return reconcileBackgroundAgentResolutions(
      messages,
      resolutionSnapshot.resolutions,
    );
  }, [connection.sessionId, messages, resolutionSnapshot]);
}
export function useMessages(t) {
  const blocks = useTranscriptBlocks();
  return useMessagesFromBlocks(t, blocks);
}
//# sourceMappingURL=useMessages.js.map
