import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from 'react/jsx-runtime';
import {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useI18n } from '../../i18n';
import { useInteractionBlocker } from '../../interactionBlockContext';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '../ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  ArrowDownIcon,
  ArrowDownUpIcon,
  ArrowUpIcon,
  BoltIcon,
  CheckIcon,
  CopyIcon,
  FilterIcon,
  GripVerticalIcon,
  MinusIcon,
  PlusIcon,
  Rows3Icon,
  XIcon,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import styles from './EnhancedMarkdownTable.module.css';
const TEXT_FILTER_LABEL_KEYS = {
  contains: 'markdownTable.filter.text.contains',
  equals: 'markdownTable.filter.text.equals',
  notEquals: 'markdownTable.filter.text.notEquals',
  startsWith: 'markdownTable.filter.text.startsWith',
  endsWith: 'markdownTable.filter.text.endsWith',
};
const NUMBER_FILTER_LABEL_KEYS = {
  gt: 'markdownTable.filter.number.gt',
  gte: 'markdownTable.filter.number.gte',
  lt: 'markdownTable.filter.number.lt',
  lte: 'markdownTable.filter.number.lte',
  between: 'markdownTable.filter.number.between',
};
export const MAX_ENHANCED_TABLE_ROWS = 500;
export const MAX_ENHANCED_TABLE_COLUMNS = 50;
// Must stay in sync with --action-column-width in EnhancedMarkdownTable.module.css
const ACTION_COLUMN_WIDTH = 40;
const DEFAULT_COLUMN_WIDTH = 160;
const COMPACT_COLUMN_WIDTH = 72;
const MIN_COLUMN_WIDTH = 80;
const MAX_COLUMN_WIDTH = 640;
const KEYBOARD_COLUMN_RESIZE_STEP = 16;
const COLUMN_DRAG_MIME = 'application/x-qwen-web-shell-table-column';
const LONG_CELL_TEXT_LENGTH = 60;
const LONG_CELL_LINE_COUNT = 3;
const DENSITY_OPTIONS = ['standard', 'compact', 'comfortable'];
const ACTION_COLUMN_STYLE = {
  width: ACTION_COLUMN_WIDTH,
  minWidth: ACTION_COLUMN_WIDTH,
  maxWidth: ACTION_COLUMN_WIDTH,
};
function clampColumnWidth(width) {
  return Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, width));
}
function isInteractiveSelectionTarget(target) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        'a, button, input, textarea, select, [contenteditable="true"]',
      ),
    )
  );
}
function hasNativeSelection() {
  const selection = document.getSelection();
  return Boolean(selection && !selection.isCollapsed);
}
function isTagElement(node, tag) {
  return isValidElement(node) && node.type === tag;
}
function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim();
}
function isLongCellText(value) {
  return (
    value.length > LONG_CELL_TEXT_LENGTH ||
    value.split(/\r\n|\r|\n/).length > LONG_CELL_LINE_COUNT
  );
}
function densityClassName(density) {
  switch (density) {
    case 'compact':
      return styles.densityCompact;
    case 'comfortable':
      return styles.densityComfortable;
    case 'standard':
    default:
      return styles.densityStandard;
  }
}
function findVerticalScrollContainer(element) {
  let current = element;
  while (current) {
    const overflowY = window.getComputedStyle(current).overflowY;
    if (
      overflowY === 'auto' ||
      overflowY === 'scroll' ||
      overflowY === 'overlay'
    ) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}
function getTextContent(node) {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getTextContent).join('');
  }
  if (isValidElement(node)) {
    if (node.type === 'img') return node.props.alt ?? '';
    return getTextContent(node.props.children);
  }
  return '';
}
function emptyCell(rowKey, columnIndex) {
  return {
    key: `${rowKey}-empty-${columnIndex}`,
    content: '',
    text: '',
    rawText: '',
    isHeader: false,
  };
}
function parseRow(rowNode, rowKey) {
  const cellNodes = Children.toArray(rowNode.props.children).filter(
    (child) => isTagElement(child, 'td') || isTagElement(child, 'th'),
  );
  return {
    key: rowKey,
    cells: cellNodes.map((cellNode, cellIndex) => {
      const rawText = getTextContent(cellNode.props.children);
      return {
        key: `${rowKey}-${cellIndex}`,
        content: cellNode.props.children,
        text: normalizeText(rawText),
        rawText,
        isHeader: cellNode.type === 'th',
        textAlign: cellNode.props.style?.textAlign,
      };
    }),
  };
}
function parseRows(sectionNode, prefix) {
  return Children.toArray(sectionNode.props.children)
    .filter((child) => isTagElement(child, 'tr'))
    .map((rowNode, rowIndex) => parseRow(rowNode, `${prefix}-${rowIndex}`));
}
function normalizeRow(row, columnCount) {
  return {
    ...row,
    cells: Array.from(
      { length: columnCount },
      (_, columnIndex) =>
        row.cells[columnIndex] ?? emptyCell(row.key, columnIndex),
    ),
  };
}
function parseTable(children, defaultColumnLabel) {
  const topLevel = Children.toArray(children);
  const headerRows = [];
  const bodyRows = [];
  const directRows = [];
  topLevel.forEach((child, index) => {
    if (isTagElement(child, 'thead')) {
      headerRows.push(...parseRows(child, `head-${index}`));
    } else if (isTagElement(child, 'tbody')) {
      bodyRows.push(...parseRows(child, `body-${index}`));
    } else if (isTagElement(child, 'tfoot')) {
      bodyRows.push(...parseRows(child, `foot-${index}`));
    } else if (isTagElement(child, 'tr')) {
      directRows.push(parseRow(child, `row-${index}`));
    }
  });
  if (directRows.length > 0) {
    const [firstRow, ...restRows] = directRows;
    if (firstRow?.cells.some((cell) => cell.isHeader)) {
      headerRows.push(firstRow);
      bodyRows.push(...restRows);
    } else {
      bodyRows.push(...directRows);
    }
  }
  const allRows = [...headerRows, ...bodyRows];
  const columnCount = Math.max(0, ...allRows.map((row) => row.cells.length));
  const firstHeaderRow = headerRows[0];
  const headers = Array.from({ length: columnCount }, (_, columnIndex) => {
    const cell = firstHeaderRow?.cells[columnIndex];
    if (cell) return cell;
    const label = defaultColumnLabel(columnIndex);
    return {
      key: `header-${columnIndex}`,
      content: label,
      text: label,
      rawText: label,
      isHeader: true,
    };
  });
  return {
    headers,
    rows: bodyRows.map((row) => normalizeRow(row, columnCount)),
    columnCount,
  };
}
function parseNumber(value) {
  const trimmed = value.trim();
  const isPercent = trimmed.endsWith('%');
  const numericText = isPercent ? trimmed.slice(0, -1) : trimmed;
  const normalized = numericText.replace(/[$€£¥₹,\s]/g, '');
  if (!/^-?(\d+(\.\d+)?|\.\d+)$/.test(normalized)) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return isPercent ? parsed / 100 : parsed;
}
function compareCellText(a, b) {
  const aNumber = parseNumber(a);
  const bNumber = parseNumber(b);
  if (aNumber !== null && bNumber !== null && aNumber !== bNumber) {
    return aNumber - bNumber;
  }
  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}
