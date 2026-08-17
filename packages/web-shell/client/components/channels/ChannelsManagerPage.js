import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  PencilIcon,
  RadioTowerIcon,
  RotateCwIcon,
  Trash2Icon,
} from 'lucide-react';
import { useChannels, useWorkspace } from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../../i18n';
import { extractErrorDetail } from '../../utils/errorDetail';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../ui/empty';
import { Spinner } from '../ui/spinner';
import { Switch } from '../ui/switch';
import { ChannelEditorDialog } from './ChannelEditorDialog';
import styles from './ChannelsManagerPage.module.css';
import {
  isChannelPlatformAvailable,
  isSupportedChannelType,
  PLATFORM_MARKS,
} from './channel-platform';
const STATUS_KEYS = {
  stopped: 'channels.status.stopped',
  starting: 'channels.status.starting',
  connected: 'channels.status.connected',
  partial: 'channels.status.partial',
  error: 'channels.status.error',
};
function badgeVariant(state) {
  if (state === 'error') return 'destructive';
  if (state === 'connected') return 'secondary';
  return 'outline';
}
export function ChannelsManagerPage({ onClose, initialFocusRef }) {
  const { t } = useI18n();
  const workspace = useWorkspace();
  const supportsManagement =
    workspace.capabilities?.features.includes('channel_management') === true;
  const {
    catalog,
    snapshot,
    channels,
    loading,
    error,
    reload,
    createOrUpdate,
    remove,
    setStartup,
    start,
    stop,
    restart,
    pairing,
  } = useChannels({
    autoLoad: supportsManagement,
    enabled: supportsManagement,
  });
  const canManage = supportsManagement && Boolean(workspace.token);
  const [busy, setBusy] = useState(null);
  const [actionErrors, setActionErrors] = useState({});
  const [editor, setEditor] = useState();
  const [deleteTarget, setDeleteTarget] = useState();
  const [deleteError, setDeleteError] = useState();
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    setBusy(null);
    setActionErrors({});
    setEditor(undefined);
    setDeleteTarget(undefined);
    setDeleteError(undefined);
    setDeleting(false);
  }, [workspace.workspaceCwd]);
  const availablePlatforms = useMemo(
    () => catalog.filter(isChannelPlatformAvailable),
    [catalog],
  );
  const instances = useMemo(
    () =>
      Object.values(channels)
        .filter((channel) => isSupportedChannelType(channel.config.type))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [channels],
  );
  const workspaceName =
    workspace.workspaceCwd
      ?.split(/[\\/]+/)
      .filter(Boolean)
      .at(-1) ?? t('channels.workspace.current');
  const channelTypeLabel = useCallback(
    (channel) => {
      const type = String(channel.config.type);
      return catalog.find((item) => item.type === type)?.displayName ?? type;
    },
    [catalog],
  );
  const descriptorFor = useCallback(
    (channel) =>
      availablePlatforms.find(
        (descriptor) => descriptor.type === channel.config.type,
      ),
    [availablePlatforms],
  );
  const saveChannel = useCallback(
    (name, request) => createOrUpdate(name, request),
    [createOrUpdate],
  );
  const deleteChannel = useCallback(async () => {
    if (
      !deleteTarget ||
      deleteTarget.workspaceCwd !== workspace.workspaceCwd ||
      !snapshot ||
      deleting
    ) {
      return;
    }
    setDeleting(true);
    setDeleteError(undefined);
    try {
      await remove(deleteTarget.instance.name, {
        expectedRevision: snapshot.revision,
      });
      setDeleteTarget(undefined);
    } catch (removeError) {
      setDeleteError(extractErrorDetail(removeError));
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, deleting, remove, snapshot, workspace.workspaceCwd]);
  const runAction = useCallback(
    async (channel, action, operation) => {
      if (!canManage || busy) return;
      setBusy({ name: channel.name, action });
      setActionErrors((current) => {
        const next = { ...current };
        delete next[channel.name];
        return next;
      });
      try {
        await operation();
      } catch (actionError) {
        setActionErrors((current) => ({
          ...current,
          [channel.name]: extractErrorDetail(actionError),
        }));
      } finally {
        setBusy(null);
      }
    },
    [busy, canManage],
  );
  const renderPrimaryAction = (channel) => {
    const disabled = !canManage || busy !== null;
    if (channel.runtime.state === 'stopped') {
      return _jsxs(Button, {
        size: 'sm',
        disabled: disabled,
        onClick: () =>
          void runAction(channel, 'start', () => start(channel.name)),
        children: [
          busy?.name === channel.name && busy.action === 'start'
            ? _jsx(Spinner, {})
            : null,
          t('channels.action.start'),
        ],
      });
    }
    if (channel.runtime.state === 'error') {
      return _jsxs(Button, {
        size: 'sm',
        disabled: disabled,
        onClick: () =>
          void runAction(channel, 'restart', () => restart(channel.name)),
        children: [
          busy?.name === channel.name && busy.action === 'restart'
            ? _jsx(Spinner, {})
            : null,
          t('channels.action.retry'),
        ],
      });
    }
    return _jsxs(Button, {
      size: 'sm',
      variant: 'outline',
      disabled: disabled,
      onClick: () => void runAction(channel, 'stop', () => stop(channel.name)),
      children: [
        busy?.name === channel.name && busy.action === 'stop'
          ? _jsx(Spinner, {})
          : null,
        t('channels.action.stop'),
      ],
    });
  };
  return _jsxs('div', {
    className: styles.page,
    children: [
      _jsx('header', {
        className: styles.pageHeader,
        children: _jsxs('div', {
          className: styles.titleGroup,
          children: [
            _jsx(Button, {
              variant: 'ghost',
              size: 'icon',
              onClick: onClose,
              'aria-label': t('channels.action.back'),
              children: _jsx(ArrowLeftIcon, {}),
            }),
            _jsxs('div', {
              className: styles.titleCopy,
              children: [
                _jsx('h1', {
                  ref: initialFocusRef,
                  tabIndex: -1,
                  className: styles.title,
                  children: t('channels.title'),
                }),
                _jsx('p', {
                  className: styles.summary,
                  children: t('channels.summary', {
                    workspace: workspaceName,
                    count: instances.length,
                  }),
                }),
              ],
            }),
          ],
        }),
      }),
      !supportsManagement
        ? _jsxs(Alert, {
            children: [
              _jsx(AlertCircleIcon, {}),
              _jsx(AlertTitle, { children: t('channels.unsupported.title') }),
              _jsx(AlertDescription, {
                children: t('channels.unsupported.description'),
              }),
            ],
          })
        : null,
      supportsManagement && !workspace.token
        ? _jsxs(Alert, {
            children: [
              _jsx(AlertCircleIcon, {}),
              _jsx(AlertTitle, { children: t('channels.readOnly.title') }),
              _jsx(AlertDescription, {
                children: t('channels.readOnly.description'),
              }),
            ],
          })
        : null,
      loading && instances.length === 0
        ? _jsxs('div', {
            className:
              'flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground',
            children: [_jsx(Spinner, {}), t('channels.loading')],
          })
        : null,
      error
        ? _jsxs(Alert, {
            variant: 'destructive',
            children: [
              _jsx(AlertCircleIcon, {}),
              _jsx(AlertTitle, { children: t('channels.loadError.title') }),
              _jsx(AlertDescription, { children: extractErrorDetail(error) }),
              _jsx(Button, {
                className: 'mt-2 w-fit',
                size: 'sm',
                variant: 'outline',
                onClick: () => void reload(),
                children: t('channels.action.retry'),
              }),
            ],
          })
        : null,
      _jsxs('section', {
        className: styles.section,
        'aria-labelledby': 'configured-channels',
        children: [
          _jsxs('div', {
            className: styles.sectionHeader,
            children: [
              _jsx('h2', {
                id: 'configured-channels',
                className: styles.sectionTitle,
                children: t('channels.configured'),
              }),
              _jsx(Badge, { variant: 'outline', children: instances.length }),
            ],
          }),
          !loading && !error && instances.length === 0
            ? _jsx(Empty, {
                className: 'border',
                children: _jsxs(EmptyHeader, {
                  children: [
                    _jsx(EmptyMedia, {
                      variant: 'icon',
                      children: _jsx(RadioTowerIcon, {}),
                    }),
                    _jsx(EmptyTitle, { children: t('channels.empty.title') }),
                    _jsx(EmptyDescription, {
                      children: t('channels.empty.description'),
                    }),
                  ],
                }),
              })
            : null,
          instances.length > 0
            ? _jsx('div', {
                className: styles.channelGrid,
                children: instances.map((channel) => {
                  const descriptor = descriptorFor(channel);
                  const runtimeError =
                    actionErrors[channel.name] ?? channel.runtime.lastError;
                  return _jsxs(
                    Card,
                    {
                      size: 'sm',
                      className: styles.channelCard,
                      'data-runtime-state': channel.runtime.state,
                      children: [
                        _jsxs(CardHeader, {
                          children: [
                            _jsxs('div', {
                              className: 'min-w-0',
                              children: [
                                _jsxs(CardTitle, {
                                  className:
                                    'flex min-w-0 flex-wrap items-center gap-2',
                                  children: [
                                    _jsx('span', {
                                      className: 'truncate',
                                      children: channel.name,
                                    }),
                                    _jsx(Badge, {
                                      variant: badgeVariant(
                                        channel.runtime.state,
                                      ),
                                      children: t(
                                        STATUS_KEYS[channel.runtime.state],
                                      ),
                                    }),
                                  ],
                                }),
                                _jsx(CardDescription, {
                                  children: channelTypeLabel(channel),
                                }),
                              ],
                            }),
                            _jsx(CardAction, {
                              children: renderPrimaryAction(channel),
                            }),
                          ],
                        }),
                        runtimeError
                          ? _jsx(CardContent, {
                              children: _jsxs(Alert, {
                                variant: 'destructive',
                                className: styles.errorAlert,
                                children: [
                                  _jsx(AlertCircleIcon, {}),
                                  _jsx(AlertTitle, {
                                    children: t('channels.runtimeError'),
                                  }),
                                  _jsx(AlertDescription, {
                                    children: runtimeError,
                                  }),
                                ],
                              }),
                            })
                          : null,
                        _jsxs(CardFooter, {
                          className: styles.channelActions,
                          children: [
                            _jsxs('label', {
                              className: styles.startupControl,
                              children: [
                                _jsx(Switch, {
                                  size: 'sm',
                                  checked: channel.startsWithServe,
                                  disabled:
                                    !canManage || busy !== null || !snapshot,
                                  'aria-label': t(
                                    'channels.action.startWithServeNamed',
                                    {
                                      name: channel.name,
                                    },
                                  ),
                                  onCheckedChange: (enabled) =>
                                    void runAction(channel, 'startup', () =>
                                      setStartup(channel.name, {
                                        expectedRevision:
                                          snapshot?.revision ?? '',
                                        enabled,
                                      }),
                                    ),
                                }),
                                t('channels.startsWithServe'),
                              ],
                            }),
                            _jsxs('div', {
                              className: styles.lifecycleActions,
                              children: [
                                channel.runtime.state !== 'stopped' &&
                                channel.runtime.state !== 'error'
                                  ? _jsxs(Button, {
                                      size: 'sm',
                                      variant: 'ghost',
                                      disabled: !canManage || busy !== null,
                                      onClick: () =>
                                        void runAction(channel, 'restart', () =>
                                          restart(channel.name),
                                        ),
                                      children: [
                                        busy?.name === channel.name &&
                                        busy.action === 'restart'
                                          ? _jsx(Spinner, {})
                                          : _jsx(RotateCwIcon, {}),
                                        t('channels.action.restart'),
                                      ],
                                    })
                                  : null,
                                descriptor
                                  ? _jsxs(Button, {
                                      size: 'sm',
                                      variant: 'ghost',
                                      disabled:
                                        !canManage ||
                                        busy !== null ||
                                        !snapshot,
                                      'aria-label': t(
                                        'channels.action.editNamed',
                                        {
                                          name: channel.name,
                                        },
                                      ),
                                      onClick: () =>
                                        setEditor({
                                          workspaceCwd: workspace.workspaceCwd,
                                          descriptor,
                                          instance: channel,
                                        }),
                                      children: [
                                        _jsx(PencilIcon, {}),
                                        t('channels.action.edit'),
                                      ],
                                    })
                                  : null,
                                _jsxs(Button, {
                                  size: 'sm',
                                  variant: 'ghost',
                                  className:
                                    'text-destructive hover:text-destructive',
                                  disabled:
                                    !canManage || busy !== null || !snapshot,
                                  'aria-label': t(
                                    'channels.action.deleteNamed',
                                    {
                                      name: channel.name,
                                    },
                                  ),
                                  onClick: () => {
                                    setDeleteError(undefined);
                                    setDeleteTarget({
                                      workspaceCwd: workspace.workspaceCwd,
                                      instance: channel,
                                    });
                                  },
                                  children: [
                                    _jsx(Trash2Icon, {}),
                                    t('channels.action.delete'),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    },
                    channel.name,
                  );
                }),
              })
            : null,
        ],
      }),
      availablePlatforms.length > 0
        ? _jsxs('section', {
            className: styles.section,
            'aria-labelledby': 'channel-platforms',
            children: [
              _jsxs('div', {
                children: [
                  _jsx('h2', {
                    id: 'channel-platforms',
                    className: styles.sectionTitle,
                    children: t('channels.availablePlatforms'),
                  }),
                  _jsx('p', {
                    className: 'mt-1 text-xs text-muted-foreground',
                    children: t('channels.availablePlatforms.description'),
                  }),
                ],
              }),
              _jsx('div', {
                className: styles.platformGrid,
                children: availablePlatforms.map((platform) =>
                  _jsxs(
                    'button',
                    {
                      type: 'button',
                      className: styles.platformCard,
                      'data-testid': `channel-platform-${platform.type}`,
                      disabled: !canManage || !snapshot,
                      'aria-label': t('channels.platform.configureNamed', {
                        platform: platform.displayName,
                      }),
                      onClick: () =>
                        setEditor({
                          workspaceCwd: workspace.workspaceCwd,
                          descriptor: platform,
                        }),
                      children: [
                        _jsx('span', {
                          className: styles.platformMark,
                          'aria-hidden': 'true',
                          children:
                            PLATFORM_MARKS[platform.type] ??
                            platform.displayName[0]?.toUpperCase() ??
                            '?',
                        }),
                        _jsxs('div', {
                          className: styles.platformCopy,
                          children: [
                            _jsx('p', {
                              className: styles.platformName,
                              children: platform.displayName,
                            }),
                            _jsx('p', {
                              className: styles.platformHint,
                              children: t('channels.platform.configure'),
                            }),
                          ],
                        }),
                      ],
                    },
                    platform.type,
                  ),
                ),
              }),
            ],
          })
        : null,
      editor && editor.workspaceCwd === workspace.workspaceCwd && snapshot
        ? _jsx(ChannelEditorDialog, {
            open: true,
            descriptor: editor.descriptor,
            instance: editor.instance,
            expectedRevision: snapshot.revision,
            existingNames: instances
              .filter((channel) => channel.name !== editor.instance?.name)
              .map((channel) => channel.name),
            onOpenChange: (open) => {
              if (!open) setEditor(undefined);
            },
            onSave: saveChannel,
            onReload: reload,
            listPairingRequests: pairing.list,
            approvePairingRequest: pairing.approve,
            listPairingApprovals: pairing.approvals,
            revokePairingApproval: pairing.revoke,
          })
        : null,
      _jsx(AlertDialog, {
        open: Boolean(
          deleteTarget && deleteTarget.workspaceCwd === workspace.workspaceCwd,
        ),
        onOpenChange: (open) => {
          if (!open && !deleting) {
            setDeleteTarget(undefined);
            setDeleteError(undefined);
          }
        },
        children: _jsxs(AlertDialogContent, {
          children: [
            _jsxs(AlertDialogHeader, {
              children: [
                _jsx(AlertDialogTitle, {
                  children: t('channels.delete.title', {
                    name: deleteTarget?.instance.name ?? '',
                  }),
                }),
                _jsx(AlertDialogDescription, {
                  children: t('channels.delete.description'),
                }),
              ],
            }),
            deleteError
              ? _jsxs(Alert, {
                  variant: 'destructive',
                  children: [
                    _jsx(AlertCircleIcon, {}),
                    _jsx(AlertTitle, { children: t('channels.delete.error') }),
                    _jsx(AlertDescription, { children: deleteError }),
                    _jsx(Button, {
                      className: 'mt-2 w-fit',
                      size: 'sm',
                      variant: 'outline',
                      onClick: () => {
                        void reload().then(
                          () => {
                            setDeleteTarget(undefined);
                            setDeleteError(undefined);
                          },
                          (reloadError) => {
                            setDeleteError(extractErrorDetail(reloadError));
                          },
                        );
                      },
                      children: t('channels.editor.reloadLatest'),
                    }),
                  ],
                })
              : null,
            _jsxs(AlertDialogFooter, {
              children: [
                _jsx(AlertDialogCancel, {
                  disabled: deleting,
                  children: t('channels.editor.cancel'),
                }),
                _jsxs(Button, {
                  variant: 'destructive',
                  disabled: deleting,
                  onClick: () => void deleteChannel(),
                  children: [
                    deleting ? _jsx(Spinner, {}) : null,
                    t('channels.action.delete'),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
}
//# sourceMappingURL=ChannelsManagerPage.js.map
