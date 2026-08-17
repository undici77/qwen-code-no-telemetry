import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from 'react/jsx-runtime';
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWorkspace } from '@qwen-code/webui/daemon-react-sdk';
import {
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  CheckIcon,
  ChevronRightIcon,
  GitBranchIcon,
  GitCommitIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  TagIcon,
  FileDiffIcon,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { validateBranchName } from './GitModePopover';
import styles from './BranchPickerPopover.module.css';
export function BranchPickerPopover({
  open,
  onOpenChange,
  workspaceCwd,
  gitCwd,
  side = 'bottom',
  onBranchChanged,
  onOpenDiff,
  onOpenCommit,
  children,
}) {
  const { t } = useI18n();
  const { client } = useWorkspace();
  const ws = useMemo(
    () => client.workspaceByCwd(workspaceCwd),
    [client, workspaceCwd],
  );
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [statusType, setStatusType] = useState('info');
  const [search, setSearch] = useState('');
  const [newBranchMode, setNewBranchMode] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [checkoutRefMode, setCheckoutRefMode] = useState(false);
  const [checkoutRefValue, setCheckoutRefValue] = useState('');
  const [busyAction, setBusyAction] = useState(null);
  const [collapsed, setCollapsed] = useState({
    recent: false,
    local: false,
    remote: true,
    tags: true,
  });
  const searchRef = useRef(null);
  const contentRef = useRef(null);
  const requestIdRef = useRef(0);
  const fetchBranches = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await ws.workspaceGitBranches(gitCwd);
      if (requestId !== requestIdRef.current) return;
      setData(result);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [ws, gitCwd]);
  useEffect(() => {
    if (open) {
      void fetchBranches();
      setSearch('');
      setNewBranchMode(false);
      setCheckoutRefMode(false);
      setNewBranchName('');
      setCheckoutRefValue('');
      setStatusMsg(null);
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open, fetchBranches]);
  const showStatus = useCallback((msg, type = 'info') => {
    setStatusMsg(msg);
    setStatusType(type);
  }, []);
  const handleCheckout = useCallback(
    async (ref) => {
      if (busyAction) return;
      setBusyAction('checkout');
      try {
        await ws.workspaceGitCheckout(ref, gitCwd);
        showStatus(t('branchPicker.checkedOut', { branch: ref }), 'success');
        onBranchChanged?.();
        onOpenChange(false);
      } catch (err) {
        showStatus(err instanceof Error ? err.message : String(err), 'error');
      } finally {
        setBusyAction(null);
      }
    },
    [ws, busyAction, gitCwd, onBranchChanged, onOpenChange, showStatus, t],
  );
  const handleNewBranch = useCallback(async () => {
    if (busyAction) return;
    if (!validateBranchName(newBranchName)) {
      // An empty name just means "not typed yet"; only explain the rejection
      // once the user has actually entered something invalid.
      if (newBranchName) {
        showStatus(t('branchPicker.invalidBranchName'), 'error');
      }
      return;
    }
    setBusyAction('newBranch');
    try {
      await ws.workspaceGitCreateBranch(newBranchName, undefined, gitCwd);
      showStatus(
        t('branchPicker.createdBranch', { branch: newBranchName }),
        'success',
      );
      onBranchChanged?.();
      onOpenChange(false);
    } catch (err) {
      showStatus(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setBusyAction(null);
    }
  }, [
    ws,
    busyAction,
    gitCwd,
    newBranchName,
    onBranchChanged,
    onOpenChange,
    showStatus,
    t,
  ]);
  const handleCheckoutRef = useCallback(async () => {
    if (!checkoutRefValue.trim()) return;
    await handleCheckout(checkoutRefValue.trim());
  }, [checkoutRefValue, handleCheckout]);
  const handlePush = useCallback(async () => {
    if (busyAction) return;
    setBusyAction('push');
    try {
      const result = await ws.workspaceGitPush({ setUpstream: true }, gitCwd);
      showStatus(result.output || t('branchPicker.pushSuccess'), 'success');
      await fetchBranches();
      onBranchChanged?.();
    } catch (err) {
      showStatus(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setBusyAction(null);
    }
  }, [ws, busyAction, gitCwd, fetchBranches, onBranchChanged, showStatus, t]);
  const handlePull = useCallback(async () => {
    if (busyAction) return;
    setBusyAction('pull');
    try {
      const result = await ws.workspaceGitPull(undefined, gitCwd);
      showStatus(result.output || t('branchPicker.pullSuccess'), 'success');
      await fetchBranches();
      onBranchChanged?.();
    } catch (err) {
      showStatus(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setBusyAction(null);
    }
  }, [ws, busyAction, gitCwd, fetchBranches, onBranchChanged, showStatus, t]);
  const q = search.toLowerCase().trim();
  const filterBranches = useCallback(
    (branches) => {
      if (!q) return branches;
      return branches.filter((b) => b.name.toLowerCase().includes(q));
    },
    [q],
  );
  const filteredLocal = useMemo(
    () => (data ? filterBranches(data.local) : []),
    [data, filterBranches],
  );
  const filteredRemote = useMemo(
    () => (data ? filterBranches(data.remote) : []),
    [data, filterBranches],
  );
  const filteredTags = useMemo(() => {
    if (!data) return [];
    if (!q) return data.tags;
    return data.tags.filter((tg) => tg.name.toLowerCase().includes(q));
  }, [data, q]);
  const filteredRecent = useMemo(() => {
    if (!data) return [];
    if (!q) return data.recent;
    return data.recent.filter((r) => r.toLowerCase().includes(q));
  }, [data, q]);
  const remoteGroups = useMemo(() => {
    const groups = new Map();
    for (const b of filteredRemote) {
      const slash = b.name.indexOf('/');
      const remote = slash > 0 ? b.name.slice(0, slash) : 'other';
      let list = groups.get(remote);
      if (!list) {
        list = [];
        groups.set(remote, list);
      }
      list.push(b);
    }
    return groups;
  }, [filteredRemote]);
  const actionsVisible =
    !q ||
    t('branchPicker.action.pull').toLowerCase().includes(q) ||
    t('branchPicker.action.push').toLowerCase().includes(q) ||
    t('branchPicker.action.commit').toLowerCase().includes(q) ||
    t('branchPicker.action.newBranch').toLowerCase().includes(q) ||
    t('branchPicker.action.checkoutRef').toLowerCase().includes(q) ||
    t('branchPicker.action.viewChanges').toLowerCase().includes(q);
  useEffect(() => {
    if (!actionsVisible) {
      setNewBranchMode(false);
      setCheckoutRefMode(false);
    }
  }, [actionsVisible]);
  const toggleSection = useCallback(
    (key) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] })),
    [],
  );
  return _jsxs(Popover, {
    open: open,
    onOpenChange: onOpenChange,
    children: [
      _jsx(PopoverTrigger, { asChild: true, children: children }),
      _jsxs(PopoverContent, {
        ref: contentRef,
        className: styles.picker,
        side: side,
        align: 'start',
        sideOffset: 4,
        // The content is portaled out of the composer, but React synthetic
        // clicks still bubble through the React tree to the composer
        // surface's onClick, which calls core.focus() and steals focus out
        // of the popover — Radix then dismisses it via focus-outside.
        // Stop the bubble so clicks inside keep focus in the popover
        // (mirrors the GitModePopover / ToolbarPopover pattern).
        onClick: (e) => e.stopPropagation(),
        onPointerDownOutside: (e) => {
          if (contentRef.current?.contains(e.target)) {
            e.preventDefault();
          }
        },
        children: [
          _jsxs('div', {
            className: styles.searchWrap,
            children: [
              _jsx(SearchIcon, { size: 14, className: styles.searchIcon }),
              _jsx('input', {
                ref: searchRef,
                className: styles.searchInput,
                placeholder: t('branchPicker.search'),
                value: search,
                onChange: (e) => setSearch(e.target.value),
              }),
            ],
          }),
          _jsxs('div', {
            className: styles.list,
            children: [
              loading &&
                _jsx('div', {
                  className: styles.loading,
                  children: t('branchPicker.loading'),
                }),
              error &&
                _jsx('div', { className: styles.empty, children: error }),
              !loading &&
                !error &&
                data &&
                _jsxs(_Fragment, {
                  children: [
                    actionsVisible &&
                      _jsxs(_Fragment, {
                        children: [
                          _jsxs('button', {
                            type: 'button',
                            className: styles.actionItem,
                            disabled: !!busyAction,
                            onClick: () => void handlePull(),
                            children: [
                              busyAction === 'pull'
                                ? _jsx(Loader2Icon, {
                                    size: 14,
                                    className: `${styles.actionIcon} ${styles.spin}`,
                                  })
                                : _jsx(ArrowDownToLineIcon, {
                                    size: 14,
                                    className: styles.actionIcon,
                                  }),
                              _jsx('span', {
                                className: styles.actionLabel,
                                children: t('branchPicker.action.pull'),
                              }),
                            ],
                          }),
                          onOpenCommit &&
                            _jsxs('button', {
                              type: 'button',
                              className: styles.actionItem,
                              disabled: !!busyAction,
                              onClick: () => {
                                onOpenCommit();
                                onOpenChange(false);
                              },
                              children: [
                                _jsx(GitCommitIcon, {
                                  size: 14,
                                  className: styles.actionIcon,
                                }),
                                _jsx('span', {
                                  className: styles.actionLabel,
                                  children: t('branchPicker.action.commit'),
                                }),
                              ],
                            }),
                          _jsxs('button', {
                            type: 'button',
                            className: styles.actionItem,
                            disabled: !!busyAction,
                            onClick: () => void handlePush(),
                            children: [
                              busyAction === 'push'
                                ? _jsx(Loader2Icon, {
                                    size: 14,
                                    className: `${styles.actionIcon} ${styles.spin}`,
                                  })
                                : _jsx(ArrowUpFromLineIcon, {
                                    size: 14,
                                    className: styles.actionIcon,
                                  }),
                              _jsx('span', {
                                className: styles.actionLabel,
                                children: t('branchPicker.action.push'),
                              }),
                            ],
                          }),
                          onOpenDiff &&
                            _jsxs('button', {
                              type: 'button',
                              className: styles.actionItem,
                              onClick: () => {
                                onOpenDiff();
                                onOpenChange(false);
                              },
                              children: [
                                _jsx(FileDiffIcon, {
                                  size: 14,
                                  className: styles.actionIcon,
                                }),
                                _jsx('span', {
                                  className: styles.actionLabel,
                                  children: t(
                                    'branchPicker.action.viewChanges',
                                  ),
                                }),
                              ],
                            }),
                          _jsx('div', { className: styles.separator }),
                          _jsxs('button', {
                            type: 'button',
                            className: styles.actionItem,
                            onClick: () => {
                              setNewBranchMode(!newBranchMode);
                              setCheckoutRefMode(false);
                            },
                            children: [
                              _jsx(PlusIcon, {
                                size: 14,
                                className: styles.actionIcon,
                              }),
                              _jsx('span', {
                                className: styles.actionLabel,
                                children: t('branchPicker.action.newBranch'),
                              }),
                            ],
                          }),
                          newBranchMode &&
                            _jsx('div', {
                              className: styles.inlineInput,
                              children: _jsx('input', {
                                className: `${styles.inlineInputField} ${
                                  newBranchName &&
                                  !validateBranchName(newBranchName)
                                    ? styles.inlineInputFieldInvalid
                                    : ''
                                }`,
                                placeholder: t(
                                  'branchPicker.newBranchPlaceholder',
                                ),
                                value: newBranchName,
                                onChange: (e) =>
                                  setNewBranchName(e.target.value),
                                onKeyDown: (e) => {
                                  if (e.key === 'Enter') void handleNewBranch();
                                  if (e.key === 'Escape')
                                    setNewBranchMode(false);
                                },
                                autoFocus: true,
                              }),
                            }),
                          _jsxs('button', {
                            type: 'button',
                            className: styles.actionItem,
                            onClick: () => {
                              setCheckoutRefMode(!checkoutRefMode);
                              setNewBranchMode(false);
                            },
                            children: [
                              _jsx(TagIcon, {
                                size: 14,
                                className: styles.actionIcon,
                              }),
                              _jsx('span', {
                                className: styles.actionLabel,
                                children: t('branchPicker.action.checkoutRef'),
                              }),
                            ],
                          }),
                          checkoutRefMode &&
                            _jsx('div', {
                              className: styles.inlineInput,
                              children: _jsx('input', {
                                className: styles.inlineInputField,
                                placeholder: t(
                                  'branchPicker.checkoutRefPlaceholder',
                                ),
                                value: checkoutRefValue,
                                onChange: (e) =>
                                  setCheckoutRefValue(e.target.value),
                                onKeyDown: (e) => {
                                  if (e.key === 'Enter')
                                    void handleCheckoutRef();
                                  if (e.key === 'Escape')
                                    setCheckoutRefMode(false);
                                },
                                autoFocus: true,
                              }),
                            }),
                          _jsx('div', { className: styles.separator }),
                        ],
                      }),
                    filteredRecent.length > 0 &&
                      _jsx(BranchSection, {
                        label: t('branchPicker.section.recent'),
                        sectionKey: 'recent',
                        collapsed: collapsed.recent,
                        onToggle: toggleSection,
                        children: filteredRecent.map((name) =>
                          _jsx(
                            BranchItem,
                            {
                              name: name,
                              isHead: name === data.head && !data.detached,
                              onClick: () => void handleCheckout(name),
                            },
                            name,
                          ),
                        ),
                      }),
                    _jsx(BranchSection, {
                      label: t('branchPicker.section.local'),
                      sectionKey: 'local',
                      collapsed: collapsed.local,
                      onToggle: toggleSection,
                      children:
                        filteredLocal.length === 0
                          ? _jsx('div', {
                              className: styles.empty,
                              children: t('branchPicker.noBranches'),
                            })
                          : filteredLocal.map((b) =>
                              _jsx(
                                BranchItem,
                                {
                                  name: b.name,
                                  isHead: b.isHead,
                                  ahead: b.ahead,
                                  behind: b.behind,
                                  upstream: b.upstream,
                                  onClick: () => void handleCheckout(b.name),
                                },
                                b.name,
                              ),
                            ),
                    }),
                    _jsx(BranchSection, {
                      label: t('branchPicker.section.remote'),
                      sectionKey: 'remote',
                      collapsed: collapsed.remote,
                      onToggle: toggleSection,
                      children:
                        filteredRemote.length === 0
                          ? _jsx('div', {
                              className: styles.empty,
                              children: t('branchPicker.noBranches'),
                            })
                          : Array.from(remoteGroups.entries()).map(
                              ([remote, branches]) =>
                                _jsxs(
                                  'div',
                                  {
                                    children: [
                                      _jsx('div', {
                                        className: styles.remoteGroupLabel,
                                        children: remote,
                                      }),
                                      branches.map((b) => {
                                        const slash = b.name.indexOf('/');
                                        const localName =
                                          slash > 0
                                            ? b.name.slice(slash + 1)
                                            : b.name;
                                        return _jsx(
                                          BranchItem,
                                          {
                                            name: localName,
                                            isHead: false,
                                            onClick: () =>
                                              void handleCheckout(b.name),
                                          },
                                          b.name,
                                        );
                                      }),
                                    ],
                                  },
                                  remote,
                                ),
                            ),
                    }),
                    _jsx(BranchSection, {
                      label: t('branchPicker.section.tags'),
                      sectionKey: 'tags',
                      collapsed: collapsed.tags,
                      onToggle: toggleSection,
                      children:
                        filteredTags.length === 0
                          ? _jsx('div', {
                              className: styles.empty,
                              children: t('branchPicker.noTags'),
                            })
                          : filteredTags.map((tg) =>
                              _jsxs(
                                'button',
                                {
                                  type: 'button',
                                  className: styles.item,
                                  onClick: () =>
                                    void handleCheckout(`refs/tags/${tg.name}`),
                                  children: [
                                    _jsx(TagIcon, {
                                      size: 13,
                                      className: styles.itemIcon,
                                    }),
                                    _jsx('span', {
                                      className: styles.itemName,
                                      children: tg.name,
                                    }),
                                  ],
                                },
                                tg.name,
                              ),
                            ),
                    }),
                  ],
                }),
            ],
          }),
          statusMsg &&
            _jsx('div', {
              className: `${styles.statusBar} ${
                statusType === 'error'
                  ? styles.statusBarError
                  : statusType === 'success'
                    ? styles.statusBarSuccess
                    : ''
              }`,
              children: statusMsg,
            }),
        ],
      }),
    ],
  });
}
function BranchSection({
  label,
  sectionKey: _key,
  collapsed,
  onToggle,
  children,
}) {
  return _jsxs('div', {
    className: styles.section,
    children: [
      _jsxs('button', {
        type: 'button',
        className: styles.sectionHeader,
        'aria-expanded': !collapsed,
        onClick: () => onToggle(_key),
        children: [
          _jsx(ChevronRightIcon, {
            size: 12,
            className: `${styles.sectionChevron} ${collapsed ? styles.sectionChevronCollapsed : ''}`,
          }),
          label,
        ],
      }),
      !collapsed && children,
    ],
  });
}
function BranchItem({ name, isHead, ahead, behind, upstream, onClick }) {
  return _jsxs('button', {
    type: 'button',
    className: `${styles.item} ${isHead ? styles.itemActive : ''}`,
    onClick: onClick,
    children: [
      isHead
        ? _jsx(StarIcon, {
            size: 13,
            className: `${styles.itemIcon} ${styles.itemStar}`,
          })
        : _jsx(GitBranchIcon, { size: 13, className: styles.itemIcon }),
      _jsx('span', { className: styles.itemName, children: name }),
      _jsxs('span', {
        className: styles.itemMeta,
        children: [
          (ahead ?? 0) > 0 || (behind ?? 0) > 0
            ? _jsxs('span', {
                className: styles.itemAheadBehind,
                children: [
                  (ahead ?? 0) > 0 &&
                    _jsxs('span', { children: ['\u2191', ahead] }),
                  (behind ?? 0) > 0 &&
                    _jsxs('span', { children: ['\u2193', behind] }),
                ],
              })
            : null,
          upstream &&
            _jsx('span', {
              className: styles.itemUpstream,
              children: upstream,
            }),
          isHead && _jsx(CheckIcon, { size: 12 }),
        ],
      }),
    ],
  });
}
//# sourceMappingURL=BranchPickerPopover.js.map