function getSelectionRowBounds(range) {
  return {
    minRow: Math.min(range.anchorRow, range.focusRow),
    maxRow: Math.max(range.anchorRow, range.focusRow),
  };
}
function getSelectedColumnIndexes(range, visibleColumnIndexes) {
  if (!range) return [];
  const anchorIndex = visibleColumnIndexes.indexOf(range.anchorCol);
  const focusIndex = visibleColumnIndexes.indexOf(range.focusCol);
  if (anchorIndex === -1 || focusIndex === -1) return [];
  const minIndex = Math.min(anchorIndex, focusIndex);
  const maxIndex = Math.max(anchorIndex, focusIndex);
  return visibleColumnIndexes.slice(minIndex, maxIndex + 1);
}
function sanitizeForClipboard(value) {
  const inspectedValue = value
    .replace(/[\u200B-\u200D\u2060\u00AD\uFEFF]/g, '')
    .trimStart();
  return /^[=+\-@]/.test(inspectedValue) ? `'${value}` : value;
}
function cellClipboardText(cell) {
  return (cell?.rawText ?? cell?.text ?? '').replace(/[\r\n\t]+/g, ' ');
}
function cellReadableText(cell) {
  return cell.rawText || cell.text;
}
function applyColumnWidth(current, columnIndex, nextWidth) {
  const currentWidth = current[columnIndex] ?? DEFAULT_COLUMN_WIDTH;
  if (currentWidth === nextWidth) return current;
  if (nextWidth === DEFAULT_COLUMN_WIDTH) {
    const next = { ...current };
    delete next[columnIndex];
    return next;
  }
  return {
    ...current,
    [columnIndex]: nextWidth,
  };
}
function getSelectionText(range, rows, visibleColumnIndexes) {
  if (!range) return '';
  const { minRow, maxRow } = getSelectionRowBounds(range);
  const selectedColumns = getSelectedColumnIndexes(range, visibleColumnIndexes);
  if (selectedColumns.length === 0) return '';
  const lines = [];
  for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex++) {
    const row = rows[rowIndex];
    if (!row) continue;
    lines.push(
      selectedColumns
        .map((columnIndex) =>
          sanitizeForClipboard(cellClipboardText(row.cells[columnIndex])),
        )
        .join('\t'),
    );
  }
  return lines.join('\n');
}
function getVisibleTableText(headers, rows, visibleColumnIndexes) {
  if (visibleColumnIndexes.length === 0) return '';
  const lines = [
    visibleColumnIndexes
      .map((columnIndex) =>
        sanitizeForClipboard(cellClipboardText(headers[columnIndex])),
      )
      .join('\t'),
    ...rows.map((row) =>
      visibleColumnIndexes
        .map((columnIndex) =>
          sanitizeForClipboard(cellClipboardText(row.cells[columnIndex])),
        )
        .join('\t'),
    ),
  ];
  return lines.join('\n');
}
function getSelectionStatistics(range, rows, visibleColumnIndexes) {
  if (!range) return null;
  const { minRow, maxRow } = getSelectionRowBounds(range);
  const selectedColumns = getSelectedColumnIndexes(range, visibleColumnIndexes);
  if (selectedColumns.length === 0) return null;
  let selectedCount = 0;
  let nonEmptyCount = 0;
  let numericCount = 0;
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  let allPercent = true;
  let allCurrency = true;
  let currencySymbol;
  for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex++) {
    const row = rows[rowIndex];
    if (!row) continue;
    selectedColumns.forEach((columnIndex) => {
      const cell = row.cells[columnIndex];
      if (!cell) return;
      selectedCount += 1;
      const value = cell.text.trim();
      if (!value) return;
      nonEmptyCount += 1;
      const numericValue = parseNumber(value);
      if (numericValue === null) return;
      numericCount += 1;
      sum += numericValue;
      min = Math.min(min, numericValue);
      max = Math.max(max, numericValue);
      allPercent = allPercent && value.endsWith('%');
      const symbols = value.match(/[$€£¥₹]/g);
      const currentSymbol = symbols?.length === 1 ? symbols[0] : undefined;
      if (!currentSymbol) {
        allCurrency = false;
      } else if (currencySymbol === undefined) {
        currencySymbol = currentSymbol;
      } else if (currencySymbol !== currentSymbol) {
        allCurrency = false;
      }
    });
  }
  if (selectedCount === 0) return null;
  const format =
    numericCount > 0 && allPercent
      ? 'percent'
      : numericCount > 0 && allCurrency && currencySymbol
        ? 'currency'
        : 'number';
  return {
    selectedCount,
    nonEmptyCount,
    numericCount,
    sum,
    average: numericCount > 0 ? sum / numericCount : 0,
    min: numericCount > 0 ? min : 0,
    max: numericCount > 0 ? max : 0,
    format,
    currencySymbol,
  };
}
function formatSelectionStatistic(value, statistics, language) {
  const normalizedValue = Object.is(value, -0) ? 0 : value;
  const locale = language === 'en' ? 'en-US' : language;
  if (statistics.format === 'percent') {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      maximumFractionDigits: 6,
    }).format(normalizedValue);
  }
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 6,
  }).format(Math.abs(normalizedValue));
  if (statistics.format === 'currency' && statistics.currencySymbol) {
    return `${normalizedValue < 0 ? '-' : ''}${statistics.currencySymbol}${formatted}`;
  }
  return normalizedValue < 0 ? `-${formatted}` : formatted;
}
function moveColumn(order, fromColumn, toColumn) {
  if (fromColumn === toColumn) return order;
  const fromIndex = order.indexOf(fromColumn);
  const toIndex = order.indexOf(toColumn);
  if (fromIndex === -1 || toIndex === -1) return order;
  const next = [...order];
  const [moved] = next.splice(fromIndex, 1);
  if (moved === undefined) return order;
  next.splice(toIndex, 0, moved);
  return next;
}
function initialColumnOrder(columnCount) {
  return Array.from({ length: columnCount }, (_, index) => index);
}
function hasColumnDragData(dataTransfer) {
  return Array.from(dataTransfer.types).includes(COLUMN_DRAG_MIME);
}
function isFilterActive(filter) {
  if (!filter) return false;
  if (filter.selectedValues !== undefined) return true;
  if (filter.textFilter?.value.trim()) return true;
  if (filter.numberFilter?.value.trim()) return true;
  return false;
}
function matchesTextFilter(value, filter) {
  if (!filter?.value.trim()) return true;
  const cellText = value.toLowerCase();
  const filterText = filter.value.trim().toLowerCase();
  switch (filter.operator) {
    case 'equals':
      return cellText === filterText;
    case 'notEquals':
      return cellText !== filterText;
    case 'startsWith':
      return cellText.startsWith(filterText);
    case 'endsWith':
      return cellText.endsWith(filterText);
    case 'contains':
    default:
      return cellText.includes(filterText);
  }
}
function matchesNumberFilter(value, filter) {
  if (!filter?.value.trim()) return true;
  const cellNumber = parseNumber(value);
  const filterNumber = parseNumber(filter.value);
  if (cellNumber === null || filterNumber === null) return false;
  switch (filter.operator) {
    case 'gt':
      return cellNumber > filterNumber;
    case 'gte':
      return cellNumber >= filterNumber;
    case 'lt':
      return cellNumber < filterNumber;
    case 'lte':
      return cellNumber <= filterNumber;
    case 'between': {
      const filterNumberTo = parseNumber(filter.valueTo ?? '');
      if (filterNumberTo === null) return false;
      const min = Math.min(filterNumber, filterNumberTo);
      const max = Math.max(filterNumber, filterNumberTo);
      return cellNumber >= min && cellNumber <= max;
    }
    default:
      return true;
  }
}
function matchesColumnFilter(value, filter) {
  if (
    filter.selectedValues !== undefined &&
    !filter.selectedValues.includes(value)
  ) {
    return false;
  }
  return (
    matchesTextFilter(value, filter.textFilter) &&
    matchesNumberFilter(value, filter.numberFilter)
  );
}
function applyFilters(rows, filters, excludeColumnIndex) {
  const activeFilters = Object.entries(filters)
    .map(([key, value]) => [Number(key), value])
    .filter(
      ([columnIndex, value]) =>
        columnIndex !== excludeColumnIndex && isFilterActive(value),
    );
  if (activeFilters.length === 0) return rows;
  return rows.filter((row) =>
    activeFilters.every(([columnIndex, filter]) =>
      matchesColumnFilter(row.cells[columnIndex]?.text ?? '', filter),
    ),
  );
}
function sortRows(rows, sort) {
  if (!sort) return rows;
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const result = compareCellText(
        a.row.cells[sort.columnIndex]?.text ?? '',
        b.row.cells[sort.columnIndex]?.text ?? '',
      );
      const sorted = sort.direction === 'asc' ? result : -result;
      return sorted === 0 ? a.index - b.index : sorted;
    })
    .map(({ row }) => row);
}
function getColumnOptions(rows, columnIndex, blankLabel) {
  const counts = new Map();
  rows.forEach((row) => {
    const value = row.cells[columnIndex]?.text ?? '';
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      label: value || blankLabel,
      count,
    }))
    .sort((a, b) => compareCellText(a.value, b.value));
}
function isMostlyNumericColumn(rows, columnIndex) {
  let filledCount = 0;
  let numericCount = 0;
  rows.forEach((row) => {
    const value = row.cells[columnIndex]?.text ?? '';
    if (!value) return;
    filledCount += 1;
    if (parseNumber(value) !== null) numericCount += 1;
  });
  return filledCount > 0 && numericCount / filledCount >= 0.7;
}
function hasSameValues(a, b) {
  if (a.length !== b.length) return false;
  const aSet = new Set(a);
  return b.every((value) => aSet.has(value));
}
function normalizeFilter(filter, allOptionValues) {
  const next = {};
  if (
    filter.selectedValues !== undefined &&
    !hasSameValues(filter.selectedValues, allOptionValues)
  ) {
    next.selectedValues = filter.selectedValues;
  }
  if (filter.textFilter?.value.trim()) {
    next.textFilter = {
      operator: filter.textFilter.operator,
      value: filter.textFilter.value.trim(),
    };
  }
  if (filter.numberFilter?.value.trim()) {
    const value = filter.numberFilter.value.trim();
    const valueTo = filter.numberFilter.valueTo?.trim();
    if (
      parseNumber(value) !== null &&
      (filter.numberFilter.operator !== 'between' ||
        parseNumber(valueTo ?? '') !== null)
    ) {
      next.numberFilter = {
        operator: filter.numberFilter.operator,
        value,
        valueTo,
      };
    }
  }
  return isFilterActive(next) ? next : undefined;
}
function ValueFilterSection({
  columnIndex,
  columnName,
  search,
  searchInputRef,
  filteredOptions,
  visibleOptions,
  selectedValues,
  allFilteredSelected,
  onSearchChange,
  onFilteredSelectionChange,
  onToggleValue,
}) {
  const { t } = useI18n();
  return _jsxs('div', {
    className: 'flex flex-col gap-1.5 border-b px-2.5 py-2',
    children: [
      _jsx(Input, {
        ref: searchInputRef,
        className: 'h-7 text-xs',
        value: search,
        onChange: (event) => onSearchChange(event.currentTarget.value),
        placeholder: t('markdownTable.filter.searchPlaceholder'),
        name: `markdown-table-option-search-${columnIndex}`,
        'aria-label': t('markdownTable.filter.searchAria', {
          column: columnName,
        }),
      }),
      _jsxs(Label, {
        htmlFor: `markdown-table-filter-all-${columnIndex}`,
        className:
          'min-h-7 cursor-pointer gap-2 px-1.5 py-1 text-xs font-normal hover:bg-muted',
        children: [
          _jsx(Checkbox, {
            id: `markdown-table-filter-all-${columnIndex}`,
            name: `markdown-table-filter-all-${columnIndex}`,
            'data-name': `markdown-table-filter-all-${columnIndex}`,
            checked: allFilteredSelected,
            onCheckedChange: (checked) =>
              onFilteredSelectionChange(checked === true),
          }),
          _jsx('span', { children: t('markdownTable.filter.selectVisible') }),
          _jsx('span', {
            className: 'ml-auto text-muted-foreground tabular-nums',
            children: filteredOptions.length,
          }),
        ],
      }),
      _jsxs('div', {
        className: 'max-h-[170px] overflow-auto rounded-md border bg-muted/50',
        children: [
          visibleOptions.map((option, optionIndex) =>
            _jsxs(
              Label,
              {
                htmlFor: `markdown-table-filter-option-${columnIndex}-${optionIndex}`,
                className:
                  'min-h-7 cursor-pointer gap-2 px-1.5 py-1 text-xs font-normal hover:bg-muted',
                children: [
                  _jsx(Checkbox, {
                    id: `markdown-table-filter-option-${columnIndex}-${optionIndex}`,
                    name: `markdown-table-filter-option-${columnIndex}-${optionIndex}`,
                    'data-name': `markdown-table-filter-option-${columnIndex}-${optionIndex}`,
                    checked: selectedValues.has(option.value),
                    onCheckedChange: () => onToggleValue(option.value),
                  }),
                  _jsx('span', {
                    className: 'min-w-0 flex-1 truncate',
                    children: option.label,
                  }),
                  _jsx('span', {
                    className: 'ml-auto text-muted-foreground tabular-nums',
                    children: option.count,
                  }),
                ],
              },
              option.value,
            ),
          ),
          filteredOptions.length > visibleOptions.length &&
            _jsx('div', {
              className: 'p-2 text-center text-muted-foreground',
              children: t('markdownTable.filter.optionLimit', {
                count: visibleOptions.length,
              }),
            }),
          filteredOptions.length === 0 &&
            _jsx('div', {
              className: 'p-2 text-center text-muted-foreground',
              children: t('markdownTable.filter.noOptions'),
            }),
        ],
      }),
    ],
  });
}
function CustomFilterSection({
  overlayId,
  columnIndex,
  columnName,
  isNumeric,
  textOperator,
  textValue,
  numberOperator,
  numberValue,
  numberValueTo,
  onTextOperatorChange,
  onTextValueChange,
  onNumberOperatorChange,
  onNumberValueChange,
  onNumberValueToChange,
}) {
  const { t } = useI18n();
  return _jsxs('div', {
    className: 'flex flex-col gap-1.5 border-b px-2.5 py-2',
    children: [
      _jsx('div', {
        className: 'font-semibold text-muted-foreground',
        children: t('markdownTable.filter.custom'),
      }),
      isNumeric
        ? _jsxs(_Fragment, {
            children: [
              _jsxs(Select, {
                value: numberOperator,
                name: `markdown-table-number-operator-${columnIndex}`,
                onValueChange: (value) => onNumberOperatorChange(value),
                children: [
                  _jsx(SelectTrigger, {
                    size: 'sm',
                    className: 'w-full text-xs',
                    'data-name': `markdown-table-number-operator-${columnIndex}`,
                    'aria-label': t('markdownTable.filter.numberAria', {
                      column: columnName,
                    }),
                    children: _jsx(SelectValue, {}),
                  }),
                  _jsx(SelectContent, {
                    'data-markdown-table-filter-owner': overlayId,
                    className:
                      'z-[calc(var(--web-shell-popover-z-index,1000)+1)]',
                    children: Object.entries(NUMBER_FILTER_LABEL_KEYS).map(
                      ([value, labelKey]) =>
                        _jsx(
                          SelectItem,
                          {
                            value: value,
                            'data-value': value,
                            className: 'text-xs',
                            children: t(labelKey),
                          },
                          value,
                        ),
                    ),
                  }),
                ],
              }),
              _jsxs('div', {
                className: 'flex gap-1.5',
                children: [
                  _jsx(Input, {
                    className: 'h-7 text-xs',
                    value: numberValue,
                    onChange: (event) =>
                      onNumberValueChange(event.currentTarget.value),
                    placeholder: t('markdownTable.filter.numberPlaceholder'),
                    name: `markdown-table-number-filter-${columnIndex}`,
                  }),
                  numberOperator === 'between' &&
                    _jsx(Input, {
                      className: 'h-7 text-xs',
                      value: numberValueTo,
                      onChange: (event) =>
                        onNumberValueToChange(event.currentTarget.value),
                      placeholder: t('markdownTable.filter.toPlaceholder'),
                      name: `markdown-table-number-filter-to-${columnIndex}`,
                    }),
                ],
              }),
            ],
          })
        : _jsxs(_Fragment, {
            children: [
              _jsxs(Select, {
                value: textOperator,
                name: `markdown-table-text-operator-${columnIndex}`,
                onValueChange: (value) => onTextOperatorChange(value),
                children: [
                  _jsx(SelectTrigger, {
                    size: 'sm',
                    className: 'w-full text-xs',
                    'data-name': `markdown-table-text-operator-${columnIndex}`,
                    'aria-label': t('markdownTable.filter.textAria', {
                      column: columnName,
                    }),
                    children: _jsx(SelectValue, {}),
                  }),
                  _jsx(SelectContent, {
                    'data-markdown-table-filter-owner': overlayId,
                    className:
                      'z-[calc(var(--web-shell-popover-z-index,1000)+1)]',
                    children: Object.entries(TEXT_FILTER_LABEL_KEYS).map(
                      ([value, labelKey]) =>
                        _jsx(
                          SelectItem,
                          {
                            value: value,
                            'data-value': value,
                            className: 'text-xs',
                            children: t(labelKey),
                          },
                          value,
                        ),
                    ),
                  }),
                ],
              }),
              _jsx(Input, {
                className: 'h-7 text-xs',
                value: textValue,
                onChange: (event) =>
                  onTextValueChange(event.currentTarget.value),
                placeholder: t('markdownTable.filter.textPlaceholder'),
                name: `markdown-table-text-filter-${columnIndex}`,
              }),
            ],
          }),
    ],
  });
}
function FilterMenuFooter({ onClear, onClose, onApply }) {
  const { t } = useI18n();
  return _jsxs('div', {
    className: 'flex items-center gap-1.5 px-2.5 py-2',
    children: [
      _jsx(Button, {
        variant: 'outline',
        size: 'sm',
        type: 'button',
        onClick: onClear,
        children: t('markdownTable.filter.reset'),
      }),
      _jsx('span', { className: 'flex-1' }),
      _jsx(Button, {
        variant: 'outline',
        size: 'sm',
        type: 'button',
        onClick: onClose,
        children: t('markdownTable.filter.cancel'),
      }),
      _jsx(Button, {
        size: 'sm',
        type: 'button',
        onClick: onApply,
        children: t('markdownTable.filter.confirm'),
      }),
    ],
  });
}
function ColumnFilterMenu({
  id,
  columnName,
  columnIndex,
  filter,
  isNumeric,
  options,
  onApply,
  onClose,
}) {
  const allOptionValues = useMemo(
    () => options.map((option) => option.value),
    [options],
  );
  const [search, setSearch] = useState('');
  const [selectedValues, setSelectedValues] = useState(
    () => new Set(filter?.selectedValues ?? allOptionValues),
  );
  const [textOperator, setTextOperator] = useState(
    filter?.textFilter?.operator ?? 'contains',
  );
  const [textValue, setTextValue] = useState(filter?.textFilter?.value ?? '');
  const [numberOperator, setNumberOperator] = useState(
    filter?.numberFilter?.operator ?? 'gt',
  );
  const [numberValue, setNumberValue] = useState(
    filter?.numberFilter?.value ?? '',
  );
  const [numberValueTo, setNumberValueTo] = useState(
    filter?.numberFilter?.valueTo ?? '',
  );
  const searchInputRef = useRef(null);
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);
  const filteredOptions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(keyword),
    );
  }, [options, search]);
  const visibleOptions = filteredOptions.slice(0, 500);
  const allFilteredSelected =
    filteredOptions.length > 0 &&
    filteredOptions.every((option) => selectedValues.has(option.value));
  const setFilteredSelection = (selected) => {
    setSelectedValues((current) => {
      const next = new Set(current);
      filteredOptions.forEach((option) => {
        if (selected) {
          next.add(option.value);
        } else {
          next.delete(option.value);
        }
      });
      return next;
    });
  };
  const toggleValue = (value) => {
    setSelectedValues((current) => {
      const next = new Set(current);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };
  const applyDraft = () => {
    onApply(
      columnIndex,
      normalizeFilter(
        {
          selectedValues: Array.from(selectedValues),
          textFilter: {
            operator: textOperator,
            value: textValue,
          },
          numberFilter: {
            operator: numberOperator,
            value: numberValue,
            valueTo: numberValueTo,
          },
        },
        allOptionValues,
      ),
    );
  };
  const clearFilter = () => {
    onApply(columnIndex, undefined);
  };
  return _jsxs(PopoverContent, {
    id: id,
    'data-markdown-table-filter-owner': id,
    align: 'end',
    sideOffset: 2,
    collisionPadding: 6,
    onCloseAutoFocus: (event) => {
      if (document.activeElement && document.activeElement !== document.body) {
        event.preventDefault();
      }
    },
    className:
      'max-h-[min(430px,calc(100vh-16px))] w-[300px] max-w-[80vw] gap-0 overflow-auto p-0 text-xs',
    role: 'dialog',
    'aria-labelledby': `${id}-title`,
    children: [
      _jsx(PopoverHeader, {
        className: 'border-b px-2.5 py-2',
        children: _jsx(PopoverTitle, {
          id: `${id}-title`,
          className: 'truncate text-xs font-bold',
          children: columnName,
        }),
      }),
      _jsx(ValueFilterSection, {
        columnIndex: columnIndex,
        columnName: columnName,
        search: search,
        searchInputRef: searchInputRef,
        filteredOptions: filteredOptions,
        visibleOptions: visibleOptions,
        selectedValues: selectedValues,
        allFilteredSelected: allFilteredSelected,
        onSearchChange: setSearch,
        onFilteredSelectionChange: setFilteredSelection,
        onToggleValue: toggleValue,
      }),
      _jsx(CustomFilterSection, {
        overlayId: id,
        columnIndex: columnIndex,
        columnName: columnName,
        isNumeric: isNumeric,
        textOperator: textOperator,
        textValue: textValue,
        numberOperator: numberOperator,
        numberValue: numberValue,
        numberValueTo: numberValueTo,
        onTextOperatorChange: setTextOperator,
        onTextValueChange: setTextValue,
        onNumberOperatorChange: setNumberOperator,
        onNumberValueChange: setNumberValue,
        onNumberValueToChange: setNumberValueTo,
      }),
      _jsx(FilterMenuFooter, {
        onClear: clearFilter,
        onClose: onClose,
        onApply: applyDraft,
      }),
    ],
  });
}
export function EnhancedMarkdownTable({ children, fallback, toolbarExtra }) {
  const { t } = useI18n();
  const table = useMemo(
    () =>
      parseTable(children, (columnIndex) =>
        t('markdownTable.column', { index: columnIndex + 1 }),
      ),
    [children, t],
  );
  if (table.columnCount === 0)
    return _jsx(_Fragment, {
      children: fallback ?? _jsx('table', { children: children }),
    });
  if (
    table.rows.length > MAX_ENHANCED_TABLE_ROWS ||
    table.columnCount > MAX_ENHANCED_TABLE_COLUMNS
  ) {
    return _jsx(_Fragment, {
      children: fallback ?? _jsx('table', { children: children }),
    });
  }
  return _jsx(EnhancedTable, { table: table, toolbarExtra: toolbarExtra });
}
function CustomColumnsPopover({
  headers,
  columnOrder,
  hiddenColumns,
  detailColumns,
  onToggleTableColumn,
  onToggleAllTableColumns,
  onToggleDetailColumn,
  onToggleAllDetailColumns,
  onReset,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) {
  const { t } = useI18n();
  const id = useId();
  const visibleColumnCount = headers.length - hiddenColumns.size;
  const allTableColumnsVisible = visibleColumnCount === headers.length;
  const allDetailColumnsVisible = detailColumns.size === headers.length;
  const tableColumnsChecked =
    visibleColumnCount === 0
      ? false
      : allTableColumnsVisible
        ? true
        : 'indeterminate';
  const detailColumnsChecked =
    detailColumns.size === 0
      ? false
      : allDetailColumnsVisible
        ? true
        : 'indeterminate';
  return _jsxs(Popover, {
    children: [
      _jsx(PopoverTrigger, {
        asChild: true,
        children: _jsxs(Button, {
          variant: 'ghost',
          size: 'sm',
          className: `${styles.toolbarControl} ${styles.compactToolbarControl}`,
          'aria-label': t('markdownTable.customColumns'),
          type: 'button',
          children: [
            _jsx(BoltIcon, {}),
            _jsx('span', {
              className: styles.compactToolbarLabel,
              children: t('markdownTable.customColumns'),
            }),
          ],
        }),
      }),
      _jsxs(PopoverContent, {
        align: 'end',
        className: `${styles.columnsPopover} max-h-[min(520px,calc(100vh-16px))] w-80 max-w-[85vw] gap-0 overflow-auto p-0`,
        children: [
          _jsxs('div', {
            className: 'flex items-center gap-3 border-b px-3 py-3',
            children: [
              _jsx(Checkbox, {
                checked: tableColumnsChecked,
                onCheckedChange: (checked) =>
                  onToggleAllTableColumns(checked === true),
                'aria-label': t('markdownTable.customColumns.toggleAllTable'),
              }),
              _jsx('span', {
                className: 'flex-1 text-xs text-muted-foreground',
                children: t('markdownTable.customColumns.tableSection'),
              }),
              _jsx(Button, {
                variant: 'ghost',
                size: 'sm',
                type: 'button',
                onClick: onReset,
                children: t('markdownTable.customColumns.reset'),
              }),
            ],
          }),
          _jsx('div', {
            className: 'p-2',
            children: columnOrder.map((columnIndex) => {
              const header = headers[columnIndex];
              if (!header) return null;
              const columnName =
                header.text ||
                t('markdownTable.column', { index: columnIndex + 1 });
              return _jsxs(
                'div',
                {
                  className:
                    'flex min-h-9 items-center gap-2 rounded-md px-1.5 hover:bg-muted',
                  onDragOver: onDragOver,
                  onDrop: (event) => onDrop(event, columnIndex),
                  children: [
                    _jsx('button', {
                      className:
                        'flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted-foreground/10 active:cursor-grabbing',
                      type: 'button',
                      draggable: true,
                      onDragStart: (event) => onDragStart(event, columnIndex),
                      onDragEnd: onDragEnd,
                      'aria-label': t('markdownTable.moveColumn', {
                        column: columnName,
                      }),
                      children: _jsx(GripVerticalIcon, {
                        className: 'size-3.5',
                      }),
                    }),
                    _jsx(Checkbox, {
                      id: `${id}-table-${columnIndex}`,
                      checked: !hiddenColumns.has(columnIndex),
                      onCheckedChange: () => onToggleTableColumn(columnIndex),
                    }),
                    _jsx(Label, {
                      htmlFor: `${id}-table-${columnIndex}`,
                      className:
                        'min-w-0 flex-1 cursor-pointer truncate font-normal',
                      children: columnName,
                    }),
                  ],
                },
                header.key,
              );
            }),
          }),
          _jsxs('div', {
            className: 'flex items-center gap-3 border-y px-3 py-3',
            children: [
              _jsx(Checkbox, {
                checked: detailColumnsChecked,
                onCheckedChange: (checked) =>
                  onToggleAllDetailColumns(checked === true),
                'aria-label': t('markdownTable.customColumns.toggleAllDetails'),
              }),
              _jsx('span', {
                className: 'text-xs text-muted-foreground',
                children: t('markdownTable.customColumns.detailSection'),
              }),
            ],
          }),
          _jsx('div', {
            className: 'p-2',
            children: headers.map((header, columnIndex) => {
              const columnName =
                header.text ||
                t('markdownTable.column', { index: columnIndex + 1 });
              return _jsxs(
                'div',
                {
                  className:
                    'flex min-h-9 items-center gap-2 rounded-md px-1.5 hover:bg-muted',
                  children: [
                    _jsx(Checkbox, {
                      id: `${id}-detail-${columnIndex}`,
                      checked: detailColumns.has(columnIndex),
                      onCheckedChange: () => onToggleDetailColumn(columnIndex),
                    }),
                    _jsx(Label, {
                      htmlFor: `${id}-detail-${columnIndex}`,
                      className:
                        'min-w-0 flex-1 cursor-pointer truncate font-normal',
                      children: columnName,
                    }),
                  ],
                },
                `${header.key}-detail`,
              );
            }),
          }),
        ],
      }),
    ],
  });
}
export function EnhancedTable({ table, toolbarExtra }) {
  const { language, t } = useI18n();
  const registerInteractionBlocker = useInteractionBlocker();
  const tableId = useId();
  const [sort, setSort] = useState(null);
  const [filters, setFilters] = useState({});
  const [selection, setSelection] = useState(null);
  const [openFilterMenu, setOpenFilterMenu] = useState(null);
  const [columnContextMenu, setColumnContextMenu] = useState(null);
  const [hiddenColumns, setHiddenColumns] = useState(() => new Set());
  const [detailColumns, setDetailColumns] = useState(
    () => new Set(initialColumnOrder(table.columnCount)),
  );
  const [columnWidths, setColumnWidths] = useState({});
  const [columnOrder, setColumnOrder] = useState(() =>
    initialColumnOrder(table.columnCount),
  );
  const [activeColumn, setActiveColumn] = useState(null);
  const [freezeFirstColumn, setFreezeFirstColumn] = useState(false);
  const [resizingColumn, setResizingColumn] = useState(null);
  const [detailRowKey, setDetailRowKey] = useState(null);
  const [cellDialog, setCellDialog] = useState(null);
  const [longTextExpanded, setLongTextExpanded] = useState(false);
  const [density, setDensity] = useState('standard');
  const [frozenColumnShadowLeft, setFrozenColumnShadowLeft] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedVisible, setCopiedVisible] = useState(false);
  const [copiedSelection, setCopiedSelection] = useState(false);
  const [copiedCellDialog, setCopiedCellDialog] = useState(false);
  const draggingRef = useRef(false);
  const copiedVisibleTimerRef = useRef(null);
  const copiedSelectionTimerRef = useRef(null);
  const copiedCellDialogTimerRef = useRef(null);
  const copiedVisibleGenRef = useRef(0);
  const copiedSelectionGenRef = useRef(0);
  const copiedCellDialogGenRef = useRef(0);
  const mountedRef = useRef(true);
  const shellRef = useRef(null);
  const containerRef = useRef(null);
  const frozenHeaderCellRef = useRef(null);
  const detailToggleAnchorRef = useRef(null);
  const columnContextMenuRef = useRef(null);
  const cellDialogRef = useRef(null);
  const cellDialogFocusReturnRef = useRef(null);
  const pendingSelectionRef = useRef(null);
  const selectionFrameRef = useRef(0);
  const resizeFrameRef = useRef(0);
  const pendingResizeWidthRef = useRef(null);
  const draggingColumnRef = useRef(null);
  const tableStructureKey = useMemo(
    () =>
      `${table.columnCount}\0${table.headers.map((header) => header.text).join('\0')}`,
    [table.columnCount, table.headers],
  );
  const tableStructureKeyRef = useRef(tableStructureKey);
  const closeFilterMenu = useCallback(() => {
    setOpenFilterMenu(null);
  }, []);
  const resetCopiedVisible = useCallback(() => {
    copiedVisibleGenRef.current += 1;
    if (copiedVisibleTimerRef.current) {
      clearTimeout(copiedVisibleTimerRef.current);
      copiedVisibleTimerRef.current = null;
    }
    setCopiedVisible(false);
  }, []);
  const resetCopiedSelection = useCallback(() => {
    copiedSelectionGenRef.current += 1;
    if (copiedSelectionTimerRef.current) {
      clearTimeout(copiedSelectionTimerRef.current);
      copiedSelectionTimerRef.current = null;
    }
    setCopiedSelection(false);
  }, []);
  const resetCopiedCellDialog = useCallback(() => {
    copiedCellDialogGenRef.current += 1;
    if (copiedCellDialogTimerRef.current) {
      clearTimeout(copiedCellDialogTimerRef.current);
      copiedCellDialogTimerRef.current = null;
    }
    setCopiedCellDialog(false);
  }, []);
  const flushPendingSelection = useCallback(() => {
    if (selectionFrameRef.current) {
      cancelAnimationFrame(selectionFrameRef.current);
      selectionFrameRef.current = 0;
    }
    const pendingSelection = pendingSelectionRef.current;
    pendingSelectionRef.current = null;
    if (!pendingSelection) return;
    setSelection((current) =>
      current
        ? {
            ...current,
            focusRow: pendingSelection.rowIndex,
            focusCol: pendingSelection.columnIndex,
          }
        : current,
    );
  }, []);
  const stopDragging = useCallback(() => {
    flushPendingSelection();
    draggingRef.current = false;
    setIsDragging(false);
  }, [flushPendingSelection]);
  useEffect(() => {
    const stopDraggingWhenHidden = () => {
      if (document.hidden) stopDragging();
    };
    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('blur', stopDragging);
    document.addEventListener('visibilitychange', stopDraggingWhenHidden);
    return () => {
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('blur', stopDragging);
      document.removeEventListener('visibilitychange', stopDraggingWhenHidden);
      if (selectionFrameRef.current) {
        cancelAnimationFrame(selectionFrameRef.current);
      }
    };
  }, [stopDragging]);
  useEffect(() => {
    if (tableStructureKeyRef.current === tableStructureKey) return;
    tableStructureKeyRef.current = tableStructureKey;
    setSort(null);
    setFilters({});
    setSelection(null);
    setOpenFilterMenu(null);
    setColumnContextMenu(null);
    setHiddenColumns(new Set());
    setDetailColumns(new Set(initialColumnOrder(table.columnCount)));
    setColumnWidths({});
    setColumnOrder(initialColumnOrder(table.columnCount));
    setActiveColumn(null);
    setFreezeFirstColumn(false);
    setResizingColumn(null);
    setDetailRowKey(null);
    setCellDialog(null);
    setLongTextExpanded(false);
    setDensity('standard');
    resetCopiedVisible();
    resetCopiedSelection();
    resetCopiedCellDialog();
    draggingRef.current = false;
    draggingColumnRef.current = null;
    setIsDragging(false);
  }, [
    resetCopiedSelection,
    resetCopiedCellDialog,
    resetCopiedVisible,
    table.columnCount,
    tableStructureKey,
  ]);
  useEffect(() => {
    resetCopiedSelection();
  }, [resetCopiedSelection, selection]);
  useEffect(() => {
    // StrictMode simulates an unmount/remount without re-running useRef's
    // initializer, so restore this before clipboard callbacks can run.
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (copiedVisibleTimerRef.current) {
        clearTimeout(copiedVisibleTimerRef.current);
        copiedVisibleTimerRef.current = null;
      }
      if (copiedSelectionTimerRef.current) {
        clearTimeout(copiedSelectionTimerRef.current);
        copiedSelectionTimerRef.current = null;
      }
      if (copiedCellDialogTimerRef.current) {
        clearTimeout(copiedCellDialogTimerRef.current);
        copiedCellDialogTimerRef.current = null;
      }
    };
  }, []);
  useEffect(() => {
    if (!openFilterMenu) return;
    const filterOwnerId = `${tableId}-filter-${openFilterMenu.columnIndex}`;
    const closeOnScroll = (event) => {
      if (event.target instanceof Element) {
        const owner = event.target.closest(
          '[data-markdown-table-filter-owner]',
        );
        if (
          owner?.getAttribute('data-markdown-table-filter-owner') ===
          filterOwnerId
        ) {
          return;
        }
      }
      setOpenFilterMenu(null);
    };
    const closeOnResize = () => setOpenFilterMenu(null);
    document.addEventListener('scroll', closeOnScroll, true);
    window.addEventListener('resize', closeOnResize);
    return () => {
      document.removeEventListener('scroll', closeOnScroll, true);
      window.removeEventListener('resize', closeOnResize);
    };
  }, [openFilterMenu, tableId]);
  useEffect(() => {
    if (!columnContextMenu) return;
    const closeMenu = (event) => {
      const target = event.target;
      if (!columnContextMenuRef.current?.contains(target)) {
        setColumnContextMenu(null);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setColumnContextMenu(null);
      }
    };
    const closeOnScrollOrResize = () => setColumnContextMenu(null);
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('scroll', closeOnScrollOrResize, true);
    window.addEventListener('resize', closeOnScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('scroll', closeOnScrollOrResize, true);
      window.removeEventListener('resize', closeOnScrollOrResize);
    };
  }, [columnContextMenu]);
  useEffect(() => {
    const clearActiveColumnOnOutsideMouseDown = (event) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !shellRef.current?.contains(target) &&
        !columnContextMenuRef.current?.contains(target)
      ) {
        setActiveColumn(null);
      }
    };
    const clearActiveColumnOnEscape = (event) => {
      if (
        event.defaultPrevented ||
        openFilterMenu ||
        cellDialog ||
        columnContextMenu
      )
        return;
      if (event.key === 'Escape') setActiveColumn(null);
    };
    document.addEventListener('mousedown', clearActiveColumnOnOutsideMouseDown);
    document.addEventListener('keydown', clearActiveColumnOnEscape);
    return () => {
      document.removeEventListener(
        'mousedown',
        clearActiveColumnOnOutsideMouseDown,
      );
      document.removeEventListener('keydown', clearActiveColumnOnEscape);
    };
  }, [cellDialog, columnContextMenu, openFilterMenu]);
  useEffect(() => {
    if (!selection) return;
    const clearSelectionOnOutsideMouseDown = (event) => {
      const target = event.target;
      if (target instanceof Node && !shellRef.current?.contains(target)) {
        stopDragging();
        setSelection(null);
      }
    };
    document.addEventListener('mousedown', clearSelectionOnOutsideMouseDown);
    return () => {
      document.removeEventListener(
        'mousedown',
        clearSelectionOnOutsideMouseDown,
      );
    };
  }, [selection, stopDragging]);
  const filteredRows = useMemo(
    () => applyFilters(table.rows, filters),
    [filters, table.rows],
  );
  const visibleRows = useMemo(
    () => sortRows(filteredRows, sort),
    [filteredRows, sort],
  );
  useEffect(() => {
    setSelection((current) => {
      if (!current) return current;
      return getSelectionRowBounds(current).maxRow < visibleRows.length
        ? current
        : null;
    });
  }, [visibleRows.length]);
  const openFilterOptions = useMemo(() => {
    if (!openFilterMenu) return [];
    const columnIndex = openFilterMenu.columnIndex;
    return getColumnOptions(
      applyFilters(table.rows, filters, columnIndex),
      columnIndex,
      t('markdownTable.blank'),
    );
  }, [filters, openFilterMenu, t, table.rows]);
  const numericColumns = useMemo(
    () =>
      table.headers.map((_, columnIndex) =>
        isMostlyNumericColumn(table.rows, columnIndex),
      ),
    [table.headers, table.rows],
  );
  const orderedVisibleColumnIndexes = useMemo(
    () =>
      columnOrder
        .filter((index) => index >= 0 && index < table.columnCount)
        .filter((index) => !hiddenColumns.has(index)),
    [columnOrder, hiddenColumns, table.columnCount],
  );
  const detailColumnIndexes = useMemo(
    () =>
      initialColumnOrder(table.columnCount).filter((index) =>
        detailColumns.has(index),
      ),
    [detailColumns, table.columnCount],
  );
  const frozenColumnIndex = freezeFirstColumn
    ? orderedVisibleColumnIndexes[0]
    : undefined;
  const fixedVisibleColumnWidth = orderedVisibleColumnIndexes.reduce(
    (total, index) => total + (columnWidths[index] ?? 0),
    0,
  );
  const flexibleColumnCount = orderedVisibleColumnIndexes.filter(
    (index) => columnWidths[index] === undefined,
  ).length;
  const hasFillerColumn = flexibleColumnCount === 0;
  const currentCellDialogCell = useMemo(() => {
    if (!cellDialog) return null;
    const row = visibleRows.find((item) => item.key === cellDialog.rowKey);
    return row?.cells[cellDialog.columnIndex] ?? null;
  }, [cellDialog, visibleRows]);
  const currentCellDialogText = currentCellDialogCell?.text;
  useEffect(() => {
    resetCopiedVisible();
  }, [resetCopiedVisible, orderedVisibleColumnIndexes, visibleRows]);
  useEffect(() => {
    if (!resizingColumn) return;
    const applyPendingResize = () => {
      const nextWidth = pendingResizeWidthRef.current;
      pendingResizeWidthRef.current = null;
      if (resizeFrameRef.current) {
        cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = 0;
      }
      if (nextWidth === null) return;
      setColumnWidths((current) =>
        applyColumnWidth(current, resizingColumn.columnIndex, nextWidth),
      );
    };
    const resizeColumn = (event) => {
      pendingResizeWidthRef.current = clampColumnWidth(
        resizingColumn.startWidth + event.clientX - resizingColumn.startX,
      );
      if (resizeFrameRef.current) return;
      resizeFrameRef.current = requestAnimationFrame(applyPendingResize);
    };
    const stopResize = () => {
      applyPendingResize();
      setResizingColumn(null);
    };
    const stopResizeWhenHidden = () => {
      if (document.hidden) stopResize();
    };
    window.addEventListener('mousemove', resizeColumn);
    window.addEventListener('mouseup', stopResize);
    window.addEventListener('blur', stopResize);
    document.addEventListener('visibilitychange', stopResizeWhenHidden);
    return () => {
      window.removeEventListener('mousemove', resizeColumn);
      window.removeEventListener('mouseup', stopResize);
      window.removeEventListener('blur', stopResize);
      document.removeEventListener('visibilitychange', stopResizeWhenHidden);
      if (resizeFrameRef.current) {
        cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = 0;
      }
      pendingResizeWidthRef.current = null;
    };
  }, [resizingColumn]);
  useEffect(() => {
    if (detailRowKey && !visibleRows.some((row) => row.key === detailRowKey)) {
      setDetailRowKey(null);
    }
    if (
      cellDialog &&
      !visibleRows.some(
        (row) =>
          row.key === cellDialog.rowKey && row.cells[cellDialog.columnIndex],
      )
    ) {
      setCellDialog(null);
    }
  }, [cellDialog, detailRowKey, visibleRows]);
  useLayoutEffect(() => {
    const anchor = detailToggleAnchorRef.current;
    detailToggleAnchorRef.current = null;
    if (!anchor?.element.isConnected) return;
    const offset = anchor.element.getBoundingClientRect().top - anchor.top;
    if (offset === 0) return;
    if (anchor.scrollContainer) {
      anchor.scrollContainer.scrollTop += offset;
    } else {
      window.scrollBy(0, offset);
    }
  }, [detailRowKey]);
  useEffect(() => {
    if (!cellDialog) return;
    return registerInteractionBlocker();
  }, [cellDialog, registerInteractionBlocker]);
  useEffect(() => {
    if (!cellDialog) return;
    resetCopiedCellDialog();
  }, [cellDialog, currentCellDialogText, resetCopiedCellDialog]);
  useEffect(() => {
    if (!cellDialog) return;
    return () => {
      const focusReturn = cellDialogFocusReturnRef.current;
      cellDialogFocusReturnRef.current = null;
      if (focusReturn?.isConnected) focusReturn.focus({ preventScroll: true });
    };
  }, [cellDialog]);
  const setColumnFilter = (columnIndex, nextFilter) => {
    setSelection(null);
    setFilters((current) => {
      const next = { ...current };
      if (nextFilter && isFilterActive(nextFilter)) {
        next[columnIndex] = nextFilter;
      } else {
        delete next[columnIndex];
      }
      return next;
    });
    closeFilterMenu();
  };
  const toggleSort = (columnIndex) => {
    setSelection(null);
    setActiveColumn(columnIndex);
    setSort((current) => {
      if (current?.columnIndex !== columnIndex) {
        return { columnIndex, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { columnIndex, direction: 'desc' };
      }
      return null;
    });
  };
  const setFilterMenuOpen = (columnIndex, open) => {
    if (!open) {
      setOpenFilterMenu((current) =>
        current?.columnIndex === columnIndex ? null : current,
      );
      return;
    }
    setSelection(null);
    setActiveColumn(columnIndex);
    setColumnContextMenu(null);
    setOpenFilterMenu({ columnIndex });
  };
  const toggleTableColumn = (columnIndex) => {
    setSelection(null);
    setActiveColumn((current) => (current === columnIndex ? null : current));
    closeFilterMenu();
    setFilters((current) => {
      const next = { ...current };
      delete next[columnIndex];
      return next;
    });
    setSort((current) =>
      current?.columnIndex === columnIndex ? null : current,
    );
    setHiddenColumns((current) => {
      const next = new Set(current);
      if (next.has(columnIndex)) {
        next.delete(columnIndex);
      } else {
        next.add(columnIndex);
      }
      return next;
    });
  };
  const toggleAllTableColumns = (visible) => {
    setSelection(null);
    setActiveColumn(null);
    closeFilterMenu();
    if (visible) {
      setHiddenColumns(new Set());
      return;
    }
    setHiddenColumns(new Set(initialColumnOrder(table.columnCount)));
    setFilters({});
    setSort(null);
  };
  const toggleDetailColumn = (columnIndex) => {
    setDetailColumns((current) => {
      const next = new Set(current);
      if (next.has(columnIndex)) {
        next.delete(columnIndex);
      } else {
        next.add(columnIndex);
      }
      return next;
    });
  };
  const toggleAllDetailColumns = (visible) => {
    setDetailColumns(
      visible ? new Set(initialColumnOrder(table.columnCount)) : new Set(),
    );
  };
  const resetColumns = () => {
    setSelection(null);
    setActiveColumn(null);
    closeFilterMenu();
    setColumnOrder(initialColumnOrder(table.columnCount));
    setHiddenColumns(new Set());
    setDetailColumns(new Set(initialColumnOrder(table.columnCount)));
  };
  const toggleFreezeFirstColumnFromMenu = () => {
    setFreezeFirstColumn((current) => !current);
    setColumnContextMenu(null);
  };
  const openColumnContextMenu = (event, columnIndex) => {
    if (columnIndex !== orderedVisibleColumnIndexes[0]) {
      return;
    }
    event.preventDefault();
    setSelection(null);
    setActiveColumn(columnIndex);
    setOpenFilterMenu(null);
    const menuWidth = 220;
    const menuHeight = 72;
    setColumnContextMenu({
      left: Math.max(
        6,
        Math.min(event.clientX, window.innerWidth - menuWidth - 6),
      ),
      top: Math.max(
        6,
        Math.min(event.clientY, window.innerHeight - menuHeight - 6),
      ),
    });
  };
  const toggleRowDetail = (rowKey, rowElement) => {
    if (detailRowKey !== rowKey && rowElement) {
      detailToggleAnchorRef.current = {
        element: rowElement,
        scrollContainer: findVerticalScrollContainer(
          shellRef.current?.parentElement ?? null,
        ),
        top: rowElement.getBoundingClientRect().top,
      };
    }
    setSelection(null);
    setCellDialog(null);
    resetCopiedCellDialog();
    setDetailRowKey((current) => (current === rowKey ? null : rowKey));
  };
  const openCellDialog = (rowKey, columnIndex) => {
    cellDialogFocusReturnRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setSelection(null);
    setOpenFilterMenu(null);
    setDetailRowKey(null);
    resetCopiedCellDialog();
    setCellDialog({
      rowKey,
      columnIndex,
    });
  };
  const closeCellDialog = () => {
    setCellDialog(null);
    resetCopiedCellDialog();
  };
  const copyCellDialogValue = () => {
    if (currentCellDialogText == null || !navigator.clipboard) return;
    const copyGeneration = copiedCellDialogGenRef.current;
    void navigator.clipboard
      .writeText(sanitizeForClipboard(currentCellDialogText))
      .then(() => {
        if (!mountedRef.current) return;
        if (copiedCellDialogGenRef.current !== copyGeneration) return;
        if (copiedCellDialogTimerRef.current) {
          clearTimeout(copiedCellDialogTimerRef.current);
        }
        setCopiedCellDialog(true);
        copiedCellDialogTimerRef.current = setTimeout(
          () => setCopiedCellDialog(false),
          2000,
        );
      })
      .catch((error) =>
        console.warn('[web-shell] clipboard write failed:', error),
      );
  };
  const selectionRowBounds = useMemo(
    () => (selection ? getSelectionRowBounds(selection) : null),
    [selection],
  );
  const selectedColumnIndexSet = useMemo(
    () =>
      new Set(getSelectedColumnIndexes(selection, orderedVisibleColumnIndexes)),
    [selection, orderedVisibleColumnIndexes],
  );
  const isCellSelected = (rowIndex, columnIndex) => {
    if (!selectionRowBounds) return false;
    const { minRow, maxRow } = selectionRowBounds;
    return (
      rowIndex >= minRow &&
      rowIndex <= maxRow &&
      selectedColumnIndexSet.has(columnIndex)
    );
  };
  const flexibleColumnWidth = (minWidth, fixedWidth, flexibleColumnCount) =>
    `max(${minWidth}px, calc((100cqw - ${ACTION_COLUMN_WIDTH}px - ${fixedWidth}px) / ${flexibleColumnCount}))`;
  const columnGroupStyle = (columnIndex) => {
    const width = columnWidths[columnIndex];
    if (width !== undefined) return { width };
    const minWidth =
      density === 'compact' ? COMPACT_COLUMN_WIDTH : DEFAULT_COLUMN_WIDTH;
    return {
      width: flexibleColumnWidth(
        minWidth,
        fixedVisibleColumnWidth,
        flexibleColumnCount,
      ),
    };
  };
  useLayoutEffect(() => {
    if (!freezeFirstColumn || frozenColumnIndex === undefined) {
      setFrozenColumnShadowLeft(null);
      return;
    }
    const shell = shellRef.current;
    const frozenHeader = frozenHeaderCellRef.current;
    if (!shell || !frozenHeader) return;
    const updateShadowPosition = () => {
      const shellRect = shell.getBoundingClientRect();
      const headerRect = frozenHeader.getBoundingClientRect();
      setFrozenColumnShadowLeft(
        Math.max(0, headerRect.right - shellRect.left - shell.clientLeft),
      );
    };
    updateShadowPosition();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateShadowPosition);
      return () => window.removeEventListener('resize', updateShadowPosition);
    }
    const resizeObserver = new ResizeObserver(updateShadowPosition);
    resizeObserver.observe(shell);
    resizeObserver.observe(frozenHeader);
    return () => resizeObserver.disconnect();
  }, [
    columnWidths,
    density,
    freezeFirstColumn,
    frozenColumnIndex,
    orderedVisibleColumnIndexes,
  ]);
  const startColumnResize = (event, columnIndex) => {
    event.preventDefault();
    event.stopPropagation();
    const headerCell = event.currentTarget.closest('th');
    const renderedWidth = headerCell?.getBoundingClientRect().width;
    setResizingColumn({
      columnIndex,
      startX: event.clientX,
      startWidth:
        columnWidths[columnIndex] ??
        (renderedWidth ? Math.round(renderedWidth) : DEFAULT_COLUMN_WIDTH),
    });
  };
  const resizeColumnWithKeyboard = (event, columnIndex) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)
      return;
    let delta = 0;
    if (event.key === 'ArrowRight') {
      delta = KEYBOARD_COLUMN_RESIZE_STEP;
    } else if (event.key === 'ArrowLeft') {
      delta = -KEYBOARD_COLUMN_RESIZE_STEP;
    }
    if (delta === 0) return;
    event.preventDefault();
    event.stopPropagation();
    const headerCell = event.currentTarget.closest('th');
    const renderedWidth = headerCell?.getBoundingClientRect().width;
    setColumnWidths((current) => {
      const width =
        current[columnIndex] ??
        (renderedWidth ? Math.round(renderedWidth) : DEFAULT_COLUMN_WIDTH);
      const nextWidth = clampColumnWidth(width + delta);
      return applyColumnWidth(current, columnIndex, nextWidth);
    });
  };
  const startColumnDrag = (event, columnIndex) => {
    event.stopPropagation();
    setActiveColumn(columnIndex);
    draggingColumnRef.current = columnIndex;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(COLUMN_DRAG_MIME, String(columnIndex));
  };
  const stopColumnDrag = () => {
    draggingColumnRef.current = null;
  };
  const dragOverColumn = (event) => {
    if (
      draggingColumnRef.current === null ||
      !hasColumnDragData(event.dataTransfer)
    ) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };
  const dropColumn = (event, targetColumnIndex) => {
    const sourceColumnIndex = draggingColumnRef.current;
    stopColumnDrag();
    if (sourceColumnIndex === null || !hasColumnDragData(event.dataTransfer)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setSelection(null);
    setActiveColumn(sourceColumnIndex);
    setColumnOrder((current) =>
      moveColumn(current, sourceColumnIndex, targetColumnIndex),
    );
  };
  const startSelectionAtCell = (rowIndex, columnIndex) => {
    if (openFilterMenu !== null) {
      setOpenFilterMenu(null);
    }
    setActiveColumn(null);
    draggingRef.current = true;
    setSelection({
      anchorRow: rowIndex,
      anchorCol: columnIndex,
      focusRow: rowIndex,
      focusCol: columnIndex,
    });
  };
  const startSelection = (event, rowIndex, columnIndex) => {
    if (event.button !== 0 || isInteractiveSelectionTarget(event.target))
      return;
    event.preventDefault();
    containerRef.current?.focus({ preventScroll: true });
    startSelectionAtCell(rowIndex, columnIndex);
  };
  const extendSelection = (rowIndex, columnIndex) => {
    if (!draggingRef.current) return;
    setIsDragging(true);
    pendingSelectionRef.current = { rowIndex, columnIndex };
    if (selectionFrameRef.current) return;
    selectionFrameRef.current = requestAnimationFrame(() => {
      selectionFrameRef.current = 0;
      const pendingSelection = pendingSelectionRef.current;
      pendingSelectionRef.current = null;
      if (!pendingSelection) return;
      setSelection((current) =>
        current
          ? {
              ...current,
              focusRow: pendingSelection.rowIndex,
              focusCol: pendingSelection.columnIndex,
            }
          : current,
      );
    });
  };
  const getTouchCell = (touch) => {
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const cell = element?.closest('[data-row-index][data-column-index]');
    if (!cell || !shellRef.current?.contains(cell)) return null;
    const rowIndex = Number(cell.dataset.rowIndex);
    const columnIndex = Number(cell.dataset.columnIndex);
    if (!Number.isInteger(rowIndex) || !Number.isInteger(columnIndex)) {
      return null;
    }
    return { rowIndex, columnIndex };
  };
  const startTouchSelection = (event, rowIndex, columnIndex) => {
    if (
      event.touches.length !== 1 ||
      isInteractiveSelectionTarget(event.target)
    ) {
      return;
    }
    startSelectionAtCell(rowIndex, columnIndex);
  };
  const extendTouchSelection = (event) => {
    if (!draggingRef.current || event.touches.length !== 1) return;
    const touch = event.touches[0];
    if (!touch) return;
    const cell = getTouchCell(touch);
    if (!cell) return;
    event.preventDefault();
    extendSelection(cell.rowIndex, cell.columnIndex);
  };
  const copySelection = () => {
    const text = getSelectionText(
      selection,
      visibleRows,
      orderedVisibleColumnIndexes,
    );
    if (!text || !navigator.clipboard) return;
    const copyGeneration = copiedSelectionGenRef.current;
    void navigator.clipboard
      .writeText(text)
      .then(() => {
        if (!mountedRef.current) return;
        if (copiedSelectionGenRef.current !== copyGeneration) return;
        if (copiedSelectionTimerRef.current) {
          clearTimeout(copiedSelectionTimerRef.current);
        }
        setCopiedSelection(true);
        copiedSelectionTimerRef.current = setTimeout(
          () => setCopiedSelection(false),
          2000,
        );
      })
      .catch((error) =>
        console.warn('[web-shell] clipboard write failed:', error),
      );
  };
  const copyVisibleTable = () => {
    const text = getVisibleTableText(
      table.headers,
      visibleRows,
      orderedVisibleColumnIndexes,
    );
    if (!text || !navigator.clipboard) return;
    const copyGeneration = copiedVisibleGenRef.current;
    void navigator.clipboard
      .writeText(text)
      .then(() => {
        if (!mountedRef.current) return;
        if (copiedVisibleGenRef.current !== copyGeneration) return;
        if (copiedVisibleTimerRef.current) {
          clearTimeout(copiedVisibleTimerRef.current);
        }
        setCopiedVisible(true);
        copiedVisibleTimerRef.current = setTimeout(
          () => setCopiedVisible(false),
          2000,
        );
      })
      .catch((error) =>
        console.warn('[web-shell] clipboard write failed:', error),
      );
  };
  const handleCopy = (event) => {
    if (hasNativeSelection()) return;
    const text = getSelectionText(
      selection,
      visibleRows,
      orderedVisibleColumnIndexes,
    );
    if (!text) return;
    event.preventDefault();
    event.clipboardData.setData('text/plain', text);
  };
  const selectionStatistics = useMemo(
    () =>
      getSelectionStatistics(
        selection,
        visibleRows,
        orderedVisibleColumnIndexes,
      ),
    [orderedVisibleColumnIndexes, selection, visibleRows],
  );
  const selectedCount = selectionStatistics?.selectedCount ?? 0;
  const activeFilterCount =
    Object.values(filters).filter(isFilterActive).length;
  const hasLongText = useMemo(
    () =>
      visibleRows.some((row) =>
        orderedVisibleColumnIndexes.some((columnIndex) => {
          const cell = row.cells[columnIndex];
          return cell ? isLongCellText(cellReadableText(cell)) : false;
        }),
      ),
    [orderedVisibleColumnIndexes, visibleRows],
  );
  const rowSummary =
    visibleRows.length === table.rows.length
      ? t('markdownTable.rows', { count: table.rows.length })
      : t('markdownTable.rowsFiltered', {
          visible: visibleRows.length,
          total: table.rows.length,
        });
  const renderCellContent = (cell, expanded) => {
    const displayText = cellReadableText(cell);
    const isLong = isLongCellText(displayText);
    return _jsx('div', {
      className: `${styles.cellContent} ${isLong && !expanded ? styles.cellContentCollapsed : ''}`,
      title: isLong && !expanded ? displayText : undefined,
      children: _jsx('div', {
        className: styles.cellText,
        children: cell.content,
      }),
    });
  };
  const renderDetailValue = (cell, expanded) => {
    const isEmpty = cell.text.length === 0;
    const displayText = cellReadableText(cell);
    const isLong = isLongCellText(displayText);
    return _jsx('div', {
      className: `${styles.detailValueContent} ${isLong && !expanded ? styles.detailValueCollapsed : ''} ${isEmpty ? styles.emptyValue : ''}`,
      title: isLong && !expanded ? displayText : undefined,
      children: _jsx('div', {
        className: styles.detailValueText,
        children: isEmpty ? t('markdownTable.emptyValue') : cell.content,
      }),
    });
  };
  return _jsxs('div', {
    ref: shellRef,
    className: `${styles.tableShell} ${densityClassName(density)} ${freezeFirstColumn ? styles.hasFrozenColumn : ''} ${isDragging ? styles.dragging : ''}`,
    children: [
      _jsx(TooltipProvider, {
        delayDuration: 300,
        children: _jsxs('div', {
          className: styles.toolbar,
          children: [
            _jsx('span', { className: styles.summary, children: rowSummary }),
            activeFilterCount > 0 &&
              _jsx('span', {
                className: styles.selection,
                children: t('markdownTable.filtersActive', {
                  count: activeFilterCount,
                }),
              }),
            selectedCount > 0 &&
              selectionStatistics &&
              _jsxs('div', {
                className: styles.selectionStats,
                children: [
                  _jsxs('span', {
                    className: styles.selectionMetric,
                    children: [
                      t('markdownTable.selection.selected'),
                      ' ',
                      _jsx('strong', {
                        className: styles.selectionMetricValue,
                        children: selectionStatistics.selectedCount,
                      }),
                    ],
                  }),
                  _jsxs('span', {
                    className: styles.selectionMetric,
                    children: [
                      t('markdownTable.selection.nonEmpty'),
                      ' ',
                      _jsx('strong', {
                        className: styles.selectionMetricValue,
                        children: selectionStatistics.nonEmptyCount,
                      }),
                    ],
                  }),
                  _jsxs('span', {
                    className: styles.selectionMetric,
                    children: [
                      t('markdownTable.selection.numeric'),
                      ' ',
                      _jsx('strong', {
                        className: styles.selectionMetricValue,
                        children: selectionStatistics.numericCount,
                      }),
                    ],
                  }),
                  _jsxs(Tooltip, {
                    children: [
                      _jsx(TooltipTrigger, {
                        asChild: true,
                        children: _jsx(Button, {
                          variant: 'outline',
                          size: 'xs',
                          className: styles.selectionCopyButton,
                          type: 'button',
                          onClick: copySelection,
                          'aria-label': t('markdownTable.copyTsv'),
                          children: copiedSelection
                            ? t('code.copied')
                            : t('markdownTable.copyTsv'),
                        }),
                      }),
                      _jsx(TooltipContent, {
                        side: 'top',
                        children: t('markdownTable.copyTsvHint'),
                      }),
                    ],
                  }),
                  selectionStatistics.numericCount > 0 &&
                    _jsxs(_Fragment, {
                      children: [
                        _jsxs('span', {
                          className: `${styles.selectionMetric} ${styles.selectionMetricSecondary}`,
                          children: [
                            t('markdownTable.selection.sum'),
                            ' ',
                            _jsx('strong', {
                              className: styles.selectionMetricValue,
                              children: formatSelectionStatistic(
                                selectionStatistics.sum,
                                selectionStatistics,
                                language,
                              ),
                            }),
                          ],
                        }),
                        _jsxs('span', {
                          className: `${styles.selectionMetric} ${styles.selectionMetricSecondary}`,
                          children: [
                            t('markdownTable.selection.average'),
                            ' ',
                            _jsx('strong', {
                              className: styles.selectionMetricValue,
                              children: formatSelectionStatistic(
                                selectionStatistics.average,
                                selectionStatistics,
                                language,
                              ),
                            }),
                          ],
                        }),
                        _jsxs('span', {
                          className: `${styles.selectionMetric} ${styles.selectionMetricSecondary}`,
                          children: [
                            t('markdownTable.selection.min'),
                            ' ',
                            _jsx('strong', {
                              className: styles.selectionMetricValue,
                              children: formatSelectionStatistic(
                                selectionStatistics.min,
                                selectionStatistics,
                                language,
                              ),
                            }),
                          ],
                        }),
                        _jsxs('span', {
                          className: `${styles.selectionMetric} ${styles.selectionMetricSecondary}`,
                          children: [
                            t('markdownTable.selection.max'),
                            ' ',
                            _jsx('strong', {
                              className: styles.selectionMetricValue,
                              children: formatSelectionStatistic(
                                selectionStatistics.max,
                                selectionStatistics,
                                language,
                              ),
                            }),
                          ],
                        }),
                      ],
                    }),
                ],
              }),
            _jsx('span', { className: styles.toolbarSpacer }),
            _jsxs(Select, {
              value: density,
              onValueChange: (value) => setDensity(value),
              children: [
                _jsxs(SelectTrigger, {
                  size: 'sm',
                  className: styles.densityTrigger,
                  'aria-label': t('markdownTable.densityLabel'),
                  children: [
                    _jsx(Rows3Icon, { className: 'size-4' }),
                    _jsx(SelectValue, {
                      children: _jsx('span', {
                        className: styles.compactToolbarLabel,
                        children: t('markdownTable.densityCurrent', {
                          density: t(`markdownTable.density.${density}`),
                        }),
                      }),
                    }),
                  ],
                }),
                _jsx(SelectContent, {
                  className: styles.densityMenu,
                  children: DENSITY_OPTIONS.map((option) =>
                    _jsx(
                      SelectItem,
                      {
                        value: option,
                        'data-value': option,
                        children: t(`markdownTable.density.${option}`),
                      },
                      option,
                    ),
                  ),
                }),
              ],
            }),
            _jsx(CustomColumnsPopover, {
              headers: table.headers,
              columnOrder: columnOrder,
              hiddenColumns: hiddenColumns,
              detailColumns: detailColumns,
              onToggleTableColumn: toggleTableColumn,
              onToggleAllTableColumns: toggleAllTableColumns,
              onToggleDetailColumn: toggleDetailColumn,
              onToggleAllDetailColumns: toggleAllDetailColumns,
              onReset: resetColumns,
              onDragStart: startColumnDrag,
              onDragEnd: stopColumnDrag,
              onDragOver: dragOverColumn,
              onDrop: dropColumn,
            }),
            hasLongText &&
              _jsx(Button, {
                variant: 'ghost',
                size: 'sm',
                className: styles.toolbarControl,
                type: 'button',
                onClick: () => setLongTextExpanded((current) => !current),
                children: longTextExpanded
                  ? t('markdownTable.collapseLongText')
                  : t('markdownTable.expandLongText'),
              }),
            _jsxs(Tooltip, {
              children: [
                _jsx(TooltipTrigger, {
                  asChild: true,
                  children: _jsxs('button', {
                    className: styles.iconButton,
                    type: 'button',
                    onClick: copyVisibleTable,
                    'aria-label': t('markdownTable.copyVisible'),
                    children: [
                      copiedVisible
                        ? _jsxs(_Fragment, {
                            children: [
                              _jsx(CheckIcon, { 'aria-hidden': 'true' }),
                              _jsx('span', {
                                className: 'sr-only',
                                children: '\u2713',
                              }),
                            ],
                          })
                        : _jsx(CopyIcon, { 'aria-hidden': 'true' }),
                      _jsx('span', {
                        className: 'sr-only',
                        children: copiedVisible
                          ? t('code.copied')
                          : t('markdownTable.copyVisible'),
                      }),
                    ],
                  }),
                }),
                _jsx(TooltipContent, {
                  side: 'top',
                  children: copiedVisible
                    ? t('code.copied')
                    : t('markdownTable.copyVisible'),
                }),
              ],
            }),
            toolbarExtra,
          ],
        }),
      }),
      _jsxs('div', {
        ref: containerRef,
        className: styles.scroller,
        tabIndex: 0,
        onCopy: handleCopy,
        children: [
          _jsxs('table', {
            className: styles.table,
            children: [
              _jsxs('colgroup', {
                children: [
                  _jsx('col', {
                    className: styles.actionColumn,
                    style: ACTION_COLUMN_STYLE,
                  }),
                  orderedVisibleColumnIndexes.map((columnIndex) =>
                    _jsx(
                      'col',
                      { style: columnGroupStyle(columnIndex) },
                      `column-${columnIndex}`,
                    ),
                  ),
                  hasFillerColumn &&
                    _jsx('col', { className: styles.fillerColumn }),
                ],
              }),
              _jsx('thead', {
                children: _jsxs('tr', {
                  children: [
                    _jsx('th', {
                      className: `${styles.headerCell} ${styles.actionHeaderCell} ${freezeFirstColumn ? styles.stickyActionHeaderCell : ''}`,
                      children: _jsx('span', {
                        className: 'sr-only',
                        children: t('markdownTable.actions'),
                      }),
                    }),
                    orderedVisibleColumnIndexes.map((columnIndex) => {
                      const header = table.headers[columnIndex];
                      if (!header) return null;
                      const isSorted = sort?.columnIndex === columnIndex;
                      const isFiltered = isFilterActive(filters[columnIndex]);
                      const isMenuOpen =
                        openFilterMenu?.columnIndex === columnIndex;
                      const columnName =
                        header.text ||
                        t('markdownTable.column', { index: columnIndex + 1 });
                      const sortAriaLabel = isSorted
                        ? t(
                            sort.direction === 'asc'
                              ? 'markdownTable.sortByColumnAsc'
                              : 'markdownTable.sortByColumnDesc',
                            { column: columnName },
                          )
                        : t('markdownTable.sortByColumn', {
                            column: columnName,
                          });
                      const ariaSort = isSorted
                        ? sort.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none';
                      const filterMenuId = `${tableId}-filter-${columnIndex}`;
                      const headerAlignStyle = header.textAlign
                        ? { textAlign: header.textAlign }
                        : undefined;
                      const isFrozenColumn = frozenColumnIndex === columnIndex;
                      const isActiveColumn = activeColumn === columnIndex;
                      return _jsxs(
                        'th',
                        {
                          ref: isFrozenColumn ? frozenHeaderCellRef : undefined,
                          className: `${styles.headerCell} ${isFrozenColumn ? styles.frozenHeaderCell : ''} ${isActiveColumn ? styles.activeHeaderCell : ''}`,
                          'aria-sort': ariaSort,
                          onContextMenu: (event) =>
                            openColumnContextMenu(event, columnIndex),
                          style: headerAlignStyle,
                          title: columnName,
                          children: [
                            _jsxs('div', {
                              className: styles.headerControls,
                              children: [
                                _jsx('span', {
                                  className: styles.headerText,
                                  style: headerAlignStyle,
                                  children: header.content,
                                }),
                                _jsxs(Popover, {
                                  open: isMenuOpen,
                                  onOpenChange: (open) =>
                                    setFilterMenuOpen(columnIndex, open),
                                  children: [
                                    _jsx(PopoverTrigger, {
                                      asChild: true,
                                      children: _jsx('button', {
                                        className: `${styles.filterTrigger} ${isFiltered ? styles.filterTriggerActive : ''}`,
                                        type: 'button',
                                        'aria-label': t(
                                          'markdownTable.filterColumn',
                                          {
                                            column: columnName,
                                          },
                                        ),
                                        'aria-controls': isMenuOpen
                                          ? filterMenuId
                                          : undefined,
                                        children: _jsx(FilterIcon, {
                                          'aria-hidden': 'true',
                                        }),
                                      }),
                                    }),
                                    isMenuOpen &&
                                      _jsx(
                                        ColumnFilterMenu,
                                        {
                                          id: filterMenuId,
                                          columnName: columnName,
                                          columnIndex: columnIndex,
                                          filter: filters[columnIndex],
                                          isNumeric:
                                            numericColumns[columnIndex] ??
                                            false,
                                          options: openFilterOptions,
                                          onApply: setColumnFilter,
                                          onClose: closeFilterMenu,
                                        },
                                        columnIndex,
                                      ),
                                  ],
                                }),
                                _jsx('button', {
                                  className: `${styles.sortTrigger} ${isSorted ? styles.sortTriggerActive : ''}`,
                                  type: 'button',
                                  onClick: () => toggleSort(columnIndex),
                                  'aria-label': sortAriaLabel,
                                  children: isSorted
                                    ? sort.direction === 'asc'
                                      ? _jsx(ArrowUpIcon, {
                                          'aria-hidden': 'true',
                                        })
                                      : _jsx(ArrowDownIcon, {
                                          'aria-hidden': 'true',
                                        })
                                    : _jsx(ArrowDownUpIcon, {
                                        'aria-hidden': 'true',
                                      }),
                                }),
                              ],
                            }),
                            _jsx('button', {
                              className: styles.resizeHandle,
                              type: 'button',
                              onMouseDown: (event) =>
                                startColumnResize(event, columnIndex),
                              onKeyDown: (event) =>
                                resizeColumnWithKeyboard(event, columnIndex),
                              role: 'separator',
                              'aria-label': t('markdownTable.resizeColumn', {
                                column: columnName,
                              }),
                              'aria-orientation': 'vertical',
                              'aria-valuemin': MIN_COLUMN_WIDTH,
                              'aria-valuemax': MAX_COLUMN_WIDTH,
                              'aria-valuenow':
                                columnWidths[columnIndex] ??
                                DEFAULT_COLUMN_WIDTH,
                            }),
                          ],
                        },
                        header.key,
                      );
                    }),
                    hasFillerColumn &&
                      _jsx('th', {
                        className: styles.fillerHeaderCell,
                        'aria-hidden': 'true',
                      }),
                  ],
                }),
              }),
              _jsx('tbody', {
                children: visibleRows.map((row, rowIndex) => {
                  const detailOpen = detailRowKey === row.key;
                  const detailId = `${tableId}-detail-${row.key}`;
                  return _jsxs(
                    Fragment,
                    {
                      children: [
                        _jsxs('tr', {
                          children: [
                            _jsx('td', {
                              className: `${styles.cell} ${styles.actionCell} ${freezeFirstColumn ? styles.stickyActionCell : ''}`,
                              children: _jsx('button', {
                                className: styles.rowDetailButton,
                                type: 'button',
                                onClick: (event) =>
                                  toggleRowDetail(
                                    row.key,
                                    event.currentTarget.closest('tr'),
                                  ),
                                'aria-expanded': detailOpen,
                                'aria-controls': detailId,
                                'aria-label': t(
                                  detailOpen
                                    ? 'markdownTable.closeRowDetailsAria'
                                    : 'markdownTable.rowDetailsAria',
                                  { index: rowIndex + 1 },
                                ),
                                children: detailOpen
                                  ? _jsx(MinusIcon, { 'aria-hidden': 'true' })
                                  : _jsx(PlusIcon, { 'aria-hidden': 'true' }),
                              }),
                            }),
                            orderedVisibleColumnIndexes.map((columnIndex) => {
                              const cell = row.cells[columnIndex];
                              if (!cell) return null;
                              const cellAlignStyle = cell.textAlign
                                ? { textAlign: cell.textAlign }
                                : undefined;
                              const isFrozenColumn =
                                frozenColumnIndex === columnIndex;
                              return _jsx(
                                'td',
                                {
                                  className: `${styles.cell} ${
                                    isCellSelected(rowIndex, columnIndex)
                                      ? styles.selectedCell
                                      : ''
                                  } ${isFrozenColumn ? styles.frozenCell : ''}`,
                                  style: cellAlignStyle,
                                  'data-row-index': rowIndex,
                                  'data-column-index': columnIndex,
                                  onMouseDown: (event) =>
                                    startSelection(
                                      event,
                                      rowIndex,
                                      columnIndex,
                                    ),
                                  onMouseEnter: () =>
                                    extendSelection(rowIndex, columnIndex),
                                  onTouchStart: (event) =>
                                    startTouchSelection(
                                      event,
                                      rowIndex,
                                      columnIndex,
                                    ),
                                  onTouchMove: extendTouchSelection,
                                  onTouchEnd: stopDragging,
                                  onTouchCancel: stopDragging,
                                  onDoubleClick: (event) => {
                                    if (
                                      isInteractiveSelectionTarget(event.target)
                                    ) {
                                      return;
                                    }
                                    openCellDialog(row.key, columnIndex);
                                  },
                                  children: renderCellContent(
                                    cell,
                                    longTextExpanded,
                                  ),
                                },
                                cell.key,
                              );
                            }),
                            hasFillerColumn &&
                              _jsx('td', {
                                className: styles.fillerCell,
                                'aria-hidden': 'true',
                              }),
                          ],
                        }),
                        detailOpen &&
                          _jsx('tr', {
                            id: detailId,
                            className: styles.detailRow,
                            children: _jsx('td', {
                              className: styles.detailCell,
                              colSpan:
                                orderedVisibleColumnIndexes.length +
                                1 +
                                (hasFillerColumn ? 1 : 0),
                              children: _jsxs('div', {
                                className: styles.detailPanel,
                                children: [
                                  _jsx('span', {
                                    className: 'sr-only',
                                    children: t('markdownTable.detailsHeader'),
                                  }),
                                  detailColumnIndexes.map((columnIndex) => {
                                    const header = table.headers[columnIndex];
                                    const cell = row.cells[columnIndex];
                                    if (!header || !cell) return null;
                                    return _jsxs(
                                      'div',
                                      {
                                        className: styles.detailItem,
                                        children: [
                                          _jsx('div', {
                                            className: styles.detailLabel,
                                            title: header.text,
                                            children: header.content,
                                          }),
                                          _jsx('div', {
                                            className: styles.detailValue,
                                            children: renderDetailValue(
                                              cell,
                                              longTextExpanded,
                                            ),
                                          }),
                                        ],
                                      },
                                      `${row.key}-detail-${columnIndex}`,
                                    );
                                  }),
                                  detailColumnIndexes.length === 0 &&
                                    _jsx('div', {
                                      className: styles.emptyValue,
                                      children: t(
                                        'markdownTable.customColumns.noDetails',
                                      ),
                                    }),
                                ],
                              }),
                            }),
                          }),
                      ],
                    },
                    row.key,
                  );
                }),
              }),
            ],
          }),
          visibleRows.length === 0 &&
            _jsx('div', {
              className: styles.emptyState,
              children:
                table.rows.length === 0
                  ? t('markdownTable.empty')
                  : t('markdownTable.emptyFiltered'),
            }),
        ],
      }),
      freezeFirstColumn &&
        frozenColumnShadowLeft !== null &&
        _jsx('div', {
          className: styles.frozenColumnShadow,
          style: { left: frozenColumnShadowLeft },
          'aria-hidden': 'true',
        }),
      columnContextMenu &&
        orderedVisibleColumnIndexes.length > 0 &&
        _jsx('div', {
          ref: columnContextMenuRef,
          className: styles.columnContextMenu,
          style: {
            left: columnContextMenu.left,
            top: columnContextMenu.top,
          },
          role: 'menu',
          children: _jsx('button', {
            className: styles.columnContextMenuAction,
            type: 'button',
            role: 'menuitem',
            onClick: toggleFreezeFirstColumnFromMenu,
            children: freezeFirstColumn
              ? t('markdownTable.unfreezeFirstColumn')
              : t('markdownTable.freezeFirstColumn'),
          }),
        }),
      _jsx(Dialog, {
        open: cellDialog !== null && currentCellDialogCell !== null,
        onOpenChange: (open) => {
          if (!open) closeCellDialog();
        },
        children:
          currentCellDialogCell &&
          _jsxs(DialogContent, {
            ref: cellDialogRef,
            className: 'sm:max-w-lg',
            showCloseButton: false,
            overlayProps: { onMouseDown: closeCellDialog },
            onOpenAutoFocus: (event) => {
              event.preventDefault();
              cellDialogRef.current?.focus();
            },
            tabIndex: -1,
            children: [
              _jsx(DialogClose, {
                asChild: true,
                children: _jsxs(Button, {
                  variant: 'ghost',
                  className: 'absolute top-2 right-2',
                  size: 'icon-sm',
                  'aria-label': t('markdownTable.close'),
                  children: [
                    _jsx(XIcon, { className: 'size-3.5', strokeWidth: 1.5 }),
                    _jsx('span', {
                      className: 'sr-only',
                      children: t('markdownTable.close'),
                    }),
                  ],
                }),
              }),
              _jsx(DialogHeader, {
                children: _jsx(DialogTitle, {
                  children: t('markdownTable.cellDialogTitle'),
                }),
              }),
              _jsx('div', {
                className:
                  'max-h-[200px] min-h-[100px] cursor-text overflow-auto rounded-lg border bg-background/70 p-3 leading-relaxed font-semibold whitespace-pre-wrap break-words select-text',
                children: currentCellDialogCell.content,
              }),
              _jsxs(DialogFooter, {
                children: [
                  _jsx(Button, {
                    variant: 'outline',
                    onClick: copyCellDialogValue,
                    children: copiedCellDialog
                      ? t('code.copied')
                      : t('markdownTable.copyCell'),
                  }),
                  _jsx(DialogClose, {
                    asChild: true,
                    children: _jsx(Button, {
                      children: t('markdownTable.close'),
                    }),
                  }),
                ],
              }),
            ],
          }),
      }),
    ],
  });
}
//# sourceMappingURL=EnhancedMarkdownTable.js.map
