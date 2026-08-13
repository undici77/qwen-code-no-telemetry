/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const HEADLESS_YOLO_NO_SANDBOX_WARNING: string;
/**
 * Returns a warning line to emit when running in YOLO without a sandbox in a
 * non-interactive run, or `null` when no warning is warranted: sandbox is
 * configured, we're already inside a sandbox, approval mode is not YOLO, or
 * the user explicitly suppressed the notice.
 *
 * The call site (gemini.tsx) is responsible for gating on
 * `!config.isInteractive()` — this helper deliberately ignores interactivity
 * so it stays pure and unit-testable.
 *
 * The `env` argument is injectable for tests; production callers omit it and
 * fall through to `process.env`.
 */
export declare function getHeadlessYoloSafetyWarning(config: {
    getApprovalMode(): string | undefined;
    getSandbox(): unknown;
}, env?: NodeJS.ProcessEnv): string | null;
