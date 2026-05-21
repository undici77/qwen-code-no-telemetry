import { DefaultOpenAICompatibleProvider } from './default.js';
export class OpenRouterOpenAICompatibleProvider extends DefaultOpenAICompatibleProvider {
    constructor(contentGeneratorConfig, cliConfig) {
        super(contentGeneratorConfig, cliConfig);
    }
    static isOpenRouterProvider(contentGeneratorConfig) {
        const baseURL = contentGeneratorConfig.baseUrl || '';
        return baseURL.includes('openrouter.ai');
    }
    buildHeaders() {
        // Get base headers from parent class
        const baseHeaders = super.buildHeaders();
        // Add OpenRouter-specific headers
        return {
            ...baseHeaders,
            'HTTP-Referer': 'https://github.com/QwenLM/qwen-code.git',
            'X-OpenRouter-Title': 'Qwen Code',
        };
    }
}
//# sourceMappingURL=openrouter.js.map