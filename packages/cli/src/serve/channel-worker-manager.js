/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { ChannelWebhookEnqueueError } from './channel-webhook-ipc.js';
import { ChannelDeliveryError, } from '../runtime/channel-delivery-ipc.js';
import { ChannelWorkerReconcileError } from './channel-worker-group.js';
import { ChannelWorkerStartupError, ChannelWorkerStopError, } from './channel-worker-supervisor.js';
export class ChannelWorkerControlError extends Error {
    code;
    rolledBack;
    rollbackError;
    startupFailures;
    startupFailuresTruncated;
    constructor(code, message, details = {}) {
        super(message);
        this.name = 'ChannelWorkerControlError';
        this.code = code;
        this.rolledBack = details.rolledBack;
        this.rollbackError = details.rollbackError;
        this.startupFailures = details.startupFailures?.map((failure) => ({
            ...failure,
        }));
        this.startupFailuresTruncated = details.startupFailuresTruncated;
    }
}
const DISABLED_SNAPSHOT = {
    enabled: false,
    state: 'disabled',
    channels: [],
};
function cloneSelection(selection) {
    return selection.mode === 'all'
        ? { mode: 'all' }
        : { mode: 'names', names: [...selection.names] };
}
function cloneGroups(groups) {
    return groups.map((group) => ({
        workspaceCwd: group.workspaceCwd,
        selection: cloneSelection(group.selection),
    }));
}
function selectionsEqual(left, right) {
    if (!left || left.mode !== right.mode)
        return false;
    if (left.mode === 'all')
        return true;
    if (right.mode === 'all' || left.names.length !== right.names.length) {
        return false;
    }
    return left.names.every((name, index) => name === right.names[index]);
}
function isPartial(workers) {
    return workers.some((worker) => {
        if (!worker.requestedChannels)
            return false;
        const connected = new Set(worker.channels);
        return worker.requestedChannels.some((name) => !connected.has(name));
    });
}
function groupIncludesName(group, name) {
    return group.selection.mode === 'all' || group.selection.names.includes(name);
}
function assertRequiredOwner(targetGroups, requiredOwner) {
    const owners = targetGroups.filter((target) => groupIncludesName(target, requiredOwner.name));
    if (owners.length !== 1 ||
        owners[0].workspaceCwd !== requiredOwner.workspaceCwd) {
        throw new ChannelWorkerControlError('channel_runtime_owner_mismatch', `Channel "${requiredOwner.name}" does not resolve to workspace "${requiredOwner.workspaceCwd}".`);
    }
}
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function startupFailureDetails(error) {
    if (!(error instanceof ChannelWorkerStartupError ||
        error instanceof ChannelWorkerReconcileError) ||
        !error.startupFailures) {
        return {};
    }
    return {
        startupFailures: error.startupFailures,
        ...(error.startupFailuresTruncated
            ? { startupFailuresTruncated: true }
            : {}),
    };
}
export function createChannelWorkerManager(opts) {
    let committedSelection;
    let committedGroups = [];
    let pendingSelection;
    let transition = 'idle';
    let group;
    let leaseReserved = opts.initialLeaseReserved === true;
    let draining = false;
    let hardKilled = false;
    let lane = Promise.resolve();
    const workspaceDrains = new Set();
    const snapshot = () => ({
        enabled: committedSelection !== undefined || group !== undefined || leaseReserved,
        selection: committedSelection ? cloneSelection(committedSelection) : null,
        ...(pendingSelection
            ? { pendingSelection: cloneSelection(pendingSelection) }
            : {}),
        transition,
        workers: group?.snapshots() ?? [],
    });
    const notify = () => {
        opts.onStateChange?.(snapshot());
    };
    const enqueue = (operation) => {
        const result = lane.then(operation, operation);
        lane = result.then(() => undefined, () => undefined);
        return result;
    };
    const drainingError = () => new ChannelWorkerControlError('daemon_draining', 'Daemon is shutting down.');
    const reserve = (selection) => {
        if (leaseReserved)
            return;
        opts.reserveLease(selection);
        leaseReserved = true;
    };
    const release = () => {
        if (!leaseReserved)
            return;
        opts.releaseLease();
        leaseReserved = false;
    };
    const setTransition = (next, pending) => {
        transition = next;
        pendingSelection = pending ? cloneSelection(pending) : undefined;
        notify();
    };
    const commit = (selection, groups) => {
        committedSelection = selection ? cloneSelection(selection) : undefined;
        committedGroups = cloneGroups(groups);
        transition = 'idle';
        pendingSelection = undefined;
        opts.onCommittedSelection?.(committedSelection, groups);
        notify();
    };
    const classifyFailure = (error, fallbackCode) => {
        if (error instanceof ChannelWorkerReconcileError) {
            return new ChannelWorkerControlError(error.stopFailed ? 'channel_worker_stop_failed' : fallbackCode, error.message, {
                rolledBack: error.rolledBack,
                ...(error.rollbackError
                    ? { rollbackError: error.rollbackError }
                    : {}),
                ...startupFailureDetails(error),
            });
        }
        return new ChannelWorkerControlError(error instanceof ChannelWorkerStopError
            ? 'channel_worker_stop_failed'
            : fallbackCode, errorMessage(error), startupFailureDetails(error));
    };
    const applySelection = async (selection, initial, resolvedGroups) => {
        if (hardKilled)
            throw drainingError();
        const enabling = !snapshot().enabled;
        const replacing = committedSelection !== undefined;
        const sameSelection = selectionsEqual(committedSelection, selection);
        if (sameSelection && group?.isHealthy()) {
            return {
                changed: false,
                replaced: false,
                partial: isPartial(group.snapshots()),
                state: snapshot(),
                created: false,
            };
        }
        setTransition(replacing ? 'reconciling' : 'starting', selection);
        let targetGroups;
        try {
            targetGroups =
                resolvedGroups ??
                    (await opts.resolveGroups(selection, initial ? 'initial' : 'set'));
            if (hardKilled)
                throw drainingError();
            reserve(selection);
        }
        catch (error) {
            setTransition('idle');
            throw error;
        }
        if (!group) {
            let candidate;
            try {
                candidate = opts.createGroup(targetGroups);
            }
            catch (error) {
                let cleanupError;
                if (!initial) {
                    try {
                        release();
                    }
                    catch (releaseError) {
                        cleanupError = releaseError;
                    }
                }
                setTransition('idle');
                throw new ChannelWorkerControlError('channel_worker_start_failed', errorMessage(error), cleanupError
                    ? { rolledBack: false, rollbackError: errorMessage(cleanupError) }
                    : { rolledBack: !initial });
            }
            group = candidate;
            for (const workspaceCwd of workspaceDrains) {
                candidate.beginWorkspaceDrain(workspaceCwd);
            }
            notify();
            try {
                await candidate.start();
            }
            catch (error) {
                const startupDetails = startupFailureDetails(error);
                let cleanupError;
                try {
                    await candidate.stop();
                }
                catch (stopError) {
                    cleanupError = stopError;
                }
                if (!cleanupError) {
                    if (!initial) {
                        try {
                            release();
                        }
                        catch (releaseError) {
                            cleanupError = releaseError;
                        }
                    }
                    if (!cleanupError)
                        group = undefined;
                }
                setTransition('idle');
                throw new ChannelWorkerControlError('channel_worker_start_failed', errorMessage(error), cleanupError
                    ? {
                        rolledBack: false,
                        rollbackError: errorMessage(cleanupError),
                        ...startupDetails,
                    }
                    : { rolledBack: true, ...startupDetails });
            }
            commit(selection, targetGroups);
            return {
                changed: true,
                replaced: false,
                partial: isPartial(candidate.snapshots()),
                state: snapshot(),
                created: enabling,
            };
        }
        try {
            const result = await group.reconcile(targetGroups, {
                onRollingBack: () => setTransition('rolling_back', selection),
            });
            commit(selection, targetGroups);
            return {
                changed: result.changed || !sameSelection,
                replaced: !sameSelection,
                partial: isPartial(result.workers),
                state: snapshot(),
                created: enabling,
            };
        }
        catch (error) {
            setTransition('idle');
            throw classifyFailure(error, 'channel_worker_start_failed');
        }
    };
    const committedChannelNames = () => {
        if (!committedSelection)
            return [];
        if (committedSelection.mode === 'names') {
            return [...committedSelection.names];
        }
        const names = new Set();
        for (const worker of group?.snapshots() ?? []) {
            for (const name of worker.requestedChannels ?? worker.channels) {
                names.add(name);
            }
        }
        return [...names];
    };
    const assertCommittedOwner = (requiredOwner) => {
        const owners = (group?.snapshots() ?? []).filter((worker) => worker.adapters?.some((adapter) => adapter.name === requiredOwner.name) ||
            worker.requestedChannels?.includes(requiredOwner.name) ||
            worker.channels.includes(requiredOwner.name));
        if (owners.length !== 1 ||
            owners[0].workspaceCwd !== requiredOwner.workspaceCwd) {
            throw new ChannelWorkerControlError('channel_runtime_owner_mismatch', `Channel "${requiredOwner.name}" does not have one confirmed runtime owner in workspace "${requiredOwner.workspaceCwd}".`);
        }
    };
    const stopSelectionNow = async () => {
        const hadState = group !== undefined || leaseReserved;
        if (!hadState) {
            return { changed: false, state: snapshot() };
        }
        setTransition('stopping');
        try {
            if (group) {
                await group.stop();
                group = undefined;
            }
            release();
        }
        catch (error) {
            setTransition('idle');
            throw classifyFailure(error, 'channel_worker_stop_failed');
        }
        commit(undefined, []);
        return { changed: hadState, state: snapshot() };
    };
    const manager = {
        async startInitial(selection) {
            if (draining)
                throw drainingError();
            await enqueue(async () => {
                await applySelection(selection, true);
            });
        },
        setSelection(selection, requiredOwner) {
            if (draining) {
                return Promise.reject(drainingError());
            }
            return enqueue(async () => {
                if (!requiredOwner)
                    return applySelection(selection, false);
                const targetGroups = await opts.resolveGroups(selection, 'set');
                assertRequiredOwner(targetGroups, requiredOwner);
                if (hardKilled)
                    throw drainingError();
                return applySelection(selection, false, targetGroups);
            });
        },
        setChannelEnabled(owner, enabled) {
            if (draining) {
                return Promise.reject(drainingError());
            }
            return enqueue(async () => {
                const committedNames = committedChannelNames();
                const currentlyEnabled = committedNames.includes(owner.name);
                if (currentlyEnabled)
                    assertCommittedOwner(owner);
                if (enabled) {
                    if (currentlyEnabled) {
                        return {
                            changed: false,
                            replaced: false,
                            partial: isPartial(group?.snapshots() ?? []),
                            state: snapshot(),
                            created: false,
                        };
                    }
                    const selection = {
                        mode: 'names',
                        names: [...committedNames, owner.name],
                    };
                    const targetGroups = await opts.resolveGroups(selection, 'set');
                    assertRequiredOwner(targetGroups, owner);
                    if (hardKilled)
                        throw drainingError();
                    return applySelection(selection, false, targetGroups);
                }
                if (!currentlyEnabled) {
                    return { changed: false, state: snapshot() };
                }
                const names = committedNames.filter((name) => name !== owner.name);
                return names.length === 0
                    ? stopSelectionNow()
                    : applySelection({ mode: 'names', names }, false);
            });
        },
        stopSelection() {
            if (draining) {
                return Promise.reject(drainingError());
            }
            return enqueue(stopSelectionNow);
        },
        reload() {
            if (draining) {
                return Promise.reject(drainingError());
            }
            return enqueue(async () => {
                if (!group || !committedSelection) {
                    throw new ChannelWorkerControlError('channel_worker_not_enabled', 'This daemon has no channel worker to reload.');
                }
                setTransition('reconciling', committedSelection);
                let targetGroups;
                try {
                    targetGroups = await opts.resolveGroups(committedSelection, 'reload');
                }
                catch (error) {
                    setTransition('idle');
                    throw error;
                }
                if (hardKilled)
                    throw drainingError();
                try {
                    await group.reconcile(targetGroups, {
                        force: true,
                        onRollingBack: () => setTransition('rolling_back', committedSelection),
                    });
                }
                catch (error) {
                    setTransition('idle');
                    throw classifyFailure(error, 'channel_worker_start_failed');
                }
                commit(committedSelection, targetGroups);
                const snapshots = group.snapshots();
                return (snapshots.find((worker) => worker.primary) ??
                    snapshots[0] ?? { ...DISABLED_SNAPSHOT });
            });
        },
        reloadWorkspace(workspaceCwd, name) {
            if (draining) {
                return Promise.reject(drainingError());
            }
            return enqueue(async () => {
                if (!group || !committedSelection) {
                    throw new ChannelWorkerControlError('channel_worker_not_enabled', 'This daemon has no channel worker to reload.');
                }
                setTransition('reconciling', committedSelection);
                let targetGroups;
                try {
                    targetGroups = await opts.resolveGroups(committedSelection, 'reload');
                    assertRequiredOwner(targetGroups, { name, workspaceCwd });
                    if (targetGroups.filter((target) => target.workspaceCwd === workspaceCwd).length !== 1 ||
                        committedGroups.filter((target) => target.workspaceCwd === workspaceCwd).length !== 1) {
                        throw new ChannelWorkerControlError('channel_runtime_owner_mismatch', `Workspace "${workspaceCwd}" does not own a committed channel worker.`);
                    }
                }
                catch (error) {
                    setTransition('idle');
                    throw error;
                }
                if (hardKilled)
                    throw drainingError();
                try {
                    await group.reconcile(targetGroups, {
                        forceWorkspaceCwd: workspaceCwd,
                        onRollingBack: () => setTransition('rolling_back', committedSelection),
                    });
                }
                catch (error) {
                    setTransition('idle');
                    throw classifyFailure(error, 'channel_worker_start_failed');
                }
                const targetGroup = targetGroups.find((target) => target.workspaceCwd === workspaceCwd);
                const nextCommittedGroups = committedGroups.map((committedGroup) => committedGroup.workspaceCwd === workspaceCwd
                    ? targetGroup
                    : committedGroup);
                commit(committedSelection, nextCommittedGroups);
                const worker = group
                    .snapshots()
                    .find((snapshot) => snapshot.workspaceCwd === workspaceCwd);
                if (!worker) {
                    throw new ChannelWorkerControlError('channel_runtime_owner_mismatch', `Workspace "${workspaceCwd}" has no channel worker after reload.`);
                }
                return worker;
            });
        },
        state: snapshot,
        primarySnapshot: () => group?.primarySnapshot() ?? { ...DISABLED_SNAPSHOT },
        snapshots: () => group?.snapshots() ?? [],
        committedChannelNames,
        enqueueWebhookTask(task) {
            if (!group || draining) {
                return Promise.reject(new ChannelWebhookEnqueueError('channel_worker_unavailable', draining
                    ? 'Daemon is shutting down.'
                    : 'Channel worker is not running.'));
            }
            return group.enqueueWebhookTask(task);
        },
        deliverChannelMessage(workspaceCwd, request) {
            if (!group || draining) {
                return Promise.reject(new ChannelDeliveryError('channel_worker_unavailable', draining
                    ? 'Daemon is shutting down.'
                    : 'Channel worker is not running.'));
            }
            return group.deliverChannelMessage(request, workspaceCwd);
        },
        beginWorkspaceDrain(workspaceCwd) {
            workspaceDrains.add(workspaceCwd);
            group?.beginWorkspaceDrain(workspaceCwd);
        },
        cancelWorkspaceDrain(workspaceCwd) {
            workspaceDrains.delete(workspaceCwd);
            group?.cancelWorkspaceDrain(workspaceCwd);
        },
        workspaceActivity(workspaceCwd) {
            return group?.workspaceActivity(workspaceCwd) ?? 0;
        },
        removeWorkspace(workspaceCwd) {
            return enqueue(async () => {
                try {
                    await group?.removeWorkspace(workspaceCwd);
                    notify();
                }
                finally {
                    workspaceDrains.delete(workspaceCwd);
                }
            });
        },
        restoreWorkspace(workspaceCwd) {
            return enqueue(async () => {
                await group?.restoreWorkspace(workspaceCwd);
                notify();
            });
        },
        refreshWorkspaces() {
            return enqueue(async () => {
                if (!group || !committedSelection)
                    return;
                setTransition('reconciling', committedSelection);
                let targetGroups;
                try {
                    targetGroups = await opts.resolveGroups(committedSelection, 'reload');
                }
                catch (error) {
                    setTransition('idle');
                    throw error;
                }
                if (hardKilled)
                    throw drainingError();
                try {
                    await group.reconcile(targetGroups);
                }
                catch (error) {
                    setTransition('idle');
                    throw classifyFailure(error, 'channel_worker_start_failed');
                }
                commit(committedSelection, targetGroups);
            });
        },
        workerChanged: notify,
        shutdown() {
            draining = true;
            return enqueue(async () => {
                if (group || leaseReserved)
                    setTransition('stopping');
                try {
                    if (group) {
                        await group.stop();
                        group = undefined;
                    }
                    release();
                }
                catch (error) {
                    setTransition('idle');
                    throw classifyFailure(error, 'channel_worker_stop_failed');
                }
                commit(undefined, []);
            });
        },
        killAllSync() {
            draining = true;
            hardKilled = true;
            group?.killAllSync();
            pendingSelection = undefined;
            transition = 'idle';
            notify();
        },
    };
    return manager;
}
//# sourceMappingURL=channel-worker-manager.js.map