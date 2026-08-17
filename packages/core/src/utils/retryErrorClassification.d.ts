/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType } from '../core/contentGenerator.js';
export type RetryErrorKind =
  | 'http'
  | 'sse-provider'
  | 'provider'
  | 'transport'
  | 'abort'
  | 'provider-business'
  | 'unknown';
export type RetryErrorDiagnosis = 'retryable' | 'fail-fast' | 'unknown';
export interface RetryErrorClassificationContext {
  authType?: AuthType | string;
  extraRetryErrorCodes?: readonly number[];
}
export interface RetryErrorClassification {
  kind: RetryErrorKind;
  diagnosis: RetryErrorDiagnosis;
  reason: string;
  statusCode?: number;
  providerCode?: string;
  providerMessage?: string;
  requestId?: string;
  transportCode?: string;
}
/**
 * Classifies retry-related failures.
 *
 * The result is primarily diagnostic — it labels the observed error shape for
 * logging. It also feeds a single control decision in `retryWithBackoff`: a
 * `'fail-fast'` diagnosis keeps a permanent error (e.g. allocated-quota
 * exhaustion surfacing as HTTP 429) out of the unbounded persistent loop.
 * Beyond that, it does not drive retry, fail-fast, or fallback control.
 */
export declare function classifyRetryError(
  error: unknown,
  context?: RetryErrorClassificationContext,
): RetryErrorClassification;
export declare function getTransportCode(error: unknown): string | undefined;
/**
 * Determines whether a classified error is eligible for model fallback.
 *
 * The PR scope is intentionally narrow: fallback only applies to the explicit
 * capacity statuses documented for the feature (429/503/529), after same-model
 * retries are exhausted.
 */
export declare function isFallbackEligible(
  classification: RetryErrorClassification,
): boolean;
