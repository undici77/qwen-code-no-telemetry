/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { createDebugLogger } from '../../utils/debugLogger.js';
import { redactProxyError } from '../../utils/runtimeFetchOptions.js';
const debugLogger = createDebugLogger('OPENAI_ERROR');
export class EnhancedErrorHandler {
    shouldSuppressLogging;
    constructor(shouldSuppressLogging = () => false) {
        this.shouldSuppressLogging = shouldSuppressLogging;
    }
    handle(error, context, request) {
        const redactedError = redactProxyError(error);
        const isTimeoutError = this.isTimeoutError(redactedError);
        const errorMessage = this.buildErrorMessage(redactedError, context, isTimeoutError);
        // Allow subclasses to suppress error logging for specific scenarios
        if (!this.shouldSuppressErrorLogging(redactedError, request)) {
            debugLogger.error('OpenAI API Error:', errorMessage);
        }
        // Provide helpful timeout-specific error message
        if (isTimeoutError) {
            throw new Error(`${errorMessage}\n\n${this.getTimeoutTroubleshootingTips()}`);
        }
        throw redactedError;
    }
    shouldSuppressErrorLogging(error, request) {
        return this.shouldSuppressLogging(error, request);
    }
    isTimeoutError(error) {
        if (!error)
            return false;
        const errorMessage = error instanceof Error
            ? error.message.toLowerCase()
            : String(error).toLowerCase();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorCode = error?.code;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorType = error?.type;
        // Check for common timeout indicators
        return (errorMessage.includes('timeout') ||
            errorMessage.includes('timed out') ||
            errorMessage.includes('connection timeout') ||
            errorMessage.includes('request timeout') ||
            errorMessage.includes('read timeout') ||
            errorMessage.includes('etimedout') ||
            errorMessage.includes('esockettimedout') ||
            errorCode === 'ETIMEDOUT' ||
            errorCode === 'ESOCKETTIMEDOUT' ||
            errorType === 'timeout' ||
            errorMessage.includes('request timed out') ||
            errorMessage.includes('deadline exceeded'));
    }
    buildErrorMessage(error, context, isTimeoutError) {
        const durationSeconds = Math.round((Date.now() - context.startTime) / 1000);
        if (isTimeoutError) {
            return `Request timeout after ${durationSeconds}s. Try reducing input length or increasing timeout in config.`;
        }
        return error instanceof Error ? error.message : String(error);
    }
    getTimeoutTroubleshootingTips() {
        const tips = [
            '- Reduce input length or complexity',
            '- Increase timeout in config: contentGenerator.timeout',
            '- Check network connectivity',
        ];
        return `Troubleshooting tips:\n${tips.join('\n')}`;
    }
}
//# sourceMappingURL=errorHandler.js.map