/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExtensionManager } from '@qwen-code/qwen-code-core';
import { resolveLanguageSetting } from '../../i18n/index.js';
import { createExtensionsController, redactExtensionDisplaySource, } from './workspace-extensions-controller.js';
vi.mock('../../i18n/index.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        resolveLanguageSetting: vi.fn().mockReturnValue('en'),
    };
});
describe('redactExtensionDisplaySource', () => {
    it('keeps uploaded filenames readable while hiding their identity token', () => {
        expect(redactExtensionDisplaySource('upload:v1:550e8400-e29b-41d4-a716-446655440000:扩展?#.zip')).toBe('upload:扩展?#.zip');
        expect(redactExtensionDisplaySource('upload:legacy?#.zip')).toBe('upload:legacy?#.zip');
    });
});
describe('createExtensionsController', () => {
    beforeEach(() => {
        vi.mocked(resolveLanguageSetting).mockReturnValue('en');
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });
    it('releases the commit lane when a manual refresh times out', async () => {
        vi.useFakeTimers();
        let refreshCalls = 0;
        let releaseRefresh;
        const controller = createExtensionsController({
            boundWorkspace: '/work/bound',
            bridge: {},
            workspace: {
                refreshExtensionsForAllSessions: () => {
                    refreshCalls += 1;
                    if (refreshCalls > 1) {
                        return Promise.resolve({ refreshed: 1, failed: 0 });
                    }
                    return new Promise((resolve) => {
                        releaseRefresh = resolve;
                    });
                },
            },
        });
        const outcome = controller.refreshExtensionsForAllSessions().then(() => 'resolved', (error) => (error instanceof Error ? error.message : 'error'));
        await vi.advanceTimersByTimeAsync(30_000);
        expect(await Promise.race([outcome, Promise.resolve('pending')])).toBe('extension refresh timed out after 30000ms');
        const nextOutcome = controller.refreshExtensionsForAllSessions().then((result) => result, (error) => (error instanceof Error ? error.message : 'error'));
        await vi.advanceTimersByTimeAsync(0);
        expect(refreshCalls).toBe(2);
        await expect(nextOutcome).resolves.toEqual({ refreshed: 1, failed: 0 });
        releaseRefresh?.({ refreshed: 0, failed: 0 });
        await vi.advanceTimersByTimeAsync(0);
    });
    it('releases the commit lane at the durable commit boundary', async () => {
        let finishPostCommit;
        const postCommit = new Promise((resolve) => {
            finishPostCommit = resolve;
        });
        const controller = createExtensionsController({
            boundWorkspace: '/work/bound',
            bridge: {},
            workspace: {},
        });
        const manager = {
            refreshCache: vi.fn(async () => undefined),
        };
        const response = () => ({
            status: vi.fn().mockReturnThis(),
            location: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            json: vi.fn(),
        });
        let firstCommitted;
        const durableCommit = new Promise((resolve) => {
            firstCommitted = resolve;
        });
        let finishFirstOperation;
        const firstOperationFinished = new Promise((resolve) => {
            finishFirstOperation = resolve;
        });
        let finishSecondOperation;
        const secondOperationFinished = new Promise((resolve) => {
            finishSecondOperation = resolve;
        });
        let secondStarted = false;
        controller.runQueuedExtensionMutation('install', { name: 'first' }, response(), async (_extensionManager, _signal, context) => {
            await context.commit(async (onCommitted) => {
                onCommitted(1);
                firstCommitted();
                await postCommit;
                return { generation: 1 };
            });
            finishFirstOperation();
            return { status: 'installed', name: 'first' };
        }, { manager, skipRefresh: true });
        await durableCommit;
        controller.runQueuedExtensionMutation('enable', { name: 'second' }, response(), async (_extensionManager, _signal, context) => {
            await context.commit(async (onCommitted) => {
                secondStarted = true;
                onCommitted(2);
                return { generation: 2 };
            });
            finishSecondOperation();
            return { status: 'enabled', name: 'second' };
        }, { manager, skipRefresh: true });
        await vi.waitFor(() => expect(secondStarted).toBe(true));
        finishPostCommit();
        await Promise.all([firstOperationFinished, secondOperationFinished]);
    });
    it('does not commit after the captured runtime generation closes', async () => {
        let generationOpen = true;
        const controller = createExtensionsController({
            boundWorkspace: '/work/bound',
            bridge: {},
            workspace: {},
            captureGenerationAssertion: () => () => {
                if (!generationOpen)
                    throw new Error('generation closed');
            },
        });
        const manager = {
            refreshCache: vi.fn(async () => undefined),
        };
        const responseBody = vi.fn();
        const response = {
            status: vi.fn().mockReturnThis(),
            location: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            json: responseBody,
        };
        const commit = vi.fn(async () => ({ generation: 1 }));
        controller.runQueuedExtensionMutation('install', { name: 'demo' }, response, async (_extensionManager, _signal, context) => {
            await context.commit(commit);
            return { status: 'installed', name: 'demo' };
        }, { manager, skipRefresh: true });
        generationOpen = false;
        const operationId = responseBody.mock.calls[0]?.[0].operationId;
        await vi.waitFor(() => expect(controller.getOperation(operationId)).toMatchObject({
            status: 'failed',
            error: 'generation closed',
        }));
        expect(commit).not.toHaveBeenCalled();
    });
    it('starts the status cache lifetime after a slow refresh completes', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(0);
        const refreshCache = vi
            .spyOn(ExtensionManager.prototype, 'refreshCache')
            .mockImplementation(async () => {
            vi.setSystemTime(3_000);
        });
        vi.spyOn(ExtensionManager.prototype, 'getLoadedExtensions').mockReturnValue([]);
        const controller = createExtensionsController({
            boundWorkspace: '/work/bound',
            bridge: {},
            workspace: {},
        });
        await controller.buildLocalExtensionsStatus();
        await controller.buildLocalExtensionsStatus();
        expect(refreshCache).toHaveBeenCalledOnce();
    });
    it('normalizes the current language when resolving extension metadata', async () => {
        vi.mocked(resolveLanguageSetting).mockImplementation((language) => language === 'zh_TW' ? 'zh_TW' : 'en');
        const extensionDir = await mkdtemp(join(tmpdir(), 'qwen-localized-extension-'));
        try {
            await mkdir(join(extensionDir, '.qwen'));
            await writeFile(join(extensionDir, '.qwen', 'settings.json'), JSON.stringify({ general: { language: 'zh_TW' } }));
            await writeFile(join(extensionDir, 'qwen-extension.json'), JSON.stringify({
                name: 'localized-extension',
                displayName: { en: 'English name', 'zh-TW': '繁體名稱' },
            }));
            const controller = createExtensionsController({
                boundWorkspace: extensionDir,
                bridge: {},
                workspace: {},
            });
            const config = controller
                .createExtensionManager(extensionDir, true)
                .loadExtensionConfig({ extensionDir });
            expect(config.displayName).toBe('繁體名稱');
            expect(resolveLanguageSetting).toHaveBeenCalledWith('zh_TW');
        }
        finally {
            await rm(extensionDir, { recursive: true, force: true });
        }
    });
    it('invalidates the status cache when the current language changes', async () => {
        const refreshCache = vi
            .spyOn(ExtensionManager.prototype, 'refreshCache')
            .mockResolvedValue(undefined);
        vi.spyOn(ExtensionManager.prototype, 'getLoadedExtensions').mockReturnValue([]);
        const controller = createExtensionsController({
            boundWorkspace: '/work/bound',
            bridge: {},
            workspace: {},
        });
        await controller.buildLocalExtensionsStatus();
        await controller.buildLocalExtensionsStatus();
        vi.mocked(resolveLanguageSetting).mockReturnValue('zh');
        await controller.buildLocalExtensionsStatus();
        expect(refreshCache).toHaveBeenCalledTimes(2);
    });
    it('reports an accepted operation as running while its cache refreshes', async () => {
        let finishRefresh;
        const refreshPending = new Promise((resolve) => {
            finishRefresh = resolve;
        });
        const manager = {
            refreshCache: vi.fn(async () => await refreshPending),
        };
        const responseBody = vi.fn();
        const response = {
            status: vi.fn().mockReturnThis(),
            location: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            json: responseBody,
        };
        const controller = createExtensionsController({
            boundWorkspace: '/work/bound',
            bridge: {},
            workspace: {},
        });
        controller.runQueuedExtensionMutation('install', { name: 'demo' }, response, async () => ({ status: 'installed', name: 'demo', updated: false }), { manager, skipRefresh: true });
        const operationId = responseBody.mock.calls[0]?.[0].operationId;
        await vi.waitFor(() => expect(manager.refreshCache).toHaveBeenCalledOnce());
        expect(controller.getOperation(operationId)).toMatchObject({
            status: 'running',
            phase: 'preparing',
        });
        finishRefresh();
        await vi.waitFor(() => expect(controller.getOperation(operationId)?.status).toBe('succeeded'));
    });
    it('reports an operation as preparing while any parallel preparation is active', async () => {
        let releaseBlocker;
        const blocker = new Promise((resolve) => {
            releaseBlocker = resolve;
        });
        let releaseFirst;
        const first = new Promise((resolve) => {
            releaseFirst = resolve;
        });
        let firstStarted;
        const firstActive = new Promise((resolve) => {
            firstStarted = resolve;
        });
        const controller = createExtensionsController({
            boundWorkspace: '/work/bound',
            bridge: {},
            workspace: {},
        });
        const manager = {
            refreshCache: vi.fn(async () => undefined),
        };
        const responseBody = vi.fn();
        const response = {
            status: vi.fn().mockReturnThis(),
            location: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            json: responseBody,
        };
        const held = controller.preparationQueue.run(async () => await blocker);
        controller.runQueuedExtensionMutation('install', { name: 'demo' }, response, async (_extensionManager, _signal, context) => {
            await Promise.all([
                context.prepare(async () => {
                    firstStarted();
                    await first;
                }),
                context.prepare(async () => undefined),
            ]);
            return { status: 'installed', name: 'demo', updated: false };
        }, { manager, skipRefresh: true });
        const operationId = responseBody.mock.calls[0]?.[0].operationId;
        await firstActive;
        expect(controller.getOperation(operationId)).toMatchObject({
            status: 'running',
            phase: 'preparing',
        });
        releaseFirst();
        releaseBlocker();
        await held;
        await vi.waitFor(() => expect(controller.getOperation(operationId)).toMatchObject({
            status: 'succeeded',
            phase: undefined,
        }));
    });
    it('clears phase from every terminal operation state', async () => {
        vi.spyOn(process.stderr, 'write').mockReturnValue(true);
        const controller = createExtensionsController({
            boundWorkspace: '/work/bound',
            bridge: {
                broadcastExtensionsChanged: vi.fn(),
            },
            workspace: {},
        });
        const manager = {
            refreshCache: vi.fn(async () => undefined),
        };
        const response = () => {
            const responseBody = vi.fn();
            return {
                responseBody,
                value: {
                    status: vi.fn().mockReturnThis(),
                    location: vi.fn().mockReturnThis(),
                    set: vi.fn().mockReturnThis(),
                    json: responseBody,
                },
            };
        };
        const run = async (operation) => {
            const res = response();
            controller.runQueuedExtensionMutation('install', { name: 'demo' }, res.value, operation, { manager, skipRefresh: true });
            const operationId = res.responseBody.mock.calls[0]?.[0]
                .operationId;
            await vi.waitFor(() => expect(controller.getOperation(operationId)?.status).toMatch(/^(succeeded|succeeded_with_warnings|failed)$/));
            return controller.getOperation(operationId);
        };
        await expect(run(async () => ({
            status: 'installed',
            name: 'demo',
            updated: false,
        }))).resolves.toMatchObject({ status: 'succeeded', phase: undefined });
        await expect(run(async (_extensionManager, _signal, context) => {
            await context.commit(async () => ({
                generation: 1,
                warnings: [{ code: 'cleanup_failed', error: 'cleanup failed' }],
            }));
            return { status: 'installed', name: 'demo', updated: false };
        })).resolves.toMatchObject({
            status: 'succeeded_with_warnings',
            phase: undefined,
        });
        await expect(run(async () => {
            throw new Error('prepare failed');
        })).resolves.toMatchObject({ status: 'failed', phase: undefined });
    });
    it('aborts timed-out preparation without committing and releases its slot', async () => {
        vi.useFakeTimers();
        vi.spyOn(process.stderr, 'write').mockReturnValue(true);
        let releaseBlocker;
        const blocker = new Promise((resolve) => {
            releaseBlocker = resolve;
        });
        const controller = createExtensionsController({
            boundWorkspace: '/work/bound',
            bridge: {
                broadcastExtensionsChanged: vi.fn(),
            },
            workspace: {},
        });
        const manager = {
            refreshCache: vi.fn(async () => undefined),
        };
        const responseBody = vi.fn();
        const response = {
            status: vi.fn().mockReturnThis(),
            location: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            json: responseBody,
        };
        const commit = vi.fn(async () => ({ generation: 1 }));
        const held = controller.preparationQueue.run(async () => await blocker);
        controller.runQueuedExtensionMutation('install', { name: 'demo' }, response, async (_extensionManager, _signal, context) => {
            await context.prepare(async (signal) => await new Promise((_resolve, reject) => {
                signal.addEventListener('abort', () => reject(signal.reason), {
                    once: true,
                });
            }));
            await context.commit(commit);
            return { status: 'installed', name: 'demo' };
        }, { manager, deadlineMs: 100 });
        await vi.advanceTimersByTimeAsync(0);
        const operationId = responseBody.mock.calls[0]?.[0].operationId;
        let probeStarted = false;
        const probe = controller.preparationQueue.run(async () => {
            probeStarted = true;
        });
        expect(probeStarted).toBe(false);
        await vi.advanceTimersByTimeAsync(100);
        await probe;
        expect(controller.getOperation(operationId)).toMatchObject({
            status: 'failed',
            code: 'extension_prepare_timeout',
        });
        expect(commit).not.toHaveBeenCalled();
        expect(probeStarted).toBe(true);
        releaseBlocker();
        await held;
    });
    it('does not commit preparation that settles after its deadline', async () => {
        vi.useFakeTimers();
        vi.spyOn(process.stderr, 'write').mockReturnValue(true);
        let finishPreparation;
        const preparation = new Promise((resolve) => {
            finishPreparation = resolve;
        });
        const controller = createExtensionsController({
            boundWorkspace: '/work/bound',
            bridge: {
                broadcastExtensionsChanged: vi.fn(),
            },
            workspace: {},
        });
        const manager = {
            refreshCache: vi.fn(async () => undefined),
        };
        const responseBody = vi.fn();
        const response = {
            status: vi.fn().mockReturnThis(),
            location: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            json: responseBody,
        };
        const commit = vi.fn(async () => ({ generation: 1 }));
        controller.runQueuedExtensionMutation('install', { name: 'demo' }, response, async (_extensionManager, _signal, context) => {
            await context.prepare(async () => await preparation);
            await context.commit(commit);
            return { status: 'installed', name: 'demo' };
        }, { manager, deadlineMs: 100 });
        await vi.advanceTimersByTimeAsync(0);
        const operationId = responseBody.mock.calls[0]?.[0].operationId;
        await vi.advanceTimersByTimeAsync(100);
        finishPreparation();
        await vi.advanceTimersByTimeAsync(0);
        await vi.waitFor(() => expect(controller.getOperation(operationId)).toMatchObject({
            status: 'failed',
            code: 'extension_prepare_timeout',
        }));
        expect(commit).not.toHaveBeenCalled();
    });
    it('releases the operation slot when the acceptance response throws', () => {
        let operationId;
        const throwingResponse = {
            status: vi.fn().mockReturnThis(),
            location: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            json: vi.fn((body) => {
                operationId = body.operationId;
                throw new Error('socket closed');
            }),
        };
        const controller = createExtensionsController({
            boundWorkspace: '/work/bound',
            bridge: {},
            workspace: {},
        });
        expect(() => controller.runQueuedExtensionMutation('install', {}, throwingResponse, async () => ({ status: 'installed' }))).not.toThrow();
        expect(operationId).toBeDefined();
        expect(controller.getOperation(operationId)).toBeUndefined();
        const response = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        const releases = Array.from({ length: 10 }, () => controller.acquireOperationSlot(response));
        expect(releases.every(Boolean)).toBe(true);
        releases.forEach((release) => release?.());
    });
});
//# sourceMappingURL=workspace-extensions-controller.test.js.map