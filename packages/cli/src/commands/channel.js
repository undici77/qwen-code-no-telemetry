import { startCommand } from './channel/start.js';
import { stopCommand } from './channel/stop.js';
import { statusCommand } from './channel/status.js';
import { pairingListCommand, pairingApproveCommand, } from './channel/pairing.js';
import { configureWeixinCommand } from './channel/configure.js';
const pairingCommand = {
    command: 'pairing',
    describe: 'Manage DM pairing requests',
    builder: (yargs) => yargs
        .command(pairingListCommand)
        .command(pairingApproveCommand)
        .demandCommand(1, 'You need at least one command before continuing.')
        .version(false),
    handler: () => { },
};
export const channelCommand = {
    command: 'channel',
    describe: 'Manage messaging channels (Telegram, Discord, etc.)',
    builder: (yargs) => yargs
        .command(startCommand)
        .command(stopCommand)
        .command(statusCommand)
        .command(pairingCommand)
        .command(configureWeixinCommand)
        .demandCommand(1, 'You need at least one command before continuing.')
        .version(false),
    handler: () => { },
};
//# sourceMappingURL=channel.js.map