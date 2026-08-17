import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from 'react/jsx-runtime';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useConnection } from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../../i18n';
import { useListboxKeyboard } from '../../hooks/useListboxKeyboard';
import { dp } from './dialogStyles';
import styles from './ModelDialog.module.css';
function formatContextWindow(size, t) {
  return size
    ? `${size.toLocaleString()} ${t('contextUsage.tokens')}`
    : t('model.contextWindow.unknown');
}
function formatModalities(modalities, t) {
  if (!modalities) return t('model.modality.textOnly');
  const parts = [];
  if (modalities.image) parts.push(t('model.modality.image'));
  if (modalities.pdf) parts.push(t('model.modality.pdf'));
  if (modalities.audio) parts.push(t('model.modality.audio'));
  if (modalities.video) parts.push(t('model.modality.video'));
  if (parts.length === 0) return t('model.modality.textOnly');
  return `${t('model.modality.text')} · ${parts.join(' · ')}`;
}
function getAuthType(model) {
  if (model.authType) return model.authType;
  const match = model.id.match(/\(([^()]+)\)$/);
  return match?.[1];
}
function getModelName(model) {
  if (model.label) return model.label;
  if (model.baseModelId) return model.baseModelId;
  return model.id.replace(/\([^()]+\)$/, '');
}
function getModelKey(model) {
  return [
    model.authType ?? '',
    model.id,
    model.baseUrl ?? '',
    model.envKey ?? '',
  ].join('\0');
}
function getModelSelectId(model, isFastMode) {
  if (!isFastMode) return model.id;
  return model.baseModelId ?? model.id.replace(/\([^()]+\)$/, '');
}
function DetailRow({ label, value }) {
  return _jsxs('div', {
    className: styles.detailRow,
    children: [
      _jsx('span', { className: styles.detailLabel, children: label }),
      _jsx('span', { className: styles.detailValue, children: value }),
    ],
  });
}
export function ModelDialog({
  mode = 'main',
  onSelect,
  models,
  currentModelId,
}) {
  const connection = useConnection();
  const currentModel = currentModelId ?? connection.currentModel ?? '';
  const availableModels = useMemo(
    () => models ?? connection.models ?? [],
    [models, connection.models],
  );
  const { t } = useI18n();
  const listRef = useRef(null);
  const isFastMode = mode === 'fast';
  const isVoiceMode = mode === 'voice';
  const isVisionMode = mode === 'vision';
  const currentIdx = availableModels.findIndex((m) => m.id === currentModel);
  const [activeIndex, setActiveIndex] = useState(
    currentIdx >= 0 ? currentIdx : 0,
  );
  // Follow the current model until the user first navigates: models arrive
  // asynchronously, and the current model itself can change while the dialog
  // is open (e.g. another client sharing the session switches models) — the
  // highlight, detail panel and Enter must track it. Once the user has moved
  // the highlight themselves, it is theirs and must not be stolen.
  const userNavigatedRef = useRef(false);
  useEffect(() => {
    if (userNavigatedRef.current || availableModels.length === 0) return;
    setActiveIndex(currentIdx >= 0 ? currentIdx : 0);
  }, [availableModels.length, currentIdx]);
  const moveHighlight = (index) => {
    userNavigatedRef.current = true;
    setActiveIndex(index);
  };
  // Keep the highlight in bounds if the model list refreshes/shrinks while open,
  // so aria-activedescendant, the detail panel and Enter all stay in sync.
  useEffect(() => {
    if (activeIndex >= availableModels.length && availableModels.length > 0) {
      setActiveIndex(availableModels.length - 1);
    }
  }, [availableModels.length, activeIndex]);
  const selectedModel = availableModels[activeIndex] ?? availableModels[0];
  const confirm = (index) => {
    const model = availableModels[index];
    if (model) onSelect(getModelSelectId(model, isFastMode));
  };
  const { keyboardMode } = useListboxKeyboard({
    itemCount: availableModels.length,
    activeIndex,
    onActiveIndexChange: moveHighlight,
    onConfirm: confirm,
  });
  useEffect(() => {
    const el = listRef.current?.children[activeIndex];
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);
  return _jsxs('div', {
    className: styles.layout,
    children: [
      _jsxs('div', {
        className: `${styles.list} ${keyboardMode ? styles.keyboardOnly : ''}`,
        ref: listRef,
        role: 'listbox',
        tabIndex: 0,
        'aria-activedescendant':
          availableModels.length > 0 ? `model-opt-${activeIndex}` : undefined,
        'aria-label': isFastMode
          ? t('model.setFast')
          : isVoiceMode
            ? t('model.setVoice')
            : isVisionMode
              ? t('model.setVision')
              : t('model.select'),
        'data-web-shell-model-dialog': true,
        children: [
          availableModels.length === 0
            ? _jsx('div', {
                className: styles.empty,
                children: t('model.none'),
              })
            : null,
          availableModels.map((model, index) => {
            const selected = index === activeIndex;
            // Only the first id match is the "current" one. `currentModel` is just
            // an id string, so when two providers expose the same model id we
            // cannot tell them apart here — mark one, consistent with the initial
            // highlight (which also lands on `currentIdx`, the first match).
            const isCurrent = index === currentIdx;
            const authType = getAuthType(model);
            return _jsxs(
              'div',
              {
                id: `model-opt-${index}`,
                role: 'option',
                'aria-selected': isCurrent,
                className: `${styles.row} ${selected ? styles.selected : ''} ${isCurrent ? dp('dialog-current') : ''}`,
                'data-web-shell-model-option': true,
                'data-model-id': model.id,
                onClick: () => confirm(index),
                onMouseMove: () => moveHighlight(index),
                children: [
                  _jsxs('span', {
                    className: styles.number,
                    children: [index + 1, '.'],
                  }),
                  authType
                    ? _jsxs('span', {
                        className: styles.provider,
                        children: ['[', authType, ']'],
                      })
                    : null,
                  _jsx('span', {
                    className: styles.label,
                    children: getModelName(model),
                  }),
                  model.isRuntime
                    ? _jsx('span', {
                        className: styles.badge,
                        children: t('common.runtime'),
                      })
                    : null,
                ],
              },
              getModelKey(model),
            );
          }),
        ],
      }),
      selectedModel
        ? _jsxs(_Fragment, {
            children: [
              _jsx('div', { className: styles.divider }),
              _jsxs('div', {
                className: styles.detail,
                children: [
                  _jsx(DetailRow, {
                    label: t('model.modality'),
                    value: formatModalities(selectedModel.modalities, t),
                  }),
                  _jsx(DetailRow, {
                    label: t('model.contextWindow'),
                    value: formatContextWindow(selectedModel.contextWindow, t),
                  }),
                  getAuthType(selectedModel) !== 'qwen-oauth'
                    ? _jsxs(_Fragment, {
                        children: [
                          _jsx(DetailRow, {
                            label: t('model.baseUrl'),
                            value: selectedModel.baseUrl ?? t('model.default'),
                          }),
                          _jsx(DetailRow, {
                            label: t('model.apiKey'),
                            value: selectedModel.envKey ?? t('model.notSet'),
                          }),
                        ],
                      })
                    : null,
                ],
              }),
            ],
          })
        : null,
    ],
  });
}
//# sourceMappingURL=ModelDialog.js.map
