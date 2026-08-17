import { jsx as _jsx } from 'react/jsx-runtime';
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
const {
  animationFrameBlocks,
  connection,
  messagesFromBlocks,
  workspaceActions,
  workspaceClient,
  latestMessageListProps,
  messages,
} = vi.hoisted(() => ({
  animationFrameBlocks: [{ id: 'frame-block' }],
  connection: {
    sessionId: 'subagent-session',
    workspaceCwd: '/work/project',
    loadingTranscript: false,
    catchingUp: true,
  },
  messagesFromBlocks: vi.fn(),
  workspaceActions: {
    readFile: vi.fn(),
  },
  workspaceClient: {
    resolveSubagentSession: vi.fn(),
    cancelSubagentSession: vi.fn(),
  },
  latestMessageListProps: {
    current: undefined,
  },
  messages: [
    {
      id: 'tools-1',
      role: 'tool_group',
      tools: [
        {
          callId: 'agent-1',
          toolName: 'agent',
          title: 'agent: investigate',
          status: 'completed',
          kind: 'agent',
          args: { prompt: 'Investigate the failure' },
        },
      ],
    },
  ],
}));
vi.mock('@qwen-code/webui/daemon-react-sdk', () => ({
  DaemonSessionProvider: ({ children }) => children,
  useConnection: () => connection,
  useWorkspace: () => ({ client: workspaceClient }),
  useWorkspaceActions: () => workspaceActions,
}));
vi.mock('../../hooks/useMessages', () => ({
  useMessagesFromBlocks: (translator, blocks) => {
    messagesFromBlocks(translator, blocks);
    return messages;
  },
}));
vi.mock('../../hooks/useAnimationFrameTranscriptBlocks', () => ({
  useAnimationFrameTranscriptBlocks: () => animationFrameBlocks,
}));
vi.mock('../../hooks/useSessionArtifacts', () => ({
  useSessionArtifacts: () => ({ artifacts: [] }),
}));
vi.mock('../MessageList', () => ({
  MessageList: (props) => {
    latestMessageListProps.current = props;
    return _jsx('div', { 'data-testid': 'subagent-transcript' });
  },
}));
const { SubagentDetail } = await import('./SubagentDetail');
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let container = null;
let root = null;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  container = null;
  root = null;
  latestMessageListProps.current = undefined;
  messagesFromBlocks.mockClear();
  workspaceClient.resolveSubagentSession.mockReset();
});
it('opens subagent and fork transcript outputs in source-scoped panel tabs', async () => {
  workspaceClient.resolveSubagentSession.mockResolvedValue({
    sessionId: 'subagent-session',
    status: 'running',
  });
  const onRightPanelOpen = vi.fn();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      _jsx(I18nProvider, {
        language: 'en',
        children: _jsx(SubagentDetail, {
          sessionId: 'parent-session',
          rootToolCallId: 'agent-1',
          initialRootTool: {
            ...messages[0].tools[0],
            startTime: 40_000,
          },
          workspaceCwd: '/work/project',
          onRightPanelOpen: onRightPanelOpen,
        }),
      }),
    );
    await Promise.resolve();
  });
  expect(latestMessageListProps.current).toMatchObject({
    activeTurnStartedAt: 40_000,
    catchingUp: true,
    turnFileChanges: expect.any(Map),
    turnArtifacts: expect.any(Map),
  });
  expect(messagesFromBlocks).toHaveBeenCalledWith(
    expect.any(Function),
    animationFrameBlocks,
  );
  const openOutput = latestMessageListProps.current?.['onTurnOutputOpen'];
  act(() => {
    openOutput({
      id: 'review',
      kind: 'review',
      title: 'Review',
      turnId: 'turn-1',
      changes: [],
      workspaceCwd: '/work/project',
      workspaceId: 'project-id',
    });
  });
  expect(onRightPanelOpen).toHaveBeenCalledWith({
    id: 'review',
    kind: 'review',
    title: 'Review',
    turnId: 'turn-1',
    changes: [],
    sourceSessionId: 'subagent-session',
    workspaceCwd: '/work/project',
    workspaceId: 'project-id',
  });
});
//# sourceMappingURL=SubagentDetail.integration.test.js.map
