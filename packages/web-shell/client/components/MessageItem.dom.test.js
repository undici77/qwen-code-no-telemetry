import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from '../i18n';
import { WebShellCustomizationProvider } from '../customization';
vi.mock('../App', async () => {
  const { createContext } = await import('react');
  return { CompactModeContext: createContext(false) };
});
// Stub the message body components so MessageItem's own wiring — not the bodies
// — is under test. UserMessage/AssistantMessage throw on a sentinel so we can
// drive the message-level ErrorBoundary (the real one, imported below); the
// rest are inert. MessageTimestamp is a passthrough so its chrome doesn't
// interfere with querying the fallback.
vi.mock('./MessageTimestamp', async () => {
  const React = await import('react');
  return {
    MessageTimestamp: ({ children, toolGroupSpacing }) =>
      React.createElement(
        'div',
        { 'data-tool-group-spacing': String(toolGroupSpacing === true) },
        children,
      ),
    formatTimestamp: () => '',
  };
});
vi.mock('./messages/UserMessage', async () => {
  const React = await import('react');
  return {
    UserMessage: ({ content }) => {
      if (content.includes('__BOOM__')) throw new Error('user boom');
      return React.createElement('div', { 'data-testid': 'user-ok' }, content);
    },
  };
});
vi.mock('./messages/AssistantMessage', async () => {
  const React = await import('react');
  const { useWebShellCustomization } = await import('../customization');
  return {
    AssistantMessage: ({ content, customFooterInfo }) => {
      if (content.includes('__BOOM__')) throw new Error('assistant boom');
      const { renderAssistantTurnFooter } = useWebShellCustomization();
      const customFooter = customFooterInfo
        ? renderAssistantTurnFooter?.(customFooterInfo)
        : undefined;
      return React.createElement(
        'div',
        { 'data-testid': 'assistant-ok' },
        content,
        customFooter,
      );
    },
    ThinkingMessage: ({ generateContent }) =>
      React.createElement('div', {
        'data-testid': 'thinking',
        'data-has-generator': generateContent !== undefined ? 'true' : 'false',
      }),
  };
});
vi.mock('./messages/SystemMessage', () => ({ SystemMessage: () => null }));
vi.mock('./messages/ToolGroup', () => ({ ToolGroup: () => null }));
vi.mock('./messages/PlanMessage', () => ({ PlanMessage: () => null }));
vi.mock('./messages/BtwMessage', () => ({ BtwMessage: () => null }));
vi.mock('./messages/UserShellMessage', () => ({
  UserShellMessage: () => null,
}));
vi.mock('./InsightProgress', () => ({ InsightProgress: () => null }));
vi.mock('./InsightReady', () => ({ InsightReady: () => null }));
const { MessageItem } = await import('./MessageItem');
const { CompactModeContext } = await import('../App');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const RENDER_ERROR = 'This message could not be displayed.';
const mounted = [];
function renderWithRoot(node) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(node));
  mounted.push({ root, container });
  return { root, container };
}
function render(node) {
  return renderWithRoot(node).container;
}
afterEach(() => {
  for (const { root, container } of mounted.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  vi.restoreAllMocks();
});
const userMsg = (id, content) => ({ id, role: 'user', content, timestamp: 0 });
const assistantMsg = (id, content) => ({
  id,
  role: 'assistant',
  content,
  timestamp: 0,
});
const thinkingMsg = (id, content) => ({
  id,
  role: 'thinking',
  content,
  timestamp: 0,
});
const toolMsg = (id) => ({
  id,
  role: 'tool_group',
  tools: [],
  timestamp: 0,
});
function item(message) {
  return _jsx(MessageItem, { message: message });
}
describe('MessageItem error isolation', () => {
  it('renders a healthy message normally (no fallback)', () => {
    const container = render(
      _jsx(I18nProvider, {
        language: 'en',
        children: item(userMsg('1', 'hello')),
      }),
    );
    expect(
      container.querySelector('[data-testid="user-ok"]')?.textContent,
    ).toBe('hello');
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
  it('degrades a crashing message to an inline notice while a sibling survives', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const container = render(
      _jsxs(I18nProvider, {
        language: 'en',
        children: [
          item(userMsg('ok', 'hello')),
          item(userMsg('bad', '__BOOM__')),
        ],
      }),
    );
    // The healthy sibling still renders — one bad message doesn't take down the
    // transcript.
    expect(
      container.querySelector('[data-testid="user-ok"]')?.textContent,
    ).toBe('hello');
    // The crashing message degrades to the localized inline notice.
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      RENDER_ERROR,
    );
  });
  it('right-aligns the fallback for a user message', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const container = render(
      _jsx(I18nProvider, {
        language: 'en',
        children: item(userMsg('1', '__BOOM__')),
      }),
    );
    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert.style.justifyContent).toBe('flex-end');
  });
  it('left-aligns the fallback for an assistant message', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const container = render(
      _jsx(I18nProvider, {
        language: 'en',
        children: item(assistantMsg('1', '__BOOM__')),
      }),
    );
    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert.style.justifyContent).toBe('flex-start');
  });
});
describe('MessageItem selectable wrapper', () => {
  it('keeps the user-selectable wrapper out of layout via display: contents', () => {
    // The wrapper only exists to carry the `data-user-selectable` CSS marker
    // (standalone.css re-enables text selection through it). It must NOT
    // generate a layout box: several parents are flex containers whose item
    // used to be the message body itself — a plain div here becomes the flex
    // item instead and shrinks to content width, squeezing the user chat
    // bubble (max-width: 80% of the shrunken wrapper) so even short messages
    // wrap mid-word.
    const container = render(
      _jsx(I18nProvider, {
        language: 'en',
        children: item(userMsg('1', 'hello')),
      }),
    );
    const wrapper = container.querySelector('[data-user-selectable]');
    expect(wrapper).not.toBeNull();
    expect(wrapper.style.display).toBe('contents');
    // The message body renders inside the wrapper, so the CSS descendant
    // selector `[data-user-selectable] *` still re-enables selection.
    expect(wrapper.querySelector('[data-testid="user-ok"]')).not.toBeNull();
  });
});
describe('MessageItem tool group spacing', () => {
  it('uses larger row spacing only in compact mode', () => {
    const compact = render(
      _jsx(I18nProvider, {
        language: 'en',
        children: _jsx(CompactModeContext.Provider, {
          value: true,
          children: item(toolMsg('compact')),
        }),
      }),
    );
    const regular = render(
      _jsx(I18nProvider, {
        language: 'en',
        children: _jsx(CompactModeContext.Provider, {
          value: false,
          children: item(toolMsg('regular')),
        }),
      }),
    );
    const compactAssistant = render(
      _jsx(I18nProvider, {
        language: 'en',
        children: _jsx(CompactModeContext.Provider, {
          value: true,
          children: item(assistantMsg('assistant', 'answer')),
        }),
      }),
    );
    const defaultTool = render(
      _jsx(I18nProvider, {
        language: 'en',
        children: item(toolMsg('default')),
      }),
    );
    expect(
      compact.firstElementChild?.getAttribute('data-tool-group-spacing'),
    ).toBe('true');
    expect(
      regular.firstElementChild?.getAttribute('data-tool-group-spacing'),
    ).toBe('false');
    expect(
      compactAssistant.firstElementChild?.getAttribute(
        'data-tool-group-spacing',
      ),
    ).toBe('false');
    expect(
      defaultTool.firstElementChild?.getAttribute('data-tool-group-spacing'),
    ).toBe('false');
  });
});
describe('MessageItem generation updates', () => {
  it('rerenders a thinking message when generation becomes available', () => {
    const message = thinkingMsg('1', 'reasoning');
    const { root, container } = renderWithRoot(
      _jsx(I18nProvider, {
        language: 'en',
        children: _jsx(MessageItem, { message: message }),
      }),
    );
    expect(
      container
        .querySelector('[data-testid="thinking"]')
        ?.getAttribute('data-has-generator'),
    ).toBe('false');
    const generateContent = async function* () {};
    act(() =>
      root.render(
        _jsx(I18nProvider, {
          language: 'en',
          children: _jsx(MessageItem, {
            message: message,
            generateContent: generateContent,
          }),
        }),
      ),
    );
    expect(
      container
        .querySelector('[data-testid="thinking"]')
        ?.getAttribute('data-has-generator'),
    ).toBe('true');
  });
});
describe('MessageItem assistant turn footer', () => {
  const customization = (renderAssistantTurnFooter) => ({
    renderAssistantTurnFooter,
  });
  const footerInfo = (turnId, messageId = '1') => ({
    turnId,
    message: {
      id: messageId,
      content: 'hello',
      isStreaming: false,
      timestamp: 0,
    },
  });
  it('passes custom footer info to assistant messages', () => {
    const renderAssistantTurnFooter = vi.fn(({ turnId }) =>
      _jsx('div', { 'data-testid': 'assistant-footer', children: turnId }),
    );
    const container = render(
      _jsx(I18nProvider, {
        language: 'en',
        children: _jsx(WebShellCustomizationProvider, {
          value: customization(renderAssistantTurnFooter),
          children: _jsx(MessageItem, {
            message: assistantMsg('1', 'hello'),
            assistantTurnFooterInfo: footerInfo('u1'),
          }),
        }),
      }),
    );
    expect(renderAssistantTurnFooter).toHaveBeenCalledWith(footerInfo('u1'));
    expect(
      container.querySelector('[data-testid="assistant-footer"]')?.textContent,
    ).toBe('u1');
  });
  it('updates custom footer content when only footer info changes', () => {
    const message = assistantMsg('1', 'hello');
    const renderAssistantTurnFooter = vi.fn(({ turnId }) =>
      _jsx('div', { 'data-testid': 'assistant-footer', children: turnId }),
    );
    const value = customization(renderAssistantTurnFooter);
    const { root, container } = renderWithRoot(
      _jsx(I18nProvider, {
        language: 'en',
        children: _jsx(WebShellCustomizationProvider, {
          value: value,
          children: _jsx(MessageItem, {
            message: message,
            assistantTurnFooterInfo: footerInfo('u1'),
          }),
        }),
      }),
    );
    expect(
      container.querySelector('[data-testid="assistant-footer"]')?.textContent,
    ).toBe('u1');
    act(() =>
      root.render(
        _jsx(I18nProvider, {
          language: 'en',
          children: _jsx(WebShellCustomizationProvider, {
            value: value,
            children: _jsx(MessageItem, {
              message: message,
              assistantTurnFooterInfo: footerInfo('u2'),
            }),
          }),
        }),
      ),
    );
    expect(
      container.querySelector('[data-testid="assistant-footer"]')?.textContent,
    ).toBe('u2');
  });
  it('degrades a crashing custom footer renderer to an inline notice', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const renderAssistantTurnFooter = vi.fn(() => {
      throw new Error('footer boom');
    });
    const container = render(
      _jsx(I18nProvider, {
        language: 'en',
        children: _jsx(WebShellCustomizationProvider, {
          value: customization(renderAssistantTurnFooter),
          children: _jsx(MessageItem, {
            message: assistantMsg('1', 'hello'),
            assistantTurnFooterInfo: footerInfo('u1'),
          }),
        }),
      }),
    );
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      RENDER_ERROR,
    );
  });
});
//# sourceMappingURL=MessageItem.dom.test.js.map
