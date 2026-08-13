/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type ChildProcess, type SpawnOptions } from 'node:child_process';
import type { Config } from '../config/config.js';
import { createDebugLogger } from '../utils/debugLogger.js';
export interface SleepInhibitorHandle {
    release(): void;
}
export interface SleepInhibitorConfig {
    platform?: NodeJS.Platform;
    env?: NodeJS.ProcessEnv;
    spawn?: (command: string, args: string[], options?: SpawnOptions) => ChildProcess;
    logger?: Pick<ReturnType<typeof createDebugLogger>, 'debug' | 'warn'>;
}
export declare class SleepInhibitor {
    private activeCount;
    private child;
    private spawnFailedForCurrentRun;
    private exitedWhileActiveLogged;
    private readonly platform;
    private readonly env;
    private readonly spawn;
    private readonly logger;
    private noAskPasswordSupported;
    private probing;
    constructor(config?: SleepInhibitorConfig);
    acquire(reason?: string): SleepInhibitorHandle;
    getActiveCount(): number;
    isRunning(): boolean;
    private release;
    private start;
    /**
     * Spawn `systemd-inhibit --help` and inspect the output to determine whether
     * `--no-ask-password` is supported. The result is cached so the probe only
     * runs once per process lifetime.
     */
    private probeNoAskPassword;
    private doStart;
    /**
     * Kill any active inhibitor subprocess and reset state. Safe to call
     * multiple times; used by the process-exit handler to avoid orphaning the
     * subprocess.
     */
    dispose(): void;
    /**
     * Build a minimal environment for the inhibitor subprocess instead of
     * passing an empty env. An empty env strips PATH (so the command cannot be
     * resolved) and DBUS_SESSION_BUS_ADDRESS/XDG_RUNTIME_DIR (which
     * systemd-inhibit needs to reach the user's systemd over D-Bus on Linux).
     * On Windows, PowerShell needs SYSTEMROOT/WINDIR.
     */
    private getSpawnEnv;
    private stop;
    private getCommand;
    private getUnavailableMessage;
}
export declare const sleepInhibitor: SleepInhibitor;
export declare function acquireSleepInhibitor(config: Pick<Config, 'getPreventSystemSleepEnabled'>, reason?: string): SleepInhibitorHandle;
