import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from 'react/jsx-runtime';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { useI18n } from '../i18n';
import { useLiveVoice } from './useLiveVoice';
import styles from './LiveVoiceButton.module.css';
const REQUIREMENTS = [
  ['host', 'live.requirement.host'],
  ['microphone', 'live.requirement.microphone'],
  ['accessibility', 'live.requirement.accessibility'],
  ['screenRecording', 'live.requirement.screenRecording'],
  ['audioInput', 'live.requirement.audioInput'],
  ['audioOutput', 'live.requirement.audioOutput'],
  ['globalShortcut', 'live.requirement.globalShortcut'],
  ['appshot', 'live.requirement.appshot'],
  ['provider', 'live.requirement.provider'],
];
function LiveIcon() {
  return _jsxs('svg', {
    width: '18',
    height: '18',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    'aria-hidden': 'true',
    children: [
      _jsx('path', { d: 'M4 13v-2' }),
      _jsx('path', { d: 'M8 16V8' }),
      _jsx('path', { d: 'M12 19V5' }),
      _jsx('path', { d: 'M16 16V8' }),
      _jsx('path', { d: 'M20 13v-2' }),
    ],
  });
}
function isActive(status) {
  return Boolean(
    status &&
      ['starting', 'listening', 'thinking', 'speaking', 'stopping'].includes(
        status.state,
      ),
  );
}
function stateLabel(state, t) {
  return t(`live.requirementState.${state ?? 'missing'}`);
}
function liveStateLabel(status, t) {
  if (status?.statusText) return status.statusText;
  return t(`live.state.${status?.state ?? 'unavailable'}`);
}
export function LiveVoiceButton() {
  const { t } = useI18n();
  const {
    supported,
    status,
    loading,
    mutating,
    refresh,
    start,
    stop,
    setMute,
  } = useLiveVoice();
  if (!supported) return null;
  const active = isActive(status);
  const busy = loading || mutating;
  const label = active ? t('live.manage') : t('live.open');
  const requirements = status?.requirements ?? {};
  return _jsxs(Dialog, {
    onOpenChange: (open) => {
      if (open) void refresh();
    },
    children: [
      _jsx(DialogTrigger, {
        asChild: true,
        children: _jsx('button', {
          type: 'button',
          className: styles.trigger,
          'aria-label': label,
          title: label,
          'data-active': active,
          'data-state': status?.state ?? 'unavailable',
          'data-available': status?.available === true,
          children: _jsx(LiveIcon, {}),
        }),
      }),
      _jsxs(DialogContent, {
        'data-web-shell-live-dialog': true,
        children: [
          _jsxs(DialogHeader, {
            children: [
              _jsx(DialogTitle, { children: t('live.title') }),
              _jsx(DialogDescription, {
                children: status?.available
                  ? t('live.readyDescription')
                  : t('live.setupDescription'),
              }),
            ],
          }),
          !status?.available
            ? _jsx('ul', {
                className: styles.requirements,
                children: REQUIREMENTS.map(([key, messageKey]) => {
                  const requirementState = requirements[key];
                  return _jsxs(
                    'li',
                    {
                      className: styles.requirement,
                      children: [
                        _jsx('span', { children: t(messageKey) }),
                        _jsxs('span', {
                          className: styles.requirementState,
                          children: [
                            _jsx('span', {
                              className: styles.dot,
                              'data-ready': requirementState === 'ready',
                              'data-denied': requirementState === 'denied',
                            }),
                            stateLabel(requirementState, t),
                          ],
                        }),
                      ],
                    },
                    key,
                  );
                }),
              })
            : _jsxs('div', {
                className: styles.liveState,
                'data-state': status.state,
                children: [
                  _jsx('span', { className: styles.liveStateOrb }),
                  _jsx('span', { children: liveStateLabel(status, t) }),
                ],
              }),
          status?.message
            ? _jsx('p', { className: styles.error, children: status.message })
            : null,
          status?.transcript
            ? _jsx('p', {
                className: styles.transcript,
                'data-role': 'user',
                children: status.transcript,
              })
            : null,
          status?.caption
            ? _jsx('p', {
                className: styles.transcript,
                'data-role': 'assistant',
                children: status.caption,
              })
            : null,
          status?.shortcut
            ? _jsx('p', {
                className: styles.hint,
                children: t('live.shortcutHint', { shortcut: status.shortcut }),
              })
            : null,
          !status?.available
            ? _jsx('p', {
                className: styles.hint,
                children: t('live.noFallback'),
              })
            : null,
          _jsxs(DialogFooter, {
            children: [
              !status?.available
                ? _jsx(Button, {
                    variant: 'outline',
                    disabled: busy,
                    onClick: () => refresh(),
                    children: t('live.refresh'),
                  })
                : null,
              active
                ? _jsxs(_Fragment, {
                    children: [
                      _jsx(Button, {
                        variant: 'outline',
                        disabled: busy,
                        onClick: () =>
                          setMute({ inputMuted: !status?.inputMuted }),
                        children: status?.inputMuted
                          ? t('live.unmuteInput')
                          : t('live.muteInput'),
                      }),
                      _jsx(Button, {
                        variant: 'outline',
                        disabled: busy,
                        onClick: () =>
                          setMute({ outputMuted: !status?.outputMuted }),
                        children: status?.outputMuted
                          ? t('live.unmuteOutput')
                          : t('live.muteOutput'),
                      }),
                      _jsx(Button, {
                        variant: 'destructive',
                        disabled: busy,
                        onClick: () => stop(),
                        children: t('live.stop'),
                      }),
                    ],
                  })
                : _jsxs(_Fragment, {
                    children: [
                      _jsx(Button, {
                        variant: 'outline',
                        disabled: !status?.available || busy,
                        onClick: () => start('new'),
                        children: t('live.newConversation'),
                      }),
                      _jsx(Button, {
                        disabled: !status?.available || busy,
                        onClick: () => start('resume'),
                        children: t('live.startOrResume'),
                      }),
                    ],
                  }),
            ],
          }),
        ],
      }),
    ],
  });
}
//# sourceMappingURL=LiveVoiceButton.js.map
