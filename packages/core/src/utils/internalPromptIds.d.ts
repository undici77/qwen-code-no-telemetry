/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Internal Prompt ID utilities
 *
 * Centralises the set of prompt IDs used by background operations
 * (suggestion generation, forked queries) so that logging, recording,
 * and UI layers can consistently recognise and filter them.
 */
/**
 * Returns true if the prompt_id belongs to an internal background operation
 * whose events should not be recorded to the chatRecordingService,
 * telemetry payloads, or other persistent stores visible in the UI.
 */
export declare function isInternalPromptId(promptId: string | undefined): boolean;
