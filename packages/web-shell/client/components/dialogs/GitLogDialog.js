import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useRef, useState, } from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { useWorkspace } from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../../i18n';
import { timeAgo } from '../../utils/timeAgo';
import { DialogShell } from './DialogShell';
import styles from './GitLogDialog.module.css';
const PAGE_SIZE = 50;
function parseRefs(refs) {
    if (!refs)
        return [];
    return refs
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean)
        .slice(0, 3)
        .map((r) => {
        const isHead = r.startsWith('HEAD ->');
        const label = isHead ? r.replace('HEAD -> ', '') : r;
        return { label, isHead };
    });
}
function CommitRow({ entry, workspaceCwd, gitCwd, now, }) {
    const { client } = useWorkspace();
    const { language, t } = useI18n();
    const [open, setOpen] = useState(false);
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [copied, setCopied] = useState(false);
    const cancelledRef = useRef(false);
    const copySha = () => {
        void navigator.clipboard
            .writeText(entry.sha)
            .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        })
            .catch(() => { });
    };
    useEffect(() => {
        cancelledRef.current = false;
        return () => {
            cancelledRef.current = true;
        };
    }, []);
    const toggle = () => {
        const next = !open;
        setOpen(next);
        if (next && detail === null && !loading) {
            setLoading(true);
            setError(false);
            client
                .workspaceByCwd(workspaceCwd)
                .workspaceGitCommitDetail(entry.sha, gitCwd)
                .then((result) => {
                if (cancelledRef.current)
                    return;
                setDetail(result);
            })
                .catch(() => {
                if (cancelledRef.current)
                    return;
                setError(true);
            })
                .finally(() => {
                if (cancelledRef.current)
                    return;
                setLoading(false);
            });
        }
    };
    const refs = parseRefs(entry.refs ?? '');
    const isMerge = entry.parents.length > 1;
    let detailBody;
    if (open) {
        if (loading) {
            detailBody = (_jsx("div", { className: styles.commitDetail, children: _jsx("span", { className: styles.fileBinary, children: t('gitLog.loading') }) }));
        }
        else if (error) {
            detailBody = (_jsx("div", { className: styles.commitDetail, children: _jsx("span", { className: styles.detailError, children: t('gitLog.detailError') }) }));
        }
        else if (detail && detail.available) {
            detailBody = (_jsxs("div", { className: styles.commitDetail, children: [detail.body && (_jsx("pre", { className: styles.commitBody, children: detail.body })), detail.files && (_jsxs("div", { className: styles.fileStats, children: [_jsx("div", { className: styles.fileStatHeader, children: t('gitLog.files', {
                                    count: detail.filesCount ?? 0,
                                    added: detail.linesAdded ?? 0,
                                    removed: detail.linesRemoved ?? 0,
                                }) }), detail.files.map((f) => (_jsxs("div", { className: styles.fileStatRow, children: [f.isBinary ? (_jsx("span", { className: styles.fileBinary, children: "~" })) : (_jsxs("span", { className: styles.statNums, children: [_jsxs("span", { className: styles.statAdd, children: ["+", f.added] }), _jsxs("span", { className: styles.statDel, children: ["\u2212", f.removed] })] })), _jsx("span", { className: styles.fileStatPath, children: f.path })] }, f.path))), (detail.hiddenCount ?? 0) > 0 && (_jsx("div", { className: styles.hiddenNote, children: t('gitLog.hidden', { count: detail.hiddenCount ?? 0 }) }))] }))] }));
        }
        else if (detail && !detail.available) {
            detailBody = (_jsx("div", { className: styles.commitDetail, children: _jsx("span", { className: styles.detailError, children: t('gitLog.detailError') }) }));
        }
    }
    return (_jsxs("div", { className: styles.commitRow, children: [_jsxs("div", { className: styles.commitHeader, children: [_jsxs("button", { type: "button", className: styles.commitToggle, onClick: toggle, "aria-expanded": open, children: [isMerge && _jsx("span", { className: styles.mergeIcon, children: "\u2387" }), _jsx("span", { className: styles.commitSha, title: entry.sha, children: entry.shortSha }), _jsx("span", { className: styles.commitSubject, children: entry.subject }), refs.length > 0 && (_jsx("span", { className: styles.commitRefs, children: refs.map((r) => (_jsx("span", { className: `${styles.refTag}${r.isHead ? ` ${styles.refHead}` : ''}`, children: r.label }, r.label))) })), _jsxs("span", { className: styles.commitMeta, children: [entry.authorName, " \u00B7 ", timeAgo(entry.authorDate, now, language)] })] }), _jsx("button", { type: "button", className: styles.copyBtn, onClick: copySha, "aria-label": t('gitLog.copySha', { sha: entry.shortSha }), children: copied ? _jsx(CheckIcon, { size: 12 }) : _jsx(CopyIcon, { size: 12 }) })] }), detailBody] }));
}
export function GitLogContent({ workspaceCwd, gitCwd, onSubtitleChange, }) {
    const { client } = useWorkspace();
    const { t } = useI18n();
    const [log, setLog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadMoreError, setLoadMoreError] = useState(false);
    const [now, setNow] = useState(Date.now() / 1000);
    const nextSkipRef = useRef(0);
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now() / 1000), 60_000);
        return () => clearInterval(id);
    }, []);
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(false);
        setLoadMoreError(false);
        nextSkipRef.current = 0;
        client
            .workspaceByCwd(workspaceCwd)
            .workspaceGitLog(PAGE_SIZE, 0, gitCwd)
            .then((result) => {
            if (!cancelled) {
                nextSkipRef.current = result.entries.length;
                setLog(result);
            }
        })
            .catch(() => {
            if (!cancelled)
                setError(true);
        })
            .finally(() => {
            if (!cancelled)
                setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [client, workspaceCwd, gitCwd]);
    const loadMore = useCallback(() => {
        if (!log || loadingMore)
            return;
        setLoadingMore(true);
        client
            .workspaceByCwd(workspaceCwd)
            .workspaceGitLog(PAGE_SIZE, nextSkipRef.current, gitCwd)
            .then((result) => {
            nextSkipRef.current += result.entries.length;
            setLog((prev) => {
                if (!prev)
                    return result;
                const existing = new Set(prev.entries.map((entry) => entry.sha));
                return {
                    ...prev,
                    entries: [
                        ...prev.entries,
                        ...result.entries.filter((entry) => !existing.has(entry.sha)),
                    ],
                    hasMore: result.hasMore,
                };
            });
        })
            .catch(() => {
            setLoadMoreError(true);
        })
            .finally(() => {
            setLoadingMore(false);
        });
    }, [client, workspaceCwd, gitCwd, log, loadingMore]);
    const subtitle = log?.available
        ? t('gitLog.subtitle', { count: log.entries.length })
        : undefined;
    useEffect(() => {
        onSubtitleChange?.(subtitle);
    }, [onSubtitleChange, subtitle]);
    let body;
    if (loading) {
        body = _jsx("div", { className: styles.placeholder, children: t('gitLog.loading') });
    }
    else if (error) {
        body = _jsx("div", { className: styles.placeholder, children: t('gitLog.error') });
    }
    else if (!log || !log.available) {
        body = _jsx("div", { className: styles.placeholder, children: t('gitLog.unavailable') });
    }
    else if (log.entries.length === 0) {
        body = _jsx("div", { className: styles.placeholder, children: t('gitLog.empty') });
    }
    else {
        body = (_jsxs(_Fragment, { children: [_jsx("div", { className: styles.commitList, children: log.entries.map((entry) => (_jsx(CommitRow, { entry: entry, workspaceCwd: workspaceCwd, gitCwd: gitCwd, now: now }, entry.sha))) }), loadMoreError && (_jsx("div", { className: styles.placeholder, children: t('gitLog.error') })), log.hasMore && (_jsx("button", { type: "button", className: styles.loadMore, onClick: () => {
                        setLoadMoreError(false);
                        loadMore();
                    }, disabled: loadingMore, children: loadingMore ? t('gitLog.loadingMore') : t('gitLog.loadMore') }))] }));
    }
    return _jsx("div", { className: styles.content, children: body });
}
export function GitLogDialog({ workspaceCwd, onClose, }) {
    const { t } = useI18n();
    return (_jsx(DialogShell, { title: t('gitLog.title'), size: "xl", allowFullscreen: true, onClose: onClose, children: _jsx(GitLogContent, { workspaceCwd: workspaceCwd }) }));
}
//# sourceMappingURL=GitLogDialog.js.map