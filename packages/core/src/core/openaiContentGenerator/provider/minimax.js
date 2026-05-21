/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { DefaultOpenAICompatibleProvider } from './default.js';
/** Well-known MiniMax API hostnames for exact matching. */
const MINIMAX_KNOWN_HOSTS = ['api.minimaxi.com', 'api.minimax.io'];
/**
 * Suffix patterns for custom MiniMax OpenAI-compatible API hosts.
 * Note: suffix matching is intentionally permissive — it enables
 * tagged thinking parsing for any subdomain under minimaxi.com /
 * minimax.io. If a user configures a proxy at a minimaxi subdomain
 * that points to a non-MiniMax backend, tagged thinking parsing
 * could be incorrectly enabled. The known-host exact match above
 * covers official endpoints; the suffix fallback exists for custom
 * MiniMax deployments.
 */
const MINIMAX_HOST_SUFFIXES = ['.minimaxi.com', '.minimax.io'];
export class MiniMaxOpenAICompatibleProvider extends DefaultOpenAICompatibleProvider {
    static isMiniMaxProvider(config) {
        if (!config.baseUrl)
            return false;
        try {
            const hostname = new URL(config.baseUrl).hostname.toLowerCase();
            if (MINIMAX_KNOWN_HOSTS.includes(hostname)) {
                return true;
            }
            return MINIMAX_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
        }
        catch {
            return false;
        }
    }
    getResponseParsingOptions() {
        return { taggedThinkingTags: true };
    }
}
//# sourceMappingURL=minimax.js.map