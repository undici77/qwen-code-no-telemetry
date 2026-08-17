/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  ExternalContextItem,
  ExternalContextProvider,
  ExternalMemoryWriter,
  GenericHttpProviderConfig,
  Mem0ProviderConfig,
  ProviderConfig,
  RememberResult,
} from './types.js';
export declare function createProvider(
  config: ProviderConfig,
): ExternalContextProvider;
export declare function createMemoryWriter(
  config: ProviderConfig,
): ExternalMemoryWriter | undefined;
export declare class GenericHttpSearchV1Adapter
  implements ExternalContextProvider
{
  private readonly config;
  private readonly searchUrl;
  constructor(config: GenericHttpProviderConfig);
  search(input: {
    query: string;
    limit: number;
    signal: AbortSignal;
  }): Promise<readonly ExternalContextItem[]>;
}
export declare class Mem0PlatformV3Adapter
  implements ExternalContextProvider, ExternalMemoryWriter
{
  private readonly config;
  private readonly baseUrl;
  constructor(config: Mem0ProviderConfig, baseUrl?: URL);
  search(input: {
    query: string;
    limit: number;
    signal: AbortSignal;
  }): Promise<readonly ExternalContextItem[]>;
  remember(input: {
    content: string;
    signal: AbortSignal;
  }): Promise<RememberResult>;
}
