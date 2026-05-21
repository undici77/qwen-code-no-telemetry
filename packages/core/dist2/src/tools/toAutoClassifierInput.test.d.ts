/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for each tool's `toAutoClassifierInput` projection. The projection
 * controls what the AUTO mode classifier sees about each tool call — it must
 * redact sensitive / voluminous fields (full edit content, web fetch prompts,
 * sub-agent prompts) while preserving enough for safety judgement.
 */
export {};
