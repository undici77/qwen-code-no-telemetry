/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  ModelProvidersConfig,
  ProviderProtocolConfig,
} from '@qwen-code/qwen-code-core';
export interface RemoveModelTarget {
  /** Resolved protocol/authType the model is grouped under (e.g. "openai"). */
  authType: string;
  /** The raw model id (ModelConfig.id / baseModelId). */
  modelId: string;
  /** Optional baseUrl to disambiguate same-id models across endpoints. */
  baseUrl?: string;
}
export interface RemoveModelResult {
  next: ModelProvidersConfig;
  removed: boolean;
  /**
   * The `baseUrl` stored on the removed provider entry (raw, unsanitized), or
   * `undefined` when the entry had none / nothing was removed. Callers compare
   * this against the raw `model.baseUrl` in settings — the request's `baseUrl`
   * is sanitized by the providers status endpoint and would not match.
   */
  removedBaseUrl?: string;
}
/**
 * Return a copy of `modelProviders` with the model matching `target` removed.
 *
 * `modelProviders` is keyed by provider id; for built-in providers the key
 * equals the protocol/authType, and custom ids resolve to a protocol via
 * `providerProtocol`. We locate the model by resolving each key's protocol and
 * matching the model id (plus baseUrl when supplied, to disambiguate the same
 * id configured against different endpoints). Emptied provider keys are kept as
 * empty arrays (see `buildRemoval`).
 */
export declare function removeModelFromProviders(
  modelProviders: ModelProvidersConfig,
  providerProtocol: ProviderProtocolConfig | undefined,
  target: RemoveModelTarget,
): RemoveModelResult;
/**
 * Whether the given model is the currently-selected active model, so callers
 * can clear `model.name` when deleting it (leaving a dangling selection would
 * make the runtime fall back to an unrelated model on the next turn).
 */
export declare function isActiveModelSelection(
  activeModelName: string | undefined,
  activeBaseUrl: string | undefined,
  target: RemoveModelTarget,
): boolean;
