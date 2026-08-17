/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { PartListUnion } from '@google/genai';
import type { Config } from '../../config/config.js';
import type { InputModalities } from '../../core/contentGenerator.js';
/** Minimal shape of a registered model needed to auto-pick a bridge model. */
export interface VisionModelCandidate {
  id: string;
  authType?: string;
  baseUrl?: string;
  modalities?: InputModalities;
  isVision?: boolean;
  capabilities?: {
    agent?: boolean;
  };
  fastOnly?: boolean;
  voiceOnly?: boolean;
  imageOnly?: boolean;
}
/** The model/endpoint selected for a vision bridge call. */
export interface VisionBridgeModelSelection {
  id: string;
  baseUrl?: string;
  agentCapable?: true;
  /**
   * AuthType the selected model belongs to, when known. Used to look up the
   * model's own configured `generationConfig.timeout` as the vision-bridge
   * timeout default, so a provider explicitly configured for slow inference
   * (e.g. a local model) isn't cut off by the bridge's shorter fallback.
   */
  authType?: string;
}
/**
 * Whether a model can accept image input — the single source of truth the vision
 * bridge uses both to auto-pick a bridge model and to warn when a user pins a
 * non-image-capable one via `/model --vision`. Trusts an explicit `isVision`
 * flag or resolved `modalities`, else falls back to name-based defaults.
 */
export declare function isImageCapable(model: VisionModelCandidate): boolean;
export declare function isFullTurnVisionCapable(
  model: VisionModelCandidate,
): boolean;
export declare function getQualifiedVisionModelId(
  model: Pick<VisionModelCandidate, 'id' | 'authType'>,
): string;
export declare function getVisionModelSelector(
  selection: VisionBridgeModelSelection,
): string;
export declare function getFullTurnVisionModelSelector(
  selection: VisionBridgeModelSelection,
): string;
/**
 * Auto-pick an image-capable model to borrow as the vision bridge — but ONLY
 * one on the SAME provider as the primary model (same endpoint when the primary
 * has one, else same auth type). It deliberately never reaches across providers
 * to a guessed model: that risks routing the image to an unrelated or
 * unreachable endpoint (e.g. an OAuth/runtime model the user never meant to use
 * for vision). When no same-provider vision model exists, returns `undefined`
 * and the bridge stays off — the user can pin one explicitly later.
 *
 * @param primaryModelId The current primary (text-only) model id.
 * @param models The registered/available models to choose from.
 * @param primaryProvider The current primary model's provider identity.
 * @returns A same-provider image-capable model, or `undefined`.
 */
export declare function selectVisionBridgeModel(
  primaryModelId: string | undefined,
  models: VisionModelCandidate[],
  primaryProvider?: {
    authType?: string;
    baseUrl?: string;
  },
): VisionBridgeModelSelection | undefined;
/**
 * The bridge runs when the primary model is not known to accept images and an
 * image-capable model is available to borrow. Gating on image parts is the
 * caller's job.
 */
export declare function shouldRunVisionBridge(
  config: Pick<
    Config,
    'getEffectiveInputModalities' | 'getDefaultVisionBridgeModel'
  >,
): boolean;
/**
 * Outcome of a bridge attempt.
 * - `ok`: conversion succeeded; `parts` carry the description.
 * - `failed`: conversion failed; `parts` preserves user text plus a note, so
 *   the caller can continue without image data.
 * - `skipped`: nothing to do (no usable images) or the turn was cancelled.
 */
export type VisionBridgeStatus = 'ok' | 'failed' | 'skipped';
/** Structured result returned to the (UI) caller. */
export interface VisionBridgeResult {
  /** Whether transformed parts should replace the original request. */
  applied: boolean;
  status: VisionBridgeStatus;
  /** Transformed, image-free parts to send to the primary model. */
  parts?: PartListUnion;
  /** Images actually sent to the bridge model. */
  convertedCount: number;
  /** Images dropped because they were unreadable, too large, or over the cap. */
  omittedCount: number;
  /** Resolved bridge model id, when a call was attempted. */
  modelId?: string;
  /** Host of the bridge model's endpoint, for cross-provider egress clarity. */
  modelEndpoint?: string;
  /** True when image data was (or may have been) sent to the bridge model. */
  egressOccurred?: boolean;
  /** Failure reason, when `status === 'failed'`. */
  error?: string;
}
export interface VisionBridgePdfSourceContext {
  displayName: string;
  renderedRange: {
    firstPage: number;
    lastPage: number;
  };
  continuation?: VisionBridgePdfContinuation;
}
export type VisionBridgePdfContinuation =
  | {
      certainty: 'known';
      firstPage: number;
      lastPage: number;
    }
  | {
      certainty: 'possible';
      firstPage: number;
      requestedLastPage?: number;
    };
export interface VisionBridgeNoticeDisplay {
  type: 'vision_bridge_notice';
  summary: string;
  notice: string;
}
export declare function isVisionBridgeNoticeDisplay(
  value: unknown,
): value is VisionBridgeNoticeDisplay;
export declare function formatVisionBridgeNoticeDisplay(
  display: VisionBridgeNoticeDisplay,
): string;
/** Build the user-facing, sanitized disclosure for a bridge attempt. */
export declare function formatVisionBridgeNotice(
  result: VisionBridgeResult,
): string;
export declare function formatFullTurnVisionNotice(
  selection: VisionBridgeModelSelection,
): string;
/**
 * Run the vision bridge: convert inline image parts into a text description via
 * an auto-selected vision model, and return image-free parts for the primary
 * model.
 *
 * This function is UI-agnostic and never mutates its input. Gating (primary
 * model is text-only) is the caller's responsibility.
 *
 * @param params.config Active config (provides the side-query client and model).
 * @param params.parts The resolved request parts (text + inline images).
 * @param params.signal Abort signal from the surrounding turn.
 * @param params.intentText Optional caller-supplied focus hint.
 * @returns A {@link VisionBridgeResult} describing the outcome.
 */
export declare function runVisionBridge(params: {
  config: Config;
  parts: PartListUnion;
  signal: AbortSignal;
  sourceContext?: VisionBridgePdfSourceContext;
  intentText?: string;
}): Promise<VisionBridgeResult>;
