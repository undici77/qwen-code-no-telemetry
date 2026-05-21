/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { convert } from 'html-to-text';
import { fetchWithTimeout, isPrivateIp } from '../utils/fetch.js';
import { runSideQuery } from '../utils/sideQuery.js';
import { ToolErrorType } from './tool-error.js';
import { BaseDeclarativeTool, BaseToolInvocation, Kind } from './tools.js';
import { ToolNames, ToolDisplayNames } from './tool-names.js';
import { createDebugLogger } from '../utils/debugLogger.js';
const URL_FETCH_TIMEOUT_MS = 10000;
const MAX_CONTENT_LENGTH = 100000;
/**
 * Implementation of the WebFetch tool invocation logic
 */
class WebFetchToolInvocation extends BaseToolInvocation {
    config;
    debugLogger;
    constructor(config, params) {
        super(params);
        this.config = config;
        this.debugLogger = createDebugLogger('WEB_FETCH');
    }
    getAcceptHeader() {
        const format = this.params.format ?? 'auto';
        switch (format) {
            case 'markdown':
                return 'text/markdown';
            case 'html':
                return 'text/html';
            case 'text':
                return 'text/plain';
            case 'auto':
            default:
                return 'text/markdown, text/html, text/plain';
        }
    }
    async executeDirectFetch(signal) {
        let url = this.params.url;
        // Convert GitHub blob URL to raw URL
        if (url.includes('github.com') && url.includes('/blob/')) {
            url = url
                .replace('github.com', 'raw.githubusercontent.com')
                .replace('/blob/', '/');
            this.debugLogger.debug(`[WebFetchTool] Converted GitHub blob URL to raw URL: ${url}`);
        }
        const acceptHeader = this.getAcceptHeader();
        this.debugLogger.debug(`[WebFetchTool] Using Accept header: ${acceptHeader}`);
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
            this.debugLogger.debug(`[WebFetchTool] Successfully fetched content from ${url}`);
            const contentType = response.headers.get('content-type') || '';
            const responseText = await response.text();
            let textContent;
            if (contentType.includes('text/markdown')) {
                this.debugLogger.debug('[WebFetchTool] Received markdown content');
                textContent = responseText.substring(0, MAX_CONTENT_LENGTH);
            }
            else if (contentType.includes('text/plain')) {
                this.debugLogger.debug('[WebFetchTool] Received plain text content');
                textContent = responseText.substring(0, MAX_CONTENT_LENGTH);
            }
            else {
                this.debugLogger.debug('[WebFetchTool] Converting HTML to text');
                textContent = convert(responseText, {
                    wordwrap: false,
                    selectors: [
                        { selector: 'a', options: { ignoreHref: true } },
                        { selector: 'img', format: 'skip' },
                    ],
                }).substring(0, MAX_CONTENT_LENGTH);
            }
            this.debugLogger.debug(`[WebFetchTool] Content length: ${textContent.length} characters`);
            const fallbackPrompt = `The user requested the following: "${this.params.prompt}".

I have fetched the content from ${this.params.url}. Please use the following content to answer the user's request.

---
${textContent}
---`;
            this.debugLogger.debug(`[WebFetchTool] Processing content with prompt: "${this.params.prompt}"`);
            const result = await runSideQuery(this.config, {
                purpose: 'web-fetch',
                // Pin to the main model — fast model loses too much fidelity on
                // long, rich source material.
                model: this.config.getModel(),
                // Best-effort: the outer catch already converts processing failures
                // into a tool error; retrying 7× just delays that fallback.
                maxAttempts: 1,
                contents: [{ role: 'user', parts: [{ text: fallbackPrompt }] }],
                systemInstruction: 'Extract and summarize the requested information from the provided web content. ' +
                    'Be concise and accurate. Respond only with the requested information.',
                abortSignal: signal,
            });
            const resultText = result.text || '';
            this.debugLogger.debug(`[WebFetchTool] Successfully processed content from ${this.params.url}`);
            return {
                llmContent: resultText,
                returnDisplay: `Content from ${this.params.url} processed successfully.`,
            };
        }
        catch (e) {
            const error = e;
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
    getDescription() {
        const displayPrompt = this.params.prompt.length > 100
            ? this.params.prompt.substring(0, 97) + '...'
            : this.params.prompt;
        const format = this.params.format ?? 'auto';
        return `Fetching content from ${this.params.url} (format: ${format}) and processing with prompt: "${displayPrompt}"`;
    }
    /**
     * WebFetch is a read-like tool (fetches content) but requires confirmation
     * because it makes external network requests.
     */
    async getDefaultPermission() {
        return 'ask';
    }
    /**
     * Constructs the web fetch confirmation details.
     */
    async getConfirmationDetails(_abortSignal) {
        // Extract the domain for the permission rule.
        let domain;
        try {
            domain = new URL(this.params.url).hostname;
        }
        catch {
            domain = this.params.url;
        }
        const permissionRules = [`WebFetch(${domain})`];
        const confirmationDetails = {
            type: 'info',
            title: `Confirm Web Fetch`,
            prompt: `Fetch content from ${this.params.url} and process with: ${this.params.prompt}`,
            urls: [this.params.url],
            permissionRules,
            onConfirm: async (_outcome, _payload) => {
                // No-op: persistence is handled by coreToolScheduler via PM rules
            },
        };
        return confirmationDetails;
    }
    async execute(signal) {
        // Check if URL is private/localhost
        const isPrivate = isPrivateIp(this.params.url);
        if (isPrivate) {
            this.debugLogger.debug(`[WebFetchTool] Private IP detected for ${this.params.url}, using direct fetch`);
        }
        else {
            this.debugLogger.debug(`[WebFetchTool] Public URL detected for ${this.params.url}, using direct fetch`);
        }
        return this.executeDirectFetch(signal);
    }
}
/**
 * Implementation of the WebFetch tool logic
 */
export class WebFetchTool extends BaseDeclarativeTool {
    config;
    static Name = ToolNames.WEB_FETCH;
    constructor(config) {
        super(WebFetchTool.Name, ToolDisplayNames.WEB_FETCH, 'Fetches content from a specified URL and processes it using an AI model\n- Takes a URL and a prompt as input\n- Supports content negotiation for markdown (reduces tokens by ~80%)\n- Fetches the URL content, converts HTML to text if needed\n- Processes the content with the prompt using a small, fast model\n- Returns the model\'s response about the content\n- Use this tool when you need to retrieve and analyze web content\n\nUsage notes:\n  - IMPORTANT: If an MCP-provided web fetch tool is available, prefer using that tool instead of this one, as it may have fewer restrictions. All MCP-provided tools start with "mcp__".\n  - The URL must be a fully-formed valid URL\n  - The prompt should describe what information you want to extract from the page\n  - format parameter (optional): controls only the Accept header sent to the server. All content is normalized to plain text for LLM processing, regardless of format.\n  - "auto" (default): Prefers markdown via content negotiation, accepts HTML as fallback. Use when user does NOT specify a format.\n  - "markdown": Sends Accept: text/markdown. Use when user explicitly asks for markdown content.\n  - "html": Sends Accept: text/html. Content is still converted to plain text for LLM processing.\n  - "text": Sends Accept: text/plain. Use when user explicitly asks for plain text.\n  - This tool is read-only and does not modify any files\n  - Results may be summarized if the content is very large\n  - Supports both public and private/localhost URLs using direct fetch', Kind.Fetch, {
            properties: {
                url: {
                    description: 'The URL to fetch content from',
                    type: 'string',
                },
                prompt: {
                    description: 'The prompt to run on the fetched content',
                    type: 'string',
                },
                format: {
                    description: 'Preferred content format (Accept header only): auto (default, prefers markdown), markdown, html, or text. All content is normalized to plain text.',
                    type: 'string',
                    enum: ['auto', 'markdown', 'html', 'text'],
                },
            },
            required: ['url', 'prompt'],
            type: 'object',
        }, true, // isOutputMarkdown
        false, // canUpdateOutput
        true, // shouldDefer — web fetching is infrequent
        false, // alwaysLoad
        'web fetch url http download content');
        this.config = config;
    }
    validateToolParamValues(params) {
        if (!params.url || params.url.trim() === '') {
            return "The 'url' parameter cannot be empty.";
        }
        if (!params.url.startsWith('http://') &&
            !params.url.startsWith('https://')) {
            return "The 'url' must be a valid URL starting with http:// or https://.";
        }
        if (!params.prompt || params.prompt.trim() === '') {
            return "The 'prompt' parameter cannot be empty.";
        }
        return null;
    }
    createInvocation(params) {
        return new WebFetchToolInvocation(this.config, params);
    }
    toAutoClassifierInput(params) {
        // Do not forward the prompt — it may contain sensitive context.
        return { url: params.url };
    }
}
//# sourceMappingURL=web-fetch.js.map