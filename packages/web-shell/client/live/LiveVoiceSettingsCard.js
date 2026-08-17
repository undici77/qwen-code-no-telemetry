import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from 'react/jsx-runtime';
/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { FlaskConicalIcon } from 'lucide-react';
import { useI18n } from '../i18n';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Separator } from '../components/ui/separator';
import { Spinner } from '../components/ui/spinner';
import { Switch } from '../components/ui/switch';
import { HotkeySetter } from './HotkeySetter';
const INSTALLING_STATES = new Set([
  'checking',
  'downloading',
  'verifying',
  'installing',
  'launching',
]);
function RequirementBadge({ state }) {
  const { t } = useI18n();
  const effective = state ?? 'checking';
  return _jsx(Badge, {
    variant:
      effective === 'ready'
        ? 'secondary'
        : effective === 'denied' || effective === 'unavailable'
          ? 'destructive'
          : 'outline',
    children: t(`settings.liveSetup.requirement.${effective}`),
  });
}
export function LiveVoiceSettingsCard({ setup }) {
  const { t } = useI18n();
  const [apiKey, setApiKey] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const status = setup.status;
  const enabled = status?.enabled === true;
  const busy = setup.mutating || setup.loading;
  const installBusy = INSTALLING_STATES.has(status?.install.state ?? '');
  const requirements = status?.live.requirements;
  const saveKey = async () => {
    const value = apiKey.trim();
    if (!value) return;
    try {
      await setup.update({
        apiKey: { operation: 'replace', value },
      });
      setApiKey('');
    } catch {
      // The hook exposes the sanitized daemon error in the card.
    }
  };
  const clearKey = async () => {
    try {
      await setup.update({ apiKey: { operation: 'clear' } });
      setApiKey('');
    } catch {
      // The hook exposes the sanitized daemon error in the card.
    }
  };
  const setEnabled = async (next) => {
    if (next) {
      setConfirmOpen(true);
      return;
    }
    try {
      await setup.update({ enabled: false });
    } catch {
      // The hook exposes the sanitized daemon error in the card.
    }
  };
  const confirmEnable = () => {
    void setup.update({ enabled: true }).catch(() => undefined);
  };
  const launchOrRetry = () => {
    const operation =
      status?.install.state === 'error'
        ? setup.retryInstall()
        : setup.launchHost();
    void operation.catch(() => undefined);
  };
  return _jsxs('div', {
    className: 'space-y-5 p-5 max-md:p-4',
    children: [
      _jsxs('div', {
        className: 'flex items-start justify-between gap-6',
        children: [
          _jsxs('div', {
            className: 'min-w-0 space-y-1',
            children: [
              _jsxs('div', {
                className: 'flex flex-wrap items-center gap-2',
                children: [
                  _jsx('span', {
                    className: 'font-medium',
                    children: t('settings.liveSetup.title'),
                  }),
                  _jsx(Badge, {
                    variant: 'outline',
                    children: t('settings.liveSetup.experimental'),
                  }),
                ],
              }),
              _jsx('p', {
                className: 'max-w-3xl text-sm text-muted-foreground',
                children: t('settings.liveSetup.description'),
              }),
            ],
          }),
          setup.loading && !status
            ? _jsx(Spinner, {})
            : _jsx(Switch, {
                checked: enabled,
                disabled: busy || (!enabled && status?.keyConfigured !== true),
                'aria-label': t('settings.liveSetup.enable'),
                onCheckedChange: (next) => void setEnabled(next),
              }),
        ],
      }),
      _jsx(Separator, {}),
      _jsxs('div', {
        className: 'grid gap-4 lg:grid-cols-2',
        children: [
          _jsxs('div', {
            className: 'space-y-2',
            children: [
              _jsxs('div', {
                className: 'flex items-center justify-between gap-3',
                children: [
                  _jsx('label', {
                    htmlFor: 'live-realtime-key',
                    className: 'text-sm font-medium',
                    children: t('settings.liveSetup.apiKey'),
                  }),
                  _jsxs('div', {
                    className: 'flex items-center gap-1',
                    children: [
                      _jsx(Badge, {
                        variant: status?.keyConfigured
                          ? 'secondary'
                          : 'outline',
                        children: t(
                          status?.keyConfigured
                            ? 'settings.liveSetup.configured'
                            : 'settings.liveSetup.notConfigured',
                        ),
                      }),
                      status?.keyConfigured && !enabled
                        ? _jsx(Button, {
                            type: 'button',
                            size: 'xs',
                            variant: 'ghost',
                            disabled: setup.mutating,
                            onClick: () => void clearKey(),
                            children: t('settings.liveSetup.removeKey'),
                          })
                        : null,
                    ],
                  }),
                ],
              }),
              _jsxs('div', {
                className: 'flex gap-2',
                children: [
                  _jsx(Input, {
                    id: 'live-realtime-key',
                    type: 'password',
                    autoComplete: 'off',
                    value: apiKey,
                    disabled: setup.mutating,
                    placeholder: status?.keyConfigured
                      ? t('settings.liveSetup.apiKeyReplace')
                      : t('settings.liveSetup.apiKeyPlaceholder'),
                    onChange: (event) => setApiKey(event.target.value),
                    onKeyDown: (event) => {
                      if (event.key === 'Enter') void saveKey();
                    },
                  }),
                  _jsx(Button, {
                    type: 'button',
                    size: 'sm',
                    variant: 'outline',
                    disabled: !apiKey.trim() || setup.mutating,
                    onClick: () => void saveKey(),
                    children: setup.mutating
                      ? _jsx(Spinner, {})
                      : t('settings.liveSetup.save'),
                  }),
                ],
              }),
              _jsx('p', {
                className: 'text-xs text-muted-foreground',
                children: status?.model ?? 'qwen3.5-omni-plus-realtime',
              }),
            ],
          }),
          _jsxs('div', {
            className: 'space-y-2',
            children: [
              _jsx('div', {
                className: 'text-sm font-medium',
                children: t('settings.liveSetup.shortcut'),
              }),
              _jsx(HotkeySetter, {
                accelerator: status?.shortcut ?? 'Command+E',
                disabled: setup.mutating,
                captureLabel: t('settings.liveShortcut.capture'),
                clearLabel: t('settings.liveShortcut.clear'),
                offLabel: t('settings.liveShortcut.off'),
                onChange: async (shortcut) => setup.update({ shortcut }),
              }),
            ],
          }),
        ],
      }),
      enabled && status
        ? _jsxs(_Fragment, {
            children: [
              _jsx(Separator, {}),
              _jsxs('div', {
                className: 'space-y-3',
                children: [
                  _jsxs('div', {
                    className:
                      'flex flex-wrap items-center justify-between gap-3',
                    children: [
                      _jsxs('div', {
                        children: [
                          _jsx('div', {
                            className: 'text-sm font-medium',
                            children: t('settings.liveSetup.host'),
                          }),
                          _jsxs('div', {
                            className: 'text-xs text-muted-foreground',
                            children: [
                              t(
                                `settings.liveSetup.install.${status.install.state}`,
                              ),
                              status.install.version
                                ? ` · ${status.install.version}`
                                : '',
                            ],
                          }),
                        ],
                      }),
                      installBusy
                        ? _jsx(Spinner, {})
                        : status.install.state === 'error' ||
                            (status.install.state === 'installed' &&
                              requirements?.host !== 'ready')
                          ? _jsx(Button, {
                              type: 'button',
                              size: 'sm',
                              variant: 'outline',
                              disabled: setup.mutating,
                              onClick: launchOrRetry,
                              children:
                                status.install.state === 'error'
                                  ? t('settings.liveSetup.retry')
                                  : t('settings.liveSetup.openHost'),
                            })
                          : _jsx(RequirementBadge, {
                              state: requirements?.host,
                            }),
                    ],
                  }),
                  typeof status.install.progress === 'number' && installBusy
                    ? _jsx('div', {
                        className:
                          'h-1.5 overflow-hidden rounded-full bg-muted',
                        children: _jsx('div', {
                          className:
                            'h-full rounded-full bg-primary transition-[width]',
                          style: {
                            width: `${Math.round(status.install.progress * 100)}%`,
                          },
                        }),
                      })
                    : null,
                  _jsx('div', {
                    className: 'grid gap-2 sm:grid-cols-3',
                    children: [
                      ['microphone', requirements?.microphone],
                      ['accessibility', requirements?.accessibility],
                      ['screenRecording', requirements?.screenRecording],
                    ].map(([name, state]) =>
                      _jsxs(
                        'div',
                        {
                          className:
                            'flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2',
                          children: [
                            _jsx('span', {
                              className: 'text-xs',
                              children: t(
                                `settings.liveSetup.permission.${name}`,
                              ),
                            }),
                            _jsx(RequirementBadge, { state: state }),
                          ],
                        },
                        name,
                      ),
                    ),
                  }),
                  _jsx('p', {
                    className: 'text-xs text-muted-foreground',
                    children: t('settings.liveSetup.permissionHint'),
                  }),
                ],
              }),
            ],
          })
        : null,
      (setup.error || (enabled && status?.install.message)) &&
        _jsx('p', {
          className: 'text-sm text-destructive',
          role: 'alert',
          children: setup.error?.message ?? status?.install.message,
        }),
      _jsx(AlertDialog, {
        open: confirmOpen,
        onOpenChange: setConfirmOpen,
        children: _jsxs(AlertDialogContent, {
          children: [
            _jsxs(AlertDialogHeader, {
              children: [
                _jsx(AlertDialogMedia, {
                  children: _jsx(FlaskConicalIcon, {}),
                }),
                _jsx(AlertDialogTitle, {
                  children: t('settings.liveSetup.confirmTitle'),
                }),
                _jsx(AlertDialogDescription, {
                  children: t('settings.liveSetup.confirmDescription'),
                }),
              ],
            }),
            _jsxs(AlertDialogFooter, {
              children: [
                _jsx(AlertDialogCancel, {
                  children: t('settings.liveSetup.cancel'),
                }),
                _jsx(AlertDialogAction, {
                  onClick: confirmEnable,
                  children: t('settings.liveSetup.confirm'),
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
}
//# sourceMappingURL=LiveVoiceSettingsCard.js.map
