import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from 'react/jsx-runtime';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  BotIcon,
  BoxIcon,
  CommandIcon,
  EllipsisVerticalIcon,
  FileTextIcon,
  PackageIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ServerIcon,
  SparklesIcon,
} from 'lucide-react';
import { DaemonHttpError } from '@qwen-code/sdk/daemon';
import {
  useConnection,
  useWorkspace,
  useWorkspaceActions,
  useWorkspaceEventSignals,
} from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../../i18n';
import { trimDialogLabel } from '../../utils/dialogLabels';
import styles from './ExtensionsManagerPage.module.css';
import {
  filterExtensions,
  preserveSelectedExtensionName,
} from './extensions-manager-logic';
import { Alert, AlertDescription } from '../ui/alert';
import { ManagementNotice } from '../ui/management-notice';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../ui/empty';
import { Input } from '../ui/input';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Separator } from '../ui/separator';
import { Spinner } from '../ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
const MAX_EXTENSION_ARCHIVE_BYTES = 10 * 1024 * 1024;
function isValidExtensionArchiveFilename(filename) {
  if (!/\.(?:zip|tar\.gz)$/i.test(filename)) return false;
  if (new TextEncoder().encode(filename).length > 255) return false;
  return !Array.from(filename).some((character) => {
    const code = character.charCodeAt(0);
    return character === '/' || character === '\\' || code < 32 || code === 127;
  });
}
const UPDATE_AVAILABLE = 'update available';
function extensionTitle(extension) {
  return extension.displayName || extension.name;
}
function extensionIsActive(extension) {
  if (
    extension.workspaceActivation &&
    extension.workspaceActivation !== 'inherit'
  ) {
    return extension.workspaceActivation === 'enabled';
  }
  return extension.defaultActivation
    ? extension.defaultActivation === 'enabled'
    : extension.isActive;
}
function statusLabel(extension, t) {
  return extensionIsActive(extension)
    ? t('extensions.manage.status.enabled')
    : t('extensions.manage.status.disabled');
}
function updateLabel(state, t) {
  switch (state) {
    case 'update available':
      return t('extensions.manage.updateAvailable');
    case 'up to date':
      return t('extensions.manage.upToDate');
    case 'not updatable':
      return t('extensions.manage.notUpdatable');
    case 'checking for updates':
      return t('extensions.manage.checkingUpdates');
    case 'updating':
      return t('extensions.manage.updating');
    case 'updated':
      return t('extensions.manage.updateComplete');
    case 'updated with warnings':
      return t('extensions.manage.updatedWithWarnings');
    case 'updated, needs restart':
      return t('extensions.manage.restartRequired');
    case 'error':
      return t('extensions.manage.updateError');
    case 'unknown':
    case undefined:
      return t('extensions.manage.unknownUpdate');
  }
}
function mutationMessage(operation, name, t) {
  switch (operation) {
    case 'enable':
      return t('extensions.manage.enabling', { name });
    case 'disable':
      return t('extensions.manage.disabling', { name });
    case 'uninstall':
      return t('extensions.manage.uninstalling', { name });
    case 'update':
      return t('extensions.manage.updatingExtension', { name });
    default:
      return t('extensions.manage.queued', { name });
  }
}
function mutationSuccessMessage(operation, name, t) {
  switch (operation) {
    case 'enable':
      return t('extensions.manage.enabled', { name });
    case 'disable':
      return t('extensions.manage.disabled', { name });
    case 'uninstall':
      return t('extensions.manage.uninstalled', { name });
    case 'update':
      return t('extensions.manage.updated', { name });
    default:
      return t('extensions.manage.queued', { name });
  }
}
function DetailField({ label, value }) {
  return _jsxs('div', {
    className: 'flex min-w-0 flex-col gap-1',
    children: [
      _jsx('div', {
        className: 'text-sm font-medium',
        children: trimDialogLabel(label),
      }),
      _jsx('div', {
        className: 'break-words text-sm text-muted-foreground',
        children: value,
      }),
    ],
  });
}
function CapabilityList({ items, empty, icon: Icon }) {
  if (!items.length) {
    return _jsx(Empty, {
      className: 'border',
      children: _jsxs(EmptyHeader, {
        children: [
          _jsx(EmptyMedia, { variant: 'icon', children: _jsx(Icon, {}) }),
          _jsx(EmptyTitle, { children: empty }),
        ],
      }),
    });
  }
  return _jsx(Card, {
    children: _jsx(CardContent, {
      className: 'flex flex-col',
      children: items.map((item, index) =>
        _jsxs(
          'div',
          {
            children: [
              index > 0 ? _jsx(Separator, {}) : null,
              _jsxs('div', {
                className:
                  'flex min-w-0 items-center gap-3 py-3 [contain-intrinsic-size:auto_44px] [content-visibility:auto]',
                children: [
                  _jsx(Icon, {
                    className: 'size-4 shrink-0 text-muted-foreground',
                  }),
                  _jsx('span', {
                    className: 'min-w-0 break-words',
                    children: item,
                  }),
                ],
              }),
            ],
          },
          item,
        ),
      ),
    }),
  });
}
function ExtensionInteractionDialog({
  pendingInteraction,
  submitting,
  selectedPlugin,
  interactionValue,
  setSelectedPlugin,
  setInteractionValue,
  submit,
  t,
}) {
  return _jsx(Dialog, {
    open: Boolean(pendingInteraction),
    onOpenChange: (open) => {
      if (!open && pendingInteraction && !submitting) {
        submit({ cancelled: true });
      }
    },
    children: _jsxs(DialogContent, {
      showCloseButton: false,
      className: 'max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl',
      children: [
        _jsxs(DialogHeader, {
          className: 'items-start px-3 text-left',
          children: [
            _jsx(DialogTitle, {
              children:
                pendingInteraction?.interaction.kind === 'setting'
                  ? pendingInteraction.interaction.setting.name
                  : t('extensions.manage.selectExtension'),
            }),
            _jsx(DialogDescription, {
              children:
                pendingInteraction?.interaction.kind === 'marketplace_plugin'
                  ? t('extensions.manage.installSelectPluginDescription', {
                      marketplace:
                        pendingInteraction.interaction.marketplace.name,
                    })
                  : pendingInteraction?.interaction.setting.description,
            }),
          ],
        }),
        pendingInteraction?.interaction.kind === 'marketplace_plugin'
          ? _jsx(RadioGroup, {
              'aria-label': t('extensions.manage.selectExtension'),
              value: selectedPlugin,
              onValueChange: setSelectedPlugin,
              className: 'flex flex-col gap-2 px-3',
              children: pendingInteraction.interaction.plugins.map((plugin) => {
                const id = `marketplace-plugin-${plugin.name}`;
                return _jsxs(
                  'div',
                  {
                    className:
                      'flex items-start gap-3 rounded-md border border-border p-3 has-data-[state=checked]:bg-accent/50',
                    children: [
                      _jsx(RadioGroupItem, {
                        id: id,
                        value: plugin.name,
                        disabled: submitting,
                        className: 'mt-0.5',
                      }),
                      _jsxs('label', {
                        htmlFor: id,
                        className:
                          'flex min-w-0 flex-1 cursor-pointer flex-col gap-1',
                        children: [
                          _jsx('span', {
                            className: 'font-medium',
                            children: plugin.name,
                          }),
                          _jsx('span', {
                            className: 'text-sm text-muted-foreground',
                            children:
                              plugin.description ??
                              plugin.category ??
                              (plugin.source === '.' || plugin.source === './'
                                ? t('extensions.manage.marketplaceRoot')
                                : plugin.source) ??
                              t('extensions.manage.noDescription'),
                          }),
                          plugin.tags?.length
                            ? _jsx('span', {
                                className: 'text-xs text-muted-foreground',
                                children: plugin.tags.join(' · '),
                              })
                            : null,
                        ],
                      }),
                    ],
                  },
                  plugin.name,
                );
              }),
            })
          : null,
        pendingInteraction?.interaction.kind === 'marketplace_plugin'
          ? _jsxs(DialogFooter, {
              children: [
                _jsx(Button, {
                  variant: 'outline',
                  disabled: submitting,
                  onClick: () => submit({ cancelled: true }),
                  children: t('common.cancel'),
                }),
                _jsxs(Button, {
                  disabled: submitting || !selectedPlugin,
                  onClick: () => submit({ pluginName: selectedPlugin }),
                  children: [
                    submitting ? _jsx(Spinner, {}) : null,
                    pendingInteraction.owner === 'mutation'
                      ? t('extensions.manage.update')
                      : t('extensions.manage.install'),
                  ],
                }),
              ],
            })
          : pendingInteraction?.interaction.kind === 'setting'
            ? _jsxs(_Fragment, {
                children: [
                  _jsx(Input, {
                    autoComplete: 'off',
                    'aria-label': pendingInteraction.interaction.setting.name,
                    type: pendingInteraction.interaction.setting.sensitive
                      ? 'password'
                      : 'text',
                    value: interactionValue,
                    onChange: (event) =>
                      setInteractionValue(event.target.value),
                    onKeyDown: (event) => {
                      if (event.key === 'Enter' && !submitting) {
                        event.preventDefault();
                        submit({ value: interactionValue });
                      }
                    },
                  }),
                  _jsxs(DialogFooter, {
                    children: [
                      _jsx(Button, {
                        variant: 'outline',
                        disabled: submitting,
                        onClick: () => submit({ cancelled: true }),
                        children: t('common.cancel'),
                      }),
                      _jsxs(Button, {
                        disabled: submitting,
                        onClick: () => submit({ value: interactionValue }),
                        children: [
                          submitting ? _jsx(Spinner, {}) : null,
                          pendingInteraction.owner === 'mutation'
                            ? t('extensions.manage.update')
                            : t('extensions.manage.install'),
                        ],
                      }),
                    ],
                  }),
                ],
              })
            : null,
      ],
    }),
  });
}
export function ExtensionsManagerPage({ onClose, initialFocusRef, embedded }) {
  const { t } = useI18n();
  const connection = useConnection();
  const workspace = useWorkspace();
  const actions = useWorkspaceActions();
  const signals = useWorkspaceEventSignals();
  const [extensions, setExtensions] = useState([]);
  const [selectedName, setSelectedName] = useState(null);
  const [query, setQuery] = useState('');
  const [updateStates, setUpdateStates] = useState({});
  const [loading, setLoading] = useState(false);
  const [checkingName, setCheckingName] = useState(null);
  const [busyName, setBusyName] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageTone, setMessageTone] = useState('info');
  const [messageOwner, setMessageOwner] = useState(null);
  const [recoveryError, setRecoveryError] = useState(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [uninstallName, setUninstallName] = useState(null);
  const [installOpen, setInstallOpen] = useState(false);
  const [installMethod, setInstallMethod] = useState('source');
  const [installSource, setInstallSource] = useState('');
  const [installArchive, setInstallArchive] = useState(null);
  const [installing, setInstalling] = useState(false);
  const [pendingInstall, setPendingInstall] = useState(null);
  const [pendingInteraction, setPendingInteraction] = useState(null);
  const interactionIdRef = useRef(null);
  const [interactionValue, setInteractionValue] = useState('');
  const [selectedPlugin, setSelectedPlugin] = useState('');
  const [submittingInteraction, setSubmittingInteraction] = useState(false);
  const [operationsRecovered, setOperationsRecovered] = useState(false);
  const mutationInFlightRef = useRef(false);
  const uninstallInFlightNameRef = useRef(null);
  const interactionOperationIdRef = useRef(null);
  const cardRefs = useRef(new Map());
  const archiveInputRef = useRef(null);
  const returnFocusNameRef = useRef(null);
  const [pendingMutation, setPendingMutation] = useState(null);
  const clearInteraction = useCallback((operationId) => {
    if (operationId && interactionOperationIdRef.current !== operationId) {
      return;
    }
    interactionOperationIdRef.current = null;
    interactionIdRef.current = null;
    setPendingInteraction(null);
    setInteractionValue('');
    setSelectedPlugin('');
  }, []);
  const showInteraction = useCallback((operationId, interaction, owner) => {
    if (interactionIdRef.current !== interaction.id) {
      setInteractionValue('');
      setSelectedPlugin('');
      interactionIdRef.current = interaction.id;
    }
    interactionOperationIdRef.current = operationId;
    setPendingInteraction({ operationId, interaction, owner });
  }, []);
  const load = useCallback(
    (preserveMessage = false) => {
      setLoading(true);
      const projection = workspace.workspaceCwd
        ? workspace.client
            .workspaceByCwd(workspace.workspaceCwd)
            .workspaceExtensions()
            .catch(() => null)
        : Promise.resolve(null);
      return Promise.all([actions.loadExtensionsStatus(), projection])
        .then(([status, activation]) => {
          const activations = new Map(
            (activation?.extensions ?? []).map((entry) => [
              entry.extensionId,
              entry,
            ]),
          );
          const nextExtensions = (status.extensions ?? []).map((extension) => {
            const entry = activations.get(extension.id);
            return entry
              ? {
                  ...extension,
                  defaultActivation: entry.defaultActivation,
                  workspaceActivation: entry.workspaceActivation ?? 'inherit',
                }
              : extension;
          });
          setExtensions((current) => {
            const uninstallName = uninstallInFlightNameRef.current;
            if (
              !uninstallName ||
              nextExtensions.some(
                (extension) => extension.name === uninstallName,
              )
            ) {
              return nextExtensions;
            }
            const uninstallingExtension = current.find(
              (extension) => extension.name === uninstallName,
            );
            return uninstallingExtension
              ? [...nextExtensions, uninstallingExtension]
              : nextExtensions;
          });
          if (!preserveMessage) {
            setMessageOwner(null);
            setMessageTone(status.errors?.[0] ? 'error' : 'info');
            setMessage(status.errors?.[0]?.error ?? null);
          }
          setSelectedName((name) =>
            name && uninstallInFlightNameRef.current === name
              ? name
              : preserveSelectedExtensionName(name, nextExtensions),
          );
        })
        .catch((error) => {
          if (!preserveMessage) {
            setMessageOwner(null);
            setMessageTone('error');
            setMessage(error instanceof Error ? error.message : String(error));
          }
        })
        .finally(() => setLoading(false));
    },
    [actions, workspace.client, workspace.workspaceCwd],
  );
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    let cancelled = false;
    let timer;
    let retryDelay = 2000;
    const recover = async () => {
      try {
        const { operations } = await actions.activeExtensionOperations();
        if (cancelled) return;
        const activeInstall = operations
          .filter((operation) => operation.operation === 'install')
          .sort((left, right) => right.createdAt - left.createdAt)[0];
        if (activeInstall) {
          setPendingInstall(
            (current) =>
              current ?? {
                operationId: activeInstall.operationId,
                source:
                  activeInstall.source ?? activeInstall.name ?? 'extension',
              },
          );
        }
        const activeMutation = operations.find(
          (operation) => operation.operation !== 'install',
        );
        if (activeMutation) {
          mutationInFlightRef.current = true;
          if (activeMutation.operation === 'uninstall') {
            uninstallInFlightNameRef.current =
              activeMutation.name ?? 'extension';
          }
          setPendingMutation(
            (current) =>
              current ?? {
                operationId: activeMutation.operationId,
                name: activeMutation.name ?? 'extension',
                operation: activeMutation.operation,
              },
          );
          setBusyName((current) => current ?? activeMutation.name ?? null);
        }
        setRecoveryError(null);
        setOperationsRecovered(true);
      } catch (error) {
        if (!cancelled) {
          setRecoveryError(
            error instanceof Error ? error.message : String(error),
          );
          timer = setTimeout(() => void recover(), retryDelay);
          retryDelay = Math.min(retryDelay * 2, 30_000);
        }
      }
    };
    void recover();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [actions]);
  const extensionsVersionRef = useRef(signals?.extensionsVersion ?? 0);
  useEffect(() => {
    const version = signals?.extensionsVersion ?? 0;
    if (version !== extensionsVersionRef.current) {
      extensionsVersionRef.current = version;
      setUpdateStates({});
      void load(true);
    }
  }, [load, signals?.extensionsVersion]);
  useEffect(() => {
    if (!pendingInstall) return;
    let cancelled = false;
    let timer;
    let retryDelay = 1000;
    const poll = async () => {
      try {
        const operation = await actions.extensionOperationStatus(
          pendingInstall.operationId,
        );
        if (cancelled) return;
        retryDelay = 1000;
        if (operation.status === 'waiting_for_input') {
          if (operation.interaction) {
            showInteraction(
              operation.operationId,
              operation.interaction,
              'install',
            );
            timer = setTimeout(() => void poll(), 5000);
          } else {
            setMessageTone('error');
            setMessage(t('extensions.manage.operationFailed'));
            clearInteraction(pendingInstall.operationId);
            setPendingInstall(null);
          }
          return;
        }
        if (operation.status === 'failed') {
          setMessageTone('error');
          setMessage(
            t('extensions.install.failed', {
              source: pendingInstall.source,
              error: operation.error ?? '',
            }),
          );
          clearInteraction(pendingInstall.operationId);
          setPendingInstall(null);
          return;
        }
        if (
          operation.status === 'succeeded' ||
          operation.status === 'succeeded_with_refresh_error'
        ) {
          setMessageTone(
            operation.status === 'succeeded_with_refresh_error'
              ? 'error'
              : 'success',
          );
          setMessage(
            operation.status === 'succeeded_with_refresh_error'
              ? t('extensions.manage.refreshFailed', {
                  error: operation.result?.error ?? '',
                })
              : t('extensions.install.installed', {
                  name: operation.result?.name ?? pendingInstall.source,
                }),
          );
          clearInteraction(pendingInstall.operationId);
          setPendingInstall(null);
          void load(true);
          return;
        }
        setMessageTone('progress');
        setMessage(
          t('extensions.install.started', {
            source: pendingInstall.source,
          }),
        );
        timer = setTimeout(() => void poll(), 1000);
      } catch (error) {
        if (cancelled) return;
        setMessageTone('error');
        setMessage(error instanceof Error ? error.message : String(error));
        if (error instanceof DaemonHttpError && error.status === 404) {
          clearInteraction(pendingInstall.operationId);
          setPendingInstall(null);
          return;
        }
        timer = setTimeout(() => void poll(), retryDelay);
        retryDelay = Math.min(retryDelay * 2, 30_000);
      }
    };
    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [actions, clearInteraction, load, pendingInstall, showInteraction, t]);
  const submitInteraction = useCallback(
    (response) => {
      if (!pendingInteraction) return;
      const owner = pendingInteraction.owner;
      const restartPolling = () => {
        if (owner === 'install') {
          setPendingInstall((current) => (current ? { ...current } : current));
        } else {
          setPendingMutation((current) => (current ? { ...current } : current));
        }
      };
      setSubmittingInteraction(true);
      actions
        .respondToExtensionInteraction(
          pendingInteraction.operationId,
          pendingInteraction.interaction.id,
          response,
          connection.clientId,
        )
        .then(() => {
          clearInteraction(pendingInteraction.operationId);
          restartPolling();
        })
        .catch((error) => {
          setMessageTone('error');
          setMessage(error instanceof Error ? error.message : String(error));
          clearInteraction(pendingInteraction.operationId);
          restartPolling();
        })
        .finally(() => setSubmittingInteraction(false));
    },
    [actions, clearInteraction, connection.clientId, pendingInteraction],
  );
  useEffect(() => {
    if (!pendingMutation) return;
    let cancelled = false;
    let timer;
    let retryDelay = 1000;
    const poll = async () => {
      try {
        const operation = await actions.extensionOperationStatus(
          pendingMutation.operationId,
        );
        if (cancelled) return;
        retryDelay = 1000;
        if (operation.status === 'waiting_for_input') {
          if (operation.interaction) {
            showInteraction(
              operation.operationId,
              operation.interaction,
              'mutation',
            );
            timer = setTimeout(() => void poll(), 5000);
          } else {
            setMessageTone('error');
            setMessage(t('extensions.manage.operationFailed'));
            clearInteraction(pendingMutation.operationId);
            setPendingMutation(null);
            setBusyName(null);
            mutationInFlightRef.current = false;
            if (pendingMutation.operation === 'uninstall') {
              uninstallInFlightNameRef.current = null;
              void load(true);
            }
          }
          return;
        }
        if (operation.status === 'failed') {
          setMessageTone('error');
          setMessage(operation.error ?? t('extensions.manage.operationFailed'));
          clearInteraction(pendingMutation.operationId);
          setPendingMutation(null);
          setBusyName(null);
          mutationInFlightRef.current = false;
          if (operation.operation === 'uninstall') {
            uninstallInFlightNameRef.current = null;
            void load(true);
          }
          return;
        }
        if (
          operation.status === 'succeeded' ||
          operation.status === 'succeeded_with_refresh_error'
        ) {
          if (operation.status === 'succeeded_with_refresh_error') {
            setMessageTone('error');
            setMessage(
              t('extensions.manage.refreshFailed', {
                error: operation.result?.error ?? '',
              }),
            );
          } else if (operation.operation === 'uninstall') {
            setMessage(null);
          } else {
            setMessageTone('success');
            setMessage(
              mutationSuccessMessage(
                operation.operation,
                pendingMutation.name,
                t,
              ),
            );
          }
          clearInteraction(pendingMutation.operationId);
          setPendingMutation(null);
          setBusyName(null);
          mutationInFlightRef.current = false;
          if (operation.operation === 'uninstall') {
            uninstallInFlightNameRef.current = null;
            setMessageOwner(null);
            setSelectedName(null);
          }
          if (operation.operation === 'update') {
            setUpdateStates((current) => {
              const next = { ...current };
              delete next[pendingMutation.name];
              return next;
            });
          }
          void load(true);
          return;
        }
        setMessageTone('progress');
        setMessage(
          mutationMessage(operation.operation, pendingMutation.name, t),
        );
        timer = setTimeout(() => void poll(), 1000);
      } catch (error) {
        if (cancelled) return;
        setMessageTone('error');
        setMessage(error instanceof Error ? error.message : String(error));
        if (error instanceof DaemonHttpError && error.status === 404) {
          clearInteraction(pendingMutation.operationId);
          setPendingMutation(null);
          setBusyName(null);
          mutationInFlightRef.current = false;
          if (pendingMutation.operation === 'uninstall') {
            uninstallInFlightNameRef.current = null;
            void load(true);
          }
          return;
        }
        timer = setTimeout(() => void poll(), retryDelay);
        retryDelay = Math.min(retryDelay * 2, 30_000);
      }
    };
    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [actions, clearInteraction, load, pendingMutation, showInteraction, t]);
  const refreshList = useCallback(() => {
    setMessageOwner(null);
    setMessageTone('info');
    setMessage(null);
    void load();
  }, [load]);
  const checkUpdates = useCallback(
    (name) => {
      setCheckingName(name);
      setMessageOwner(selectedName === name ? name : null);
      setMessageTone('info');
      setMessage(null);
      setUpdateStates((current) => ({
        ...current,
        [name]: 'checking for updates',
      }));
      actions
        .checkExtensionUpdates(connection.clientId)
        .then((result) => {
          setUpdateStates(result.states);
          setMessage(updateLabel(result.states[name], t));
        })
        .catch((error) => {
          setUpdateStates((current) => ({ ...current, [name]: 'error' }));
          setMessageTone('error');
          setMessage(error instanceof Error ? error.message : String(error));
        })
        .finally(() => setCheckingName(null));
    },
    [actions, connection.clientId, selectedName, t],
  );
  const installExtension = useCallback(() => {
    const source =
      installMethod === 'archive'
        ? installArchive
          ? `upload:${installArchive.name}`
          : ''
        : installSource.trim();
    const clientId = connection.clientId;
    if (
      !source ||
      (installMethod === 'archive' &&
        (!installArchive ||
          installArchive.size === 0 ||
          installArchive.size > MAX_EXTENSION_ARCHIVE_BYTES ||
          !isValidExtensionArchiveFilename(installArchive.name))) ||
      !operationsRecovered ||
      pendingInstall ||
      pendingMutation ||
      mutationInFlightRef.current
    )
      return;
    setInstalling(true);
    setMessageOwner(null);
    setMessageTone('progress');
    setMessage(null);
    const installingOperation =
      installMethod === 'archive'
        ? actions.installExtensionArchive(
            {
              archive: installArchive,
              filename: installArchive.name,
              consent: true,
            },
            clientId,
          )
        : actions.installExtension({ source, consent: true }, clientId);
    installingOperation
      .then((result) => {
        setPendingInstall({ operationId: result.operationId, source });
        setInstallSource('');
        setInstallArchive(null);
        if (archiveInputRef.current) archiveInputRef.current.value = '';
        setInstallMethod('source');
        setInstallOpen(false);
      })
      .catch((error) => {
        setMessageTone('error');
        setMessage(error instanceof Error ? error.message : String(error));
      })
      .finally(() => setInstalling(false));
  }, [
    actions,
    connection.clientId,
    installArchive,
    installMethod,
    installSource,
    operationsRecovered,
    pendingInstall,
    pendingMutation,
  ]);
  const runMutation = useCallback(
    (name, run, options = {}) => {
      const clientId = connection.clientId;
      if (
        !operationsRecovered ||
        pendingInstall ||
        pendingMutation ||
        checkingName ||
        mutationInFlightRef.current
      ) {
        return false;
      }
      mutationInFlightRef.current = true;
      if (options.operation === 'uninstall') {
        uninstallInFlightNameRef.current = name;
      }
      setBusyName(name);
      setMessageOwner(selectedName === name ? name : null);
      setMessageTone('progress');
      setMessage(options.startMessage ?? null);
      let startedPolling = false;
      run(clientId)
        .then((result) => {
          const operationId =
            result &&
            typeof result === 'object' &&
            'operationId' in result &&
            typeof result.operationId === 'string'
              ? result.operationId
              : undefined;
          if (operationId) {
            startedPolling = true;
            setPendingMutation({
              operationId,
              name,
              operation: options.operation,
            });
            return;
          }
          setMessage(t('extensions.manage.queued', { name }));
        })
        .catch((error) => {
          setMessageTone('error');
          setMessage(error instanceof Error ? error.message : String(error));
        })
        .finally(() => {
          if (!startedPolling) {
            mutationInFlightRef.current = false;
            setBusyName(null);
            if (options.operation === 'uninstall') {
              uninstallInFlightNameRef.current = null;
            }
            void load(true);
          }
        });
      return true;
    },
    [
      connection.clientId,
      checkingName,
      load,
      operationsRecovered,
      pendingInstall,
      pendingMutation,
      selectedName,
      t,
    ],
  );
  const setScopeActivation = useCallback(
    async (extension, scope, activation) => {
      if (
        busyName ||
        pendingInstall ||
        pendingMutation ||
        checkingName ||
        !workspace.workspaceCwd
      ) {
        return;
      }
      const operation =
        activation === 'enabled'
          ? 'enable'
          : activation === 'disabled'
            ? 'disable'
            : 'inherit';
      setBusyName(extension.name);
      setMessageOwner(extension.name);
      setMessageTone('progress');
      setMessage(
        operation === 'inherit'
          ? t('extensions.manage.inheriting', { name: extension.name })
          : mutationMessage(operation, extension.name, t),
      );
      try {
        const result =
          scope === 'user'
            ? await workspace.client.setExtensionDefaultActivation(
                extension.id,
                activation,
              )
            : activation === 'inherit'
              ? await workspace.client
                  .workspaceByCwd(workspace.workspaceCwd)
                  .clearExtensionActivation(extension.id)
              : await workspace.client
                  .workspaceByCwd(workspace.workspaceCwd)
                  .setExtensionActivation(extension.id, activation);
        const completed =
          await workspace.client.waitForExtensionOperation(result);
        if (completed.status === 'failed') {
          throw new Error(
            completed.error ?? t('extensions.manage.operationFailed'),
          );
        }
        await load(true);
        setMessageTone('success');
        setMessage(
          operation === 'inherit'
            ? t('extensions.manage.inherited', { name: extension.name })
            : mutationSuccessMessage(operation, extension.name, t),
        );
      } catch (error) {
        setMessageTone('error');
        setMessage(error instanceof Error ? error.message : String(error));
      } finally {
        setBusyName(null);
      }
    },
    [
      busyName,
      checkingName,
      load,
      pendingInstall,
      pendingMutation,
      t,
      workspace.client,
      workspace.workspaceCwd,
    ],
  );
  const selectedExtension = useMemo(
    () => extensions.find((extension) => extension.name === selectedName),
    [extensions, selectedName],
  );
  useEffect(() => {
    embedded?.onDetailChange(Boolean(selectedExtension));
  }, [embedded, selectedExtension]);
  const filteredExtensions = useMemo(
    () => filterExtensions(extensions, query),
    [extensions, query],
  );
  const archiveTooLarge =
    installArchive !== null &&
    installArchive.size > MAX_EXTENSION_ARCHIVE_BYTES;
  const archiveEmpty = installArchive !== null && installArchive.size === 0;
  const archiveInvalid =
    installArchive !== null &&
    !isValidExtensionArchiveFilename(installArchive.name);
  const installInputReady =
    installMethod === 'archive'
      ? installArchive !== null &&
        !archiveTooLarge &&
        !archiveEmpty &&
        !archiveInvalid
      : Boolean(installSource.trim());
  const returnToList = useCallback(() => {
    returnFocusNameRef.current = selectedName;
    setSelectedName(null);
  }, [selectedName]);
  useEffect(() => {
    if (selectedName || !returnFocusNameRef.current) return;
    cardRefs.current.get(returnFocusNameRef.current)?.focus();
    returnFocusNameRef.current = null;
  }, [selectedName]);
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
          children: selectedExtension
            ? _jsx(BreadcrumbLink, {
                asChild: true,
                children: _jsx('button', {
                  type: 'button',
                  onClick: returnToList,
                  children: t('extensions.manage.title'),
                }),
              })
            : _jsx(BreadcrumbPage, { children: t('extensions.manage.title') }),
        }),
        selectedExtension ? _jsx(BreadcrumbSeparator, {}) : null,
        selectedExtension
          ? _jsx(BreadcrumbItem, {
              children: _jsx(BreadcrumbPage, {
                children: extensionTitle(selectedExtension),
              }),
            })
          : null,
      ],
    }),
  });
  const navigation = embedded
    ? selectedExtension
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
                    onClick: embedded.onRoot,
                    children: t('extensions.manage.title'),
                  }),
                }),
              }),
              _jsx(BreadcrumbSeparator, {}),
              _jsx(BreadcrumbItem, {
                children: _jsx(BreadcrumbPage, {
                  children: extensionTitle(selectedExtension),
                }),
              }),
            ],
          }),
        })
      : null
    : standaloneNavigation;
  if (selectedExtension) {
    const details = selectedExtension.details;
    const updateState =
      updateStates[selectedExtension.name] ?? selectedExtension.updateState;
    const busy =
      !operationsRecovered ||
      pendingInstall !== null ||
      busyName !== null ||
      pendingMutation !== null;
    const checking = checkingName === selectedExtension.name;
    const userActivation = selectedExtension.defaultActivation;
    const workspaceActivation = selectedExtension.workspaceActivation;
    const activationUnavailable =
      userActivation === undefined || workspaceActivation === undefined;
    const commands = details?.commands ?? [];
    const skills = details?.skills ?? [];
    const agents = details?.agents ?? [];
    const mcpServers = details?.mcpServers ?? [];
    const contextFiles = details?.contextFiles ?? [];
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
                  children: _jsx(PackageIcon, {}),
                }),
                _jsx('div', {
                  className: 'min-w-0 flex-1',
                  children: _jsxs('div', {
                    className: 'flex flex-wrap items-center gap-2',
                    children: [
                      _jsx('h1', {
                        className: 'break-words text-xl font-semibold',
                        children: extensionTitle(selectedExtension),
                      }),
                      _jsxs(Badge, {
                        variant: 'outline',
                        children: ['v', selectedExtension.version],
                      }),
                      _jsx(Badge, {
                        variant: 'secondary',
                        className: extensionIsActive(selectedExtension)
                          ? 'bg-[var(--success-bg)] text-[var(--success-color)]'
                          : undefined,
                        children: statusLabel(selectedExtension, t),
                      }),
                    ],
                  }),
                }),
                _jsxs(DropdownMenu, {
                  open: actionsOpen,
                  onOpenChange: setActionsOpen,
                  children: [
                    _jsx(DropdownMenuTrigger, {
                      asChild: true,
                      children: _jsx(Button, {
                        variant: 'ghost',
                        size: 'icon',
                        disabled: busy || checking,
                        'aria-label': t('extensions.manage.actions'),
                        children:
                          busy || checking
                            ? _jsx(Spinner, {})
                            : _jsx(EllipsisVerticalIcon, {}),
                      }),
                    }),
                    _jsxs(DropdownMenuContent, {
                      align: 'end',
                      children: [
                        _jsxs(DropdownMenuGroup, {
                          children: [
                            _jsx(DropdownMenuItem, {
                              disabled: busy || checkingName !== null,
                              onSelect: () =>
                                checkUpdates(selectedExtension.name),
                              children: t('extensions.manage.checkUpdates'),
                            }),
                            _jsx(DropdownMenuItem, {
                              disabled:
                                busy ||
                                checking ||
                                updateState !== UPDATE_AVAILABLE,
                              onSelect: () =>
                                runMutation(
                                  selectedExtension.name,
                                  (clientId) =>
                                    actions.updateExtension(
                                      selectedExtension.name,
                                      clientId,
                                    ),
                                  {
                                    operation: 'update',
                                    startMessage: mutationMessage(
                                      'update',
                                      selectedExtension.name,
                                      t,
                                    ),
                                  },
                                ),
                              children: t('extensions.manage.update'),
                            }),
                          ],
                        }),
                        _jsx(DropdownMenuSeparator, {}),
                        _jsx(DropdownMenuGroup, {
                          children: _jsx(DropdownMenuItem, {
                            variant: 'destructive',
                            disabled: busy || checking,
                            onSelect: (event) => {
                              event.preventDefault();
                              setActionsOpen(false);
                              setUninstallName(selectedExtension.name);
                            },
                            children: t('extensions.manage.uninstallAction'),
                          }),
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            messageOwner === selectedExtension.name && message
              ? _jsx(ManagementNotice, {
                  tone: messageTone,
                  noticeKey: message,
                  closeLabel: t('common.close'),
                  onDismiss: () => setMessage(null),
                  className: 'break-words',
                  children: message,
                })
              : null,
            activationUnavailable
              ? _jsxs(Alert, {
                  variant: 'destructive',
                  children: [
                    _jsx(AlertCircleIcon, {}),
                    _jsx(AlertDescription, {
                      children: t(
                        'extensions.manage.setting.unavailableDescription',
                      ),
                    }),
                  ],
                })
              : null,
            _jsx(Card, {
              className: 'gap-0 py-1',
              children: _jsxs(CardContent, {
                className: 'flex flex-col p-0',
                children: [
                  _jsxs('div', {
                    className:
                      'flex items-center justify-between gap-4 px-4 py-3',
                    children: [
                      _jsxs('div', {
                        className: 'min-w-0',
                        children: [
                          _jsx('p', {
                            className: 'font-medium',
                            children: t('extensions.manage.userSetting'),
                          }),
                          _jsx('p', {
                            className: 'text-sm text-muted-foreground',
                            children: t(
                              'extensions.manage.userSettingDescription',
                            ),
                          }),
                        ],
                      }),
                      _jsxs(Select, {
                        value: userActivation,
                        disabled: busy || checking || activationUnavailable,
                        onValueChange: (value) =>
                          void setScopeActivation(
                            selectedExtension,
                            'user',
                            value,
                          ),
                        children: [
                          _jsx(SelectTrigger, {
                            className: 'w-28 shrink-0',
                            children: _jsx(SelectValue, {
                              placeholder: t(
                                'extensions.manage.setting.unknown',
                              ),
                            }),
                          }),
                          _jsxs(SelectContent, {
                            children: [
                              _jsx(SelectItem, {
                                value: 'enabled',
                                children: t(
                                  'extensions.manage.setting.enabled',
                                ),
                              }),
                              _jsx(SelectItem, {
                                value: 'disabled',
                                children: t(
                                  'extensions.manage.setting.disabled',
                                ),
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  _jsx(Separator, {}),
                  _jsxs('div', {
                    className:
                      'flex items-center justify-between gap-4 px-4 py-3',
                    children: [
                      _jsxs('div', {
                        className: 'min-w-0',
                        children: [
                          _jsx('p', {
                            className: 'font-medium',
                            children: t('extensions.manage.workspaceSetting'),
                          }),
                          _jsx('p', {
                            className: 'text-sm text-muted-foreground',
                            children: t(
                              'extensions.manage.workspaceSettingDescription',
                            ),
                          }),
                        ],
                      }),
                      _jsxs(Select, {
                        value: workspaceActivation,
                        disabled: busy || checking || activationUnavailable,
                        onValueChange: (value) =>
                          void setScopeActivation(
                            selectedExtension,
                            'workspace',
                            value,
                          ),
                        children: [
                          _jsx(SelectTrigger, {
                            className: 'w-28 shrink-0',
                            children: _jsx(SelectValue, {
                              placeholder: t(
                                'extensions.manage.setting.unknown',
                              ),
                            }),
                          }),
                          _jsxs(SelectContent, {
                            children: [
                              _jsx(SelectItem, {
                                value: 'inherit',
                                children: t(
                                  'extensions.manage.setting.default',
                                ),
                              }),
                              _jsx(SelectItem, {
                                value: 'enabled',
                                children: t(
                                  'extensions.manage.setting.enabled',
                                ),
                              }),
                              _jsx(SelectItem, {
                                value: 'disabled',
                                children: t(
                                  'extensions.manage.setting.disabled',
                                ),
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            }),
            _jsxs(Tabs, {
              defaultValue: 'overview',
              children: [
                _jsxs(TabsList, {
                  className: 'max-w-full overflow-x-auto',
                  children: [
                    _jsx(TabsTrigger, {
                      value: 'overview',
                      children: t('extensions.manage.overview'),
                    }),
                    _jsxs(TabsTrigger, {
                      value: 'commands',
                      children: [
                        trimDialogLabel(t('extensions.manage.commands')),
                        ' ',
                        commands.length,
                      ],
                    }),
                    _jsxs(TabsTrigger, {
                      value: 'skills',
                      children: [
                        trimDialogLabel(t('extensions.manage.skills')),
                        ' ',
                        skills.length,
                      ],
                    }),
                    _jsxs(TabsTrigger, {
                      value: 'agents',
                      children: [
                        trimDialogLabel(t('extensions.manage.agents')),
                        ' ',
                        agents.length,
                      ],
                    }),
                    _jsxs(TabsTrigger, {
                      value: 'mcp',
                      children: [
                        trimDialogLabel(t('extensions.manage.mcpServers')),
                        ' ',
                        mcpServers.length,
                      ],
                    }),
                    _jsxs(TabsTrigger, {
                      value: 'context',
                      children: [
                        trimDialogLabel(t('extensions.manage.contextFiles')),
                        ' ',
                        contextFiles.length,
                      ],
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
                            children: t('extensions.manage.overview'),
                          }),
                          selectedExtension.description
                            ? _jsx(CardDescription, {
                                children: selectedExtension.description,
                              })
                            : null,
                        ],
                      }),
                      _jsxs(CardContent, {
                        className: 'grid gap-6 sm:grid-cols-2',
                        children: [
                          _jsx(DetailField, {
                            label: t('extensions.manage.name'),
                            value: selectedExtension.name,
                          }),
                          _jsx(DetailField, {
                            label: t('extensions.manage.version'),
                            value: selectedExtension.version,
                          }),
                          _jsx(DetailField, {
                            label: t('extensions.manage.status'),
                            value: statusLabel(selectedExtension, t),
                          }),
                          _jsx(DetailField, {
                            label: t('extensions.manage.source'),
                            value: selectedExtension.source ?? '-',
                          }),
                          _jsx(DetailField, {
                            label: t('extensions.manage.path'),
                            value: selectedExtension.path,
                          }),
                          _jsx(DetailField, {
                            label: t('extensions.manage.updateStatus'),
                            value: updateLabel(updateState, t),
                          }),
                          _jsx(DetailField, {
                            label: t('extensions.manage.installType'),
                            value: selectedExtension.installType ?? '-',
                          }),
                          _jsx(DetailField, {
                            label: t('extensions.manage.origin'),
                            value: selectedExtension.originSource ?? '-',
                          }),
                          _jsx(DetailField, {
                            label: t('extensions.manage.settings'),
                            value: (details?.settings ?? []).join(', ') || '-',
                          }),
                        ],
                      }),
                    ],
                  }),
                }),
                _jsx(TabsContent, {
                  value: 'commands',
                  className: 'pt-4',
                  children: _jsx(CapabilityList, {
                    items: commands,
                    empty: t('extensions.manage.emptyCommands'),
                    icon: CommandIcon,
                  }),
                }),
                _jsx(TabsContent, {
                  value: 'skills',
                  className: 'pt-4',
                  children: _jsx(CapabilityList, {
                    items: skills,
                    empty: t('extensions.manage.emptySkills'),
                    icon: SparklesIcon,
                  }),
                }),
                _jsx(TabsContent, {
                  value: 'agents',
                  className: 'pt-4',
                  children: _jsx(CapabilityList, {
                    items: agents,
                    empty: t('extensions.manage.emptyAgents'),
                    icon: BotIcon,
                  }),
                }),
                _jsx(TabsContent, {
                  value: 'mcp',
                  className: 'pt-4',
                  children: _jsx(CapabilityList, {
                    items: mcpServers,
                    empty: t('extensions.manage.emptyMcpServers'),
                    icon: ServerIcon,
                  }),
                }),
                _jsx(TabsContent, {
                  value: 'context',
                  className: 'pt-4',
                  children: _jsx(CapabilityList, {
                    items: contextFiles,
                    empty: t('extensions.manage.emptyContextFiles'),
                    icon: FileTextIcon,
                  }),
                }),
              ],
            }),
          ],
        }),
        _jsx(AlertDialog, {
          open: uninstallName === selectedExtension.name,
          onOpenChange: (open) => {
            if (!open) setUninstallName(null);
          },
          children: _jsxs(AlertDialogContent, {
            children: [
              _jsxs(AlertDialogHeader, {
                className: 'place-items-start text-left',
                children: [
                  _jsx(AlertDialogTitle, {
                    children: t('extensions.manage.uninstallAction'),
                  }),
                  _jsx(AlertDialogDescription, {
                    children: t('extensions.manage.uninstallConfirm', {
                      name: selectedExtension.name,
                    }),
                  }),
                ],
              }),
              _jsxs(AlertDialogFooter, {
                children: [
                  _jsx(AlertDialogCancel, { children: t('common.cancel') }),
                  _jsx(AlertDialogAction, {
                    variant: 'destructive',
                    onClick: () => {
                      if (!uninstallName) return;
                      if (
                        runMutation(
                          uninstallName,
                          (clientId) =>
                            actions.uninstallExtension(uninstallName, clientId),
                          {
                            operation: 'uninstall',
                            startMessage: mutationMessage(
                              'uninstall',
                              uninstallName,
                              t,
                            ),
                          },
                        )
                      ) {
                        setUninstallName(null);
                      }
                    },
                    children: t('extensions.manage.uninstallAction'),
                  }),
                ],
              }),
            ],
          }),
        }),
        _jsx(ExtensionInteractionDialog, {
          pendingInteraction: pendingInteraction,
          submitting: submittingInteraction,
          selectedPlugin: selectedPlugin,
          interactionValue: interactionValue,
          setSelectedPlugin: setSelectedPlugin,
          setInteractionValue: setInteractionValue,
          submit: submitInteraction,
          t: t,
        }),
      ],
    });
  }
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
                    ref: initialFocusRef,
                    tabIndex: -1,
                    className: 'text-xl font-semibold outline-none',
                    children: t('extensions.manage.title'),
                  }),
                  _jsx('p', {
                    className: 'mt-1 text-sm text-muted-foreground',
                    children: t('extensions.manage.count', {
                      count: extensions.length,
                    }),
                  }),
                ],
              }),
              _jsxs('div', {
                className: 'flex shrink-0 items-center gap-2',
                children: [
                  _jsxs(Button, {
                    variant: 'outline',
                    disabled: loading,
                    onClick: refreshList,
                    children: [
                      loading
                        ? _jsx(Spinner, {})
                        : _jsx(RefreshCwIcon, { 'data-icon': 'inline-start' }),
                      t('common.refresh'),
                    ],
                  }),
                  _jsxs(Button, {
                    disabled:
                      !operationsRecovered ||
                      Boolean(pendingInstall || pendingMutation || busyName),
                    onClick: () => setInstallOpen(true),
                    children: [
                      _jsx(PlusIcon, { 'data-icon': 'inline-start' }),
                      t('extensions.manage.add'),
                    ],
                  }),
                ],
              }),
            ],
          }),
          (messageOwner === null && message) || recoveryError
            ? _jsx(ManagementNotice, {
                tone: recoveryError ? 'error' : messageTone,
                noticeKey:
                  (messageOwner === null ? message : null) ??
                  recoveryError ??
                  '',
                closeLabel: t('common.close'),
                onDismiss: () => {
                  setMessage(null);
                  setRecoveryError(null);
                },
                className: 'break-words',
                children:
                  (messageOwner === null ? message : null) ?? recoveryError,
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
                name: 'extension-search',
                'aria-label': t('extensions.manage.search'),
                autoComplete: 'off',
                value: query,
                onChange: (event) => setQuery(event.target.value),
                placeholder: t('extensions.manage.search'),
                className: 'pl-9',
              }),
            ],
          }),
          filteredExtensions.length
            ? _jsx('div', {
                className: styles.extensionGrid,
                'data-column-count': Math.min(filteredExtensions.length, 4),
                children: filteredExtensions.map((extension) => {
                  const state =
                    updateStates[extension.name] ?? extension.updateState;
                  return _jsx(
                    Card,
                    {
                      ref: (node) => {
                        if (node) cardRefs.current.set(extension.name, node);
                        else cardRefs.current.delete(extension.name);
                      },
                      size: 'sm',
                      role: 'button',
                      tabIndex: 0,
                      'aria-label': extensionTitle(extension),
                      className:
                        'cursor-pointer transition-colors hover:bg-accent/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                      onClick: () => setSelectedName(extension.name),
                      onKeyDown: (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedName(extension.name);
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
                              children: _jsx(PackageIcon, {
                                className: 'size-5',
                              }),
                            }),
                            _jsxs('div', {
                              className: 'min-w-0 flex-1',
                              children: [
                                _jsxs('div', {
                                  className:
                                    'flex min-w-0 items-start justify-between gap-2',
                                  children: [
                                    _jsx(CardTitle, {
                                      className: 'min-w-0 truncate',
                                      children: extensionTitle(extension),
                                    }),
                                    _jsx('div', {
                                      className: 'flex shrink-0 justify-end',
                                      children: _jsx(Badge, {
                                        variant: 'secondary',
                                        className: extensionIsActive(extension)
                                          ? 'bg-[var(--success-bg)] text-[10px] text-[var(--success-color)]'
                                          : 'text-[10px]',
                                        children: statusLabel(extension, t),
                                      }),
                                    }),
                                  ],
                                }),
                                state === UPDATE_AVAILABLE
                                  ? _jsx('div', {
                                      className: 'mt-1',
                                      children: _jsx(Badge, {
                                        className: 'text-[10px]',
                                        children: updateLabel(state, t),
                                      }),
                                    })
                                  : null,
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
                                            children:
                                              extension.description ||
                                              t(
                                                'extensions.manage.noDescription',
                                              ),
                                          }),
                                        }),
                                        _jsx(TooltipContent, {
                                          children:
                                            extension.description ||
                                            t(
                                              'extensions.manage.noDescription',
                                            ),
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
                    extension.id || extension.name,
                  );
                }),
              })
            : _jsx(Empty, {
                className: 'border',
                children: _jsxs(EmptyHeader, {
                  children: [
                    _jsx(EmptyMedia, {
                      variant: 'icon',
                      children: query
                        ? _jsx(SearchIcon, {})
                        : _jsx(BoxIcon, {}),
                    }),
                    _jsx(EmptyTitle, {
                      children: query
                        ? t('extensions.manage.noMatches')
                        : t('extensions.manage.empty'),
                    }),
                    !query
                      ? _jsx(EmptyDescription, {
                          children: t('extensions.manage.emptyDescription'),
                        })
                      : null,
                  ],
                }),
              }),
        ],
      }),
      _jsx(AlertDialog, {
        open: installOpen,
        onOpenChange: (open) => {
          if (open || !installing) {
            setInstallOpen(open);
            if (!open) {
              setInstallMethod('source');
              setInstallArchive(null);
              if (archiveInputRef.current) archiveInputRef.current.value = '';
            }
          }
        },
        children: _jsxs(AlertDialogContent, {
          size: 'middle',
          children: [
            _jsxs(AlertDialogHeader, {
              className: 'place-items-start text-left',
              children: [
                _jsx(AlertDialogTitle, {
                  children: t('extensions.manage.installTitle'),
                }),
                _jsx(AlertDialogDescription, {
                  children: t('extensions.manage.installDescription'),
                }),
              ],
            }),
            _jsxs(Tabs, {
              value: installMethod,
              onValueChange: (value) => setInstallMethod(value),
              children: [
                _jsxs(TabsList, {
                  className: 'grid w-full grid-cols-2',
                  children: [
                    _jsx(TabsTrigger, {
                      value: 'source',
                      disabled: installing,
                      children: t('extensions.manage.sourceTab'),
                    }),
                    _jsx(TabsTrigger, {
                      value: 'archive',
                      disabled: installing,
                      children: t('extensions.manage.archiveTab'),
                    }),
                  ],
                }),
                _jsx(TabsContent, {
                  value: 'source',
                  className: 'pt-3',
                  children: _jsx(Input, {
                    id: 'extension-source',
                    name: 'extension-source',
                    'aria-label': t('extensions.manage.sourceTab'),
                    autoComplete: 'off',
                    value: installSource,
                    onChange: (event) => setInstallSource(event.target.value),
                    placeholder: t('extensions.manage.sourcePlaceholder'),
                  }),
                }),
                _jsx(TabsContent, {
                  value: 'archive',
                  className: 'pt-3',
                  children: _jsxs('div', {
                    className: 'grid gap-2',
                    children: [
                      _jsx(Input, {
                        ref: archiveInputRef,
                        id: 'extension-archive',
                        name: 'extension-archive',
                        'aria-label': t('extensions.manage.archiveSelect'),
                        type: 'file',
                        accept: '.zip,.tar.gz,application/zip,application/gzip',
                        disabled: installing,
                        onChange: (event) =>
                          setInstallArchive(event.target.files?.[0] ?? null),
                      }),
                      installArchive
                        ? _jsx('div', {
                            className: 'text-xs text-muted-foreground',
                            children: t('extensions.manage.archiveSelected', {
                              name: installArchive.name,
                            }),
                          })
                        : null,
                      archiveTooLarge
                        ? _jsxs(Alert, {
                            variant: 'destructive',
                            children: [
                              _jsx(AlertCircleIcon, {}),
                              _jsx(AlertDescription, {
                                children: t(
                                  'extensions.manage.archiveTooLarge',
                                ),
                              }),
                            ],
                          })
                        : null,
                      archiveEmpty
                        ? _jsxs(Alert, {
                            variant: 'destructive',
                            children: [
                              _jsx(AlertCircleIcon, {}),
                              _jsx(AlertDescription, {
                                children: t('extensions.manage.archiveEmpty'),
                              }),
                            ],
                          })
                        : null,
                      archiveInvalid
                        ? _jsxs(Alert, {
                            variant: 'destructive',
                            children: [
                              _jsx(AlertCircleIcon, {}),
                              _jsx(AlertDescription, {
                                children: t('extensions.manage.archiveInvalid'),
                              }),
                            ],
                          })
                        : null,
                    ],
                  }),
                }),
              ],
            }),
            _jsxs(AlertDialogFooter, {
              children: [
                _jsx(AlertDialogCancel, {
                  disabled: installing,
                  children: t('common.cancel'),
                }),
                _jsxs(Button, {
                  disabled:
                    installing ||
                    !operationsRecovered ||
                    Boolean(pendingInstall || pendingMutation || busyName) ||
                    !installInputReady,
                  onClick: installExtension,
                  children: [
                    installing ? _jsx(Spinner, {}) : null,
                    t('extensions.manage.install'),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      _jsx(ExtensionInteractionDialog, {
        pendingInteraction: pendingInteraction,
        submitting: submittingInteraction,
        selectedPlugin: selectedPlugin,
        interactionValue: interactionValue,
        setSelectedPlugin: setSelectedPlugin,
        setInteractionValue: setInteractionValue,
        submit: submitInteraction,
        t: t,
      }),
    ],
  });
}
//# sourceMappingURL=ExtensionsManagerPage.js.map
