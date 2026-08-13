/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { redactLogCredentials } from '@qwen-code/acp-bridge/logRedaction';
import { canonicalizeWorkspace } from '@qwen-code/acp-bridge/workspacePaths';
import { PairingStore, sanitizeLogText, } from '@qwen-code/channel-base';
import { resolveChannelCwd } from '../commands/channel/channel-cwd.js';
import { getPlugin } from '../commands/channel/channel-registry.js';
import { isAllChannelSelectionName } from './channel-selection.js';
import { normalizeWorkerDiagnostic } from './channel-worker-diagnostics.js';
export class ChannelManagementError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'ChannelManagementError';
    }
}
function diagnostic(error) {
    const message = error instanceof Error ? error.message : String(error);
    return sanitizeLogText(redactLogCredentials(normalizeWorkerDiagnostic(message)), 512);
}
function usesEnvironment(value) {
    return typeof value === 'string' && /^\$[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}
export function createChannelManagementService(opts) {
    const diagnostics = new Map();
    let mutationTail = Promise.resolve();
    const inMutationLane = (mutation) => {
        const result = mutationTail.then(mutation, mutation);
        mutationTail = result.then(() => undefined, () => undefined);
        return result;
    };
    const assertExpectedRevision = (snapshot, expectedRevision) => {
        if (snapshot.revision !== expectedRevision) {
            throw new ChannelManagementError('channel_settings_conflict', 'Channel settings changed; reload before trying again.');
        }
    };
    const workerFor = (name) => {
        const matches = opts.manager
            .state()
            .workers.filter((worker) => worker.adapters?.some((adapter) => adapter.name === name) ||
            worker.requestedChannels?.includes(name) ||
            worker.channels.includes(name));
        return matches;
    };
    const workspaceCommittedNames = () => opts.manager
        .committedChannelNames()
        .filter((name) => workerFor(name).some((w) => w.workspaceCwd === opts.workspaceCwd));
    const assertOwnedRuntime = (name) => {
        if (!workspaceCommittedNames().includes(name))
            return;
        const workers = workerFor(name).filter((worker) => worker.workspaceCwd === opts.workspaceCwd);
        if (workers.length !== 1) {
            throw new ChannelManagementError('channel_runtime_owner_mismatch', `Channel "${name}" does not have one confirmed runtime owner in this workspace.`);
        }
    };
    const runtimeFor = (name) => {
        const retainedError = diagnostics.get(name);
        if (retainedError)
            return { state: 'error', lastError: retainedError };
        if (!workspaceCommittedNames().includes(name)) {
            return { state: 'stopped' };
        }
        const state = opts.manager.state();
        const workers = workerFor(name).filter((worker) => worker.workspaceCwd === opts.workspaceCwd);
        if (workers.length !== 1) {
            return {
                state: 'error',
                lastError: 'Channel runtime owner is unknown or ambiguous.',
            };
        }
        const worker = workers[0];
        const adapter = worker.adapters?.find((item) => item.name === name);
        if (adapter?.state === 'connected')
            return { state: 'connected' };
        if (adapter?.state === 'error') {
            return {
                state: 'error',
                ...(adapter.error ? { lastError: diagnostic(adapter.error) } : {}),
            };
        }
        if (adapter?.state === 'starting' ||
            state.transition === 'starting' ||
            state.transition === 'reconciling') {
            return { state: 'starting' };
        }
        if (worker.state === 'running')
            return { state: 'partial' };
        return {
            state: 'error',
            ...(worker.error ? { lastError: diagnostic(worker.error) } : {}),
        };
    };
    const instanceFrom = async (name, rawConfig, startupNames) => {
        const type = typeof rawConfig['type'] === 'string' ? rawConfig['type'] : '';
        const plugin = type ? await getPlugin(type) : undefined;
        if (!plugin?.management) {
            return {
                name,
                config: type ? { type } : {},
                secrets: {},
                startsWithServe: startupNames.some(isAllChannelSelectionName) ||
                    startupNames.includes(name),
                runtime: runtimeFor(name),
            };
        }
        const secretKeys = new Set(plugin.management.fields
            .filter((field) => field.kind === 'secret')
            .map((field) => field.key));
        const config = {};
        const secrets = {};
        for (const [key, value] of Object.entries(rawConfig)) {
            if (!secretKeys.has(key)) {
                config[key] = value;
                continue;
            }
            secrets[key] = {
                present: value !== undefined,
                ...(value !== undefined
                    ? { source: usesEnvironment(value) ? 'environment' : 'literal' }
                    : {}),
            };
        }
        for (const key of secretKeys) {
            secrets[key] ??= { present: false };
        }
        return {
            name,
            config,
            secrets,
            startsWithServe: startupNames.some(isAllChannelSelectionName) ||
                startupNames.includes(name),
            runtime: runtimeFor(name),
        };
    };
    const listFrom = async (persisted) => {
        const entries = await Promise.all(Object.entries(persisted.channels).map(async ([name, config]) => [
            name,
            await instanceFrom(name, config, persisted.startupNames),
        ]));
        return {
            revision: persisted.revision,
            instances: Object.fromEntries(entries),
        };
    };
    const resultFor = async (name, persisted = opts.store.snapshot()) => {
        const snapshot = await listFrom(persisted);
        const instance = Object.hasOwn(snapshot.instances, name)
            ? snapshot.instances[name]
            : {
                name,
                config: {},
                secrets: {},
                startsWithServe: false,
                runtime: runtimeFor(name),
            };
        return { snapshot, instance };
    };
    const stopChannel = (name) => opts.manager.setChannelEnabled({ name, workspaceCwd: opts.workspaceCwd }, false);
    const assertManageableInstanceName = (name) => {
        if (isAllChannelSelectionName(name)) {
            throw new ChannelManagementError('invalid_channel_instance_name', 'Channel instance name "all" is reserved for startup selection.');
        }
    };
    const assertWorkspaceConfig = (config) => {
        const rawCwd = config['cwd'];
        if (typeof rawCwd !== 'string')
            return;
        const workspaceCwd = canonicalizeWorkspace(opts.workspaceCwd);
        const channelCwd = canonicalizeWorkspace(resolveChannelCwd(rawCwd, workspaceCwd));
        if (channelCwd !== workspaceCwd) {
            throw new ChannelManagementError('channel_workspace_mismatch', 'Channel workspace must match the selected workspace.');
        }
    };
    const pairingStoreFor = (name) => {
        assertManageableInstanceName(name);
        const channels = opts.store.snapshot().channels;
        if (!Object.hasOwn(channels, name)) {
            throw new ChannelManagementError('channel_instance_not_found', `Channel "${name}" is not configured in this workspace.`);
        }
        const config = channels[name];
        assertWorkspaceConfig(config);
        if (config['senderPolicy'] !== 'pairing' &&
            config['groupPolicy'] !== 'pairing') {
            throw new ChannelManagementError('channel_pairing_not_enabled', `Channel "${name}" does not use pairing mode.`);
        }
        return new PairingStore(name, opts.workspaceCwd);
    };
    const service = {
        async list() {
            return listFrom(opts.store.snapshot());
        },
        async upsert(name, request) {
            assertManageableInstanceName(name);
            assertWorkspaceConfig(request.config);
            const active = workspaceCommittedNames().includes(name);
            if (active)
                assertOwnedRuntime(name);
            const persisted = await opts.store.upsert(name, request);
            diagnostics.delete(name);
            if (active) {
                try {
                    await opts.manager.reloadWorkspace(opts.workspaceCwd, name);
                }
                catch (error) {
                    diagnostics.set(name, diagnostic(error));
                    try {
                        await stopChannel(name);
                    }
                    catch {
                        // Keep the reload diagnostic when best-effort cleanup also fails.
                    }
                }
            }
            return resultFor(name, persisted);
        },
        async remove(name, request) {
            assertManageableInstanceName(name);
            const current = opts.store.snapshot();
            if (!Object.hasOwn(current.channels, name)) {
                throw new ChannelManagementError('channel_instance_not_found', `Channel "${name}" is not configured in this workspace.`);
            }
            assertWorkspaceConfig(current.channels[name]);
            assertExpectedRevision(current, request.expectedRevision);
            if (workspaceCommittedNames().includes(name)) {
                assertOwnedRuntime(name);
                await stopChannel(name);
            }
            const persisted = await opts.store.remove(name, request);
            diagnostics.delete(name);
            return resultFor(name, persisted);
        },
        async setStartup(name, request) {
            assertManageableInstanceName(name);
            const current = opts.store.snapshot();
            if (!Object.hasOwn(current.channels, name)) {
                throw new ChannelManagementError('channel_instance_not_found', `Channel "${name}" is not configured in this workspace.`);
            }
            assertWorkspaceConfig(current.channels[name]);
            const startsAll = current.startupNames.some(isAllChannelSelectionName);
            if (startsAll && request.enabled) {
                assertExpectedRevision(current, request.expectedRevision);
                return resultFor(name, current);
            }
            const startupNames = startsAll
                ? Object.keys(current.channels).filter((item) => !isAllChannelSelectionName(item) && item !== name)
                : request.enabled
                    ? current.startupNames.includes(name)
                        ? current.startupNames
                        : [...current.startupNames, name]
                    : current.startupNames.filter((item) => item !== name);
            const persisted = await opts.store.setStartupNames(startupNames, {
                expectedRevision: request.expectedRevision,
            });
            return resultFor(name, persisted);
        },
        async start(name) {
            assertManageableInstanceName(name);
            const persisted = opts.store.snapshot();
            if (!Object.hasOwn(persisted.channels, name)) {
                throw new ChannelManagementError('channel_instance_not_found', `Channel "${name}" is not configured in this workspace.`);
            }
            assertWorkspaceConfig(persisted.channels[name]);
            await opts.manager.setChannelEnabled({ name, workspaceCwd: opts.workspaceCwd }, true);
            diagnostics.delete(name);
            return resultFor(name, persisted);
        },
        async stop(name) {
            assertManageableInstanceName(name);
            const persisted = opts.store.snapshot();
            if (!Object.hasOwn(persisted.channels, name)) {
                throw new ChannelManagementError('channel_instance_not_found', `Channel "${name}" is not configured in this workspace.`);
            }
            assertWorkspaceConfig(persisted.channels[name]);
            await opts.manager.setChannelEnabled({ name, workspaceCwd: opts.workspaceCwd }, false);
            diagnostics.delete(name);
            return resultFor(name, persisted);
        },
        async restart(name) {
            assertManageableInstanceName(name);
            const persisted = opts.store.snapshot();
            if (!Object.hasOwn(persisted.channels, name)) {
                throw new ChannelManagementError('channel_instance_not_found', `Channel "${name}" is not configured in this workspace.`);
            }
            assertWorkspaceConfig(persisted.channels[name]);
            if (!workspaceCommittedNames().includes(name)) {
                throw new ChannelManagementError('channel_worker_not_enabled', `Channel "${name}" is not running.`);
            }
            assertOwnedRuntime(name);
            try {
                await opts.manager.reloadWorkspace(opts.workspaceCwd, name);
                diagnostics.delete(name);
            }
            catch (error) {
                diagnostics.set(name, diagnostic(error));
                throw error;
            }
            return resultFor(name, persisted);
        },
        async pairingRequests(name) {
            return { requests: pairingStoreFor(name).listPending() };
        },
        async approvePairing(name, code) {
            const store = pairingStoreFor(name);
            const approved = store.approve(code);
            if (!approved) {
                throw new ChannelManagementError('channel_pairing_request_not_found', 'Pairing request was not found or has expired.');
            }
            return { approved, requests: store.listPending() };
        },
        async pairingApprovals(name) {
            const store = pairingStoreFor(name);
            return {
                senderIds: store.getAllowlist(),
                groupIds: store.getGroupAllowlist(),
            };
        },
        async revokePairingApproval(name, subject) {
            const store = pairingStoreFor(name);
            const revoked = subject.type === 'group'
                ? store.revokeGroup(subject.id)
                : store.revoke(subject.id);
            if (!revoked) {
                throw new ChannelManagementError('channel_pairing_approval_not_found', 'Pairing approval was not found.');
            }
            return {
                revoked: subject.id,
                senderIds: store.getAllowlist(),
                groupIds: store.getGroupAllowlist(),
            };
        },
    };
    return {
        list: () => service.list(),
        upsert: (name, request) => inMutationLane(() => service.upsert(name, request)),
        remove: (name, request) => inMutationLane(() => service.remove(name, request)),
        setStartup: (name, request) => inMutationLane(() => service.setStartup(name, request)),
        start: (name) => inMutationLane(() => service.start(name)),
        stop: (name) => inMutationLane(() => service.stop(name)),
        restart: (name) => inMutationLane(() => service.restart(name)),
        pairingRequests: (name) => service.pairingRequests(name),
        approvePairing: (name, code) => inMutationLane(() => service.approvePairing(name, code)),
        pairingApprovals: (name) => service.pairingApprovals(name),
        revokePairingApproval: (name, subject) => inMutationLane(() => service.revokePairingApproval(name, subject)),
    };
}
//# sourceMappingURL=channel-management-service.js.map