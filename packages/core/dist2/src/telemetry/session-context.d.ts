/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Context } from '@opentelemetry/api';
export declare function setSessionContext(ctx: Context | undefined, sessionId?: string): void;
export declare function getSessionContext(): Context | undefined;
/**
 * Returns the most recent session ID passed to setSessionContext.
 * Used by LogToSpanProcessor as a fallback to derive the correct traceId
 * when a log record has no session.id attribute (e.g. after /clear or /resume).
 */
export declare function getCurrentSessionId(): string | undefined;
