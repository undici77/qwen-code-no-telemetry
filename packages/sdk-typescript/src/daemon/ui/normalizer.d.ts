/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonEvent } from '../types.js';
import type { DaemonUiEvent, NormalizeDaemonEventOptions } from './types.js';
export declare function normalizeDaemonEvent(event: DaemonEvent, opts?: NormalizeDaemonEventOptions): DaemonUiEvent[];
export declare function getSessionUpdatePayload(value: unknown): Record<string, unknown> | undefined;
/**
 * Known closed-set of `DaemonAuthDeviceFlowErrorKind` values, exported as
 * documentation of the canonical kinds the daemon emits today.
 *
 * Both reviewers noted that the
 * suggested strict validation against this set. We intentionally keep
 * lenient pass-through — the public type
 * `DaemonAuthDeviceFlowSdkErrorKind` explicitly includes `(string & {})`
 * as a forward-compat escape hatch so future daemon emissions of new
 * kinds remain typed-acceptable AND propagate end-to-end without an SDK
 * release. The existing test `keeps future auth_device_flow_failed
 * errorKind values observable` enforces this contract.
 *
 * Downstream consumers `switch(errorKind)` exhaustively MUST include a
 * `default:` arm for the open `(string & {})` case — the typed
 * known-set arms cover the listed kinds. The known set is referenced
 * here in code only so it surfaces in IDE hovers / type-doc tooling.
 */
export declare const KNOWN_DEVICE_FLOW_ERROR_KINDS: readonly ["expired_token", "access_denied", "invalid_grant", "upstream_error", "persist_failed", "not_found_or_evicted"];
