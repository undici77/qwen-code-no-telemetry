import { jsx as _jsx } from 'react/jsx-runtime';
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChatViewer } from '@qwen-code/webui';
const params = new URLSearchParams(window.location.search);
const kind = params.get('kind') === 'execute' ? 'execute' : 'bash';
const output = `${'0123456789'.repeat(82)}__${kind.toUpperCase()}_TAIL__`;
const message = {
  uuid: `${kind}-layout-message`,
  timestamp: '2026-07-31T00:00:00.000Z',
  type: 'tool_call',
  toolCall: {
    toolCallId: `${kind}-layout-tool-call`,
    kind,
    title: 'Run layout regression fixture',
    status: 'completed',
    rawInput: { command: 'printf long-output' },
    content: [
      {
        type: 'content',
        content: { type: 'text', text: output },
      },
    ],
  },
};
ReactDOM.createRoot(document.getElementById('root')).render(
  _jsx(React.StrictMode, {
    children: _jsx(ChatViewer, {
      messages: [message],
      autoScroll: false,
      theme: 'light',
    }),
  }),
);
//# sourceMappingURL=webui-tool-output-layout-harness.js.map
