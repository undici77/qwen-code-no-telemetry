/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoalPersistenceUnavailableError, } from '@qwen-code/qwen-code-core';
export function shouldDisplayGoalStateCause(cause) {
    switch (cause) {
        case 'turn_finished':
        case 'checkpoint':
        case 'verifier_accept':
            return false;
        case 'verifier_reject':
        case 'create':
        case 'replace':
        case 'edit':
        case 'pause':
        case 'resume':
        case 'complete':
        case 'blocked':
        case 'usage_limited':
        case 'clear':
        case 'migrated':
            return true;
        default: {
            const exhaustive = cause;
            return exhaustive;
        }
    }
}
export async function waitForGoalRuntime(config) {
    try {
        await config.getGoalRuntimeReady();
    }
    catch (error) {
        if (!(error instanceof GoalPersistenceUnavailableError))
            throw error;
    }
}
//# sourceMappingURL=goal-runtime.js.map