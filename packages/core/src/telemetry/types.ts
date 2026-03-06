/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Telemetry event types - stub implementations for no-telemetry mode

/**
 * Base interface for all telemetry events.
 */
export interface BaseTelemetryEvent {
  'event.name': string;
  'event.timestamp': string;
}

/**
 * Event fired when content retry occurs.
 */
export class ContentRetryEvent implements BaseTelemetryEvent {
  'event.name': 'content_retry' = 'content_retry';
  'event.timestamp': string;
  attempt_number: number;
  error_type: string; // e.g., 'EmptyStreamError'
  retry_delay_ms: number;
  model: string;

  constructor(
    attempt_number: number,
    error_type: string,
    retry_delay_ms: number,
    model: string,
  ) {
    this['event.timestamp'] = new Date().toISOString();
    this.attempt_number = attempt_number;
    this.error_type = error_type;
    this.retry_delay_ms = retry_delay_ms;
    this.model = model;
  }
}

/**
 * Event fired when all content retries fail.
 */
export class ContentRetryFailureEvent implements BaseTelemetryEvent {
  'event.name': 'content_retry_failure' = 'content_retry_failure';
  'event.timestamp': string;
  total_attempts: number;
  final_error_type: string;
  total_duration_ms?: number; // Optional: total time spent retrying
  model: string;

  constructor(
    total_attempts: number,
    final_error_type: string,
    model: string,
    total_duration_ms?: number,
  ) {
    this['event.timestamp'] = new Date().toISOString();
    this.total_attempts = total_attempts;
    this.final_error_type = final_error_type;
    this.model = model;
    this.total_duration_ms = total_duration_ms;
  }
}
