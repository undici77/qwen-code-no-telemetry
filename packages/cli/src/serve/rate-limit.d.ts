/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Request, RequestHandler } from 'express';
export type RateLimitTier = 'prompt' | 'mutation' | 'read';
export interface RateLimitTierConfig {
  windowMs: number;
  max: number;
}
export interface RateLimitConfig {
  tiers: Record<RateLimitTier, RateLimitTierConfig>;
  hostname: string;
  workspaceQualifiedAcpEnabled?: boolean;
  onLimitReached?: (
    tier: RateLimitTier,
    key: string,
    suppressed: number,
  ) => void;
  onError?: (err: unknown, path: string) => void;
}
export interface RateLimiterInstance {
  middleware: RequestHandler;
  /** Check rate limit without Express req/res. Returns true if allowed. */
  checkRate(key: string, tier: RateLimitTier): boolean;
  reset(): void;
  setDraining(v: boolean): void;
  dispose(): void;
  getHitCounts(): Record<RateLimitTier, number>;
}
export declare function createKeyExtractor(
  hostname: string,
): (req: Request) => string;
export declare function createRateLimiter(
  config: RateLimitConfig,
): RateLimiterInstance;
export declare function setRateLimiter(
  app: {
    locals: Record<string, unknown>;
  },
  limiter: RateLimiterInstance,
): void;
export declare function getRateLimiter(app: {
  locals: Record<string, unknown>;
}): RateLimiterInstance | undefined;
