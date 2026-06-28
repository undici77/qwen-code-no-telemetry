/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { convert } from 'html-to-text';
import type { Config } from '../config/config.js';
import { fetchWithTimeout, isPrivateIp } from '../utils/fetch.js';
import { runSideQuery } from '../utils/sideQuery.js';
import { ToolErrorType } from './tool-error.js';
import type {
  ToolCallConfirmationDetails,
  ToolInvocation,
  ToolResult,
  ToolConfirmationPayload,
  ToolConfirmationOutcome,
} from './tools.js';
import type { PermissionDecision } from '../permissions/types.js';
import { BaseDeclarativeTool, BaseToolInvocation, Kind } from './tools.js';
import { ToolNames, ToolDisplayNames } from './tool-names.js';
import { createDebugLogger, type DebugLogger } from '../utils/debugLogger.js';

const URL_FETCH_TIMEOUT_MS = 10000;
const MAX_CONTENT_LENGTH = 100000;

/**
 * Parameters for the WebFetch tool
 */
export interface WebFetchToolParams {
  /**
   * The URL to fetch content from
   */
  url: string;
  /**
   * The prompt to run on the fetched content
   */
  prompt: string;
  /**
   * Preferred content format (controls only the Accept header)
   * All content is normalized to plain text for LLM processing
   * - auto: Prefers markdown via content negotiation (default)
   * - markdown: Prefer markdown format
   * - html: Prefer HTML format (still converted to text)
   * - text: Prefer plain text format
   */
  format?: 'auto' | 'markdown' | 'html' | 'text';
}

/**
 * Implementation of the WebFetch tool invocation logic
 */
class WebFetchToolInvocation extends BaseToolInvocation<
  WebFetchToolParams,
  ToolResult
> {
  private readonly debugLogger: DebugLogger;

  constructor(
    private readonly config: Config,
    params: WebFetchToolParams,
  ) {
    super(params);
    this.debugLogger = createDebugLogger('WEB_FETCH');
  }

  private getAcceptHeader(): string {
    const format = this.params.format ?? 'auto';
    switch (format) {
      case 'markdown':
        return 'text/markdown, */*;q=0.1';
      case 'html':
        return 'text/html, */*;q=0.1';
      case 'text':
        return 'text/plain, */*;q=0.1';
      case 'auto':
      default:
        return 'text/markdown, text/html;q=0.9, text/plain;q=0.8, */*;q=0.1';
    }
  }

  private async executeDirectFetch(signal: AbortSignal): Promise<ToolResult> {
    let url = this.params.url;

    // Convert GitHub blob URL to raw URL
    if (url.includes('github.com') && url.includes('/blob/')) {
      url = url
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob/', '/');
      this.debugLogger.debug(
        `[WebFetchTool] Converted GitHub blob URL to raw URL: ${url}`,
      );
    }

    const acceptHeader = this.getAcceptHeader();
    this.debugLogger.debug(
      `[WebFetchTool] Using Accept header: ${acceptHeader}`,
    );

    try {
      this.debugLogger.debug(`[WebFetchTool] Fetching content from: ${url}`);
      const response = await fetchWithTimeout(url, URL_FETCH_TIMEOUT_MS, {
        Accept: acceptHeader,
      });

      if (!response.ok) {
        const errorMessage = `Request failed with status code ${response.status} ${response.statusText}`;
        this.debugLogger.error(`[WebFetchTool] ${errorMessage}`);
        throw new Error(errorMessage);
      }

      this.debugLogger.debug(
        `[WebFetchTool] Successfully fetched content from ${url}`,
      );

      const contentType = response.headers.get('content-type') || '';
      const responseText = await response.text();

      let textContent: string;

      if (contentType.includes('text/markdown')) {
        this.debugLogger.debug('[WebFetchTool] Received markdown content');
        textContent = responseText.substring(0, MAX_CONTENT_LENGTH);
      } else if (contentType.includes('text/plain')) {
        this.debugLogger.debug('[WebFetchTool] Received plain text content');
        textContent = responseText.substring(0, MAX_CONTENT_LENGTH);
      } else if (contentType.includes('text/html')) {
        this.debugLogger.debug('[WebFetchTool] Converting HTML to text');
        textContent = convert(responseText.substring(0, MAX_CONTENT_LENGTH), {
          wordwrap: false,
          selectors: [
            { selector: 'a', options: { ignoreHref: true } },
            { selector: 'img', format: 'skip' },
          ],
        });
      } else {
        this.debugLogger.debug(
          `[WebFetchTool] Passing through ${contentType || 'unknown'} content as text`,
        );
        textContent = responseText.substring(0, MAX_CONTENT_LENGTH);
      }

      this.debugLogger.debug(
        `[WebFetchTool] Content length: ${textContent.length} characters`,
      );

      const fallbackPrompt = `The user requested the following: "${this.params.prompt}".

I have fetched the content from ${this.params.url}. Please use the following content to answer the user's request.

---
${textContent}
---`;

      this.debugLogger.debug(
        `[WebFetchTool] Processing content with prompt: "${this.params.prompt}"`,
      );

      const result = await runSideQuery(this.config, {
        purpose: 'web-fetch',
        // Pin to the main model — fast model loses too much fidelity on
        // long, rich source material.
        model: this.config.getModel(),
        // Best-effort: the outer catch already converts processing failures
        // into a tool error; retrying 7× just delays that fallback.
        maxAttempts: 1,
        contents: [{ role: 'user', parts: [{ text: fallbackPrompt }] }],
        systemInstruction:
          'Extract and summarize the requested information from the provided web content. ' +
          'Be concise and accurate. Respond only with the requested information.',
        abortSignal: signal,
      });
      const resultText = result.text || '';

      this.debugLogger.debug(
        `[WebFetchTool] Successfully processed content from ${this.params.url}`,
      );

      return {
        llmContent: resultText,
        returnDisplay: `Content from ${this.params.url} processed successfully.`,
      };
    } catch (e) {
      const error = e as Error;
      const errorMessage = `Error during fetch for ${url}: ${error.message}`;
      this.debugLogger.error(`[WebFetchTool] ${errorMessage}`, error);
      return {
        llmContent: `Error: ${errorMessage}`,
        returnDisplay: `Error: ${errorMessage}`,
        error: {
          message: errorMessage,
          type: ToolErrorType.WEB_FETCH_FALLBACK_FAILED,
        },
      };
    }
  }

  override getDescription(): string {
    const displayPrompt =
      this.params.prompt.length > 100
        ? this.params.prompt.substring(0, 97) + '...'
        : this.params.prompt;
    const format = this.params.format ?? 'auto';
    return `Fetching content from ${this.params.url} (format: ${format}) and processing with prompt: "${displayPrompt}"`;
  }

  /**
   * WebFetch is a read-like tool (fetches content) but requires confirmation
   * because it makes external network requests.
   */
  override async getDefaultPermission(): Promise<PermissionDecision> {
    return 'ask';
  }

  /**
   * Constructs the web fetch confirmation details.
   */
  override async getConfirmationDetails(
    _abortSignal: AbortSignal,
  ): Promise<ToolCallConfirmationDetails> {
    // Extract the domain for the permission rule.
    let domain: string;
    try {
      domain = new URL(this.params.url).hostname;
    } catch {
      domain = this.params.url;
    }
    const permissionRules = [`WebFetch(${domain})`];

    const confirmationDetails: ToolCallConfirmationDetails = {
      type: 'info',
      title: `Confirm Web Fetch`,
      prompt: `Fetch content from ${this.params.url} and process with: ${this.params.prompt}`,
      urls: [this.params.url],
      permissionRules,
      onConfirm: async (
        _outcome: ToolConfirmationOutcome,
        _payload?: ToolConfirmationPayload,
      ) => {
        // No-op: persistence is handled by coreToolScheduler via PM rules
      },
    };
    return confirmationDetails;
  }

  async execute(signal: AbortSignal): Promise<ToolResult> {
    // Check if URL is private/localhost
    const isPrivate = isPrivateIp(this.params.url);

    if (isPrivate) {
      this.debugLogger.debug(
        `[WebFetchTool] Private IP detected for ${this.params.url}, using direct fetch`,
      );
    } else {
      this.debugLogger.debug(
        `[WebFetchTool] Public URL detected for ${this.params.url}, using direct fetch`,
      );
    }

    return this.executeDirectFetch(signal);
  }
}

