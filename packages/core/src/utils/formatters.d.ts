/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Renders a byte count with a human-readable unit. This is the one
 * implementation: `packages/cli/src/ui/utils/formatters.ts` and
 * `packages/cli/src/serve/env-snapshot.ts` re-use it instead of keeping their
 * own copies, so the same byte count cannot format differently depending on
 * which code path prints it.
 */
export declare const formatMemoryUsage: (bytes: number) => string;
