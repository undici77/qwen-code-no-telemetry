/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export function normalizeServeFastPathArgv(rawArgv) {
    const argv = [...rawArgv];
    const firstArg = argv[0]?.replace(/\\/g, '/');
    if (firstArg !== undefined &&
        (firstArg.endsWith('/dist/qwen-cli/cli.js') ||
            firstArg.endsWith('/dist/cli.js') ||
            firstArg.endsWith('/dist/cli/cli.js'))) {
        return argv.slice(1);
    }
    return argv;
}
export function isServeFastPathArgv(rawArgv) {
    return normalizeServeFastPathArgv(rawArgv)[0] === 'serve';
}
//# sourceMappingURL=fast-path-argv.js.map