/**
 * Implementation of the WebFetch tool logic
 */
export class WebFetchTool extends BaseDeclarativeTool<
  WebFetchToolParams,
  ToolResult
> {
  static readonly Name: string = ToolNames.WEB_FETCH;

  constructor(private readonly config: Config) {
    super(
      WebFetchTool.Name,
      ToolDisplayNames.WEB_FETCH,
      'Fetches a URL and returns AI-processed content. Always provide both "url" and "prompt" in every call.\n\nParameters:\n  url: The URL to fetch.\n  prompt: What to extract or summarize from the page (e.g., "Summarize this article").\n  format (optional): auto, markdown, html, or text.\n\nSupports content negotiation for markdown. Converts HTML to plain text. Read-only.\nPrefer MCP-provided web fetch tools when available (tools starting with "mcp__").',
      Kind.Fetch,
      {
        properties: {
          url: {
            description: 'The URL to fetch.',
            type: 'string',
          },
          prompt: {
            description:
              'What to extract or summarize from the page (e.g., "Summarize this article"). Always include a prompt.',
            type: 'string',
          },
          format: {
            description:
              'Preferred content format (Accept header only): auto (default, prefers markdown), markdown, html, or text. All content is normalized to plain text.',
            type: 'string',
            enum: ['auto', 'markdown', 'html', 'text'],
          },
        },
        required: ['url', 'prompt'],
        type: 'object',
      },
      true, // isOutputMarkdown
      false, // canUpdateOutput
      true, // shouldDefer — web fetching is infrequent
      false, // alwaysLoad
      'web fetch url http download content',
    );
  }

  protected override validateToolParamValues(
    params: WebFetchToolParams,
  ): string | null {
    if (!params.url || params.url.trim() === '') {
      return "The 'url' parameter cannot be empty.";
    }
    // Regex rejects non-http(s) schemes and malformed authority that new URL() normalizes away.
    if (!/^https?:\/\//i.test(params.url)) {
      return "The 'url' must be a valid URL starting with http:// or https://.";
    }
    try {
      const parsedUrl = new URL(params.url);
      if (parsedUrl.username || parsedUrl.password) {
        return "The 'url' must not include credentials.";
      }
    } catch {
      return "The 'url' is malformed and could not be parsed.";
    }
    if (!params.prompt || params.prompt.trim() === '') {
      return "The 'prompt' parameter cannot be empty.";
    }
    return null;
  }

  protected createInvocation(
    params: WebFetchToolParams,
  ): ToolInvocation<WebFetchToolParams, ToolResult> {
    return new WebFetchToolInvocation(this.config, params);
  }

  override toAutoClassifierInput(
    params: WebFetchToolParams,
  ): Record<string, unknown> {
    // Do not forward the prompt — it may contain sensitive context.
    return { url: params.url };
  }
}
