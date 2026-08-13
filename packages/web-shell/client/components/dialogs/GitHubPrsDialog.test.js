import { jsx as _jsx } from "react/jsx-runtime";
// @vitest-environment jsdom
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from '../../i18n';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => { };
}
// A STABLE client object: the dialog's fetch effect depends on `client`, so a
// fresh object per render would re-fire it in a loop.
const { workspaceGitHubPullRequests, workspaceClient } = vi.hoisted(() => {
    const workspaceGitHubPullRequests = vi.fn();
    const workspaceClient = {
        workspaceByCwd: () => ({ workspaceGitHubPullRequests }),
    };
    return { workspaceGitHubPullRequests, workspaceClient };
});
vi.mock('@qwen-code/webui/daemon-react-sdk', () => ({
    useWorkspace: () => ({ client: workspaceClient }),
}));
const { GitHubPrsContent } = await import('./GitHubPrsDialog');
let container;
let root;
function mount(language = 'en', onSubtitleChange) {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
        root.render(_jsx(I18nProvider, { language: language, children: _jsx(GitHubPrsContent, { workspaceCwd: "/repo", onSubtitleChange: onSubtitleChange }) }));
    });
}
async function flush() {
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
    });
}
afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
});
function pr(overrides = {}) {
    return {
        number: 42,
        title: 'Fix the flaky test',
        url: 'https://github.com/o/r/pull/42',
        author: 'octocat',
        headRefName: 'fix/flaky-test',
        state: 'open',
        reviewDecision: 'approved',
        checks: 'passing',
        updatedAt: Math.floor(Date.now() / 1000) - 120,
        ...overrides,
    };
}
function listPayload(pullRequests, available = true) {
    return { v: 1, workspaceCwd: '/repo', available, pullRequests };
}
describe('GitHubPrsContent', () => {
    it('renders pull requests with review badge, checks icon, and relative time', async () => {
        workspaceGitHubPullRequests.mockResolvedValue(listPayload([pr()]));
        mount();
        await flush();
        const text = document.body.textContent ?? '';
        expect(text).toContain('Fix the flaky test');
        expect(text).toContain('#42');
        expect(text).toContain('fix/flaky-test');
        expect(text).toContain('octocat');
        expect(text).toContain('2 minutes ago');
        expect(text).toContain('Approved');
    });
    it('opens the pull request on GitHub when a row is clicked', async () => {
        workspaceGitHubPullRequests.mockResolvedValue(listPayload([pr()]));
        const openSpy = vi.fn();
        vi.stubGlobal('open', openSpy);
        mount();
        await flush();
        const row = document.body.querySelector('button[aria-label*="pull request #42"]');
        expect(row).toBeTruthy();
        await act(async () => {
            row?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
        expect(openSpy).toHaveBeenCalledWith('https://github.com/o/r/pull/42', '_blank', 'noopener,noreferrer');
    });
    it('renders draft and changes-requested pull requests', async () => {
        workspaceGitHubPullRequests.mockResolvedValue(listPayload([
            pr({
                number: 7,
                title: 'WIP: rewrite the parser',
                state: 'draft',
                reviewDecision: 'changes_requested',
                checks: 'failing',
            }),
        ]));
        mount();
        await flush();
        const text = document.body.textContent ?? '';
        expect(text).toContain('WIP: rewrite the parser');
        expect(text).toContain('Changes requested');
    });
    it('renders the review-required badge', async () => {
        workspaceGitHubPullRequests.mockResolvedValue(listPayload([pr({ number: 9, reviewDecision: 'review_required' })]));
        mount();
        await flush();
        const badge = document.body.querySelector('[class*="badgeReviewRequired"]');
        expect(badge).toBeTruthy();
        expect(badge?.textContent).toBe('Review required');
    });
    it('renders the pending checks indicator', async () => {
        workspaceGitHubPullRequests.mockResolvedValue(listPayload([pr({ checks: 'pending' })]));
        mount();
        await flush();
        const pending = document.body.querySelector('[class*="checksPending"]');
        expect(pending).toBeTruthy();
    });
    it('reports the open count through onSubtitleChange', async () => {
        workspaceGitHubPullRequests.mockResolvedValue(listPayload([pr(), pr({ number: 43 })]));
        const onSubtitleChange = vi.fn();
        mount('en', onSubtitleChange);
        await flush();
        expect(onSubtitleChange).toHaveBeenCalledWith('2 open');
    });
    it('shows the empty state', async () => {
        workspaceGitHubPullRequests.mockResolvedValue(listPayload([]));
        mount();
        await flush();
        expect(document.body.textContent).toContain('No open pull requests');
    });
    it('shows the not-a-repository state', async () => {
        workspaceGitHubPullRequests.mockResolvedValue(listPayload([], false));
        mount();
        await flush();
        expect(document.body.textContent).toContain('This workspace is not a git repository');
    });
    it('shows gh install guidance when the daemon reports github_cli_unavailable', async () => {
        workspaceGitHubPullRequests.mockRejectedValue({
            body: { code: 'github_cli_unavailable' },
        });
        mount();
        await flush();
        const text = document.body.textContent ?? '';
        expect(text).toContain('GitHub CLI (gh) is not installed');
        expect(text).toContain('gh auth login');
    });
    it('shows the generic error state for other failures', async () => {
        workspaceGitHubPullRequests.mockRejectedValue(new Error('network down'));
        mount();
        await flush();
        expect(document.body.textContent).toContain('Failed to load pull requests');
    });
    it('localizes the interface', async () => {
        workspaceGitHubPullRequests.mockResolvedValue(listPayload([pr()]));
        mount('zh-CN');
        await flush();
        const text = document.body.textContent ?? '';
        expect(text).toContain('已批准');
        expect(text).toContain('2分钟前');
    });
});
//# sourceMappingURL=GitHubPrsDialog.test.js.map