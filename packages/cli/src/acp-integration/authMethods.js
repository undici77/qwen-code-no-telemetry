/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType } from '@qwen-code/qwen-code-core';
export function buildAuthMethods() {
    return [
        {
            id: AuthType.USE_OPENAI,
            name: 'Use OpenAI API key',
            description: 'Requires setting the `OPENAI_API_KEY` environment variable',
            _meta: {
                type: 'terminal',
                args: ['--auth-type=openai'],
            },
        },
    ];
}
export function pickAuthMethodsForAuthRequired(selectedType) {
    const authMethods = buildAuthMethods();
    if (selectedType) {
        const matched = authMethods.filter((method) => method.id === selectedType);
        return matched.length ? matched : authMethods;
    }
    return authMethods;
}
//# sourceMappingURL=authMethods.js.map