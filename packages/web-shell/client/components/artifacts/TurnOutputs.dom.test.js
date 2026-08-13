import { jsx as _jsx } from "react/jsx-runtime";
// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
const { readFileBytes, stat, secondaryReadFileBytes, secondaryReadWorkspaceFile, secondaryStat, workspaceByCwd, } = vi.hoisted(() => ({
    readFileBytes: vi.fn(),
    stat: vi.fn(),
    secondaryReadFileBytes: vi.fn(),
    secondaryReadWorkspaceFile: vi.fn(),
    secondaryStat: vi.fn(),
    workspaceByCwd: vi.fn(),
}));
vi.mock('@qwen-code/webui/daemon-react-sdk', () => ({
    useWorkspaceActions: () => ({
        readFileBytes,
        stat,
    }),
    useWorkspace: () => ({
        actions: { readFileBytes, stat },
        client: { workspaceByCwd },
        capabilities: {
            workspaceCwd: '/primary',
            workspaces: [
                {
                    id: 'primary-id',
                    cwd: '/primary',
                    primary: true,
                    trusted: true,
                },
                {
                    id: 'secondary-id',
                    cwd: '/secondary',
                    primary: false,
                    trusted: true,
                },
            ],
        },
    }),
}));
const { TurnOutputs } = await import('./TurnOutputs');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const createdBlobs = [];
beforeEach(() => {
    createdBlobs.length = 0;
    stat.mockResolvedValue({ sizeBytes: 3, modifiedMs: 1 });
    readFileBytes.mockResolvedValue({
        contentBase64: btoa('abc'),
        offset: 0,
        returnedBytes: 3,
        sizeBytes: 3,
    });
    secondaryStat.mockResolvedValue({ sizeBytes: 9, modifiedMs: 2 });
    secondaryReadFileBytes.mockResolvedValue({
        contentBase64: btoa('secondary'),
        offset: 0,
        returnedBytes: 9,
        sizeBytes: 9,
    });
    workspaceByCwd.mockReturnValue({
        readWorkspaceFile: secondaryReadWorkspaceFile,
        readWorkspaceFileBytes: secondaryReadFileBytes,
        fileStat: secondaryStat,
    });
    Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        value: vi.fn((blob) => {
            createdBlobs.push(blob);
            return 'blob:artifact';
        }),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        value: vi.fn(),
    });
});
afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
    readFileBytes.mockReset();
    stat.mockReset();
    secondaryReadFileBytes.mockReset();
    secondaryReadWorkspaceFile.mockReset();
    secondaryStat.mockReset();
    workspaceByCwd.mockReset();
});
describe('TurnOutputs artifact downloads', () => {
    it('shows Download for every available workspace artifact kind', () => {
        const kinds = [
            'file',
            'link',
            'html',
            'image',
            'video',
            'audio',
            'pdf',
            'notebook',
            'other',
        ];
        const artifacts = kinds.map((kind, index) => ({
            id: `artifact-${index}`,
            kind,
            storage: 'workspace',
            status: 'available',
            title: `${kind} artifact`,
            workspacePath: `output/${kind}`,
        }));
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        act(() => {
            root.render(_jsx(I18nProvider, { language: "en", children: _jsx(TurnOutputs, { turnId: "turn-1", workspaceCwd: "/primary", changes: [], artifacts: artifacts, scheduledTasks: [], onReviewChanges: () => { }, onOpenArtifact: () => { }, onOpenScheduledTask: () => { } }) }));
        });
        expect(Array.from(container.querySelectorAll('button')).filter((button) => button.textContent?.trim() === 'Download')).toHaveLength(kinds.length);
        act(() => root.unmount());
    });
    it('downloads workspace bytes with the artifact basename', async () => {
        const click = vi
            .spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(() => { });
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        act(() => {
            root.render(_jsx(I18nProvider, { language: "en", children: _jsx(TurnOutputs, { turnId: "turn-1", workspaceCwd: "/primary", changes: [], artifacts: [
                        {
                            id: 'artifact-1',
                            kind: 'pdf',
                            storage: 'workspace',
                            status: 'available',
                            title: 'Report',
                            workspacePath: 'reports/report.pdf',
                            mimeType: 'application/pdf',
                        },
                    ], scheduledTasks: [], onReviewChanges: () => { }, onOpenArtifact: () => { }, onOpenScheduledTask: () => { } }) }));
        });
        await act(async () => {
            const download = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Download');
            download?.click();
            await Promise.resolve();
        });
        expect(readFileBytes).toHaveBeenCalledWith('reports/report.pdf', {
            offset: 0,
            maxBytes: 100 * 1024,
        });
        expect(click).toHaveBeenCalledOnce();
        expect(click.mock.instances[0]?.download).toBe('report.pdf');
        expect(createdBlobs[0]?.type).toBe('application/pdf');
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:artifact');
        act(() => root.unmount());
    });
    it('routes a secondary workspace download through its qualified client', async () => {
        const click = vi
            .spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(() => { });
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        act(() => {
            root.render(_jsx(StrictMode, { children: _jsx(I18nProvider, { language: "en", children: _jsx(TurnOutputs, { turnId: "turn-secondary", workspaceCwd: "/secondary", changes: [], artifacts: [
                            {
                                id: 'secondary-artifact',
                                kind: 'file',
                                storage: 'workspace',
                                status: 'available',
                                title: 'Secondary report',
                                workspacePath: 'report.txt',
                            },
                        ], scheduledTasks: [], onReviewChanges: () => { }, onOpenArtifact: () => { }, onOpenScheduledTask: () => { } }) }) }));
        });
        await act(async () => {
            const download = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Download');
            download?.click();
            await Promise.resolve();
        });
        expect(workspaceByCwd).toHaveBeenCalledWith('/secondary');
        expect(secondaryReadFileBytes).toHaveBeenCalledWith('report.txt', {
            offset: 0,
            maxBytes: 100 * 1024,
        });
        expect(readFileBytes).not.toHaveBeenCalled();
        expect(click).toHaveBeenCalledOnce();
        act(() => root.unmount());
    });
    it('hides Download when the artifact workspace cannot be resolved', () => {
        workspaceByCwd.mockReturnValue(undefined);
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        act(() => {
            root.render(_jsx(I18nProvider, { language: "en", children: _jsx(TurnOutputs, { turnId: "turn-unknown", workspaceCwd: "/unknown", changes: [], artifacts: [
                        {
                            id: 'unknown-artifact',
                            kind: 'file',
                            storage: 'workspace',
                            status: 'available',
                            title: 'Unknown report',
                            workspacePath: 'report.txt',
                        },
                    ], scheduledTasks: [], onReviewChanges: () => { }, onOpenArtifact: () => { }, onOpenScheduledTask: () => { } }) }));
        });
        expect(Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Download')).toBeUndefined();
        expect(readFileBytes).not.toHaveBeenCalled();
        expect(secondaryReadFileBytes).not.toHaveBeenCalled();
        act(() => root.unmount());
    });
    it('stamps secondary ownership onto every panel open request', () => {
        const onOpenRequest = vi.fn();
        const artifact = {
            id: 'secondary-artifact',
            kind: 'file',
            storage: 'workspace',
            status: 'available',
            title: 'Secondary artifact',
            workspacePath: 'report.txt',
        };
        const scheduledTask = {
            id: 'secondary-task',
            toolCallId: 'task-call',
            title: 'Secondary schedule',
            cron: '0 9 * * *',
            prompt: 'secondary only',
            recurring: true,
            durable: true,
        };
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        act(() => {
            root.render(_jsx(I18nProvider, { language: "en", children: _jsx(TurnOutputs, { turnId: "turn-secondary", workspaceCwd: "/secondary", changes: [
                        {
                            path: 'changed.ts',
                            status: 'modified',
                            toolCallId: 'change-call',
                            isArtifact: false,
                            diffs: [],
                        },
                    ], artifacts: [artifact], scheduledTasks: [scheduledTask], onOpenRequest: onOpenRequest, onReviewChanges: () => { }, onOpenArtifact: () => { }, onOpenScheduledTask: () => { } }) }));
        });
        act(() => {
            container
                .querySelector('button[title="changed.ts"]')
                ?.click();
            container
                .querySelector('button[title="Secondary artifact"]')
                ?.click();
            container
                .querySelector('button[title="Secondary schedule"]')
                ?.click();
        });
        expect(onOpenRequest).toHaveBeenNthCalledWith(1, expect.objectContaining({
            kind: 'review',
            workspaceCwd: '/secondary',
            workspaceId: 'secondary-id',
        }));
        expect(onOpenRequest).toHaveBeenNthCalledWith(2, expect.objectContaining({
            kind: 'artifact',
            artifact,
            workspaceCwd: '/secondary',
            workspaceId: 'secondary-id',
        }));
        expect(onOpenRequest).toHaveBeenNthCalledWith(3, expect.objectContaining({
            kind: 'scheduled_task',
            task: expect.objectContaining({
                id: 'secondary-task',
                workspaceId: 'secondary-id',
            }),
            workspaceCwd: '/secondary',
            workspaceId: 'secondary-id',
        }));
        act(() => root.unmount());
    });
    it('disables repeated downloads and reports failures through the toast callback', async () => {
        let rejectStat;
        stat.mockReturnValue(new Promise((_resolve, reject) => {
            rejectStat = reject;
        }));
        const onError = vi.fn();
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        act(() => {
            root.render(_jsx(I18nProvider, { language: "en", children: _jsx(TurnOutputs, { turnId: "turn-1", workspaceCwd: "/primary", changes: [], artifacts: [
                        {
                            id: 'artifact-1',
                            kind: 'file',
                            storage: 'workspace',
                            status: 'available',
                            title: 'Report',
                            workspacePath: 'report.txt',
                        },
                    ], scheduledTasks: [], onReviewChanges: () => { }, onOpenArtifact: () => { }, onOpenScheduledTask: () => { }, onError: onError }) }));
        });
        const download = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Download');
        act(() => download?.click());
        expect(download?.disabled).toBe(true);
        expect(download?.textContent).toContain('Downloading');
        act(() => download?.click());
        expect(stat).toHaveBeenCalledTimes(1);
        await act(async () => {
            rejectStat?.(new Error('read denied'));
            await Promise.resolve();
        });
        expect(download?.disabled).toBe(false);
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Download failed: read denied' }), 'Download failed: read denied');
        act(() => root.unmount());
    });
    it('does not show Download for managed, pending, or pathless artifacts', () => {
        const artifacts = [
            {
                id: 'workspace-1',
                kind: 'file',
                storage: 'workspace',
                status: 'available',
                title: 'workspace artifact',
                workspacePath: 'output/file.txt',
            },
            {
                id: 'managed-1',
                kind: 'file',
                storage: 'managed',
                status: 'available',
                title: 'managed artifact',
                workspacePath: 'output/managed.txt',
            },
            {
                id: 'pending-1',
                kind: 'file',
                storage: 'workspace',
                status: 'pending',
                title: 'pending artifact',
                workspacePath: 'output/pending.txt',
            },
            {
                id: 'pathless-1',
                kind: 'file',
                storage: 'workspace',
                status: 'available',
                title: 'pathless artifact',
            },
        ];
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        act(() => {
            root.render(_jsx(I18nProvider, { language: "en", children: _jsx(TurnOutputs, { turnId: "turn-1", workspaceCwd: "/primary", changes: [], artifacts: artifacts, scheduledTasks: [], onReviewChanges: () => { }, onOpenArtifact: () => { }, onOpenScheduledTask: () => { } }) }));
        });
        expect(Array.from(container.querySelectorAll('button')).filter((button) => button.textContent?.trim() === 'Download')).toHaveLength(1);
        act(() => root.unmount());
    });
    it('cancels the read and skips the save when the card unmounts mid-download', async () => {
        const click = vi
            .spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(() => { });
        let resolveRead;
        readFileBytes.mockReturnValue(new Promise((resolve) => {
            resolveRead = resolve;
        }));
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        act(() => {
            root.render(_jsx(I18nProvider, { language: "en", children: _jsx(TurnOutputs, { turnId: "turn-1", workspaceCwd: "/primary", changes: [], artifacts: [
                        {
                            id: 'artifact-1',
                            kind: 'file',
                            storage: 'workspace',
                            status: 'available',
                            title: 'Report',
                            workspacePath: 'report.txt',
                        },
                    ], scheduledTasks: [], onReviewChanges: () => { }, onOpenArtifact: () => { }, onOpenScheduledTask: () => { } }) }));
        });
        const download = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Download');
        act(() => download?.click());
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(readFileBytes).toHaveBeenCalledTimes(1);
        act(() => root.unmount());
        await act(async () => {
            resolveRead?.({
                contentBase64: btoa('abc'),
                offset: 0,
                returnedBytes: 3,
                sizeBytes: 3,
            });
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(click).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=TurnOutputs.dom.test.js.map