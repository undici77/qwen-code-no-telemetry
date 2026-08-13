/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { Storage, SessionService } from '@qwen-code/qwen-code-core';
import { loadSettings } from '../../config/settings.js';
export function initSessionService() {
    const settings = loadSettings();
    Storage.setRuntimeBaseDir(settings.merged.advanced?.runtimeOutputDir, process.cwd());
    return new SessionService(process.cwd());
}
//# sourceMappingURL=common.js.map