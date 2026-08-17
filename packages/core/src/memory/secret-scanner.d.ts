/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface SecretMatch {
  /** Rule ID that matched (e.g. "github-pat") */
  ruleId: string;
  /** Human-readable label derived from the rule ID */
  label: string;
}
/**
 * Scan content for credential patterns. Returns one match per rule that fired
 * (deduplicated by rule ID). The matched value is never returned — only which
 * rule fired — so secret values are never logged or surfaced.
 */
export declare function scanForSecrets(content: string): SecretMatch[];
