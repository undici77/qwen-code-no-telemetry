import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftIcon,
  BotIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
} from 'lucide-react';
import {
  DAEMON_APPROVAL_MODES,
  useAgents,
} from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../../i18n';
import {
  canModifyAgent,
  filterAgents,
  isOverridden,
  preserveAgentSelection,
  scopeForLevel,
} from './agents-manager-logic';
import { AgentCreatePage } from './AgentCreatePage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Badge } from '../ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '../ui/empty';
import { Input } from '../ui/input';
import { ManagementNotice } from '../ui/management-notice';
import { Spinner } from '../ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import styles from './AgentsManagerPage.module.css';
function levelLabel(level, t) {
  if (level === 'project') return t('agent.level.project');
  if (level === 'user') return t('agent.level.user');
  if (level === 'builtin') return t('agent.level.builtin');
  if (level === 'extension') return t('agent.level.extension');
  return level;
}
function approvalModeLabel(mode, t) {
  if (!mode) return '—';
  if (mode === 'inherit' || mode === 'bubble') {
    return t(`agent.approval.${mode}`);
  }
  if (DAEMON_APPROVAL_MODES.some((value) => value === mode)) {
    return t(`mode.listLabel.${mode}`);
  }
  return mode;
}
function DetailField({ label, value }) {
  return _jsxs('div', {
    className: 'flex min-w-0 flex-col gap-1',
    children: [
      _jsx('div', { className: 'text-sm font-medium', children: label }),
      _jsx('div', {
        className: 'break-words text-sm text-muted-foreground',
        children: value,
      }),
    ],
  });
}
function jsonText(value) {
  return value ? JSON.stringify(value, null, 2) : '—';
}
function unwrapPlainText(value) {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(
      /(?<!\n)\n(?!\n|[ \t]*(?:#{1,6}\s|[-*+]\s|\d+\.\s|```|>\s|\*\*[^*\n]+\*\*:))/g,
      ' ',
    );
}
export function AgentsManagerPage({ onClose, embedded, initialCreateScope }) {
  const { t } = useI18n();
  const {
    agents,
    loading,
    error: agentsError,
    reload,
    getAgent,
    deleteAgent,
  } = useAgents({ autoLoad: true });
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [selection, setSelection] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(() =>
    Boolean(initialCreateScope),
  );
  const [editOpen, setEditOpen] = useState(false);
  const [listNotice, setListNotice] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [detailError, setDetailError] = useState(null);
  const [listErrorDismissed, setListErrorDismissed] = useState(false);
  const filteredAgents = useMemo(
    () => filterAgents(agents, query, levelFilter),
    [agents, query, levelFilter],
  );
  const selectedAgent = useMemo(
    () => preserveAgentSelection(selection, agents),
    [agents, selection],
  );
  const selectedName = selection?.name ?? null;
  useEffect(() => {
    setSelection((current) => preserveAgentSelection(current, agents));
  }, [agents]);
  useEffect(() => {
    embedded?.onDetailChange(Boolean(selectedName || createOpen || editOpen));
  }, [createOpen, editOpen, embedded, selectedName]);
  useEffect(() => {
    if (!selection) {
      setDetail(null);
      setDetailError(null);
      return;
    }
    let active = true;
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    getAgent(selection.name, scopeForLevel(selection.level))
      .then((nextDetail) => {
        if (active) setDetail(nextDetail);
      })
      .catch((e) => {
        if (active) setDetailError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selection, getAgent]);
  useEffect(() => {
    setListErrorDismissed(false);
  }, [agentsError]);
  useEffect(() => {
    if (initialCreateScope) setCreateOpen(true);
  }, [initialCreateScope]);
  function returnToList() {
    setCreateOpen(false);
    setEditOpen(false);
    setSelection(null);
    setDetail(null);
    setMutationError(null);
    void reload();
  }
  async function handleDelete() {
    if (!detail || !selectedAgent) return;
    const scope = scopeForLevel(selectedAgent.level);
    if (!scope) return;
    setBusy(true);
    try {
      await deleteAgent(selectedAgent.name, scope);
      setDeleteOpen(false);
      setSelection(null);
      setDetail(null);
      setListNotice(t('agent.deleted', { name: detail.name }));
      await reload();
    } catch (e) {
      setDeleteOpen(false);
      setMutationError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  const levelOptions = [
    { value: 'all', label: t('skills.filter.all') },
    { value: 'project', label: t('agent.level.project') },
    { value: 'user', label: t('agent.level.user') },
    { value: 'builtin', label: t('agent.level.builtin') },
    { value: 'extension', label: t('agent.level.extension') },
  ];
  const subpageTitle = editOpen
    ? t('agent.edit')
    : (selectedName ?? (createOpen ? t('agent.create.button') : null));
  const standaloneNavigation = _jsx(Breadcrumb, {
    className:
      'sticky -top-4 z-10 -mx-5 -mt-4 border-b bg-background px-5 py-3',
    children: _jsxs(BreadcrumbList, {
      className: 'text-base',
      children: [
        _jsx(BreadcrumbItem, {
          children: _jsx(Button, {
            variant: 'ghost',
            size: 'icon',
            onClick: onClose,
            'aria-label': t('common.back'),
            children: _jsx(ArrowLeftIcon, {}),
          }),
        }),
        _jsx(BreadcrumbItem, {
          children: subpageTitle
            ? _jsx(BreadcrumbLink, {
                asChild: true,
                children: _jsx('button', {
                  type: 'button',
                  onClick: returnToList,
                  children: t('agents.title'),
                }),
              })
            : _jsx(BreadcrumbPage, { children: t('agents.title') }),
        }),
        subpageTitle ? _jsx(BreadcrumbSeparator, {}) : null,
        subpageTitle
          ? _jsx(BreadcrumbItem, {
              children: _jsx(BreadcrumbPage, { children: subpageTitle }),
            })
          : null,
      ],
    }),
  });
  const navigation = embedded
    ? subpageTitle
      ? _jsx(Breadcrumb, {
          className:
            'sticky -top-4 z-10 -mx-5 -mt-4 border-b bg-background px-5 py-3',
          children: _jsxs(BreadcrumbList, {
            className: 'h-8 text-sm',
            children: [
              _jsx(BreadcrumbItem, {
                children: _jsx(BreadcrumbLink, {
                  asChild: true,
                  children: _jsx('button', {
                    type: 'button',
                    onClick: () => {
                      returnToList();
                      embedded.onDetailChange(false);
                    },
                    children: t('agents.title'),
                  }),
                }),
              }),
              _jsx(BreadcrumbSeparator, {}),
              _jsx(BreadcrumbItem, {
                children: _jsx(BreadcrumbPage, { children: subpageTitle }),
              }),
            ],
          }),
        })
      : null
    : standaloneNavigation;
  // ── Create view ──
  if (createOpen) {
    return _jsxs('div', {
      className: 'flex w-full flex-col gap-6 pb-8',
      children: [
        navigation,
        _jsx(AgentCreatePage, {
          initialScope: initialCreateScope ?? 'global',
          onCancel: returnToList,
          onCreated: (name) => {
            setCreateOpen(false);
            setListNotice(t('agent.created', { name }));
            void reload();
          },
        }),
      ],
    });
  }
  if (editOpen && detail) {
    return _jsxs('div', {
      className: 'flex w-full flex-col gap-6 pb-8',
      children: [
        navigation,
        _jsx(AgentCreatePage, {
          agent: detail,
          onCancel: () => setEditOpen(false),
          onCreated: (name) => {
            setEditOpen(false);
            setSelection(null);
            setDetail(null);
            setListNotice(t('agent.updated', { name }));
            void reload();
          },
        }),
      ],
    });
  }
  // ── Detail view ──
  if (selectedName && detail) {
    const mutable = canModifyAgent(detail);
    const toolsText =
      !detail.tools || detail.tools.length === 0 || detail.tools.includes('*')
        ? t('agent.create.tools.all')
        : detail.tools.join(', ');
    const disallowedToolsText = detail.disallowedTools?.join(', ') || '—';
    return _jsxs('div', {
      className: 'flex w-full flex-col gap-6 pb-8',
      children: [
        navigation,
        _jsxs('div', {
          className: 'flex w-full flex-col gap-6',
          children: [
            _jsxs('div', {
              className: 'flex items-center gap-4',
              children: [
                _jsx('div', {
                  className:
                    'flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted',
                  children: _jsx(BotIcon, {}),
                }),
                _jsx('div', {
                  className: 'min-w-0 flex-1',
                  children: _jsxs('div', {
                    className: 'flex flex-wrap items-center gap-2',
                    children: [
                      _jsx('h1', {
                        className:
                          'break-words text-xl font-semibold text-balance',
                        children: detail.name,
                      }),
                      _jsx(Badge, {
                        variant: 'outline',
                        children: levelLabel(detail.level, t),
                      }),
                      isOverridden(detail, agents)
                        ? _jsx(Badge, {
                            variant: 'secondary',
                            children: t('agent.overriddenBadge'),
                          })
                        : null,
                    ],
                  }),
                }),
                mutable
                  ? _jsxs(DropdownMenu, {
                      children: [
                        _jsx(DropdownMenuTrigger, {
                          asChild: true,
                          children: _jsx(Button, {
                            variant: 'ghost',
                            size: 'icon',
                            disabled: busy,
                            'aria-label': t('agent.chooseAction', {
                              name: detail.name,
                            }),
                            children: busy
                              ? _jsx(Spinner, {})
                              : _jsx(EllipsisVerticalIcon, {}),
                          }),
                        }),
                        _jsx(DropdownMenuContent, {
                          align: 'end',
                          onCloseAutoFocus: (event) => event.preventDefault(),
                          children: _jsxs(DropdownMenuGroup, {
                            children: [
                              _jsxs(DropdownMenuItem, {
                                onSelect: () => setEditOpen(true),
                                children: [
                                  _jsx(PencilIcon, {
                                    'data-icon': 'inline-start',
                                  }),
                                  t('agent.edit'),
                                ],
                              }),
                              _jsxs(DropdownMenuItem, {
                                variant: 'destructive',
                                disabled: busy,
                                onSelect: () => setDeleteOpen(true),
                                children: [
                                  _jsx(Trash2Icon, {
                                    'data-icon': 'inline-start',
                                  }),
                                  t('agent.delete'),
                                ],
                              }),
                            ],
                          }),
                        }),
                      ],
                    })
                  : null,
              ],
            }),
            mutationError
              ? _jsx(ManagementNotice, {
                  tone: 'error',
                  noticeKey: mutationError,
                  closeLabel: t('common.close'),
                  onDismiss: () => setMutationError(null),
                  children: mutationError,
                })
              : null,
            _jsxs(Tabs, {
              defaultValue: 'overview',
              children: [
                _jsxs(TabsList, {
                  className: 'max-w-full overflow-x-auto',
                  children: [
                    _jsx(TabsTrigger, {
                      value: 'overview',
                      children: t('agent.detail.overview'),
                    }),
                    _jsx(TabsTrigger, {
                      value: 'prompt',
                      children: t('agent.detail.systemPrompt'),
                    }),
                    _jsx(TabsTrigger, {
                      value: 'tools',
                      children: t('agent.detail.tools'),
                    }),
                    _jsx(TabsTrigger, {
                      value: 'mcp',
                      children: t('agent.detail.mcp'),
                    }),
                    _jsx(TabsTrigger, {
                      value: 'hooks',
                      children: t('agent.detail.hooks'),
                    }),
                  ],
                }),
                _jsx(TabsContent, {
                  value: 'overview',
                  className: 'pt-4',
                  children: _jsxs(Card, {
                    children: [
                      _jsxs(CardHeader, {
                        children: [
                          _jsx(CardTitle, {
                            className: 'text-sm',
                            children: t('agent.descriptionLabel'),
                          }),
                          _jsx(CardDescription, {
                            children: detail.description || '—',
                          }),
                        ],
                      }),
                      _jsxs(CardContent, {
                        className: 'grid gap-6 sm:grid-cols-2',
                        children: [
                          _jsx(DetailField, {
                            label: t('agent.filePathLabel'),
                            value: detail.filePath || '—',
                          }),
                          _jsx(DetailField, {
                            label: t('agent.modelLabel'),
                            value: detail.model || '—',
                          }),
                          _jsx(DetailField, {
                            label: t('agent.level.label'),
                            value: levelLabel(detail.level, t),
                          }),
                          _jsx(DetailField, {
                            label: t('agent.create.approvalMode'),
                            value: approvalModeLabel(
                              detail.approvalMode || detail.permissionMode,
                              t,
                            ),
                          }),
                          _jsx(DetailField, {
                            label: t('agent.create.maxTurns'),
                            value: detail.maxTurns?.toString() || '—',
                          }),
                          _jsx(DetailField, {
                            label: t('agent.create.color'),
                            value: detail.color || '—',
                          }),
                        ],
                      }),
                    ],
                  }),
                }),
                _jsx(TabsContent, {
                  value: 'prompt',
                  className: 'pt-4',
                  children: _jsx(Card, {
                    children: _jsx(CardContent, {
                      children: _jsx('div', {
                        className:
                          'max-h-[60vh] w-full overflow-auto break-words whitespace-pre-line text-sm leading-6 text-muted-foreground',
                        children: detail.systemPrompt
                          ? unwrapPlainText(detail.systemPrompt)
                          : '—',
                      }),
                    }),
                  }),
                }),
                _jsx(TabsContent, {
                  value: 'tools',
                  className: 'pt-4',
                  children: _jsxs(Card, {
                    children: [
                      _jsxs(CardHeader, {
                        children: [
                          _jsx(CardTitle, {
                            className: 'text-sm',
                            children: t('agent.toolsLabel'),
                          }),
                          _jsx(CardDescription, { children: toolsText }),
                        ],
                      }),
                      _jsx(CardContent, {
                        className: 'flex flex-col gap-6',
                        children: _jsx(DetailField, {
                          label: t('agent.create.disallowedTools'),
                          value: disallowedToolsText,
                        }),
                      }),
                    ],
                  }),
                }),
                _jsx(TabsContent, {
                  value: 'mcp',
                  className: 'pt-4',
                  children: _jsxs(Card, {
                    children: [
                      _jsx(CardHeader, {
                        children: _jsx(CardTitle, {
                          className: 'text-sm',
                          children: t('agent.create.mcpServers'),
                        }),
                      }),
                      _jsx(CardContent, {
                        children: _jsx('pre', {
                          className:
                            'max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground',
                          children: jsonText(detail.mcpServers),
                        }),
                      }),
                    ],
                  }),
                }),
                _jsx(TabsContent, {
                  value: 'hooks',
                  className: 'pt-4',
                  children: _jsxs(Card, {
                    children: [
                      _jsx(CardHeader, {
                        children: _jsx(CardTitle, {
                          className: 'text-sm',
                          children: t('agent.detail.hooks'),
                        }),
                      }),
                      _jsx(CardContent, {
                        children: _jsx('pre', {
                          className:
                            'max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground',
                          children: jsonText(detail.hooks),
                        }),
                      }),
                    ],
                  }),
                }),
              ],
            }),
            _jsx(AlertDialog, {
              open: deleteOpen,
              onOpenChange: (open) => {
                if (!open && busy) return;
                setDeleteOpen(open);
              },
              children: _jsxs(AlertDialogContent, {
                children: [
                  _jsxs(AlertDialogHeader, {
                    children: [
                      _jsx(AlertDialogTitle, {
                        children: t('agent.delete.title', {
                          name: detail.name,
                        }),
                      }),
                      _jsx(AlertDialogDescription, {
                        children: t('agent.delete.confirm', {
                          name: detail.name,
                        }),
                      }),
                    ],
                  }),
                  _jsxs(AlertDialogFooter, {
                    children: [
                      _jsx(AlertDialogCancel, {
                        disabled: busy,
                        children: t('common.cancel'),
                      }),
                      _jsxs(AlertDialogAction, {
                        variant: 'destructive',
                        disabled: busy,
                        onClick: (event) => {
                          event.preventDefault();
                          void handleDelete();
                        },
                        children: [
                          busy
                            ? _jsx(Spinner, { 'data-icon': 'inline-start' })
                            : null,
                          t('agent.delete.yes'),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            }),
          ],
        }),
      ],
    });
  }
  // ── Detail loading ──
  if (selectedName && detailLoading) {
    return _jsxs('div', {
      className: 'flex w-full flex-col gap-6 pb-8',
      children: [
        navigation,
        _jsx('div', {
          className: 'flex items-center justify-center py-12',
          children: _jsx(Spinner, { className: 'size-6' }),
        }),
      ],
    });
  }
  if (selectedName && detailError) {
    return _jsxs('div', {
      className: 'flex w-full flex-col gap-6 pb-8',
      children: [
        navigation,
        _jsx(ManagementNotice, {
          tone: 'error',
          noticeKey: detailError,
          closeLabel: t('common.close'),
          onDismiss: returnToList,
          children: detailError,
        }),
      ],
    });
  }
  // ── List view ──
  return _jsxs('div', {
    className: 'flex w-full flex-col gap-6 pb-8',
    children: [
      navigation,
      _jsxs('div', {
        className: 'flex w-full flex-col gap-6',
        children: [
          _jsxs('div', {
            className: 'flex items-start justify-between gap-4',
            children: [
              _jsxs('div', {
                children: [
                  _jsx('h1', {
                    className: 'text-xl font-semibold text-balance',
                    children: t('agents.title'),
                  }),
                  _jsx('p', {
                    className:
                      'mt-1 text-sm text-muted-foreground tabular-nums',
                    children: t('agent.count', { count: agents.length }),
                  }),
                ],
              }),
              _jsxs('div', {
                className: 'flex gap-2',
                children: [
                  _jsxs(Button, {
                    variant: 'outline',
                    disabled: loading,
                    onClick: () => void reload(),
                    children: [
                      loading
                        ? _jsx(Spinner, { 'data-icon': 'inline-start' })
                        : _jsx(RefreshCwIcon, { 'data-icon': 'inline-start' }),
                      t('common.refresh'),
                    ],
                  }),
                  _jsxs(Button, {
                    onClick: () => setCreateOpen(true),
                    children: [
                      _jsx(PlusIcon, { 'data-icon': 'inline-start' }),
                      t('agent.create.button'),
                    ],
                  }),
                ],
              }),
            ],
          }),
          agentsError && !listErrorDismissed
            ? _jsx(ManagementNotice, {
                tone: 'error',
                noticeKey: agentsError.message,
                closeLabel: t('common.close'),
                onDismiss: () => setListErrorDismissed(true),
                children: agentsError.message,
              })
            : null,
          listNotice
            ? _jsx(ManagementNotice, {
                tone: 'success',
                noticeKey: listNotice,
                closeLabel: t('common.close'),
                onDismiss: () => setListNotice(null),
                children: listNotice,
              })
            : null,
          _jsxs('div', {
            className: 'relative',
            children: [
              _jsx(SearchIcon, {
                className:
                  'pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground',
              }),
              _jsx(Input, {
                name: 'agent-search',
                'aria-label': t('common.search'),
                autoComplete: 'off',
                value: query,
                onChange: (event) => setQuery(event.target.value),
                placeholder: t('common.search'),
                className: 'pl-9',
              }),
            ],
          }),
          _jsx(ToggleGroup, {
            type: 'single',
            value: levelFilter,
            onValueChange: (value) => {
              if (value) setLevelFilter(value);
            },
            variant: 'outline',
            size: 'sm',
            'aria-label': t('agent.level.filter'),
            children: levelOptions.map((option) =>
              _jsx(
                ToggleGroupItem,
                { value: option.value, children: option.label },
                option.value,
              ),
            ),
          }),
          filteredAgents.length
            ? _jsx('div', {
                className: styles.agentGrid,
                'data-column-count': Math.min(filteredAgents.length, 4),
                children: filteredAgents.map((agent) =>
                  _jsx(
                    Card,
                    {
                      size: 'sm',
                      role: 'button',
                      tabIndex: 0,
                      'aria-label': agent.name,
                      className:
                        'cursor-pointer transition-colors hover:bg-accent/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                      onClick: () => {
                        setListNotice(null);
                        setMutationError(null);
                        setSelection({ name: agent.name, level: agent.level });
                      },
                      onKeyDown: (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setListNotice(null);
                          setMutationError(null);
                          setSelection({
                            name: agent.name,
                            level: agent.level,
                          });
                        }
                      },
                      children: _jsx(CardHeader, {
                        className: 'block',
                        children: _jsxs('div', {
                          className: 'flex items-start gap-3',
                          children: [
                            _jsx('div', {
                              className:
                                'flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted',
                              children: _jsx(BotIcon, { className: 'size-5' }),
                            }),
                            _jsxs('div', {
                              className: 'min-w-0 flex-1',
                              children: [
                                _jsxs('div', {
                                  className:
                                    'flex min-w-0 items-start justify-between gap-2',
                                  children: [
                                    _jsx(CardTitle, {
                                      className: 'min-w-0 flex-1 truncate',
                                      children: agent.name,
                                    }),
                                    _jsxs('div', {
                                      className: 'flex shrink-0 gap-1',
                                      children: [
                                        _jsx(Badge, {
                                          variant: 'outline',
                                          className: 'text-[10px]',
                                          children: levelLabel(agent.level, t),
                                        }),
                                        isOverridden(agent, agents)
                                          ? _jsx(Badge, {
                                              variant: 'secondary',
                                              className: 'text-[10px]',
                                              children: t(
                                                'agent.overriddenBadge',
                                              ),
                                            })
                                          : null,
                                      ],
                                    }),
                                  ],
                                }),
                                _jsx(CardDescription, {
                                  className: 'mt-1 min-w-0 text-xs',
                                  children: _jsx(TooltipProvider, {
                                    delayDuration: 300,
                                    children: _jsxs(Tooltip, {
                                      children: [
                                        _jsx(TooltipTrigger, {
                                          asChild: true,
                                          children: _jsx('span', {
                                            className: 'block truncate',
                                            children: agent.description || '—',
                                          }),
                                        }),
                                        _jsx(TooltipContent, {
                                          children: agent.description || '—',
                                        }),
                                      ],
                                    }),
                                  }),
                                }),
                              ],
                            }),
                          ],
                        }),
                      }),
                    },
                    `${agent.level}:${agent.name}`,
                  ),
                ),
              })
            : _jsx(Empty, {
                className: 'border',
                children: _jsxs(EmptyHeader, {
                  children: [
                    _jsx(EmptyMedia, {
                      variant: 'icon',
                      children:
                        query || levelFilter !== 'all'
                          ? _jsx(SearchIcon, {})
                          : _jsx(BotIcon, {}),
                    }),
                    _jsx(EmptyTitle, {
                      children:
                        query || levelFilter !== 'all'
                          ? t('agent.noMatches')
                          : t('agent.empty'),
                    }),
                  ],
                }),
              }),
        ],
      }),
    ],
  });
}
//# sourceMappingURL=AgentsManagerPage.js.map
