/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { ToolInvocation, ToolResult } from './tools.js';
import { BaseDeclarativeTool } from './tools.js';
export interface WebSearchToolParams {
  /** The search query. Must be at least 2 characters. */
  query: string;
}
/**
 * Settings for the built-in WebSearch tool (SerpApi backend).
 * Resolved by the CLI config loader from `tools.webSearch` in settings.json
 * merged with env overrides (ENABLE_WEB_SEARCH, SERPAPI_API_KEY).
 */
export interface WebSearchSettings {
  enabled?: boolean;
  /**
   * SerpApi API key. Falls back to the SERPAPI_API_KEY environment variable
   * when not set here.
   */
  apiKey?: string;
  /**
   * Search engine to use. Default: "google".
   * Supported: google, bing, baidu, yahoo, duckduckgo, yandex, etc.
   */
  engine?: string;
  /**
   * Language (hl parameter). Default: "en".
   */
  hl?: string;
  /**
   * Country (gl parameter). Default: "us".
   */
  gl?: string;
}
/** Resolved backend configuration for the SerpApi side request. */
export interface SerpApiBackendConfig {
  apiKey: string;
  engine: string;
  hl: string;
  gl: string;
}
export type WebSearchGateResult =
  | {
      ok: true;
      backend: SerpApiBackendConfig;
    }
  | {
      ok: false;
      notice: string;
    };
/**
 * Evaluate whether WebSearch can run with the current configuration.
 *
 * Called at registry-build time (register the tool or surface a startup
 * notice) and re-checked per invocation.
 */
export declare function evaluateWebSearchGate(
  config: Config,
): WebSearchGateResult;
interface SerpApiOrganicResult {
  position?: number;
  title?: string;
  link?: string;
  displayed_link?: string;
  snippet?: string;
  rich_snippet?: {
    top?: Record<string, unknown>;
  };
  sitelinks?: {
    expanded?: Array<{
      title?: string;
      link?: string;
    }>;
  };
}
interface SerpApiKnowledgeGraph {
  title?: string;
  type?: string;
  description?: string;
  source?: {
    name?: string;
    link?: string;
  };
  attributes?: Record<string, string>;
  knowledge_graph_search_url?: string;
}
interface SerpApiAnswerBox {
  answer?: string;
  title?: string;
  link?: string;
  snippet?: string;
  source?: {
    name?: string;
    link?: string;
  };
  list?: string[];
  type?: string;
  result?: string;
}
interface SerpApiRelatedQuestion {
  question?: string;
  answer?: string;
  title?: string;
  link?: string;
  source?: {
    name?: string;
    link?: string;
  };
  list?: string[];
  items?: Array<{
    title?: string;
    link?: string;
  }>;
}
interface SerpApiTopStory {
  title?: string;
  link?: string;
  source?: string;
  date?: string;
  snippet?: string;
}
interface SerpApiInlineImage {
  title?: string;
  link?: string;
  source?: string;
  original?: string;
  thumbnail?: string;
}
interface SerpApiInlineVideo {
  title?: string;
  link?: string;
  source?: string;
  channel?: string;
  duration?: string;
  date?: string;
  snippet?: string;
}
interface SerpApiShoppingResult {
  title?: string;
  link?: string;
  source?: string;
  price?: string;
  rating?: number;
  reviews?: number;
  snippet?: string;
}
interface SerpApiTwitterResult {
  link?: string;
  snippet?: string;
  date?: string;
  author?: string;
  tweet?: string;
}
interface SerpApiJob {
  title?: string;
  company_name?: string;
  location?: string;
  via?: string;
  description?: string;
  link?: string;
}
interface SerpApiResponse {
  search_metadata?: {
    id?: string;
    status?: string;
    json_endpoint?: string;
    created_at?: string;
    processed_at?: string;
    total_time_taken?: number;
  };
  search_parameters?: {
    engine?: string;
    q?: string;
    hl?: string;
    gl?: string;
  };
  search_information?: {
    query_displayed?: string;
    total_results?: number;
    time_taken_displayed?: number;
    organic_results_state?: string;
  };
  knowledge_graph?: SerpApiKnowledgeGraph;
  answer_box?: SerpApiAnswerBox | SerpApiAnswerBox[];
  organic_results?: SerpApiOrganicResult[];
  related_questions?: SerpApiRelatedQuestion[];
  top_stories?: SerpApiTopStory[];
  inline_images?: SerpApiInlineImage[];
  inline_videos?: SerpApiInlineVideo[];
  shopping_results?: SerpApiShoppingResult[];
  twitter_results?: SerpApiTwitterResult[];
  jobs?: SerpApiJob[];
  local_results?: Array<{
    title?: string;
    address?: string;
    phone?: string;
    website?: string;
    rating?: number;
    reviews?: number;
    type?: string;
    hours?: string;
  }>;
  sports_results?: Record<string, unknown>;
  recipes_results?: Array<{
    title?: string;
    link?: string;
    source?: string;
    rating?: number;
    reviews?: number;
    ingredients?: string[];
  }>;
  map?: {
    link?: string;
    gps_coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };
  error?: string;
}
/**
 * Convert a SerpApi JSON response into structured Markdown that an LLM can
 * easily consume. Pure data transformation — no LLM involved.
 */
export declare function serpApiToMarkdown(
  data: SerpApiResponse,
  query: string,
): string;
export declare class WebSearchTool extends BaseDeclarativeTool<
  WebSearchToolParams,
  ToolResult
> {
  private readonly config;
  static readonly Name: string;
  get maxOutputChars(): number;
  constructor(config: Config);
  get schema(): {
    name: string;
    description: string;
    parametersJsonSchema: unknown;
  };
  protected validateToolParamValues(params: WebSearchToolParams): string | null;
  protected createInvocation(
    params: WebSearchToolParams,
  ): ToolInvocation<WebSearchToolParams, ToolResult>;
  toAutoClassifierInput(params: WebSearchToolParams): Record<string, unknown>;
}
export {};
