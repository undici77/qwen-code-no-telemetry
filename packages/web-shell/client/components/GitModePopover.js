import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { CircleDotIcon, GitBranchIcon, GitForkIcon } from 'lucide-react';
import { useI18n } from '../i18n';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import styles from './GitModePopover.module.css';
// Byte-length caps mirroring the server predicate in session.ts; keep in sync.
// git creates loose refs as files, so each `/`-separated component is bounded
// by the filesystem's per-component name limit (~255 bytes minus git's `.lock`
// suffix). Count UTF-8 bytes, not code points, since Unicode is allowed.
const MAX_BRANCH_NAME_BYTES = 1000;
const MAX_BRANCH_COMPONENT_BYTES = 200;
const branchNameEncoder = new TextEncoder();
// UX-only validation; the server re-validates in POST /session (session.ts).
// Keep the two predicates in sync.
export function validateBranchName(name) {
  if (!name) return false;
  return !(
    /[^\p{L}\p{N}._/-]/u.test(name) ||
    name.includes('..') ||
    name.includes('//') ||
    name.startsWith('.') ||
    name.startsWith('-') ||
    name.startsWith('/') ||
    name.endsWith('/') ||
    name.endsWith('.') ||
    name.endsWith('.git') ||
    name.includes('@{') ||
    name.split('/').some((c) => c.startsWith('.') || c.endsWith('.lock')) ||
    name.toUpperCase() === 'HEAD' ||
    branchNameEncoder.encode(name).length > MAX_BRANCH_NAME_BYTES ||
    name
      .split('/')
      .some(
        (c) => branchNameEncoder.encode(c).length > MAX_BRANCH_COMPONENT_BYTES,
      )
  );
}
export function GitModePopover({
  branch,
  compact = false,
  intent,
  onIntentChange,
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState(intent.mode);
  const [branchName, setBranchName] = useState(
    intent.mode === 'branch' ? intent.name : '',
  );
  const contentRef = useRef(null);
  const branchValid = useMemo(
    () => validateBranchName(branchName),
    [branchName],
  );
  const handleOpenChange = useCallback(
    (v) => {
      setOpen(v);
      if (v) {
        setSelectedMode(intent.mode);
        setBranchName(intent.mode === 'branch' ? intent.name : '');
      }
    },
    [intent],
  );
  const handleSelectCurrent = useCallback(() => {
    onIntentChange({ mode: 'current' });
    setOpen(false);
  }, [onIntentChange]);
  const handleConfirmBranch = useCallback(() => {
    if (!branchName || !branchValid) return;
    onIntentChange({ mode: 'branch', name: branchName });
    setOpen(false);
  }, [branchName, branchValid, onIntentChange]);
  const handleConfirmWorktree = useCallback(() => {
    onIntentChange({ mode: 'worktree' });
    setOpen(false);
  }, [onIntentChange]);
  const handleClear = useCallback(
    (e) => {
      e.stopPropagation();
      onIntentChange({ mode: 'current' });
      setOpen(false);
    },
    [onIntentChange],
  );
  const isBranch = intent.mode === 'branch';
  const isWorktree = intent.mode === 'worktree';
  const chipLabel = isBranch
    ? `→ ${intent.name}`
    : isWorktree
      ? t('gitMode.worktree')
      : branch;
  return _jsxs('span', {
    className: styles.wrap,
    children: [
      _jsxs(Popover, {
        open: open,
        onOpenChange: handleOpenChange,
        children: [
          _jsx(PopoverTrigger, {
            asChild: true,
            children: _jsxs('button', {
              type: 'button',
              className: `${styles.chip} ${isBranch ? styles.chipBranch : ''} ${isWorktree ? styles.chipWorktree : ''} ${compact ? styles.chipCompact : ''}`,
              'data-web-shell-git-branch': true,
              'data-testid': 'git-mode-chip',
              'aria-label': `${t('gitMode.title')}: ${chipLabel}`,
              children: [
                _jsx('span', {
                  className: styles.chipIcon,
                  children: isWorktree
                    ? _jsx(GitForkIcon, { size: 14, strokeWidth: 1.5 })
                    : _jsx(GitBranchIcon, { size: 15, strokeWidth: 1.5 }),
                }),
                !compact &&
                  _jsx('span', {
                    className: styles.chipText,
                    children: chipLabel,
                  }),
                _jsx('svg', {
                  className: `${styles.chevron} ${open ? styles.chevronOpen : ''}`,
                  viewBox: '0 0 16 16',
                  fill: 'currentColor',
                  width: 9,
                  height: 9,
                  'aria-hidden': 'true',
                  children: _jsx('path', {
                    d: 'M4.427 7.427l3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z',
                  }),
                }),
              ],
            }),
          }),
          _jsxs(PopoverContent, {
            ref: contentRef,
            side: 'top',
            align: 'end',
            sideOffset: 8,
            className: styles.popover,
            // The content is portaled out of the composer, but React synthetic
            // clicks still bubble through the React tree to the composer
            // surface's onClick, which calls core.focus() and steals focus out of
            // the popover — Radix then dismisses it via focus-outside. Stop the
            // bubble so option clicks keep focus inside (mirrors the composer
            // ToolbarPopover pattern in ChatEditor).
            onClick: (e) => e.stopPropagation(),
            onOpenAutoFocus: (e) => e.preventDefault(),
            onInteractOutside: (e) => {
              // The portal container fools Radix's dismissable-layer into
              // thinking clicks inside the popover are "outside". Only
              // prevent dismissal when the target is genuinely inside.
              if (contentRef.current?.contains(e.target)) {
                e.preventDefault();
              }
            },
            children: [
              _jsx('div', {
                className: styles.header,
                children: t('gitMode.title'),
              }),
              _jsxs('button', {
                type: 'button',
                role: 'radio',
                'aria-checked': selectedMode === 'current',
                className: `${styles.option} ${selectedMode === 'current' ? styles.optionSelected : ''}`,
                onClick: handleSelectCurrent,
                children: [
                  _jsx('span', {
                    className: `${styles.optionIcon} ${styles.iconCurrent}`,
                    children: _jsx(CircleDotIcon, {
                      size: 15,
                      strokeWidth: 1.5,
                    }),
                  }),
                  _jsxs('span', {
                    className: styles.optionText,
                    children: [
                      _jsx('span', {
                        className: styles.optionName,
                        children: t('gitMode.current'),
                      }),
                      _jsx('span', {
                        className: styles.optionDesc,
                        children: t('gitMode.currentDesc', { branch }),
                      }),
                    ],
                  }),
                  selectedMode === 'current' &&
                    _jsx('span', {
                      className: styles.checkCurrent,
                      'aria-hidden': 'true',
                      children: '\u2713',
                    }),
                ],
              }),
              _jsxs('button', {
                type: 'button',
                role: 'radio',
                'aria-checked': selectedMode === 'branch',
                className: `${styles.option} ${selectedMode === 'branch' ? styles.optionSelected : ''}`,
                onClick: () => setSelectedMode('branch'),
                children: [
                  _jsx('span', {
                    className: `${styles.optionIcon} ${styles.iconBranch}`,
                    children: _jsx(GitBranchIcon, {
                      size: 15,
                      strokeWidth: 1.5,
                    }),
                  }),
                  _jsxs('span', {
                    className: styles.optionText,
                    children: [
                      _jsx('span', {
                        className: styles.optionName,
                        children: t('gitMode.branch'),
                      }),
                      _jsx('span', {
                        className: styles.optionDesc,
                        children: t('gitMode.branchDesc', { branch }),
                      }),
                    ],
                  }),
                  selectedMode === 'branch' &&
                    _jsx('span', {
                      className: styles.checkBranch,
                      'aria-hidden': 'true',
                      children: '\u2713',
                    }),
                ],
              }),
              selectedMode === 'branch' &&
                _jsxs('div', {
                  className: styles.branchBox,
                  children: [
                    _jsxs('div', {
                      className: styles.branchRow,
                      children: [
                        _jsx('label', {
                          className: styles.branchLabel,
                          htmlFor: 'git-mode-branch-input',
                          children: t('gitMode.branchLabel'),
                        }),
                        _jsxs('span', {
                          className: styles.branchInputWrap,
                          children: [
                            _jsx('input', {
                              className: `${styles.branchInput} ${branchName && !branchValid ? styles.branchInputInvalid : ''} ${branchName && branchValid ? styles.branchInputValid : ''}`,
                              value: branchName,
                              onChange: (e) => setBranchName(e.target.value),
                              onKeyDown: (e) => {
                                if (
                                  e.key === 'Enter' &&
                                  branchName &&
                                  branchValid
                                )
                                  handleConfirmBranch();
                              },
                              placeholder: t('gitMode.branchPlaceholder'),
                              autoFocus: true,
                              spellCheck: false,
                              autoComplete: 'off',
                              id: 'git-mode-branch-input',
                              'data-testid': 'git-mode-branch-input',
                            }),
                            branchName &&
                              _jsx('span', {
                                className: styles.branchStatus,
                                'aria-hidden': 'true',
                                style: {
                                  color: branchValid
                                    ? 'var(--git-mode-valid)'
                                    : 'var(--git-mode-invalid)',
                                },
                                children: branchValid ? '✓' : '✗',
                              }),
                          ],
                        }),
                      ],
                    }),
                    _jsx('div', {
                      className: `${styles.branchHint} ${branchName && !branchValid ? styles.branchHintError : ''}`,
                      children:
                        branchName && !branchValid
                          ? t('gitMode.branchInvalidName')
                          : t('gitMode.branchHint'),
                    }),
                    branchName &&
                      branchValid &&
                      _jsx('div', {
                        className: styles.branchHint,
                        children: t('gitMode.branchConflictWarning'),
                      }),
                  ],
                }),
              _jsxs('button', {
                type: 'button',
                role: 'radio',
                'aria-checked': selectedMode === 'worktree',
                className: `${styles.option} ${selectedMode === 'worktree' ? styles.optionSelected : ''}`,
                onClick: () => setSelectedMode('worktree'),
                children: [
                  _jsx('span', {
                    className: `${styles.optionIcon} ${styles.iconWorktree}`,
                    children: _jsx(GitForkIcon, { size: 15, strokeWidth: 1.5 }),
                  }),
                  _jsxs('span', {
                    className: styles.optionText,
                    children: [
                      _jsx('span', {
                        className: styles.optionName,
                        children: t('gitMode.worktree'),
                      }),
                      _jsx('span', {
                        className: styles.optionDesc,
                        children: t('gitMode.worktreeDesc'),
                      }),
                    ],
                  }),
                  selectedMode === 'worktree' &&
                    _jsx('span', {
                      className: styles.checkWorktree,
                      'aria-hidden': 'true',
                      children: '\u2713',
                    }),
                ],
              }),
              _jsxs('div', {
                className: styles.footer,
                children: [
                  _jsx('span', {
                    className: styles.cmd,
                    children:
                      selectedMode === 'branch'
                        ? `$ git checkout -b ${branchName || '…'} ← ${branch}`
                        : selectedMode === 'worktree'
                          ? '$ git worktree add .qwen/worktrees/<slug>'
                          : `$ git checkout ${branch}`,
                  }),
                  selectedMode === 'branch' &&
                    _jsx('button', {
                      type: 'button',
                      className: styles.confirmBranch,
                      disabled: !branchName || !branchValid,
                      onClick: handleConfirmBranch,
                      'data-testid': 'git-mode-confirm-branch',
                      children: t('gitMode.confirmBranch'),
                    }),
                  selectedMode === 'worktree' &&
                    _jsx('button', {
                      type: 'button',
                      className: styles.confirmWorktree,
                      onClick: handleConfirmWorktree,
                      'data-testid': 'git-mode-confirm-worktree',
                      children: t('gitMode.confirmWorktree'),
                    }),
                ],
              }),
            ],
          }),
        ],
      }),
      (isBranch || isWorktree) &&
        _jsx('button', {
          type: 'button',
          className: styles.clearBtn,
          onClick: handleClear,
          'aria-label': t('gitMode.resetToCurrent'),
          title: t('gitMode.resetToCurrent'),
          'data-testid': 'git-mode-clear',
          children: '\u2715',
        }),
    ],
  });
}
//# sourceMappingURL=GitModePopover.js.map
