/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseDeclarativeTool, BaseToolInvocation, Kind, } from '@qwen-code/qwen-code-core';
export const SPEAK_TO_USER_TOOL_NAME = 'speak_to_user';
export const MAX_SPEAK_TO_USER_MESSAGE_CHARS = 32_000;
class SpeakToUserInvocation extends BaseToolInvocation {
    speak;
    constructor(params, speak) {
        super(params);
        this.speak = speak;
    }
    getDescription() {
        return 'Speak an important Live update';
    }
    getDefaultPermission() {
        return Promise.resolve('allow');
    }
    async execute(signal) {
        signal.throwIfAborted();
        await this.speak(this.params.message);
        signal.throwIfAborted();
        return {
            llmContent: 'The voice update was sent.',
            returnDisplay: 'Spoke to user',
        };
    }
}
export class SpeakToUserTool extends BaseDeclarativeTool {
    speak;
    constructor(speak) {
        super(SPEAK_TO_USER_TOOL_NAME, 'SpeakToUser', 'Speak an important voice chat update to the user. Use this sparingly ' +
            'and only during an active voice chat. Automatic backend Qwen Code ' +
            'text is silent context and is not automatically spoken. The message ' +
            'is spoken verbatim by the voice model, so write it for speech. Final ' +
            'assistant text is not automatically spoken; call this tool if the ' +
            'user should hear something.', Kind.Other, {
            type: 'object',
            additionalProperties: false,
            properties: {
                message: {
                    type: 'string',
                    minLength: 1,
                    maxLength: MAX_SPEAK_TO_USER_MESSAGE_CHARS,
                },
            },
            required: ['message'],
        }, true, false, false, true);
        this.speak = speak;
    }
    createInvocation(params) {
        return new SpeakToUserInvocation(params, this.speak);
    }
}
//# sourceMappingURL=live-speak-to-user.js.map