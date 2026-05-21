/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { addCommand } from './mcp/add.js';
import { removeCommand } from './mcp/remove.js';
import { listCommand } from './mcp/list.js';
import { reconnectCommand } from './mcp/reconnect.js';
export const mcpCommand = {
    command: 'mcp',
    describe: 'Manage MCP servers',
    builder: (yargs) => yargs
        .command(addCommand)
        .command(removeCommand)
        .command(listCommand)
        .command(reconnectCommand)
        .demandCommand(1, 'You need at least one command before continuing.')
        .version(false),
    handler: () => {
        // yargs will automatically show help if no subcommand is provided
        // thanks to demandCommand(1) in the builder.
    },
};
//# sourceMappingURL=mcp.js.map