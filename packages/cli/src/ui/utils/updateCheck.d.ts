/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { execFile } from 'node:child_process';
import { getNpmCliPath } from '../../utils/installationInfo.js';
/**
 * Result of an update lookup. Mirrors the subset of update-notifier's
 * UpdateInfo that the CLI consumes — kept local so version checking no longer
 * depends on update-notifier at all (#7515).
 */
export interface UpdateInfo {
    latest: string;
    current: string;
    type: string;
    name: string;
}
export declare const FETCH_TIMEOUT_MS = 5000;
/**
 * Sentinel error thrown when `fetchInfo()` does not resolve within
 * `FETCH_TIMEOUT_MS`. `npm view` is bounded by the `timeout` option passed to
 * `execFile` (see `runGlobalNpm`), but we still race it here as a second,
 * independent bound so a slow / unreachable registry (corporate proxy,
 * offline network, DNS failure) can never hang the check indefinitely. Race
 * the call against a bounded timer and surface a real error so `/update` can
 * report "check failed" instead of silently returning "up to date". The
 * `distTag` is carried on the message so an oncall reading logs can tell
 * which registry endpoint stalled — the nightly path fires two concurrent
 * fetches, and only one of them may be blocked (e.g. a corporate proxy that
 * lets `nightly` through but not `latest`). Related: #6857.
 */
export declare class UpdateCheckTimeoutError extends Error {
    readonly distTag?: string;
    constructor(timeoutMs: number, distTag?: string);
}
export type UpdateCheckFailureReason = 'timeout' | 'offline' | 'registry';
/**
 * Buckets an update-check failure so callers can tell the user what actually
 * happened instead of a generic "check your network" message. Matches error
 * codes both on the `code` property and inside the message text, because the
 * global-npm path surfaces network failures only through `npm` child-process
 * stderr embedded in the error message. Related: #7049.
 */
export declare function classifyUpdateCheckError(error: unknown): UpdateCheckFailureReason;
/**
 * Short human-readable reason for an update-check failure, for embedding in
 * status messages, e.g. "registry did not respond within 5s".
 */
export declare function describeUpdateCheckFailure(error: unknown, timeoutMs?: number): string;
declare const execFileAsync: typeof execFile.__promisify__;
export declare function runGlobalNpm(args: string[], run?: typeof execFileAsync, platform?: NodeJS.Platform, nodePath?: string, resolveNpmCliPath?: typeof getNpmCliPath): Promise<string>;
export declare function fetchGlobalNpmUpdateInfo(packageName: string, currentVersion: string, distTag: 'latest' | 'nightly', run?: typeof execFileAsync): Promise<UpdateInfo>;
export interface UpdateObject {
    message: string;
    update: UpdateInfo;
}
export type UpdateCheckResult = {
    status: 'update';
    info: UpdateObject;
} | {
    status: 'up-to-date';
    currentVersion: string;
} | {
    status: 'skipped';
    reason: string;
    currentVersion?: string;
} | {
    status: 'error';
    error: Error;
    currentVersion?: string;
};
export declare function checkForUpdatesDetailed(fetchGlobalNpm?: typeof fetchGlobalNpmUpdateInfo): Promise<UpdateCheckResult>;
export declare function checkForUpdates(fetchGlobalNpm?: typeof fetchGlobalNpmUpdateInfo): Promise<UpdateObject | null>;
export {};
