/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { InputModalities } from './contentGenerator.js';
/**
 * Return the default input modalities for a model based on its name.
 *
 * Uses the same normalize-then-regex pattern as {@link tokenLimit}.
 * Unknown models default to text-only (empty object) to avoid sending
 * unsupported media types that would cause unrecoverable API errors.
 */
export declare function defaultModalities(model: string): InputModalities;
/**
 * True for wire model ids in the qwen family: any `qwen*` id plus
 * `coder-model`, the QWEN_OAUTH default (DEFAULT_QWEN_MODEL in
 * config/models.ts, aliased to a Qwen 3.6 Plus hybrid), which doesn't
 * start with `qwen` but is the most common hybrid-thinking model for
 * first-time users. Shared by the pipeline's disable/tool-choice gates
 * and the DashScope provider's effort mapping so the family fact lives
 * in one place.
 */
export declare function isQwenFamilyWireModel(model: string | undefined): boolean;
/**
 * True for the qwen3.8-max wire model family — the only family that
 * reads the tiered `reasoning_effort` field directly. Prefix-matched so
 * dated snapshots and `-latest` aliases are covered, consistent with the
 * family pattern in MODALITY_PATTERNS above. Older qwen hybrids expose
 * only the on/off `enable_thinking` switch instead.
 */
export declare function isTieredEffortWireModel(model: string | undefined): boolean;
