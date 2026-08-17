/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const MAX_RESPONSE_BYTES: number;
export declare class ProviderHttpStatusError extends Error {
  readonly status: number;
  constructor(status: number);
}
export declare function validateProviderBaseUrl(value: string): URL;
export declare function postJson(input: {
  url: URL;
  authorization: string;
  body: unknown;
  signal: AbortSignal;
}): Promise<unknown>;
