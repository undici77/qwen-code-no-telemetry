/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { listCommand } from './sessions/list.js';
export const sessionsCommand = {
    command: 'sessions',
    describe: 'Manage Qwen Code sessions',
    builder: (yargs) => yargs
        .command(listCommand)
        .demandCommand(1, 'You need at least one command before continuing.')
        .version(false),
    // demandCommand(1) ensures a subcommand is always required;
    // yargs automatically shows help when none is provided.
    handler: () => { },
};
//# sourceMappingURL=sessions.js.map