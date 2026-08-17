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
import { useEffect, useRef, useState } from 'react';
import { useWorkspace } from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../../i18n';
import { useTheme, WebShellThemeId } from '../../themeContext';
import {
  getCodeHighlighter,
  isTooLargeToHighlight,
} from '../messages/codeHighlighter';
import { resolveFenceLanguage } from '../messages/Markdown';
import { languageForPath } from '../messages/ToolGroup';
import { sanitizeControlChars } from '../messages/toolFormatting';
import { DialogShell } from './DialogShell';
import styles from './GitDiffDialog.module.css';
const ROW_CLASS = {
  add: styles.diffLineAdd,
  del: styles.diffLineDel,
  context: styles.diffLineContext,
  meta: styles.diffLineMeta,
};
function shikiThemeFor(theme) {
  return theme === WebShellThemeId.Light
    ? 'github-light-default'
    : 'github-dark-default';
}
// Build the unified-diff rows for a file's hunks, highlighting each side
// (context+added / context+removed) as its own code block so multi-line tokens
// (a comment or string crossing an add/delete boundary) still tokenize
// correctly. Each rendered line then pulls its tokens from the matching side:
// `+` from the new side, `-` from the old side, context from either (identical).
async function buildRows(hunks, path, theme) {
  const { resolvedLang } = resolveFenceLanguage(languageForPath(path));
  let highlighter = null;
  if (resolvedLang !== 'text') {
    try {
      highlighter = await getCodeHighlighter(resolvedLang);
    } catch {
      highlighter = null;
    }
  }
  const rows = [];
  for (const hunk of hunks) {
    const newSide = [];
    const oldSide = [];
    for (const line of hunk.lines) {
      const prefix = line[0];
      const body = line.slice(1);
      if (prefix === '+') newSide.push(body);
      else if (prefix === '-') oldSide.push(body);
      else if (prefix === ' ') {
        newSide.push(body);
        oldSide.push(body);
      }
    }
    const newCode = newSide.join('\n');
    const oldCode = oldSide.join('\n');
    let newTokens = null;
    let oldTokens = null;
    if (highlighter) {
      // resolvedLang is a real Shiki language id here ('text' was filtered out
      // before the highlighter was loaded).
      const lang = resolvedLang;
      // Highlight each side independently so a small side keeps its tokens even
      // when the other side exceeds the size cap.
      if (!isTooLargeToHighlight(newCode)) {
        try {
          newTokens = highlighter.codeToTokens(newCode, { lang, theme }).tokens;
        } catch {
          newTokens = null;
        }
      }
      if (!isTooLargeToHighlight(oldCode)) {
        try {
          oldTokens = highlighter.codeToTokens(oldCode, { lang, theme }).tokens;
        } catch {
          oldTokens = null;
        }
      }
    }
    let ni = 0;
    let oi = 0;
    let oldNo = hunk.oldStart;
    let newNo = hunk.newStart;
    for (const line of hunk.lines) {
      const prefix = line[0];
      const body = line.slice(1);
      if (prefix === '+') {
        rows.push({
          type: 'add',
          oldNo: null,
          newNo,
          text: body,
          tokens: newTokens?.[ni] ?? null,
        });
        ni++;
        newNo++;
      } else if (prefix === '-') {
        rows.push({
          type: 'del',
          oldNo,
          newNo: null,
          text: body,
          tokens: oldTokens?.[oi] ?? null,
        });
        oi++;
        oldNo++;
      } else if (prefix === ' ') {
        rows.push({
          type: 'context',
          oldNo,
          newNo,
          text: body,
          tokens: newTokens?.[ni] ?? null,
        });
        ni++;
        oi++;
        oldNo++;
        newNo++;
      } else {
        // e.g. "\ No newline at end of file" — a neutral marker, no line number.
        rows.push({
          type: 'meta',
          oldNo: null,
          newNo: null,
          text: line,
          tokens: null,
        });
      }
    }
  }
  return rows;
}
function renderContent(row) {
  if (!row.tokens || row.tokens.length === 0) return row.text;
  return row.tokens.map((token, index) =>
    _jsx(
      'span',
      {
        style: token.color ? { color: token.color } : undefined,
        children: token.content,
      },
      index,
    ),
  );
}
function DiffHunks({ hunks, path }) {
  const { t } = useI18n();
  const theme = useTheme();
  const shikiTheme = shikiThemeFor(theme);
  const [rows, setRows] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setFailed(false);
    buildRows(hunks, path, shikiTheme)
      .then((built) => {
        if (!cancelled) setRows(built);
      })
      // Highlighter failures degrade to plain text inside buildRows; this
      // catches the unexpected (e.g. malformed hunk lines), which would
      // otherwise be an unhandled rejection leaving `rows` stuck at null with
      // no feedback.
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [hunks, path, shikiTheme]);
  if (failed) {
    return _jsx('div', {
      className: styles.filePlaceholder,
      children: t('gitDiff.fileError'),
    });
  }
  // null while the rows are first built and again while re-tokenizing after a
  // theme switch; show a placeholder instead of an empty, jumpily-resized box.
  if (rows === null) {
    return _jsx('div', {
      className: styles.filePlaceholder,
      children: t('gitDiff.loading'),
    });
  }
  return _jsx('div', {
    className: styles.diffLines,
    children: (rows ?? []).map((row, index) =>
      _jsxs(
        'div',
        {
          className: `${styles.diffLine} ${ROW_CLASS[row.type]}`,
          children: [
            _jsx('span', {
              className: styles.diffOldNo,
              children: row.oldNo ?? '',
            }),
            _jsx('span', {
              className: styles.diffNewNo,
              children: row.newNo ?? '',
            }),
            _jsx('span', {
              className: styles.diffMarker,
              children:
                row.type === 'add'
                  ? '+'
                  : row.type === 'del'
                    ? '-'
                    : row.type === 'meta'
                      ? ''
                      : ' ',
            }),
            _jsx('code', {
              className: styles.diffContent,
              children: renderContent(row),
            }),
          ],
        },
        index,
      ),
    ),
  });
}
function DiffFileRow({ workspaceCwd, gitCwd, file }) {
  const { t } = useI18n();
  const { client } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [hunks, setHunks] = useState(null);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  // Guard the in-flight fetch so closing the dialog before it resolves doesn't
  // settle state on an unmounted row (matching DiffHunks / GitDiffDialog).
  const cancelledRef = useRef(false);
  useEffect(() => {
    // Reset on mount: StrictMode replays mount→unmount→mount and the ref
    // persists across the replay, so without this reset the flag would stick at
    // true and suppress every post-fetch state update (row stuck on "Loading").
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && hunks === null && !loading && !file.isBinary) {
      setLoading(true);
      setError(false);
      client
        .workspaceByCwd(workspaceCwd)
        // Pass the pre-rename path so a renamed file diffs old→new (rename
        // detection) instead of showing the new path as fully added.
        .workspaceGitDiffFile(file.path, file.oldPath, gitCwd)
        .then((result) => {
          if (cancelledRef.current) return;
          setHunks(result.hunks);
          setTruncated(result.truncated === true);
        })
        .catch(() => {
          if (!cancelledRef.current) setError(true);
        })
        .finally(() => {
          if (!cancelledRef.current) setLoading(false);
        });
    }
  };
  const displayName = sanitizeControlChars(file.path);
  return _jsxs('div', {
    className: styles.file,
    children: [
      _jsxs('button', {
        type: 'button',
        className: styles.fileHeader,
        onClick: toggle,
        'aria-expanded': open,
        'aria-label': t(open ? 'gitDiff.collapse' : 'gitDiff.expand', {
          path: file.oldPath
            ? `${sanitizeControlChars(file.oldPath)} → ${displayName}`
            : displayName,
        }),
        children: [
          _jsx('span', {
            className: styles.fileStats,
            children: file.isBinary
              ? _jsx('span', {
                  className: styles.fileBinary,
                  children: t('gitDiff.binary'),
                })
              : _jsxs(_Fragment, {
                  children: [
                    _jsxs('span', {
                      className: styles.statAdd,
                      children: ['+', file.added ?? 0],
                    }),
                    _jsxs('span', {
                      className: styles.statDel,
                      children: ['-', file.removed ?? 0],
                    }),
                  ],
                }),
          }),
          _jsxs('span', {
            className: styles.filePath,
            title: displayName,
            children: [
              file.oldPath
                ? _jsxs(_Fragment, {
                    children: [
                      _jsx('span', {
                        className: styles.fileOldPath,
                        children: sanitizeControlChars(file.oldPath),
                      }),
                      ' → ',
                    ],
                  })
                : null,
              displayName,
            ],
          }),
          file.isUntracked &&
            _jsx('span', {
              className: styles.fileTag,
              children: t('gitDiff.untracked'),
            }),
          file.isDeleted &&
            _jsx('span', {
              className: styles.fileTag,
              children: t('gitDiff.deleted'),
            }),
        ],
      }),
      open &&
        _jsx('div', {
          className: styles.fileBody,
          children: file.isBinary
            ? _jsx('div', {
                className: styles.filePlaceholder,
                children: t('gitDiff.binary'),
              })
            : loading
              ? _jsx('div', {
                  className: styles.filePlaceholder,
                  children: t('gitDiff.loading'),
                })
              : error
                ? _jsx('div', {
                    className: styles.filePlaceholder,
                    children: t('gitDiff.fileError'),
                  })
                : hunks && hunks.length > 0
                  ? _jsxs(_Fragment, {
                      children: [
                        _jsx(DiffHunks, { hunks: hunks, path: file.path }),
                        truncated &&
                          _jsx('div', {
                            className: styles.filePlaceholder,
                            role: 'note',
                            children: t('gitDiff.truncated'),
                          }),
                      ],
                    })
                  : _jsx('div', {
                      className: styles.filePlaceholder,
                      children: t('gitDiff.noDiff'),
                    }),
        }),
    ],
  });
}
export function GitDiffContent({ workspaceCwd, gitCwd, onSubtitleChange }) {
  const { t } = useI18n();
  const { client } = useWorkspace();
  const [diff, setDiff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    client
      .workspaceByCwd(workspaceCwd)
      .workspaceGitDiff(gitCwd)
      .then((result) => {
        if (!cancelled) setDiff(result);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client, workspaceCwd, gitCwd]);
  const subtitle =
    diff && diff.available
      ? t('gitDiff.summary', {
          count: diff.filesCount,
          added: diff.linesAdded,
          removed: diff.linesRemoved,
        })
      : undefined;
  useEffect(() => {
    onSubtitleChange?.(subtitle);
  }, [onSubtitleChange, subtitle]);
  let body;
  if (loading) {
    body = _jsx('div', {
      className: styles.placeholder,
      children: t('gitDiff.loading'),
    });
  } else if (error) {
    body = _jsx('div', {
      className: styles.placeholder,
      children: t('gitDiff.error'),
    });
  } else if (!diff || !diff.available) {
    body = _jsx('div', {
      className: styles.placeholder,
      children: t('gitDiff.unavailable'),
    });
  } else if (diff.files.length === 0) {
    body = _jsx('div', {
      className: styles.placeholder,
      children: t('gitDiff.empty'),
    });
  } else {
    body = _jsxs('div', {
      className: styles.fileList,
      children: [
        diff.files.map((file) =>
          _jsx(
            DiffFileRow,
            // Key by workspace + path so switching workspace remounts the row
            // instead of reusing another workspace's hunks/open state for a
            // path both workspaces share.
            { workspaceCwd: workspaceCwd, gitCwd: gitCwd, file: file },
            `${workspaceCwd}:${gitCwd ?? ''}:${file.path}`,
          ),
        ),
        diff.hiddenCount > 0 &&
          _jsx('div', {
            className: styles.hiddenNote,
            children: t('gitDiff.hidden', { count: diff.hiddenCount }),
          }),
      ],
    });
  }
  return _jsx('div', { className: styles.content, children: body });
}
export function GitDiffDialog({ workspaceCwd, onClose }) {
  const { t } = useI18n();
  return _jsx(DialogShell, {
    title: t('gitDiff.title'),
    size: 'xl',
    allowFullscreen: true,
    onClose: onClose,
    children: _jsx(GitDiffContent, { workspaceCwd: workspaceCwd }),
  });
}
//# sourceMappingURL=GitDiffDialog.js.map
