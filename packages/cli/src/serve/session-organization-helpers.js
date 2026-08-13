/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { SessionOrganizationService } from '@qwen-code/qwen-code-core';
import { writeStderrLine } from '../utils/stdioHelpers.js';
export function createSessionOrganizationService(workspaceCwd) {
    return new SessionOrganizationService(workspaceCwd, (message) => {
        writeStderrLine(`qwen serve: session-org: ${message}`);
    });
}
//# sourceMappingURL=session-organization-helpers.js.map