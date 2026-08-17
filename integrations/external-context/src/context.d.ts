/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ExternalContextItem } from './types.js';
export declare const MAX_SEARCH_QUERY_CHARACTERS = 2000;
export declare function normalizeSearchQuery(query: string): string;
export declare function renderExternalContext(
  sourceItems: readonly ExternalContextItem[],
): string;
