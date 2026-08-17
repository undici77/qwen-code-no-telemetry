import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StrictMode, act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from '../../i18n';
import { WebShellPortalRootContext } from '../../portalRoot';
import { immediateClipboardWrite } from '../../test/reactHarness';
import { EnhancedMarkdownTable } from './EnhancedMarkdownTable';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const mounted = [];
const originalDocumentHidden = Object.getOwnPropertyDescriptor(
  document,
  'hidden',
);
const originalElementFromPoint = document.elementFromPoint;
const COLUMN_DRAG_MIME = 'application/x-qwen-web-shell-table-column';
afterEach(() => {
  for (const { root, container, portalRoot } of mounted.splice(0)) {
    act(() => root.unmount());
    container.remove();
    portalRoot?.remove();
  }
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.getSelection()?.removeAllRanges();
  if (originalDocumentHidden) {
    Object.defineProperty(document, 'hidden', originalDocumentHidden);
  } else {
    Reflect.deleteProperty(document, 'hidden');
  }
  if (originalElementFromPoint) {
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: originalElementFromPoint,
    });
  } else {
    Reflect.deleteProperty(document, 'elementFromPoint');
  }
});
function renderTableContent(children, language = 'en', fallback) {
  const container = document.createElement('div');
  const appRoot = document.createElement('div');
  appRoot.dataset.webShellAppRoot = '';
  const portalRoot = document.createElement('div');
  portalRoot.dataset.webShellPortalRoot = '';
  portalRoot.dataset.webShellShadcn = '';
  document.body.appendChild(container);
  container.append(appRoot, portalRoot);
  const root = createRoot(appRoot);
  act(() => {
    root.render(
      _jsx(WebShellPortalRootContext.Provider, {
        value: portalRoot,
        children: _jsx(I18nProvider, {
          language: language,
          children: _jsx(EnhancedMarkdownTable, {
            fallback: fallback,
            children: children,
          }),
        }),
      }),
    );
  });
  mounted.push({ root, container, portalRoot });
  return container;
}
function renderTable(language = 'en') {
  return renderTableContent(
    [
      _jsx(
        'thead',
        {
          children: _jsxs('tr', {
            children: [
              _jsx('th', { children: 'Team' }),
              _jsx('th', { children: 'Score' }),
            ],
          }),
        },
        'head',
      ),
      _jsxs(
        'tbody',
        {
          children: [
            _jsxs('tr', {
              children: [
                _jsx('td', { children: 'Alpha' }),
                _jsx('td', { children: '10' }),
              ],
            }),
            _jsxs('tr', {
              children: [
                _jsx('td', { children: 'Beta' }),
                _jsx('td', { children: '2' }),
              ],
            }),
            _jsxs('tr', {
              children: [
                _jsx('td', { children: 'Gamma' }),
                _jsx('td', { children: '30' }),
              ],
            }),
          ],
        },
        'body',
      ),
    ],
    language,
  );
}
function renderWideTable() {
  return renderTableContent([
    _jsx(
      'thead',
      {
        children: _jsxs('tr', {
          children: [
            _jsx('th', { children: 'Team' }),
            _jsx('th', { children: 'Region' }),
            _jsx('th', { children: 'Score' }),
          ],
        }),
      },
      'head',
    ),
    _jsxs(
      'tbody',
      {
        children: [
          _jsxs('tr', {
            children: [
              _jsx('td', { children: 'Alpha' }),
              _jsx('td', { children: 'US' }),
              _jsx('td', { children: '10' }),
            ],
          }),
          _jsxs('tr', {
            children: [
              _jsx('td', { children: 'Beta' }),
              _jsx('td', { children: 'EMEA' }),
              _jsx('td', { children: '2' }),
            ],
          }),
        ],
      },
      'body',
    ),
  ]);
}
function click(el) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}
function doubleClick(el) {
  act(() => {
    el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  });
}
function rightClick(el) {
  const event = new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    button: 2,
    clientX: 120,
    clientY: 80,
  });
  act(() => {
    el.dispatchEvent(event);
  });
  return event;
}
function openColumnMenu(container, columnLabel) {
  const header = [...container.querySelectorAll('th')]
    .slice(1)
    .find((cell) => cell.textContent?.includes(columnLabel));
  expect(header).not.toBeNull();
  rightClick(header);
}
function freezeFirstColumn(container, firstColumnLabel = 'Team') {
  openColumnMenu(container, firstColumnLabel);
  click(textButton(container, 'Freeze first column'));
}
function inputValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set;
  act(() => {
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
function selectValue(trigger, value) {
  click(trigger);
  const option = document.querySelector(
    `[role="option"][data-value="${value}"]`,
  );
  expect(option).not.toBeNull();
  click(option);
}
function rowTexts(container) {
  return [...container.querySelectorAll('tbody tr')]
    .filter((row) => row.querySelectorAll('td').length > 1)
    .map((row) =>
      [...row.querySelectorAll('td')]
        .slice(1)
        .map((cell) => cell.textContent ?? '')
        .join('|'),
    );
}
function textButton(container, text) {
  const el = [...container.querySelectorAll('button')].find(
    (button) => button.textContent === text,
  );
  expect(el).not.toBeNull();
  return el;
}
function openCustomColumns(container) {
  if (container.textContent?.includes('Columns shown in the table')) return;
  click(textButton(container, 'Custom columns'));
  expect(container.textContent).toContain('Columns shown in the table');
}
function customColumnCheckbox(container, columnLabel, section = 'table') {
  openCustomColumns(container);
  const labels = [...container.querySelectorAll('label')].filter(
    (label) => label.textContent === columnLabel,
  );
  const label = labels[section === 'table' ? 0 : 1];
  expect(label).toBeDefined();
  const checkbox = document.getElementById(label.htmlFor);
  expect(checkbox).not.toBeNull();
  return checkbox;
}
function toggleTableColumn(container, columnLabel) {
  click(customColumnCheckbox(container, columnLabel));
}
function toggleDetailColumn(container, columnLabel) {
  click(customColumnCheckbox(container, columnLabel, 'details'));
}
function cellDialog() {
  return document.querySelector('[role="dialog"]');
}
function textButtonContaining(container, text) {
  const el = [...container.querySelectorAll('button')].find((button) =>
    button.textContent?.includes(text),
  );
  expect(el).not.toBeNull();
  return el;
}
function mockClipboard() {
  const writeText = vi.fn(() => immediateClipboardWrite());
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return writeText;
}
function mockClipboardRejecting() {
  const writeText = vi.fn(() => Promise.reject(new Error('copy failed')));
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return writeText;
}
function mockClipboardDelayed() {
  let resolveCopy;
  const writeText = vi.fn(
    () =>
      new Promise((resolve) => {
        resolveCopy = resolve;
      }),
  );
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return {
    writeText,
    resolveCopy: () => {
      expect(resolveCopy).toBeDefined();
      resolveCopy?.();
    },
  };
}
function button(container, label) {
  const el = container.querySelector(`button[aria-label="${label}"]`);
  expect(el).not.toBeNull();
  return el;
}
function dataRows(container) {
  return [...container.querySelectorAll('tbody tr')].filter(
    (row) => row.querySelectorAll('td').length > 1,
  );
}
function dataCell(container, rowIndex, visibleColumnIndex) {
  const row = dataRows(container)[rowIndex];
  expect(row).toBeDefined();
  const cell = [...row.querySelectorAll('td')].slice(1)[visibleColumnIndex];
  expect(cell).toBeDefined();
  return cell;
}
function columnGroup(container, visibleColumnIndex) {
  const col = [...container.querySelectorAll('col')].slice(1)[
    visibleColumnIndex
  ];
  expect(col).toBeDefined();
  return col;
}
function dragCells(from, to) {
  act(() => {
    from.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, button: 0 }),
    );
    from.dispatchEvent(
      new MouseEvent('mouseout', { bubbles: true, relatedTarget: to }),
    );
    to.dispatchEvent(
      new MouseEvent('mouseover', { bubbles: true, relatedTarget: from }),
    );
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  });
}
function dispatchCopy(target) {
  const setData = vi.fn();
  const event = new Event('copy', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', {
    value: { setData },
  });
  act(() => {
    target.dispatchEvent(event);
  });
  return { event, setData };
}
function dragColumnElements(from, to) {
  const data = new Map();
  const dataTransfer = {
    dropEffect: '',
    effectAllowed: '',
    get types() {
      return [...data.keys()];
    },
    setData: vi.fn((type, value) => data.set(type, value)),
    getData: vi.fn((type) => data.get(type) ?? ''),
  };
  act(() => {
    from.dispatchEvent(
      Object.assign(new Event('dragstart', { bubbles: true }), {
        dataTransfer,
      }),
    );
    to.dispatchEvent(
      Object.assign(
        new Event('dragover', { bubbles: true, cancelable: true }),
        {
          dataTransfer,
        },
      ),
    );
    to.dispatchEvent(
      Object.assign(new Event('drop', { bubbles: true, cancelable: true }), {
        dataTransfer,
      }),
    );
    from.dispatchEvent(new Event('dragend', { bubbles: true }));
  });
}
function dragColumn(container, fromLabel, toLabel) {
  openCustomColumns(container);
  dragColumnElements(button(container, fromLabel), button(container, toLabel));
}
function dropExternalColumn(container, toLabel) {
  openCustomColumns(container);
  const dataTransfer = {
    dropEffect: '',
    effectAllowed: '',
    types: ['text/plain'],
    setData: vi.fn(),
    getData: vi.fn(() => ''),
  };
  const to = button(container, toLabel);
  act(() => {
    to.dispatchEvent(
      Object.assign(
        new Event('dragover', { bubbles: true, cancelable: true }),
        {
          dataTransfer,
        },
      ),
    );
    to.dispatchEvent(
      Object.assign(new Event('drop', { bubbles: true, cancelable: true }), {
        dataTransfer,
      }),
    );
  });
}
function dropForgedColumn(container, toLabel) {
  openCustomColumns(container);
  const dataTransfer = {
    dropEffect: '',
    effectAllowed: '',
    types: [COLUMN_DRAG_MIME],
    setData: vi.fn(),
    getData: vi.fn(() => '2'),
  };
  const to = button(container, toLabel);
  act(() => {
    to.dispatchEvent(
      Object.assign(
        new Event('dragover', { bubbles: true, cancelable: true }),
        {
          dataTransfer,
        },
      ),
    );
    to.dispatchEvent(
      Object.assign(new Event('drop', { bubbles: true, cancelable: true }), {
        dataTransfer,
      }),
    );
  });
}
function touchEvent(type, touches) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'touches', { value: touches });
  Object.defineProperty(event, 'changedTouches', { value: touches });
  return event;
}
describe('EnhancedMarkdownTable', () => {
  it('sorts numeric columns from header clicks', () => {
    const container = renderTable();
    click(button(container, 'Sort by Score'));
    expect(rowTexts(container)).toEqual(['Beta|2', 'Alpha|10', 'Gamma|30']);
    expect(button(container, 'Sort by Score, ascending')).toBeDefined();
    expect(
      button(container, 'Sort by Score, ascending')
        .closest('th')
        ?.getAttribute('aria-sort'),
    ).toBe('ascending');
    click(button(container, 'Sort by Score, ascending'));
    expect(rowTexts(container)).toEqual(['Gamma|30', 'Alpha|10', 'Beta|2']);
    expect(button(container, 'Sort by Score, descending')).toBeDefined();
    expect(
      button(container, 'Sort by Score, descending')
        .closest('th')
        ?.getAttribute('aria-sort'),
    ).toBe('descending');
    click(button(container, 'Sort by Score, descending'));
    expect(rowTexts(container)).toEqual(['Alpha|10', 'Beta|2', 'Gamma|30']);
    expect(button(container, 'Sort by Score')).toBeDefined();
  });
  it('filters rows from a column value menu', () => {
    const container = renderTable();
    click(button(container, 'Filter Team'));
    const search = container.querySelector(
      'input[name="markdown-table-option-search-0"]',
    );
    expect(search?.placeholder).toBe('Search filter values');
    expect(container.textContent).toContain('Select current results');
    const beta = container.querySelector(
      '[data-name="markdown-table-filter-option-0-1"]',
    );
    expect(beta).not.toBeNull();
    click(beta);
    click(
      [...container.querySelectorAll('button')].find(
        (el) => el.textContent === 'Confirm',
      ),
    );
    expect(rowTexts(container)).toEqual(['Alpha|10', 'Gamma|30']);
    expect(container.textContent).toContain('2/3 rows');
    dragCells(dataCell(container, 0, 1), dataCell(container, 1, 1));
    expect(container.textContent).toContain('Selected 2');
    expect(container.textContent).toContain('Numeric 2');
    expect(container.textContent).toContain('Sum 40');
    expect(container.textContent).toContain('Average 20');
    expect(container.textContent).toContain('Min 10');
    expect(container.textContent).toContain('Max 30');
  });
  it('mounts filter overlays in the Web Shell portal root', () => {
    const container = renderTable();
    const portalRoot = container.querySelector('[data-web-shell-portal-root]');
    const appRoot = container.querySelector('[data-web-shell-app-root]');
    click(button(container, 'Filter Team'));
    const popover = portalRoot?.querySelector('[data-slot="popover-content"]');
    expect(popover).not.toBeNull();
    expect(appRoot?.contains(popover)).toBe(false);
    expect(document.body.style.pointerEvents).not.toBe('none');
    click(
      container.querySelector('[data-name="markdown-table-text-operator-0"]'),
    );
    const select = portalRoot?.querySelector('[data-slot="select-content"]');
    expect(select).not.toBeNull();
    expect(select?.className).toContain('web-shell-popover-z-index');
    expect(select?.dataset.markdownTableFilterOwner).toBe(
      popover?.dataset.markdownTableFilterOwner,
    );
  });
  it('applies a custom number filter', () => {
    const container = renderTable();
    click(button(container, 'Filter Score'));
    const numberFilter = container.querySelector(
      'input[name="markdown-table-number-filter-1"]',
    );
    expect(numberFilter).not.toBeNull();
    inputValue(numberFilter, '10');
    click(textButton(container, 'Confirm'));
    expect(rowTexts(container)).toEqual(['Gamma|30']);
    expect(container.textContent).toContain('1/3 rows');
  });
  it.each([
    ['gte', ['Alpha|10', 'Gamma|30']],
    ['lt', ['Beta|2']],
    ['lte', ['Alpha|10', 'Beta|2']],
  ])('applies the %s number filter operator', (operator, expectedRows) => {
    const container = renderTable();
    click(button(container, 'Filter Score'));
    selectValue(
      container.querySelector('[data-name="markdown-table-number-operator-1"]'),
      operator,
    );
    inputValue(
      container.querySelector('input[name="markdown-table-number-filter-1"]'),
      '10',
    );
    click(textButton(container, 'Confirm'));
    expect(rowTexts(container)).toEqual(expectedRows);
  });
  it('applies text filter operators and reset', () => {
    const container = renderTable();
    click(button(container, 'Filter Team'));
    expect(
      container.querySelector('input[name="markdown-table-option-search-0"]'),
    ).toBe(document.activeElement);
    selectValue(
      container.querySelector('[data-name="markdown-table-text-operator-0"]'),
      'equals',
    );
    inputValue(
      container.querySelector('input[name="markdown-table-text-filter-0"]'),
      'Alpha',
    );
    click(textButton(container, 'Confirm'));
    expect(rowTexts(container)).toEqual(['Alpha|10']);
    click(button(container, 'Filter Team'));
    click(textButton(container, 'Reset'));
    expect(rowTexts(container)).toEqual(['Alpha|10', 'Beta|2', 'Gamma|30']);
    click(button(container, 'Filter Team'));
    selectValue(
      container.querySelector('[data-name="markdown-table-text-operator-0"]'),
      'startsWith',
    );
    inputValue(
      container.querySelector('input[name="markdown-table-text-filter-0"]'),
      'Ga',
    );
    click(textButton(container, 'Confirm'));
    expect(rowTexts(container)).toEqual(['Gamma|30']);
    click(button(container, 'Filter Team'));
    click(textButton(container, 'Reset'));
    click(button(container, 'Filter Team'));
    selectValue(
      container.querySelector('[data-name="markdown-table-text-operator-0"]'),
      'endsWith',
    );
    inputValue(
      container.querySelector('input[name="markdown-table-text-filter-0"]'),
      'ta',
    );
    click(textButton(container, 'Confirm'));
    expect(rowTexts(container)).toEqual(['Beta|2']);
    click(button(container, 'Filter Team'));
    click(textButton(container, 'Reset'));
    click(button(container, 'Filter Team'));
    selectValue(
      container.querySelector('[data-name="markdown-table-text-operator-0"]'),
      'notEquals',
    );
    inputValue(
      container.querySelector('input[name="markdown-table-text-filter-0"]'),
      'Beta',
    );
    click(textButton(container, 'Confirm'));
    expect(rowTexts(container)).toEqual(['Alpha|10', 'Gamma|30']);
  });
  it('applies a between number filter', () => {
    const container = renderTable();
    click(button(container, 'Filter Score'));
    selectValue(
      container.querySelector('[data-name="markdown-table-number-operator-1"]'),
      'between',
    );
    inputValue(
      container.querySelector('input[name="markdown-table-number-filter-1"]'),
      '10',
    );
    inputValue(
      container.querySelector(
        'input[name="markdown-table-number-filter-to-1"]',
      ),
      '2',
    );
    click(textButton(container, 'Confirm'));
    expect(rowTexts(container)).toEqual(['Alpha|10', 'Beta|2']);
  });
  it('sorts decimal values without leading zero numerically', () => {
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsx('tr', { children: _jsx('th', { children: 'Value' }) }),
        },
        'head',
      ),
      _jsxs(
        'tbody',
        {
          children: [
            _jsx('tr', { children: _jsx('td', { children: '.5' }) }),
            _jsx('tr', { children: _jsx('td', { children: '-.75' }) }),
            _jsx('tr', { children: _jsx('td', { children: '.123' }) }),
          ],
        },
        'body',
      ),
    ]);
    click(button(container, 'Sort by Value'));
    expect(rowTexts(container)).toEqual(['-.75', '.123', '.5']);
  });
  it('sorts currency values numerically', () => {
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsx('tr', {
            children: _jsx('th', { children: 'Amount' }),
          }),
        },
        'head',
      ),
      _jsxs(
        'tbody',
        {
          children: [
            _jsx('tr', { children: _jsx('td', { children: '$100' }) }),
            _jsx('tr', { children: _jsx('td', { children: '$20' }) }),
            _jsx('tr', { children: _jsx('td', { children: '$3' }) }),
          ],
        },
        'body',
      ),
    ]);
    click(button(container, 'Sort by Amount'));
    expect(rowTexts(container)).toEqual(['$3', '$20', '$100']);
  });
  it('filters percentage values as fractions', () => {
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsx('tr', { children: _jsx('th', { children: 'Ratio' }) }),
        },
        'head',
      ),
      _jsxs(
        'tbody',
        {
          children: [
            _jsx('tr', { children: _jsx('td', { children: '40%' }) }),
            _jsx('tr', { children: _jsx('td', { children: '0.5' }) }),
            _jsx('tr', { children: _jsx('td', { children: '75%' }) }),
          ],
        },
        'body',
      ),
    ]);
    click(button(container, 'Filter Ratio'));
    inputValue(
      container.querySelector('input[name="markdown-table-number-filter-0"]'),
      '.45',
    );
    click(textButton(container, 'Confirm'));
    expect(rowTexts(container)).toEqual(['0.5', '75%']);
  });
  it('preserves table alignment without applying it to row details', () => {
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsxs('tr', {
            children: [
              _jsx('th', { style: { textAlign: 'right' }, children: 'Amount' }),
              _jsx('th', {
                style: { textAlign: 'center' },
                children: 'Status',
              }),
            ],
          }),
        },
        'head',
      ),
      _jsx(
        'tbody',
        {
          children: _jsxs('tr', {
            children: [
              _jsx('td', { style: { textAlign: 'right' }, children: '$10' }),
              _jsx('td', { style: { textAlign: 'center' }, children: 'Done' }),
            ],
          }),
        },
        'body',
      ),
    ]);
    const headerCells = [...container.querySelectorAll('thead th')].slice(1);
    expect(headerCells[0]?.style.textAlign).toBe('right');
    expect(headerCells[1]?.style.textAlign).toBe('center');
    expect(dataCell(container, 0, 0).style.textAlign).toBe('right');
    expect(dataCell(container, 0, 1).style.textAlign).toBe('center');
    click(button(container, 'View details for row 1'));
    const detailPanel = container.querySelector('[class*="detailPanel"]');
    expect(detailPanel).not.toBeNull();
    const detailElements = [...detailPanel.querySelectorAll('div')];
    expect(
      detailElements.find((element) => element.textContent === '$10')?.style
        .textAlign,
    ).toBe('');
    expect(
      detailElements.find((element) => element.textContent === 'Done')?.style
        .textAlign,
    ).toBe('');
  });
  it('opens a selectable cell value dialog on double click', () => {
    const container = renderTable();
    doubleClick(dataCell(container, 0, 0));
    const dialog = cellDialog();
    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain('Current field value');
    expect(dialog?.textContent).toContain('Alpha');
  });
  it('mounts the cell value dialog in the Web Shell portal root', () => {
    const container = renderTable();
    doubleClick(dataCell(container, 0, 0));
    const dialog = cellDialog();
    const portalRoot = document.querySelector('[data-web-shell-portal-root]');
    const appRoot = container.querySelector('[data-web-shell-app-root]');
    expect(portalRoot?.contains(dialog)).toBe(true);
    expect(appRoot?.contains(dialog)).toBe(false);
    expect(portalRoot?.querySelector('[data-slot="dialog-overlay"]')).not.toBe(
      null,
    );
  });
  it('copies the current cell value from the dialog', async () => {
    const writeText = mockClipboard();
    const container = renderTable();
    doubleClick(dataCell(container, 1, 0));
    await act(async () => {
      textButton(document.body, 'Copy').click();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledWith('Beta');
    expect(document.body.textContent).toContain('Copied!');
  });
  it('sanitizes the current cell value copied from the dialog', async () => {
    const writeText = mockClipboard();
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsx('tr', {
            children: _jsx('th', { children: 'Formula' }),
          }),
        },
        'head',
      ),
      _jsx(
        'tbody',
        {
          children: _jsx('tr', {
            children: _jsx('td', {
              children: '=IMPORTXML("https://example.com")',
            }),
          }),
        },
        'body',
      ),
    ]);
    doubleClick(dataCell(container, 0, 0));
    await act(async () => {
      textButton(document.body, 'Copy').click();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledWith(
      '\'=IMPORTXML("https://example.com")',
    );
  });
  it('keeps the cell value dialog in sync with table updates', async () => {
    const writeText = mockClipboard();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const render = (value) => {
      act(() => {
        root.render(
          _jsx(I18nProvider, {
            language: 'en',
            children: _jsxs(EnhancedMarkdownTable, {
              children: [
                _jsx('thead', {
                  children: _jsx('tr', {
                    children: _jsx('th', { children: 'Team' }),
                  }),
                }),
                _jsx('tbody', {
                  children: _jsx('tr', {
                    children: _jsx('td', { children: value }),
                  }),
                }),
              ],
            }),
          }),
        );
      });
    };
    mounted.push({ root, container });
    render('Alpha');
    doubleClick(dataCell(container, 0, 0));
    expect(cellDialog()?.textContent).toContain('Alpha');
    await act(async () => {
      textButton(document.body, 'Copy').click();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(cellDialog()?.textContent).toContain('Copied!');
    render('Beta');
    expect(cellDialog()?.textContent).not.toContain('Alpha');
    expect(cellDialog()?.textContent).toContain('Beta');
    expect(cellDialog()?.textContent).not.toContain('Copied!');
    await act(async () => {
      textButton(document.body, 'Copy').click();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledWith('Beta');
  });
  it('copies an empty cell value from the dialog', async () => {
    const writeText = mockClipboard();
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsx('tr', { children: _jsx('th', { children: 'Team' }) }),
        },
        'head',
      ),
      _jsx(
        'tbody',
        { children: _jsx('tr', { children: _jsx('td', {}) }) },
        'body',
      ),
    ]);
    doubleClick(dataCell(container, 0, 0));
    await act(async () => {
      textButton(document.body, 'Copy').click();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledWith('');
  });
  it('closes the cell value dialog with Escape', () => {
    const container = renderTable();
    doubleClick(dataCell(container, 0, 0));
    expect(cellDialog()).not.toBeNull();
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }),
      );
    });
    expect(cellDialog()).toBeNull();
  });
  it('closes the cell value dialog from the backdrop and buttons', () => {
    const container = renderTable();
    doubleClick(dataCell(container, 0, 0));
    const backdrop = document.querySelector('[data-slot="dialog-overlay"]');
    expect(backdrop).not.toBeNull();
    act(() => {
      backdrop.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
      backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      backdrop.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(cellDialog()).toBeNull();
    doubleClick(dataCell(container, 0, 0));
    click(button(document.body, 'Close'));
    expect(cellDialog()).toBeNull();
    doubleClick(dataCell(container, 0, 0));
    click(textButton(document.body, 'Close'));
    expect(cellDialog()).toBeNull();
  });
  it('restores focus without scrolling when closing the cell value dialog', () => {
    const container = renderTable();
    const scroller = container.querySelector('[tabindex="0"]');
    expect(scroller).not.toBeNull();
    const focus = vi.spyOn(scroller, 'focus');
    act(() => {
      scroller.focus();
    });
    focus.mockClear();
    doubleClick(dataCell(container, 0, 0));
    expect(document.activeElement).not.toBe(scroller);
    click(textButton(document.body, 'Close'));
    expect(document.activeElement).toBe(scroller);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });
  it('focuses the cell value dialog instead of the close button', () => {
    const container = renderTable();
    doubleClick(dataCell(container, 0, 0));
    const iconCloseButton = button(document.body, 'Close');
    const dialog = cellDialog();
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(dialog);
    expect(document.activeElement).not.toBe(iconCloseButton);
  });
  it('keeps table Escape handling from running behind the cell dialog', () => {
    const container = renderTable();
    click(button(container, 'Sort by Team'));
    expect(
      button(container, 'Sort by Team, ascending').closest('th')?.className,
    ).toContain('activeHeaderCell');
    doubleClick(dataCell(container, 0, 0));
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    });
    act(() => {
      document.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    expect(cellDialog()).toBeNull();
    expect(
      button(container, 'Sort by Team, ascending').closest('th')?.className,
    ).toContain('activeHeaderCell');
  });
  it('clears table selection and row details when opening a cell dialog', () => {
    const container = renderTable();
    dragCells(dataCell(container, 0, 0), dataCell(container, 0, 0));
    expect(container.textContent).toContain('Selected 1');
    click(button(container, 'View details for row 1'));
    expect(container.textContent).toContain('Row details');
    doubleClick(dataCell(container, 0, 0));
    expect(container.textContent).not.toContain('Selected 1');
    expect(container.textContent).not.toContain('Row details');
    expect(cellDialog()).not.toBeNull();
  });
  it('closes an open filter menu when opening a cell dialog', () => {
    const container = renderTable();
    click(button(container, 'Filter Team'));
    expect(container.textContent).toContain('Custom filter');
    doubleClick(dataCell(container, 0, 0));
    expect(container.textContent).not.toContain('Custom filter');
    expect(cellDialog()).not.toBeNull();
  });
  it('does not open the cell dialog when double clicking an interactive target', () => {
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsx('tr', { children: _jsx('th', { children: 'Link' }) }),
        },
        'head',
      ),
      _jsx(
        'tbody',
        {
          children: _jsx('tr', {
            children: _jsx('td', {
              children: _jsx('a', {
                href: '#details',
                children: 'Open details',
              }),
            }),
          }),
        },
        'body',
      ),
    ]);
    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    doubleClick(link);
    expect(cellDialog()).toBeNull();
  });
  it('quick copies the visible sorted table', () => {
    const writeText = mockClipboard();
    const container = renderTable();
    click(button(container, 'Sort by Score'));
    click(textButton(container, 'Copy table'));
    expect(writeText).toHaveBeenCalledWith(
      ['Team\tScore', 'Beta\t2', 'Alpha\t10', 'Gamma\t30'].join('\n'),
    );
  });
  it('sanitizes spreadsheet formulas when copying TSV', () => {
    const writeText = mockClipboard();
    const hiddenFormula = '\u200B=2+2';
    const spacedFormula = ' =3+3';
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsxs('tr', {
            children: [
              _jsx('th', { children: 'Name' }),
              _jsx('th', { children: 'Formula' }),
            ],
          }),
        },
        'head',
      ),
      _jsxs(
        'tbody',
        {
          children: [
            _jsxs('tr', {
              children: [
                _jsx('td', { children: 'Alpha' }),
                _jsx('td', { children: '=1+1' }),
              ],
            }),
            _jsxs('tr', {
              children: [
                _jsx('td', { children: 'Beta' }),
                _jsx('td', { children: '-10' }),
              ],
            }),
            _jsxs('tr', {
              children: [
                _jsx('td', { children: 'Gamma' }),
                _jsx('td', { children: hiddenFormula }),
              ],
            }),
            _jsxs('tr', {
              children: [
                _jsx('td', { children: 'Delta' }),
                _jsx('td', { children: spacedFormula }),
              ],
            }),
          ],
        },
        'body',
      ),
    ]);
    click(textButton(container, 'Copy table'));
    expect(writeText).toHaveBeenCalledWith(
      [
        'Name\tFormula',
        "Alpha\t'=1+1",
        "Beta\t'-10",
        `Gamma\t'${hiddenFormula}`,
        `Delta\t'${spacedFormula}`,
      ].join('\n'),
    );
    dragCells(dataCell(container, 0, 1), dataCell(container, 0, 1));
    click(textButton(container, 'Copy TSV'));
    expect(writeText).toHaveBeenLastCalledWith("'=1+1");
  });
  it('keeps an accessible name on the custom columns trigger', () => {
    const container = renderTable();
    const trigger = button(container, 'Custom columns');
    expect(trigger.getAttribute('aria-label')).toBe('Custom columns');
    expect(trigger.textContent).toContain('Custom columns');
  });
  it('hides columns and restores them from custom columns', () => {
    const container = renderTable();
    toggleTableColumn(container, 'Team');
    expect(rowTexts(container)).toEqual(['10', '2', '30']);
    expect(container.querySelector('thead')?.textContent).not.toContain('Team');
    click(textButton(container, 'Reset'));
    expect(rowTexts(container)).toEqual(['Alpha|10', 'Beta|2', 'Gamma|30']);
  });
  it('quick copy skips hidden columns', () => {
    const writeText = mockClipboard();
    const container = renderTable();
    toggleTableColumn(container, 'Team');
    click(textButton(container, 'Copy table'));
    expect(writeText).toHaveBeenCalledWith(
      ['Score', '10', '2', '30'].join('\n'),
    );
  });
  it('resizes a column from its header handle', () => {
    const container = renderTable();
    const resize = button(container, 'Resize Team');
    act(() => {
      resize.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          button: 0,
          clientX: 100,
        }),
      );
    });
    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', { bubbles: true, clientX: 160 }),
      );
      window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    expect(columnGroup(container, 0).style.width).toBe('220px');
  });
  it('clamps resized columns to the minimum width', () => {
    const container = renderTable();
    const resize = button(container, 'Resize Team');
    act(() => {
      resize.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          button: 0,
          clientX: 100,
        }),
      );
    });
    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', { bubbles: true, clientX: 0 }),
      );
      window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    expect(columnGroup(container, 0).style.width).toBe('80px');
  });
  it('clamps resized columns to the maximum width', () => {
    const container = renderTable();
    const resize = button(container, 'Resize Team');
    act(() => {
      resize.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          button: 0,
          clientX: 100,
        }),
      );
    });
    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', { bubbles: true, clientX: 900 }),
      );
      window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    expect(columnGroup(container, 0).style.width).toBe('640px');
  });
  it('stops resizing a column when the window blurs', () => {
    const container = renderTable();
    const resize = button(container, 'Resize Team');
    act(() => {
      resize.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          button: 0,
          clientX: 100,
        }),
      );
    });
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', { bubbles: true, clientX: 220 }),
      );
    });
    expect(columnGroup(container, 0).style.width).toContain('160px');
  });
  it('flushes pending resize width when the window blurs', () => {
    const container = renderTable();
    const resize = button(container, 'Resize Team');
    act(() => {
      resize.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          button: 0,
          clientX: 100,
        }),
      );
    });
    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', { bubbles: true, clientX: 200 }),
      );
      window.dispatchEvent(new Event('blur'));
    });
    expect(columnGroup(container, 0).style.width).toBe('260px');
  });
  it('stops resizing a column when page visibility changes', () => {
    const container = renderTable();
    const resize = button(container, 'Resize Team');
    act(() => {
      resize.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          button: 0,
          clientX: 100,
        }),
      );
    });
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', { bubbles: true, clientX: 220 }),
      );
    });
    expect(columnGroup(container, 0).style.width).toContain('160px');
  });
  it('keeps resizing when page visibility changes while visible', () => {
    const container = renderTable();
    const resize = button(container, 'Resize Team');
    act(() => {
      resize.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          button: 0,
          clientX: 100,
        }),
      );
    });
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', { bubbles: true, clientX: 220 }),
      );
      window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    expect(columnGroup(container, 0).style.width).toBe('280px');
  });
  it('resizes a column with keyboard arrows', () => {
    const container = renderTable();
    const resize = button(container, 'Resize Team');
    act(() => {
      resize.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          key: 'ArrowRight',
        }),
      );
    });
    expect(columnGroup(container, 0).style.width).toBe('176px');
    act(() => {
      resize.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          key: 'ArrowLeft',
        }),
      );
    });
    expect(columnGroup(container, 0).style.width).toContain('160px');
  });
  it('uses a filler column after every visible column is manually sized', () => {
    const container = renderTable();
    const table = container.querySelector('table');
    expect(table).not.toBeNull();
    expect(container.querySelector('[class*="fillerColumn"]')).toBeNull();
    for (const column of ['Team', 'Score']) {
      act(() => {
        button(container, `Resize ${column}`).dispatchEvent(
          new KeyboardEvent('keydown', {
            bubbles: true,
            key: 'ArrowRight',
          }),
        );
      });
    }
    const columns = Array.from(table.querySelectorAll('col'));
    expect(columns).toHaveLength(4);
    expect(columns[0]?.style.width).toBe('40px');
    expect(columns[1]?.style.width).toBe('176px');
    expect(columns[2]?.style.width).toBe('176px');
    expect(columns[3]?.className).toContain('fillerColumn');
    expect(table.querySelector('thead th:last-child')?.className).toContain(
      'fillerHeaderCell',
    );
    expect(table.querySelector('tbody td:last-child')?.className).toContain(
      'fillerCell',
    );
  });
  it('subtracts fixed widths from the flexible column calc()', () => {
    const container = renderTable();
    const initialColumns = Array.from(container.querySelectorAll('col'));
    // Two flexible columns share the remaining width, so the divisor is 2
    // (jsdom serializes `/ 2` as `0.5 *`); a `/ 1` mutant would claim the
    // full width and fail this assertion.
    expect(initialColumns[1]?.style.width).toContain(
      '0.5 * (100cqw - 40px - 0px)',
    );
    expect(initialColumns[2]?.style.width).toContain(
      '0.5 * (100cqw - 40px - 0px)',
    );
    act(() => {
      button(container, 'Resize Team').dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          key: 'ArrowRight',
        }),
      );
    });
    const columns = Array.from(container.querySelectorAll('col'));
    expect(columns).toHaveLength(3);
    expect(columns[1]?.style.width).toBe('176px');
    expect(columns[2]?.style.width).toContain('1 * (100cqw - 40px - 176px)');
    expect(container.querySelector('[class*="fillerColumn"]')).toBeNull();
  });
  it('spans the detail row across the filler column', () => {
    const container = renderTable();
    for (const column of ['Team', 'Score']) {
      act(() => {
        button(container, `Resize ${column}`).dispatchEvent(
          new KeyboardEvent('keydown', {
            bubbles: true,
            key: 'ArrowRight',
          }),
        );
      });
    }
    expect(container.querySelector('[class*="fillerColumn"]')).not.toBeNull();
    click(button(container, 'View details for row 1'));
    const detailCell = container.querySelector('[class*="detailCell"]');
    expect(detailCell).not.toBeNull();
    expect(detailCell.colSpan).toBe(4);
  });
  it('resizes compact auto columns from their rendered width with keyboard arrows', () => {
    const container = renderTable();
    selectValue(button(container, 'Table density'), 'compact');
    const header = button(container, 'Sort by Team').closest('th');
    expect(header).not.toBeNull();
    Object.defineProperty(header, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ width: 92 }),
    });
    const resize = button(container, 'Resize Team');
    act(() => {
      resize.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          key: 'ArrowRight',
        }),
      );
    });
    expect(columnGroup(container, 0).style.width).toBe('108px');
  });
  it('ignores keyboard resize arrows with modifiers', () => {
    const container = renderTable();
    const resize = button(container, 'Resize Team');
    act(() => {
      resize.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          ctrlKey: true,
          key: 'ArrowRight',
        }),
      );
    });
    expect(columnGroup(container, 0).style.width).toContain('160px');
  });
  it('reorders columns and quick copies in the visible order', () => {
    const writeText = mockClipboard();
    const container = renderWideTable();
    dragColumn(container, 'Move Score', 'Move Team');
    expect(rowTexts(container)).toEqual(['10|Alpha|US', '2|Beta|EMEA']);
    click(textButton(container, 'Copy table'));
    expect(writeText).toHaveBeenCalledWith(
      ['Score\tTeam\tRegion', '10\tAlpha\tUS', '2\tBeta\tEMEA'].join('\n'),
    );
  });
  it('ignores external drops on column move handles', () => {
    const container = renderWideTable();
    dropExternalColumn(container, 'Move Score');
    expect(rowTexts(container)).toEqual(['Alpha|US|10', 'Beta|EMEA|2']);
  });
  it('ignores forged column drag payloads', () => {
    const container = renderWideTable();
    dropForgedColumn(container, 'Move Team');
    expect(rowTexts(container)).toEqual(['Alpha|US|10', 'Beta|EMEA|2']);
  });
  it('only reorders columns when dropped within custom columns', () => {
    const container = renderWideTable();
    openCustomColumns(container);
    dragColumnElements(
      button(container, 'Move Score'),
      button(container, 'Sort by Team'),
    );
    expect(rowTexts(container)).toEqual(['Alpha|US|10', 'Beta|EMEA|2']);
  });
  it('resets table visibility and order from custom columns', () => {
    const container = renderWideTable();
    toggleTableColumn(container, 'Region');
    toggleDetailColumn(container, 'Region');
    dragColumn(container, 'Move Score', 'Move Team');
    expect(rowTexts(container)).toEqual(['10|Alpha', '2|Beta']);
    const detailsButton = button(container, 'View details for row 1');
    click(detailsButton);
    const details = document.getElementById(
      detailsButton.getAttribute('aria-controls'),
    );
    expect(details?.textContent).not.toContain('Region');
    openCustomColumns(container);
    click(textButton(container, 'Reset'));
    expect(rowTexts(container)).toEqual(['Alpha|US|10', 'Beta|EMEA|2']);
    expect(details?.textContent).toContain('Region');
  });
  it('keeps hidden columns out of reordered selections', () => {
    const writeText = mockClipboard();
    const container = renderWideTable();
    dragColumn(container, 'Move Score', 'Move Team');
    toggleTableColumn(container, 'Region');
    dragCells(dataCell(container, 0, 0), dataCell(container, 1, 1));
    expect(container.textContent).toContain('Selected 4');
    expect(container.textContent).toContain('Non-empty 4');
    expect(container.textContent).toContain('Numeric 2');
    expect(container.textContent).toContain('Sum 12');
    expect(container.textContent).toContain('Average 6');
    expect(container.textContent).toContain('Min 2');
    expect(container.textContent).toContain('Max 10');
    click(textButton(container, 'Copy TSV'));
    expect(writeText).toHaveBeenCalledWith(['10\tAlpha', '2\tBeta'].join('\n'));
  });
  it('toggles sticky classes for the action column and first visible column', () => {
    const container = renderWideTable();
    expect(container.textContent).not.toContain('Freeze first column');
    openColumnMenu(container, 'Score');
    expect(container.textContent).not.toContain('Freeze first column');
    openColumnMenu(container, 'Team');
    click(textButton(container, 'Freeze first column'));
    expect(
      container.querySelector('[class*="tableShell"]')?.className,
    ).toContain('hasFrozenColumn');
    expect(container.textContent).not.toContain('Unfreeze first column');
    expect(container.querySelector('thead th')?.className).toContain(
      'stickyActionHeaderCell',
    );
    expect(
      button(container, 'Sort by Team').closest('th')?.className,
    ).toContain('frozenHeaderCell');
    expect(dataCell(container, 0, 0).className).toContain('frozenCell');
    click(button(container, 'Sort by Team'));
    expect(
      button(container, 'Sort by Team, ascending').closest('th')?.className,
    ).toContain('activeHeaderCell');
    expect(
      button(container, 'Sort by Team, ascending').closest('th')?.className,
    ).toContain('frozenHeaderCell');
    dragColumn(container, 'Move Score', 'Move Team');
    expect(
      button(container, 'Sort by Score').closest('th')?.className,
    ).toContain('frozenHeaderCell');
    openColumnMenu(container, 'Score');
    click(textButton(container, 'Unfreeze first column'));
    expect(container.textContent).not.toContain('Unfreeze first column');
    expect(container.querySelector('div')?.className).not.toContain(
      'hasFrozenColumn',
    );
    expect(
      button(container, 'Sort by Score').closest('th')?.className,
    ).not.toContain('frozenHeaderCell');
  });
  it('positions the frozen shadow from the rendered column edge', () => {
    const container = renderWideTable();
    const shell = container.querySelector('[class*="tableShell"]');
    const header = button(container, 'Sort by Team').closest('th');
    expect(shell).not.toBeNull();
    expect(header).not.toBeNull();
    Object.defineProperty(shell, 'clientLeft', {
      configurable: true,
      value: 1,
    });
    Object.defineProperty(shell, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 20 }),
    });
    Object.defineProperty(header, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ right: 301 }),
    });
    freezeFirstColumn(container);
    expect(
      container.querySelector('[class*="frozenColumnShadow"]')?.style.left,
    ).toBe('280px');
  });
  it('repositions the frozen shadow when the ResizeObserver fires', () => {
    const callbacks = [];
    const OriginalResizeObserver = globalThis.ResizeObserver;
    class CapturingResizeObserver {
      callback;
      constructor(callback) {
        this.callback = callback;
        callbacks.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    globalThis.ResizeObserver = CapturingResizeObserver;
    try {
      const container = renderWideTable();
      const shell = container.querySelector('[class*="tableShell"]');
      const header = button(container, 'Sort by Team').closest('th');
      expect(shell).not.toBeNull();
      expect(header).not.toBeNull();
      Object.defineProperty(shell, 'clientLeft', {
        configurable: true,
        value: 1,
      });
      Object.defineProperty(shell, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({ left: 20 }),
      });
      Object.defineProperty(header, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({ right: 301 }),
      });
      freezeFirstColumn(container);
      expect(
        container.querySelector('[class*="frozenColumnShadow"]')?.style.left,
      ).toBe('280px');
      Object.defineProperty(header, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({ right: 351 }),
      });
      act(() => {
        for (const cb of callbacks) {
          cb([], {});
        }
      });
      expect(
        container.querySelector('[class*="frozenColumnShadow"]')?.style.left,
      ).toBe('330px');
    } finally {
      globalThis.ResizeObserver = OriginalResizeObserver;
    }
  });
  it('repositions the frozen shadow on window resize without ResizeObserver', () => {
    const OriginalResizeObserver = globalThis.ResizeObserver;
    // @ts-expect-error -- force the window-resize fallback branch
    delete globalThis.ResizeObserver;
    try {
      const container = renderWideTable();
      const shell = container.querySelector('[class*="tableShell"]');
      const header = button(container, 'Sort by Team').closest('th');
      expect(shell).not.toBeNull();
      expect(header).not.toBeNull();
      Object.defineProperty(shell, 'clientLeft', {
        configurable: true,
        value: 1,
      });
      Object.defineProperty(shell, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({ left: 20 }),
      });
      Object.defineProperty(header, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({ right: 301 }),
      });
      freezeFirstColumn(container);
      expect(
        container.querySelector('[class*="frozenColumnShadow"]')?.style.left,
      ).toBe('280px');
      Object.defineProperty(header, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({ right: 351 }),
      });
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      expect(
        container.querySelector('[class*="frozenColumnShadow"]')?.style.left,
      ).toBe('330px');
    } finally {
      globalThis.ResizeObserver = OriginalResizeObserver;
    }
  });
  it('dismisses the first-column context menu without clearing the active column', () => {
    const container = renderWideTable();
    openColumnMenu(container, 'Team');
    expect(container.textContent).toContain('Freeze first column');
    expect(
      button(container, 'Sort by Team').closest('th')?.className,
    ).toContain('activeHeaderCell');
    const escapeEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    });
    act(() => {
      document.dispatchEvent(escapeEvent);
    });
    expect(escapeEvent.defaultPrevented).toBe(true);
    expect(container.textContent).not.toContain('Freeze first column');
    expect(
      button(container, 'Sort by Team').closest('th')?.className,
    ).toContain('activeHeaderCell');
  });
  it('keeps the active column while clicking inside the first-column context menu', () => {
    const container = renderWideTable();
    openColumnMenu(container, 'Team');
    act(() => {
      textButton(container, 'Freeze first column').dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, button: 0 }),
      );
    });
    expect(
      button(container, 'Sort by Team').closest('th')?.className,
    ).toContain('activeHeaderCell');
  });
  it('dismisses the first-column context menu on outside click, scroll, and resize', () => {
    const container = renderWideTable();
    openColumnMenu(container, 'Team');
    expect(container.textContent).toContain('Freeze first column');
    act(() => {
      dataCell(container, 0, 0).dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, button: 0 }),
      );
    });
    expect(container.textContent).not.toContain('Freeze first column');
    openColumnMenu(container, 'Team');
    expect(container.textContent).toContain('Freeze first column');
    act(() => {
      document.dispatchEvent(new Event('scroll'));
    });
    expect(container.textContent).not.toContain('Freeze first column');
    openColumnMenu(container, 'Team');
    expect(container.textContent).toContain('Freeze first column');
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(container.textContent).not.toContain('Freeze first column');
  });
  it('keeps column menus mutually exclusive while allowing native menus on other columns', () => {
    const container = renderWideTable();
    const scoreHeader = button(container, 'Sort by Score').closest('th');
    expect(scoreHeader).not.toBeNull();
    const nonFirstColumnEvent = rightClick(scoreHeader);
    expect(nonFirstColumnEvent.defaultPrevented).toBe(false);
    expect(container.textContent).not.toContain('Freeze first column');
    openColumnMenu(container, 'Team');
    expect(container.textContent).toContain('Freeze first column');
    click(button(container, 'Filter Team'));
    expect(container.textContent).toContain('Custom filter');
    expect(container.textContent).not.toContain('Freeze first column');
    openColumnMenu(container, 'Team');
    expect(container.textContent).toContain('Freeze first column');
    expect(container.textContent).not.toContain('Custom filter');
  });
  it('collapses long cells with a tooltip and expands them from the toolbar', () => {
    const longText =
      'This is a long operational note with enough content to exceed the table preview threshold and prove that the full value remains available.';
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsx('tr', { children: _jsx('th', { children: 'Note' }) }),
        },
        'head',
      ),
      _jsx(
        'tbody',
        {
          children: _jsx('tr', {
            children: _jsx('td', { children: longText }),
          }),
        },
        'body',
      ),
    ]);
    const cell = dataCell(container, 0, 0);
    expect(cell.textContent).not.toContain('Expand text');
    expect(textButton(container, 'Expand text')).toBeDefined();
    expect(cell.querySelector('[title]')?.title).toBe(longText);
    click(textButton(container, 'Expand text'));
    expect(textButton(container, 'Collapse text')).toBeDefined();
    expect(container.textContent).not.toContain('Selected 1');
    expect(cell.querySelector('[title]')).toBeNull();
    click(textButton(container, 'Collapse text'));
    expect(textButton(container, 'Expand text')).toBeDefined();
    expect(cell.querySelector('[title]')?.title).toBe(longText);
  });
  it('treats one-line long values as expandable text', () => {
    const longText =
      'A single line note can still be visually long enough to need the collapsed table preview.';
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsx('tr', { children: _jsx('th', { children: 'Note' }) }),
        },
        'head',
      ),
      _jsx(
        'tbody',
        {
          children: _jsx('tr', {
            children: _jsx('td', { children: longText }),
          }),
        },
        'body',
      ),
    ]);
    const cell = dataCell(container, 0, 0);
    expect(textButton(container, 'Expand text')).toBeDefined();
    expect(cell.querySelector('[title]')?.title).toBe(longText);
    click(textButton(container, 'Expand text'));
    expect(textButton(container, 'Collapse text')).toBeDefined();
    expect(cell.querySelector('[title]')).toBeNull();
  });
  it('copies the full long cell value instead of the expanded preview text', () => {
    const writeText = mockClipboard();
    const longText =
      'A long cell value that should be copied in full even though the visual table shows an expand affordance for readability.';
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsx('tr', { children: _jsx('th', { children: 'Note' }) }),
        },
        'head',
      ),
      _jsx(
        'tbody',
        {
          children: _jsx('tr', {
            children: _jsx('td', { children: longText }),
          }),
        },
        'body',
      ),
    ]);
    dragCells(dataCell(container, 0, 0), dataCell(container, 0, 0));
    click(textButton(container, 'Copy TSV'));
    expect(writeText).toHaveBeenCalledWith(longText);
  });
  it('flattens cell-internal newlines when copying a selection', () => {
    const writeText = mockClipboard();
    const multilineText = 'line 1\nline 2\nline 3';
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsx('tr', { children: _jsx('th', { children: 'Note' }) }),
        },
        'head',
      ),
      _jsx(
        'tbody',
        {
          children: _jsx('tr', {
            children: _jsx('td', { children: multilineText }),
          }),
        },
        'body',
      ),
    ]);
    dragCells(dataCell(container, 0, 0), dataCell(container, 0, 0));
    click(textButton(container, 'Copy TSV'));
    expect(writeText).toHaveBeenCalledWith('line 1 line 2 line 3');
  });
  it('flattens cell-internal newlines when quick copying the visible table', async () => {
    const writeText = mockClipboard();
    const multilineText = 'line 1\nline 2\nline 3';
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsx('tr', { children: _jsx('th', { children: 'Note' }) }),
        },
        'head',
      ),
      _jsx(
        'tbody',
        {
          children: _jsx('tr', {
            children: _jsx('td', { children: multilineText }),
          }),
        },
        'body',
      ),
    ]);
    await act(async () => {
      textButton(container, 'Copy table').click();
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledWith('Note\nline 1 line 2 line 3');
  });
  it('flattens cell-internal tabs when copying a selection', () => {
    const writeText = mockClipboard();
    const tabbedText = 'data\t=CMD("calc")';
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsx('tr', { children: _jsx('th', { children: 'Note' }) }),
        },
        'head',
      ),
      _jsx(
        'tbody',
        {
          children: _jsx('tr', {
            children: _jsx('td', { children: tabbedText }),
          }),
        },
        'body',
      ),
    ]);
    dragCells(dataCell(container, 0, 0), dataCell(container, 0, 0));
    click(textButton(container, 'Copy TSV'));
    expect(writeText).toHaveBeenCalledWith('data =CMD("calc")');
  });
  it('flattens cell-internal tabs when quick copying the visible table', async () => {
    const writeText = mockClipboard();
    const tabbedText = 'data\t=CMD("calc")';
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsx('tr', { children: _jsx('th', { children: 'Note' }) }),
        },
        'head',
      ),
      _jsx(
        'tbody',
        {
          children: _jsx('tr', {
            children: _jsx('td', { children: tabbedText }),
          }),
        },
        'body',
      ),
    ]);
    await act(async () => {
      textButton(container, 'Copy table').click();
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledWith('Note\ndata =CMD("calc")');
  });
  it('only shows the long text toolbar action for visible rows', () => {
    const longText =
      'A long visible note that should make the table show a toolbar expand text action before filtering.';
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsxs('tr', {
            children: [
              _jsx('th', { children: 'Team' }),
              _jsx('th', { children: 'Note' }),
            ],
          }),
        },
        'head',
      ),
      _jsxs(
        'tbody',
        {
          children: [
            _jsxs('tr', {
              children: [
                _jsx('td', { children: 'Long' }),
                _jsx('td', { children: longText }),
              ],
            }),
            _jsxs('tr', {
              children: [
                _jsx('td', { children: 'Short' }),
                _jsx('td', { children: 'ok' }),
              ],
            }),
          ],
        },
        'body',
      ),
    ]);
    expect(textButton(container, 'Expand text')).toBeDefined();
    click(button(container, 'Filter Team'));
    selectValue(
      container.querySelector('[data-name="markdown-table-text-operator-0"]'),
      'equals',
    );
    inputValue(
      container.querySelector('input[name="markdown-table-text-filter-0"]'),
      'Short',
    );
    click(textButton(container, 'Confirm'));
    expect(rowTexts(container)).toEqual(['Short|ok']);
    expect(container.textContent).not.toContain('Expand text');
  });
  it('only shows the long text toolbar action for visible columns', () => {
    const longText =
      'A hidden long note should not keep the expand text toolbar action visible.';
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsxs('tr', {
            children: [
              _jsx('th', { children: 'Team' }),
              _jsx('th', { children: 'Note' }),
            ],
          }),
        },
        'head',
      ),
      _jsx(
        'tbody',
        {
          children: _jsxs('tr', {
            children: [
              _jsx('td', { children: 'Alpha' }),
              _jsx('td', { children: longText }),
            ],
          }),
        },
        'body',
      ),
    ]);
    expect(textButton(container, 'Expand text')).toBeDefined();
    toggleTableColumn(container, 'Note');
    expect(rowTexts(container)).toEqual(['Alpha']);
    expect(container.textContent).not.toContain('Expand text');
  });
  it('selects display density from the toolbar', () => {
    const container = renderTable();
    const shell = container.querySelector('[class*="tableShell"]');
    const columns = () => Array.from(container.querySelectorAll('col'));
    expect(shell?.className).toContain('densityStandard');
    expect(button(container, 'Table density').textContent).toContain(
      'Standard density',
    );
    expect(columns()[0]?.style.width).toBe('40px');
    expect(columns()[1]?.style.width).toContain('160px');
    selectValue(button(container, 'Table density'), 'compact');
    expect(shell?.className).toContain('densityCompact');
    expect(button(container, 'Table density').textContent).toContain(
      'Compact density',
    );
    expect(columns()[0]?.style.width).toBe('40px');
    expect(columns()[1]?.style.width).toContain('72px');
    expect(columns()[1]?.style.width).not.toContain('160px');
    selectValue(button(container, 'Table density'), 'comfortable');
    expect(shell?.className).toContain('densityComfortable');
    expect(button(container, 'Table density').textContent).toContain(
      'Comfortable density',
    );
    expect(columns()[0]?.style.width).toBe('40px');
    expect(columns()[1]?.style.width).toContain('160px');
  });
  it('renders compact row details with blank values and globally expandable long values', () => {
    const longText =
      'First line\nSecond line\nThird line\nFourth line for the detail panel preview.';
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsxs('tr', {
            children: [
              _jsx('th', { children: 'Summary' }),
              _jsx('th', { children: 'Owner' }),
            ],
          }),
        },
        'head',
      ),
      _jsx(
        'tbody',
        {
          children: _jsxs('tr', {
            children: [_jsx('td', { children: longText }), _jsx('td', {})],
          }),
        },
        'body',
      ),
    ]);
    click(button(container, 'View details for row 1'));
    expect(container.textContent).toContain('Row details');
    expect(container.textContent).toContain('(blank)');
    expect(textButton(container, 'Expand text')).toBeDefined();
    click(textButton(container, 'Expand text'));
    expect(textButton(container, 'Collapse text')).toBeDefined();
  });
  it('keeps the opened row anchored when the table scroller expands', () => {
    const container = renderTable();
    container.style.overflowY = 'auto';
    container.scrollTop = 40;
    const detailsButton = button(container, 'View details for row 3');
    const row = detailsButton.closest('tr');
    expect(row).not.toBeNull();
    const rowRect = vi
      .spyOn(row, 'getBoundingClientRect')
      .mockReturnValueOnce({ top: 120 })
      .mockReturnValueOnce({ top: 280 });
    click(detailsButton);
    expect(rowRect).toHaveBeenCalledTimes(2);
    expect(container.scrollTop).toBe(200);
    expect(detailsButton.getAttribute('aria-expanded')).toBe('true');
  });
  it('falls back to window.scrollBy when no scroll ancestor exists', () => {
    const container = renderTable();
    const scrollBySpy = vi
      .spyOn(window, 'scrollBy')
      .mockImplementation(() => {});
    const detailsButton = button(container, 'View details for row 3');
    const row = detailsButton.closest('tr');
    expect(row).not.toBeNull();
    vi.spyOn(row, 'getBoundingClientRect')
      .mockReturnValueOnce({ top: 120 })
      .mockReturnValueOnce({ top: 280 });
    click(detailsButton);
    expect(scrollBySpy).toHaveBeenCalledWith(0, 160);
    expect(detailsButton.getAttribute('aria-expanded')).toBe('true');
  });
  it('shows statistics for a numeric selection', () => {
    const container = renderTable();
    dragCells(dataCell(container, 0, 1), dataCell(container, 2, 1));
    expect(container.textContent).toContain('Selected 3');
    expect(container.textContent).toContain('Non-empty 3');
    expect(container.textContent).toContain('Numeric 3');
    expect(container.textContent).toContain('Sum 42');
    expect(container.textContent).toContain('Average 14');
    expect(container.textContent).toContain('Min 2');
    expect(container.textContent).toContain('Max 30');
  });
  it('clears a selection when updated rows no longer contain it', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const render = (rows) => {
      act(() => {
        root.render(
          _jsx(I18nProvider, {
            language: 'en',
            children: _jsxs(EnhancedMarkdownTable, {
              children: [
                _jsx('thead', {
                  children: _jsx('tr', {
                    children: _jsx('th', { children: 'Value' }),
                  }),
                }),
                _jsx('tbody', {
                  children: rows.map((value) =>
                    _jsx(
                      'tr',
                      { children: _jsx('td', { children: value }) },
                      value,
                    ),
                  ),
                }),
              ],
            }),
          }),
        );
      });
    };
    mounted.push({ root, container });
    render(['10', '20', '30']);
    dragCells(dataCell(container, 2, 0), dataCell(container, 2, 0));
    expect(container.textContent).toContain('Selected 1');
    render(['10']);
    expect(container.textContent).not.toContain('Selected');
    expect(container.textContent).not.toContain('Copy TSV');
  });
  it('clears a selection when clicking outside the table', () => {
    const container = renderTable();
    dragCells(dataCell(container, 0, 0), dataCell(container, 0, 0));
    expect(container.textContent).toContain('Selected 1');
    act(() => {
      document.body.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true }),
      );
    });
    expect(container.textContent).not.toContain('Selected');
    expect(container.textContent).not.toContain('Copy TSV');
  });
  it('uses numeric cells only for mixed-selection arithmetic', () => {
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsxs('tr', {
            children: [
              _jsx('th', { children: 'Label' }),
              _jsx('th', { children: 'Value' }),
              _jsx('th', { children: 'Extra' }),
            ],
          }),
        },
        'head',
      ),
      _jsxs(
        'tbody',
        {
          children: [
            _jsxs('tr', {
              children: [
                _jsx('td', { children: 'Alpha' }),
                _jsx('td', { children: '10' }),
                _jsx('td', {}),
              ],
            }),
            _jsxs('tr', {
              children: [
                _jsx('td', { children: 'Beta' }),
                _jsx('td', { children: '2' }),
                _jsx('td', { children: '-4' }),
              ],
            }),
          ],
        },
        'body',
      ),
    ]);
    dragCells(dataCell(container, 0, 0), dataCell(container, 1, 2));
    expect(container.textContent).toContain('Selected 6');
    expect(container.textContent).toContain('Non-empty 5');
    expect(container.textContent).toContain('Numeric 3');
    expect(container.textContent).toContain('Sum 8');
    expect(container.textContent).toContain('Average 2.666667');
    expect(container.textContent).toContain('Min -4');
    expect(container.textContent).toContain('Max 10');
  });
  it('hides arithmetic statistics when the selection has no numbers', () => {
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsx('tr', { children: _jsx('th', { children: 'Value' }) }),
        },
        'head',
      ),
      _jsxs(
        'tbody',
        {
          children: [
            _jsx('tr', { children: _jsx('td', { children: 'Alpha' }) }),
            _jsx('tr', { children: _jsx('td', {}) }),
          ],
        },
        'body',
      ),
    ]);
    dragCells(dataCell(container, 0, 0), dataCell(container, 1, 0));
    expect(container.textContent).toContain('Selected 2');
    expect(container.textContent).toContain('Non-empty 1');
    expect(container.textContent).toContain('Numeric 0');
    expect(container.textContent).not.toContain('Sum ');
    expect(container.textContent).not.toContain('Average ');
    expect(container.textContent).not.toContain('Min ');
    expect(container.textContent).not.toContain('Max ');
  });
  it('preserves percent formatting for percent-only selections', () => {
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsx('tr', { children: _jsx('th', { children: 'Ratio' }) }),
        },
        'head',
      ),
      _jsxs(
        'tbody',
        {
          children: [
            _jsx('tr', { children: _jsx('td', { children: '40%' }) }),
            _jsx('tr', { children: _jsx('td', { children: '60%' }) }),
          ],
        },
        'body',
      ),
    ]);
    dragCells(dataCell(container, 0, 0), dataCell(container, 1, 0));
    expect(container.textContent).toContain('Sum 100%');
    expect(container.textContent).toContain('Average 50%');
    expect(container.textContent).toContain('Min 40%');
    expect(container.textContent).toContain('Max 60%');
  });
  it('preserves a shared currency symbol for currency-only selections', () => {
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsx('tr', {
            children: _jsx('th', { children: 'Amount' }),
          }),
        },
        'head',
      ),
      _jsxs(
        'tbody',
        {
          children: [
            _jsx('tr', { children: _jsx('td', { children: '$10' }) }),
            _jsx('tr', { children: _jsx('td', { children: '$20' }) }),
          ],
        },
        'body',
      ),
    ]);
    dragCells(dataCell(container, 0, 0), dataCell(container, 1, 0));
    expect(container.textContent).toContain('Sum $30');
    expect(container.textContent).toContain('Average $15');
    expect(container.textContent).toContain('Min $10');
    expect(container.textContent).toContain('Max $20');
  });
  it('formats negative currency statistics with one leading sign', () => {
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsx('tr', {
            children: _jsx('th', { children: 'Amount' }),
          }),
        },
        'head',
      ),
      _jsxs(
        'tbody',
        {
          children: [
            _jsx('tr', { children: _jsx('td', { children: '-$10' }) }),
            _jsx('tr', { children: _jsx('td', { children: '-$20' }) }),
          ],
        },
        'body',
      ),
    ]);
    dragCells(dataCell(container, 0, 0), dataCell(container, 1, 0));
    expect(container.textContent).toContain('Sum -$30');
    expect(container.textContent).toContain('Average -$15');
    expect(container.textContent).toContain('Min -$20');
    expect(container.textContent).toContain('Max -$10');
    expect(container.textContent).not.toContain('--$');
  });
  it('uses plain number formatting for mixed currencies', () => {
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsx('tr', {
            children: _jsx('th', { children: 'Amount' }),
          }),
        },
        'head',
      ),
      _jsxs(
        'tbody',
        {
          children: [
            _jsx('tr', { children: _jsx('td', { children: '$10' }) }),
            _jsx('tr', { children: _jsx('td', { children: '\u20AC20' }) }),
          ],
        },
        'body',
      ),
    ]);
    dragCells(dataCell(container, 0, 0), dataCell(container, 1, 0));
    expect(container.textContent).toContain('Sum 30');
    expect(container.textContent).toContain('Average 15');
    expect(container.textContent).not.toContain('Sum $');
    expect(container.textContent).not.toContain('Sum €');
  });
  it('normalizes negative zero in selection statistics', () => {
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsx('tr', { children: _jsx('th', { children: 'Value' }) }),
        },
        'head',
      ),
      _jsx(
        'tbody',
        { children: _jsx('tr', { children: _jsx('td', { children: '-0' }) }) },
        'body',
      ),
    ]);
    dragCells(dataCell(container, 0, 0), dataCell(container, 0, 0));
    expect(container.textContent).toContain('Sum 0');
    expect(container.textContent).toContain('Average 0');
    expect(container.textContent).toContain('Min 0');
    expect(container.textContent).toContain('Max 0');
    expect(container.textContent).not.toContain('Min -0');
    expect(container.textContent).not.toContain('Max -0');
  });
  it('localizes selection statistics', () => {
    const container = renderTable('zh-CN');
    dragCells(dataCell(container, 0, 1), dataCell(container, 2, 1));
    expect(container.textContent).toContain('已选 3');
    expect(container.textContent).toContain('非空 3');
    expect(container.textContent).toContain('数值 3');
    expect(container.textContent).toContain('求和 42');
    expect(container.textContent).toContain('平均 14');
    expect(container.textContent).toContain('最小 2');
    expect(container.textContent).toContain('最大 30');
  });
  it('keeps selected cell classes visible on a frozen column', () => {
    const container = renderWideTable();
    freezeFirstColumn(container);
    dragCells(dataCell(container, 0, 0), dataCell(container, 1, 1));
    expect(container.textContent).toContain('Selected 4');
    expect(dataCell(container, 0, 0).className).toContain('frozenCell');
    expect(dataCell(container, 0, 0).className).toContain('selectedCell');
    expect(dataCell(container, 0, 1).className).toContain('selectedCell');
  });
  it('copies reordered selections from the keyboard copy event', () => {
    const container = renderWideTable();
    dragColumn(container, 'Move Score', 'Move Team');
    dragCells(dataCell(container, 0, 0), dataCell(container, 1, 1));
    const scroller = container.querySelector('div[tabindex="0"]');
    expect(scroller).not.toBeNull();
    const { event, setData } = dispatchCopy(scroller);
    expect(event.defaultPrevented).toBe(true);
    expect(setData).toHaveBeenCalledWith(
      'text/plain',
      ['10\tAlpha', '2\tBeta'].join('\n'),
    );
  });
  it('copies reordered selections after freezing the first column', () => {
    const writeText = mockClipboard();
    const container = renderWideTable();
    dragColumn(container, 'Move Score', 'Move Team');
    freezeFirstColumn(container, 'Score');
    dragCells(dataCell(container, 0, 0), dataCell(container, 1, 1));
    click(textButton(container, 'Copy TSV'));
    expect(writeText).toHaveBeenCalledWith(['10\tAlpha', '2\tBeta'].join('\n'));
  });
  it('shows checkmark feedback after quick copy', async () => {
    vi.useFakeTimers();
    mockClipboard();
    const container = renderTable();
    await act(async () => {
      textButton(container, 'Copy table').click();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(container.textContent).toContain('✓');
    expect(container.textContent).toContain('Copied!');
    expect(container.textContent).not.toContain('Copy table');
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(container.textContent).not.toContain('✓');
    expect(container.textContent).toContain('Copy table');
  });
  it('keeps copy feedback working under StrictMode effect replay', async () => {
    mockClipboard();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      root.render(
        _jsx(StrictMode, {
          children: _jsx(I18nProvider, {
            language: 'en',
            children: _jsxs(EnhancedMarkdownTable, {
              children: [
                _jsx('thead', {
                  children: _jsx('tr', {
                    children: _jsx('th', { children: 'Team' }),
                  }),
                }),
                _jsx('tbody', {
                  children: _jsx('tr', {
                    children: _jsx('td', { children: 'Alpha' }),
                  }),
                }),
              ],
            }),
          }),
        }),
      );
    });
    mounted.push({ root, container });
    await act(async () => {
      textButton(container, 'Copy table').click();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(container.textContent).toContain('Copied!');
  });
  it('keeps quick copy feedback visible for the latest click', async () => {
    vi.useFakeTimers();
    mockClipboard();
    const container = renderTable();
    await act(async () => {
      textButton(container, 'Copy table').click();
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
      textButtonContaining(container, 'Copied!').click();
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(container.textContent).toContain('Copied!');
    expect(container.textContent).not.toContain('Copy table');
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(container.textContent).not.toContain('Copied!');
    expect(container.textContent).toContain('Copy table');
  });
  it('resets quick copy feedback when visible table data changes', async () => {
    vi.useFakeTimers();
    mockClipboard();
    const container = renderTable();
    await act(async () => {
      textButton(container, 'Copy table').click();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(container.textContent).toContain('Copied!');
    click(button(container, 'Sort by Score'));
    expect(container.textContent).not.toContain('Copied!');
    expect(container.textContent).toContain('Copy table');
  });
  it('ignores stale quick copy feedback after visible data changes', async () => {
    const clipboard = mockClipboardDelayed();
    const container = renderTable();
    act(() => {
      textButton(container, 'Copy table').click();
    });
    click(button(container, 'Sort by Score'));
    await act(async () => {
      clipboard.resolveCopy();
      await Promise.resolve();
    });
    expect(container.textContent).not.toContain('Copied!');
    expect(container.textContent).toContain('Copy table');
  });
  it('resets quick copy feedback when filters change visible rows', async () => {
    vi.useFakeTimers();
    mockClipboard();
    const container = renderTable();
    await act(async () => {
      textButton(container, 'Copy table').click();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(container.textContent).toContain('Copied!');
    click(button(container, 'Filter Team'));
    const beta = container.querySelector(
      '[data-name="markdown-table-filter-option-0-1"]',
    );
    expect(beta).not.toBeNull();
    click(beta);
    click(textButton(container, 'Confirm'));
    expect(container.textContent).not.toContain('Copied!');
    expect(container.textContent).toContain('Copy table');
  });
  it('does not show copied feedback when clipboard write fails', async () => {
    mockClipboardRejecting();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const container = renderTable();
    await act(async () => {
      textButton(container, 'Copy table').click();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(warn).toHaveBeenCalled();
    expect(container.textContent).not.toContain('Copied!');
    expect(container.textContent).toContain('Copy table');
  });
  it('shows text feedback after copying a selection', async () => {
    vi.useFakeTimers();
    mockClipboard();
    const container = renderTable();
    dragCells(dataCell(container, 0, 0), dataCell(container, 0, 0));
    await act(async () => {
      textButton(container, 'Copy TSV').click();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(container.textContent).toContain('Copied!');
    expect(container.textContent).not.toContain('Copy TSV');
    expect(textButton(container, 'Copied!').querySelector('svg')).toBeNull();
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(container.textContent).toContain('Copy TSV');
  });
  it('resets selection copy feedback when the selection changes', async () => {
    vi.useFakeTimers();
    mockClipboard();
    const container = renderTable();
    dragCells(dataCell(container, 0, 0), dataCell(container, 0, 0));
    await act(async () => {
      textButton(container, 'Copy TSV').click();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(container.textContent).toContain('Copied!');
    dragCells(dataCell(container, 1, 0), dataCell(container, 1, 0));
    expect(container.textContent).not.toContain('Copied!');
    expect(container.textContent).toContain('Copy TSV');
  });
  it('ignores stale selection copy feedback after selection changes', async () => {
    const clipboard = mockClipboardDelayed();
    const container = renderTable();
    dragCells(dataCell(container, 0, 0), dataCell(container, 0, 0));
    act(() => {
      textButton(container, 'Copy TSV').click();
    });
    dragCells(dataCell(container, 1, 0), dataCell(container, 1, 0));
    await act(async () => {
      clipboard.resolveCopy();
      await Promise.resolve();
    });
    expect(container.textContent).not.toContain('Copied!');
    expect(container.textContent).toContain('Copy TSV');
  });
  it('resets interactive state when table columns change', () => {
    const container = document.createElement('div');
    const portalRoot = document.createElement('div');
    portalRoot.dataset.webShellPortalRoot = '';
    portalRoot.dataset.webShellShadcn = '';
    document.body.appendChild(container);
    document.body.appendChild(portalRoot);
    const root = createRoot(container);
    const render = (children) => {
      act(() => {
        root.render(
          _jsx(WebShellPortalRootContext.Provider, {
            value: portalRoot,
            children: _jsx(I18nProvider, {
              language: 'en',
              children: _jsx(EnhancedMarkdownTable, { children: children }),
            }),
          }),
        );
      });
    };
    render([
      _jsx(
        'thead',
        {
          children: _jsxs('tr', {
            children: [
              _jsx('th', { children: 'Team' }),
              _jsx('th', { children: 'Score' }),
            ],
          }),
        },
        'head',
      ),
      _jsx(
        'tbody',
        {
          children: _jsxs('tr', {
            children: [
              _jsx('td', { children: 'Alpha' }),
              _jsx('td', { children: '10' }),
            ],
          }),
        },
        'body',
      ),
    ]);
    click(textButton(container, 'Custom columns'));
    click(customColumnCheckbox(document.body, 'Team'));
    expect(rowTexts(container)).toEqual(['10']);
    render([
      _jsx(
        'thead',
        {
          children: _jsxs('tr', {
            children: [
              _jsx('th', { children: 'Name' }),
              _jsx('th', { children: 'Value' }),
            ],
          }),
        },
        'head',
      ),
      _jsx(
        'tbody',
        {
          children: _jsxs('tr', {
            children: [
              _jsx('td', { children: 'Beta' }),
              _jsx('td', { children: '20' }),
            ],
          }),
        },
        'body',
      ),
    ]);
    expect(rowTexts(container)).toEqual(['Beta|20']);
    mounted.push({ root, container, portalRoot });
  });
  it('clears hidden column filters and sort', () => {
    const container = renderTable();
    click(button(container, 'Sort by Team'));
    click(button(container, 'Sort by Team, ascending'));
    click(button(container, 'Filter Team'));
    const beta = container.querySelector(
      '[data-name="markdown-table-filter-option-0-1"]',
    );
    expect(beta).not.toBeNull();
    click(beta);
    click(textButton(container, 'Confirm'));
    expect(rowTexts(container)).toEqual(['Gamma|30', 'Alpha|10']);
    toggleTableColumn(container, 'Team');
    expect(rowTexts(container)).toEqual(['10', '2', '30']);
    expect(container.textContent).toContain('3 rows');
  });
  it('selection copy skips hidden columns between selected cells', () => {
    const writeText = mockClipboard();
    const container = renderWideTable();
    toggleTableColumn(container, 'Region');
    dragCells(dataCell(container, 0, 0), dataCell(container, 1, 1));
    click(textButton(container, 'Copy TSV'));
    expect(writeText).toHaveBeenCalledWith(['Alpha\t10', 'Beta\t2'].join('\n'));
  });
  it('copies selected cells from the focused keyboard copy event', () => {
    const container = renderTable();
    const outsideButton = document.createElement('button');
    document.body.appendChild(outsideButton);
    outsideButton.focus();
    dragCells(dataCell(container, 0, 0), dataCell(container, 1, 1));
    const scroller = container.querySelector('div[tabindex="0"]');
    expect(scroller).not.toBeNull();
    expect(document.activeElement).toBe(scroller);
    const { event, setData } = dispatchCopy(document.activeElement);
    expect(event.defaultPrevented).toBe(true);
    expect(setData).toHaveBeenCalledWith(
      'text/plain',
      ['Alpha\t10', 'Beta\t2'].join('\n'),
    );
    outsideButton.remove();
  });
  it('keeps native text selection copy behavior', () => {
    const container = renderTable();
    const selection = document.getSelection();
    const range = document.createRange();
    range.selectNodeContents(dataCell(container, 0, 0));
    act(() => {
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
    const scroller = container.querySelector('div[tabindex="0"]');
    expect(scroller).not.toBeNull();
    const { event, setData } = dispatchCopy(scroller);
    expect(event.defaultPrevented).toBe(false);
    expect(setData).not.toHaveBeenCalled();
  });
  it('keeps cross-boundary native text selection copy behavior', () => {
    const container = renderTable();
    const outside = document.createElement('span');
    outside.textContent = 'outside';
    document.body.appendChild(outside);
    const selection = document.getSelection();
    const range = document.createRange();
    const startNode = dataCell(container, 0, 0).firstChild;
    const endNode = outside.firstChild;
    expect(startNode).not.toBeNull();
    expect(endNode).not.toBeNull();
    range.setStart(startNode, 0);
    range.setEnd(endNode, outside.textContent.length);
    act(() => {
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
    const scroller = container.querySelector('div[tabindex="0"]');
    expect(scroller).not.toBeNull();
    const { event, setData } = dispatchCopy(scroller);
    expect(event.defaultPrevented).toBe(false);
    expect(setData).not.toHaveBeenCalled();
    outside.remove();
  });
  it('prevents native text selection when selecting cells with the mouse', () => {
    const container = renderTable();
    const event = new MouseEvent('mousedown', {
      bubbles: true,
      button: 0,
      cancelable: true,
    });
    act(() => {
      dataCell(container, 0, 0).dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
  });
  it('stops extending a selection after window blur', () => {
    const writeText = mockClipboard();
    const container = renderTable();
    const from = dataCell(container, 0, 0);
    const to = dataCell(container, 1, 1);
    act(() => {
      from.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, button: 0 }),
      );
      window.dispatchEvent(new Event('blur'));
      to.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true, relatedTarget: from }),
      );
    });
    click(textButton(container, 'Copy TSV'));
    expect(writeText).toHaveBeenCalledWith('Alpha');
  });
  it('selects cells with touch drag', () => {
    const writeText = mockClipboard();
    const container = renderTable();
    const from = dataCell(container, 0, 0);
    const to = dataCell(container, 1, 1);
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => to),
    });
    act(() => {
      from.dispatchEvent(
        touchEvent('touchstart', [{ clientX: 1, clientY: 1 }]),
      );
      from.dispatchEvent(touchEvent('touchmove', [{ clientX: 2, clientY: 2 }]));
      from.dispatchEvent(touchEvent('touchend', []));
    });
    click(textButton(container, 'Copy TSV'));
    expect(writeText).toHaveBeenCalledWith(['Alpha\t10', 'Beta\t2'].join('\n'));
  });
  it('resets filter menu draft state when switching columns', async () => {
    const container = renderWideTable();
    click(button(container, 'Filter Team'));
    const teamSearch = container.querySelector(
      'input[name="markdown-table-option-search-0"]',
    );
    expect(teamSearch).not.toBeNull();
    inputValue(teamSearch, 'Al');
    click(button(container, 'Filter Score'));
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    });
    const scoreSearch = container.querySelector(
      'input[name="markdown-table-option-search-2"]',
    );
    expect(scoreSearch?.value).toBe('');
  });
  it('lets an outside header action close the filter and run immediately', async () => {
    const container = renderTable();
    click(button(container, 'Filter Team'));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const scoreSort = button(container, 'Sort by Score');
    act(() => {
      scoreSort.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true, button: 0 }),
      );
    });
    act(() => {
      scoreSort.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, button: 0 }),
      );
      scoreSort.dispatchEvent(
        new MouseEvent('mouseup', { bubbles: true, button: 0 }),
      );
      scoreSort.dispatchEvent(
        new MouseEvent('click', { bubbles: true, button: 0 }),
      );
    });
    expect(container.textContent).not.toContain('Custom filter');
    expect(rowTexts(container)).toEqual(['Beta|2', 'Alpha|10', 'Gamma|30']);
  });
  it('closes the filter menu when clicking outside it', () => {
    const container = renderTable();
    click(button(container, 'Filter Team'));
    expect(container.textContent).toContain('Custom filter');
    act(() => {
      dataCell(container, 0, 0).dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, button: 0 }),
      );
    });
    expect(container.textContent).not.toContain('Custom filter');
  });
  it('returns focus to the filter trigger when Escape closes the menu', async () => {
    const container = renderTable();
    const filterButton = button(container, 'Filter Team');
    click(filterButton);
    expect(container.textContent).toContain('Custom filter');
    expect(
      container.querySelector('input[name="markdown-table-option-search-0"]'),
    ).toBe(document.activeElement);
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }),
      );
    });
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    });
    expect(container.textContent).not.toContain('Custom filter');
    expect(document.activeElement).toBe(filterButton);
  });
  it('keeps focus within the filter popover', () => {
    const container = renderTable();
    click(button(container, 'Filter Team'));
    const menu = container.querySelector('[role="dialog"]');
    expect(menu).not.toBeNull();
    const focusableElements = Array.from(
      menu.querySelectorAll('button, input, select'),
    ).filter((element) => !element.hasAttribute('disabled'));
    expect(focusableElements.length).toBeGreaterThan(1);
    focusableElements[0].focus();
    act(() => {
      focusableElements[0].dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: 'Tab',
          shiftKey: true,
        }),
      );
    });
    expect(document.activeElement).toBe(
      focusableElements[focusableElements.length - 1],
    );
  });
  it('does not trap Tab when focus is outside the filter popover', () => {
    const container = renderTable();
    const outsideButton = document.createElement('button');
    document.body.appendChild(outsideButton);
    click(button(container, 'Filter Team'));
    act(() => outsideButton.focus());
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
    });
    act(() => {
      document.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(outsideButton);
    outsideButton.remove();
  });
  it('closes the filter menu on scroll', () => {
    const container = renderTable();
    click(button(container, 'Filter Team'));
    expect(container.textContent).toContain('Custom filter');
    const filterMenu = container.querySelector(
      '[data-markdown-table-filter-owner]',
    );
    act(() => {
      filterMenu.dispatchEvent(new Event('scroll'));
    });
    expect(container.textContent).toContain('Custom filter');
    const unrelatedPopover = document.createElement('div');
    unrelatedPopover.dataset.markdownTableFilterOwner = 'unrelated';
    document.body.appendChild(unrelatedPopover);
    act(() => {
      unrelatedPopover.dispatchEvent(new Event('scroll'));
    });
    unrelatedPopover.remove();
    expect(container.textContent).not.toContain('Custom filter');
  });
  it('keeps sorting and column visibility out of the filter menu', () => {
    const container = renderTable();
    click(button(container, 'Filter Team'));
    expect(container.textContent).not.toContain('Hide column');
    expect(container.textContent).not.toContain('Sort ascending');
    expect(container.textContent).not.toContain('Sort descending');
  });
  it('controls row-detail fields independently from table columns', () => {
    const container = renderTable();
    const detailsButton = button(container, 'View details for row 2');
    click(detailsButton);
    const detailsId = detailsButton.getAttribute('aria-controls');
    expect(detailsId).toBeTruthy();
    const details = container.ownerDocument.getElementById(detailsId);
    expect(details).not.toBeNull();
    expect(details?.textContent).toContain('Team');
    expect(details?.textContent).toContain('Beta');
    expect(details?.textContent).toContain('Score');
    expect(details?.textContent).toContain('2');
    toggleDetailColumn(container, 'Team');
    expect(details?.textContent).not.toContain('Team');
    expect(details?.textContent).not.toContain('Beta');
    expect(details?.textContent).toContain('Score');
    expect(details?.textContent).toContain('2');
    expect(container.querySelector('thead')?.textContent).toContain('Team');
  });
  it('closes row details when the row is filtered out', () => {
    const container = renderTable();
    click(button(container, 'View details for row 2'));
    click(button(container, 'Filter Team'));
    const beta = container.querySelector(
      '[data-name="markdown-table-filter-option-0-1"]',
    );
    expect(beta).not.toBeNull();
    click(beta);
    click(textButton(container, 'Confirm'));
    expect(rowTexts(container)).toEqual(['Alpha|10', 'Gamma|30']);
    expect(container.textContent).not.toContain('Row details');
    expect(container.textContent).not.toContain('Beta');
  });
  it('falls back for oversized tables', () => {
    const rows = Array.from({ length: 501 }, (_, index) =>
      _jsx('tr', { children: _jsx('td', { children: index }) }, index),
    );
    const container = renderTableContent(
      [
        _jsx(
          'thead',
          {
            children: _jsx('tr', {
              children: _jsx('th', { children: 'Value' }),
            }),
          },
          'head',
        ),
        _jsx('tbody', { children: rows }, 'body'),
      ],
      'en',
      _jsx('table', {
        children: _jsx('tbody', {
          children: _jsx('tr', {
            children: _jsx('td', { children: 'plain fallback' }),
          }),
        }),
      }),
    );
    expect(container.textContent).toContain('plain fallback');
    expect(container.textContent).not.toContain('Copy table');
  });
  it('falls back when a table has no parsed columns', () => {
    const container = renderTableContent(
      _jsx('tbody', { children: _jsx('tr', {}) }),
      'en',
      _jsx('table', {
        children: _jsx('tbody', {
          children: _jsx('tr', {
            children: _jsx('td', { children: 'plain fallback' }),
          }),
        }),
      }),
    );
    expect(container.textContent).toContain('plain fallback');
    expect(container.textContent).not.toContain('Copy table');
  });
  it('shows a distinct message for empty tables', () => {
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsx('tr', { children: _jsx('th', { children: 'Value' }) }),
        },
        'head',
      ),
    ]);
    expect(container.textContent).toContain('This table has no data.');
    expect(container.textContent).not.toContain('No rows match the filters.');
  });
  it('keeps footer rows visible', () => {
    const container = renderTableContent([
      _jsx(
        'thead',
        {
          children: _jsx('tr', { children: _jsx('th', { children: 'Item' }) }),
        },
        'head',
      ),
      _jsx(
        'tbody',
        {
          children: _jsx('tr', { children: _jsx('td', { children: 'Alpha' }) }),
        },
        'body',
      ),
      _jsx(
        'tfoot',
        {
          children: _jsx('tr', { children: _jsx('td', { children: 'Total' }) }),
        },
        'foot',
      ),
    ]);
    expect(rowTexts(container)).toEqual(['Alpha', 'Total']);
  });
  it('parses direct table row children', () => {
    const container = renderTableContent([
      _jsxs(
        'tr',
        {
          children: [
            _jsx('th', { children: 'Team' }),
            _jsx('th', { children: 'Score' }),
          ],
        },
        'head',
      ),
      _jsxs(
        'tr',
        {
          children: [
            _jsx('td', { children: 'Alpha' }),
            _jsx('td', { children: '10' }),
          ],
        },
        'alpha',
      ),
    ]);
    expect(container.textContent).toContain('Copy table');
    expect(rowTexts(container)).toEqual(['Alpha|10']);
  });
  it('localizes the new controls', () => {
    const longText =
      '这是一段足够长的中文备注，用来触发表格里的长文本折叠和统一展开控制，并验证本地化文案在工具栏和行详情中都能正确显示，避免后续回归。';
    const container = renderTableContent(
      [
        _jsx(
          'thead',
          {
            children: _jsxs('tr', {
              children: [
                _jsx('th', { children: 'Team' }),
                _jsx('th', { children: 'Note' }),
              ],
            }),
          },
          'head',
        ),
        _jsxs(
          'tbody',
          {
            children: [
              _jsxs('tr', {
                children: [
                  _jsx('td', { children: 'Alpha' }),
                  _jsx('td', { children: longText }),
                ],
              }),
              _jsxs('tr', {
                children: [_jsx('td', { children: 'Beta' }), _jsx('td', {})],
              }),
            ],
          },
          'body',
        ),
      ],
      'zh-CN',
    );
    expect(container.textContent).toContain('复制表格');
    expect(container.textContent).toContain('标准密度');
    expect(container.textContent).toContain('展开文本');
    expect(container.textContent).toContain('详情');
    click(textButton(container, '展开文本'));
    expect(container.textContent).toContain('收起文本');
    click(button(container, '查看第 2 行详情'));
    expect(container.textContent).toContain('(空白)');
    openColumnMenu(container, 'Team');
    expect(container.textContent).toContain('冻结首列');
    click(button(container, '筛选 Team'));
    expect(container.textContent).not.toContain('隐藏列');
    expect(container.textContent).not.toContain('升序排序');
  });
});
//# sourceMappingURL=EnhancedMarkdownTable.test.js.map
