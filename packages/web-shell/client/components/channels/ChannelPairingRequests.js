import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useId, useRef, useState } from 'react';
import {
  AlertCircleIcon,
  CheckIcon,
  InfoIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UsersRoundIcon,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
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
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import styles from './ChannelPairingRequests.module.css';
function senderLabel(request) {
  return request.senderName.trim() || request.senderId;
}
function requestSubject(request) {
  return (
    request.subject ?? {
      type: 'user',
      id: request.senderId,
      name: request.senderName,
    }
  );
}
function targetKey(target) {
  return `${target.type}:${target.id}`;
}
function errorCode(error) {
  if (!error || typeof error !== 'object') return undefined;
  const body = error.body;
  if (!body || typeof body !== 'object') return undefined;
  const code = body.code;
  return typeof code === 'string' ? code : undefined;
}
function pairingErrorDetail(error, unavailable) {
  if (!error || typeof error !== 'object' || !('status' in error)) {
    return unavailable;
  }
  const body = error.body;
  const message = body && typeof body === 'object' ? body.error : undefined;
  return typeof message === 'string' && message ? message : unavailable;
}
export function ChannelPairingRequests({
  channelName,
  listRequests,
  approveRequest,
  listApprovals,
  revokeApproval,
  staticAllowedUsers = [],
}) {
  const { t } = useI18n();
  const headingId = useId();
  const approvalsHeadingId = useId();
  const mounted = useRef(false);
  const currentChannelName = useRef(channelName);
  currentChannelName.current = channelName;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [approvingCode, setApprovingCode] = useState();
  const [error, setError] = useState();
  const [success, setSuccess] = useState();
  const [approvedSenderIds, setApprovedSenderIds] = useState([]);
  const [approvedGroupIds, setApprovedGroupIds] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(true);
  const [approvalsReloadToken, setApprovalsReloadToken] = useState(0);
  const [approvalsError, setApprovalsError] = useState();
  const [revokeSuccess, setRevokeSuccess] = useState();
  const [revokeTarget, setRevokeTarget] = useState();
  const [revokingTarget, setRevokingTarget] = useState();
  const approvalLabel = (target) =>
    target.type === 'group'
      ? t('channels.editor.pairing.subject.group', { name: target.id })
      : target.id;
  const approvedTargets = [
    ...approvedSenderIds.map((id) => ({ type: 'user', id })),
    ...approvedGroupIds.map((id) => ({ type: 'group', id })),
  ];
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setRequests([]);
    setError(undefined);
    setSuccess(undefined);
    setApprovingCode(undefined);
    void listRequests(channelName).then(
      (snapshot) => {
        if (!active) return;
        setRequests(snapshot.requests);
        setLoading(false);
      },
      (loadError) => {
        if (!active) return;
        setError(
          pairingErrorDetail(
            loadError,
            t('channels.editor.pairing.unavailable'),
          ),
        );
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, [channelName, listRequests, reloadToken, t]);
  useEffect(() => {
    let active = true;
    setApprovalsLoading(true);
    setApprovedSenderIds([]);
    setApprovedGroupIds([]);
    setApprovalsError(undefined);
    setRevokeSuccess(undefined);
    setRevokeTarget(undefined);
    setRevokingTarget(undefined);
    void listApprovals(channelName).then(
      (snapshot) => {
        if (!active) return;
        setApprovedSenderIds(snapshot.senderIds);
        setApprovedGroupIds(snapshot.groupIds ?? []);
        setApprovalsLoading(false);
      },
      (loadError) => {
        if (!active) return;
        setApprovalsError(
          pairingErrorDetail(
            loadError,
            t('channels.editor.pairing.approvals.unavailable'),
          ),
        );
        setApprovalsLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, [approvalsReloadToken, channelName, listApprovals, t]);
  const approve = async (request) => {
    if (approvingCode) return;
    const approvalChannel = channelName;
    setApprovingCode(request.code);
    setError(undefined);
    setSuccess(undefined);
    setRevokeSuccess(undefined);
    try {
      const result = await approveRequest(channelName, request.code);
      if (!mounted.current || currentChannelName.current !== approvalChannel) {
        return;
      }
      setRequests(result.requests);
      const subject = requestSubject(result.approved);
      setSuccess(
        t('channels.editor.pairing.approved', {
          sender:
            subject.type === 'group'
              ? t('channels.editor.pairing.subject.group', {
                  name: subject.name.trim() || subject.id,
                })
              : subject.name.trim() || subject.id,
        }),
      );
      setApprovalsReloadToken((current) => current + 1);
    } catch (approvalError) {
      if (!mounted.current || currentChannelName.current !== approvalChannel) {
        return;
      }
      if (errorCode(approvalError) === 'channel_pairing_request_not_found') {
        try {
          const snapshot = await listRequests(approvalChannel);
          if (
            mounted.current &&
            currentChannelName.current === approvalChannel
          ) {
            setRequests(snapshot.requests);
          }
        } catch (refreshError) {
          if (
            mounted.current &&
            currentChannelName.current === approvalChannel
          ) {
            setError(
              pairingErrorDetail(
                refreshError,
                t('channels.editor.pairing.unavailable'),
              ),
            );
          }
          return;
        }
      }
      if (!mounted.current || currentChannelName.current !== approvalChannel) {
        return;
      }
      setError(
        pairingErrorDetail(
          approvalError,
          t('channels.editor.pairing.unavailable'),
        ),
      );
    } finally {
      if (mounted.current && currentChannelName.current === approvalChannel) {
        setApprovingCode(undefined);
      }
    }
  };
  const revoke = async (target) => {
    if (revokingTarget) return;
    const revokeChannel = channelName;
    const key = targetKey(target);
    const label = approvalLabel(target);
    setRevokeTarget(undefined);
    setRevokingTarget(key);
    setApprovalsError(undefined);
    setRevokeSuccess(undefined);
    setSuccess(undefined);
    try {
      const result = await revokeApproval(
        channelName,
        target.type === 'group'
          ? { groupId: target.id }
          : { senderId: target.id },
      );
      if (!mounted.current || currentChannelName.current !== revokeChannel) {
        return;
      }
      setApprovedSenderIds(result.senderIds);
      setApprovedGroupIds(result.groupIds ?? []);
      setRevokeSuccess(
        t('channels.editor.pairing.approvals.revoked', { senderId: label }),
      );
    } catch (revokeError) {
      if (!mounted.current || currentChannelName.current !== revokeChannel) {
        return;
      }
      if (errorCode(revokeError) === 'channel_pairing_approval_not_found') {
        try {
          const snapshot = await listApprovals(revokeChannel);
          if (mounted.current && currentChannelName.current === revokeChannel) {
            setApprovedSenderIds(snapshot.senderIds);
            setApprovedGroupIds(snapshot.groupIds ?? []);
          }
          return;
        } catch (refreshError) {
          if (mounted.current && currentChannelName.current === revokeChannel) {
            setApprovalsError(
              pairingErrorDetail(
                refreshError,
                t('channels.editor.pairing.approvals.unavailable'),
              ),
            );
          }
          return;
        }
      }
      if (!mounted.current || currentChannelName.current !== revokeChannel) {
        return;
      }
      setApprovalsError(
        pairingErrorDetail(
          revokeError,
          t('channels.editor.pairing.approvals.unavailable'),
        ),
      );
    } finally {
      if (mounted.current && currentChannelName.current === revokeChannel) {
        setRevokingTarget(undefined);
      }
    }
  };
  return _jsxs('section', {
    className: styles.panel,
    'aria-labelledby': headingId,
    children: [
      _jsxs('div', {
        className: styles.header,
        children: [
          _jsxs('div', {
            children: [
              _jsx('h4', {
                id: headingId,
                className: styles.title,
                children: t('channels.editor.pairing.title'),
              }),
              _jsx('p', {
                className: styles.description,
                children: t('channels.editor.pairing.description'),
              }),
            ],
          }),
          _jsxs('div', {
            className: styles.headerActions,
            children: [
              _jsx(Badge, { variant: 'outline', children: requests.length }),
              _jsx(Button, {
                type: 'button',
                size: 'icon-sm',
                variant: 'ghost',
                disabled: loading || Boolean(approvingCode),
                'aria-label': t('channels.editor.pairing.refresh'),
                onClick: () => {
                  setSuccess(undefined);
                  setReloadToken((current) => current + 1);
                },
                children: loading ? _jsx(Spinner, {}) : _jsx(RefreshCwIcon, {}),
              }),
            ],
          }),
        ],
      }),
      error
        ? _jsxs(Alert, {
            variant: 'destructive',
            children: [
              _jsx(AlertCircleIcon, {}),
              _jsx(AlertTitle, {
                children: t('channels.editor.pairing.error'),
              }),
              _jsx(AlertDescription, { children: error }),
              _jsx(Button, {
                className: 'mt-2 w-fit',
                type: 'button',
                size: 'sm',
                variant: 'outline',
                disabled: loading,
                onClick: () => setReloadToken((current) => current + 1),
                children: t('channels.editor.pairing.retry'),
              }),
            ],
          })
        : null,
      success
        ? _jsxs('div', {
            role: 'status',
            className: styles.success,
            children: [_jsx(CheckIcon, {}), success],
          })
        : null,
      !loading && !error && requests.length === 0
        ? _jsxs('div', {
            className: styles.empty,
            children: [
              _jsx(UsersRoundIcon, { 'aria-hidden': 'true' }),
              _jsxs('div', {
                children: [
                  _jsx('p', {
                    className: styles.emptyTitle,
                    children: t('channels.editor.pairing.empty.title'),
                  }),
                  _jsx('p', {
                    className: styles.emptyDescription,
                    children: t('channels.editor.pairing.empty.description'),
                  }),
                ],
              }),
            ],
          })
        : null,
      requests.length > 0
        ? _jsx('ul', {
            className: styles.list,
            children: requests.map((request) => {
              const subject = requestSubject(request);
              const label =
                subject.type === 'group'
                  ? t('channels.editor.pairing.subject.group', {
                      name: subject.name.trim() || subject.id,
                    })
                  : subject.name.trim() || subject.id;
              return _jsxs(
                'li',
                {
                  className: styles.request,
                  children: [
                    _jsxs('div', {
                      className: styles.requestIdentity,
                      children: [
                        _jsx('span', {
                          className: styles.senderName,
                          children: label,
                        }),
                        label !== subject.id
                          ? _jsx('span', {
                              className: styles.senderId,
                              children: subject.id,
                            })
                          : null,
                        subject.type === 'group'
                          ? _jsx('span', {
                              className: styles.senderId,
                              children: t(
                                'channels.editor.pairing.requestedBy',
                                {
                                  sender: senderLabel(request),
                                },
                              ),
                            })
                          : null,
                        _jsx('span', {
                          className: styles.requestTime,
                          children: formatRelativeTime(
                            new Date(request.createdAt).toISOString(),
                            t,
                          ),
                        }),
                      ],
                    }),
                    _jsx('code', {
                      className: styles.code,
                      children: request.code,
                    }),
                    _jsxs(Button, {
                      type: 'button',
                      size: 'sm',
                      disabled:
                        Boolean(approvingCode) || Boolean(revokingTarget),
                      'aria-label': t('channels.editor.pairing.approveFor', {
                        sender: label,
                        code: request.code,
                      }),
                      onClick: () => void approve(request),
                      children: [
                        approvingCode === request.code
                          ? _jsx(Spinner, {})
                          : null,
                        t('channels.editor.pairing.approve'),
                      ],
                    }),
                  ],
                },
                request.code,
              );
            }),
          })
        : null,
      _jsxs('section', {
        'aria-labelledby': approvalsHeadingId,
        children: [
          _jsx('div', { className: styles.divider }),
          _jsxs('div', {
            className: styles.header,
            children: [
              _jsxs('div', {
                children: [
                  _jsx('h4', {
                    id: approvalsHeadingId,
                    className: styles.title,
                    children: t('channels.editor.pairing.approvals.title'),
                  }),
                  _jsx('p', {
                    className: styles.description,
                    children: t(
                      'channels.editor.pairing.approvals.description',
                    ),
                  }),
                ],
              }),
              _jsxs('div', {
                className: styles.headerActions,
                children: [
                  _jsx(Badge, {
                    variant: 'outline',
                    children: approvedTargets.length,
                  }),
                  _jsx(Button, {
                    type: 'button',
                    size: 'icon-sm',
                    variant: 'ghost',
                    disabled: approvalsLoading || Boolean(revokingTarget),
                    'aria-label': t(
                      'channels.editor.pairing.approvals.refresh',
                    ),
                    onClick: () => {
                      setRevokeSuccess(undefined);
                      setApprovalsReloadToken((current) => current + 1);
                    },
                    children: approvalsLoading
                      ? _jsx(Spinner, {})
                      : _jsx(RefreshCwIcon, {}),
                  }),
                ],
              }),
            ],
          }),
          approvalsError
            ? _jsxs(Alert, {
                variant: 'destructive',
                children: [
                  _jsx(AlertCircleIcon, {}),
                  _jsx(AlertTitle, {
                    children: t('channels.editor.pairing.approvals.error'),
                  }),
                  _jsx(AlertDescription, { children: approvalsError }),
                  _jsx(Button, {
                    className: 'mt-2 w-fit',
                    type: 'button',
                    size: 'sm',
                    variant: 'outline',
                    disabled: approvalsLoading,
                    onClick: () =>
                      setApprovalsReloadToken((current) => current + 1),
                    children: t('channels.editor.pairing.retry'),
                  }),
                ],
              })
            : null,
          revokeSuccess
            ? _jsxs('div', {
                role: 'status',
                className: styles.success,
                children: [_jsx(CheckIcon, {}), revokeSuccess],
              })
            : null,
          !approvalsLoading && !approvalsError && approvedTargets.length === 0
            ? _jsxs('div', {
                className: styles.empty,
                children: [
                  _jsx(ShieldCheckIcon, { 'aria-hidden': 'true' }),
                  _jsxs('div', {
                    children: [
                      _jsx('p', {
                        className: styles.emptyTitle,
                        children: t(
                          'channels.editor.pairing.approvals.empty.title',
                        ),
                      }),
                      _jsx('p', {
                        className: styles.emptyDescription,
                        children: t(
                          'channels.editor.pairing.approvals.empty.description',
                        ),
                      }),
                    ],
                  }),
                ],
              })
            : null,
          approvedTargets.length > 0
            ? _jsx('ul', {
                className: styles.list,
                children: approvedTargets.map((target) => {
                  const label = approvalLabel(target);
                  const key = targetKey(target);
                  return _jsxs(
                    'li',
                    {
                      className: styles.approval,
                      children: [
                        _jsxs('div', {
                          className: styles.approvalIdentity,
                          children: [
                            _jsx(ShieldCheckIcon, { 'aria-hidden': 'true' }),
                            _jsx('code', {
                              className: styles.approvalSenderId,
                              children: label,
                            }),
                          ],
                        }),
                        _jsxs(Button, {
                          type: 'button',
                          size: 'sm',
                          variant: 'destructive',
                          disabled:
                            Boolean(revokingTarget) || Boolean(approvingCode),
                          'aria-label': t(
                            'channels.editor.pairing.approvals.revokeFor',
                            { senderId: label },
                          ),
                          onClick: () => setRevokeTarget(target),
                          children: [
                            revokingTarget === key
                              ? _jsx(Spinner, {})
                              : _jsx(Trash2Icon, {}),
                            t('channels.editor.pairing.approvals.revoke'),
                          ],
                        }),
                      ],
                    },
                    key,
                  );
                }),
              })
            : null,
          staticAllowedUsers.length > 0
            ? _jsxs(Alert, {
                children: [
                  _jsx(InfoIcon, {}),
                  _jsx(AlertTitle, {
                    children: t('channels.editor.pairing.allowlist.title'),
                  }),
                  _jsxs(AlertDescription, {
                    children: [
                      _jsx('p', {
                        children: t(
                          'channels.editor.pairing.allowlist.description',
                        ),
                      }),
                      _jsx('code', {
                        className: styles.allowlist,
                        children: staticAllowedUsers.join(', '),
                      }),
                    ],
                  }),
                ],
              })
            : null,
        ],
      }),
      _jsx(AlertDialog, {
        open: Boolean(revokeTarget),
        onOpenChange: (open) => {
          if (!open) setRevokeTarget(undefined);
        },
        children: _jsxs(AlertDialogContent, {
          children: [
            _jsxs(AlertDialogHeader, {
              children: [
                _jsx(AlertDialogTitle, {
                  children: t(
                    'channels.editor.pairing.approvals.confirm.title',
                    {
                      senderId: revokeTarget ? approvalLabel(revokeTarget) : '',
                    },
                  ),
                }),
                _jsx(AlertDialogDescription, {
                  children: t(
                    'channels.editor.pairing.approvals.confirm.description',
                  ),
                }),
              ],
            }),
            _jsxs(AlertDialogFooter, {
              children: [
                _jsx(AlertDialogCancel, {
                  type: 'button',
                  children: t('channels.editor.cancel'),
                }),
                _jsx(AlertDialogAction, {
                  type: 'button',
                  variant: 'destructive',
                  onClick: () => {
                    if (revokeTarget) void revoke(revokeTarget);
                  },
                  children: t(
                    'channels.editor.pairing.approvals.confirm.action',
                  ),
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
}
//# sourceMappingURL=ChannelPairingRequests.js.map
