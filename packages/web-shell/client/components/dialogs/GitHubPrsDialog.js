import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from 'react';
import { CheckIcon, ClockIcon, GitPullRequestIcon, GitPullRequestDraftIcon, XIcon, } from 'lucide-react';
import { useWorkspace } from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../../i18n';
import { timeAgo } from '../../utils/timeAgo';
import styles from './GitHubPrsDialog.module.css';
function errorCode(error) {
    const body = error && typeof error === 'object'
        ? error.body
        : undefined;
    const code = body && typeof body === 'object'
        ? body.code
        : undefined;
    return typeof code === 'string' ? code : null;
}
function ChecksIcon({ checks }) {
    const { t } = useI18n();
    switch (checks) {
        case 'passing':
            return (_jsx("span", { className: styles.checksPassing, title: t('githubPrs.checksPassing'), children: _jsx(CheckIcon, { size: 12 }) }));
        case 'failing':
            return (_jsx("span", { className: styles.checksFailing, title: t('githubPrs.checksFailing'), children: _jsx(XIcon, { size: 12 }) }));
        case 'pending':
            return (_jsx("span", { className: styles.checksPending, title: t('githubPrs.checksPending'), children: _jsx(ClockIcon, { size: 12 }) }));
        default:
            return null;
    }
}
function PullRequestRow({ pr, now, }) {
    const { t, language } = useI18n();
    const StateIcon = pr.state === 'draft' ? GitPullRequestDraftIcon : GitPullRequestIcon;
    const reviewBadge = pr.reviewDecision === 'approved' ? (_jsx("span", { className: `${styles.badge} ${styles.badgeApproved}`, children: t('githubPrs.reviewApproved') })) : pr.reviewDecision === 'changes_requested' ? (_jsx("span", { className: `${styles.badge} ${styles.badgeChanges}`, children: t('githubPrs.reviewChanges') })) : pr.reviewDecision === 'review_required' ? (_jsx("span", { className: `${styles.badge} ${styles.badgeReviewRequired}`, children: t('githubPrs.reviewRequired') })) : null;
    return (_jsxs("button", { type: "button", className: styles.prRow, "aria-label": t('githubPrs.open', { number: pr.number }), onClick: () => {
            if (pr.url)
                window.open(pr.url, '_blank', 'noopener,noreferrer');
        }, children: [_jsxs("span", { className: styles.prLine, children: [_jsx(StateIcon, { size: 12, className: pr.state === 'draft' ? styles.stateDraft : styles.stateOpen }), _jsx("span", { className: styles.prTitle, children: pr.title }), reviewBadge, _jsx(ChecksIcon, { checks: pr.checks })] }), _jsxs("span", { className: styles.prMeta, children: ["#", pr.number, " \u00B7 ", pr.headRefName, pr.author ? ` · ${pr.author}` : '', " \u00B7", ' ', timeAgo(pr.updatedAt, now, language)] })] }));
}
export function GitHubPrsContent({ workspaceCwd, onSubtitleChange, }) {
    const { client } = useWorkspace();
    const { t } = useI18n();
    const [list, setList] = useState(null);
    const [loading, setLoading] = useState(true);
    const [failure, setFailure] = useState(null);
    const [now, setNow] = useState(Date.now() / 1000);
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now() / 1000), 60_000);
        return () => clearInterval(id);
    }, []);
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setFailure(null);
        client
            .workspaceByCwd(workspaceCwd)
            .workspaceGitHubPullRequests()
            .then((result) => {
            if (!cancelled)
                setList(result);
        })
            .catch((error) => {
            if (!cancelled)
                setFailure(errorCode(error) ?? 'unknown');
        })
            .finally(() => {
            if (!cancelled)
                setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [client, workspaceCwd]);
    const subtitle = list?.available
        ? t('githubPrs.subtitle', { count: list.pullRequests.length })
        : undefined;
    useEffect(() => {
        onSubtitleChange?.(subtitle);
    }, [onSubtitleChange, subtitle]);
    let body;
    if (loading) {
        body = _jsx("div", { className: styles.placeholder, children: t('githubPrs.loading') });
    }
    else if (failure === 'github_cli_unavailable') {
        body = (_jsx("div", { className: styles.placeholder, children: t('githubPrs.cliUnavailable') }));
    }
    else if (failure !== null) {
        body = _jsx("div", { className: styles.placeholder, children: t('githubPrs.error') });
    }
    else if (!list || !list.available) {
        body = (_jsx("div", { className: styles.placeholder, children: t('githubPrs.unavailable') }));
    }
    else if (list.pullRequests.length === 0) {
        body = _jsx("div", { className: styles.placeholder, children: t('githubPrs.empty') });
    }
    else {
        body = (_jsx("div", { className: styles.prList, children: list.pullRequests.map((pr) => (_jsx(PullRequestRow, { pr: pr, now: now }, pr.number))) }));
    }
    return _jsx("div", { className: styles.content, children: body });
}
//# sourceMappingURL=GitHubPrsDialog.js.map