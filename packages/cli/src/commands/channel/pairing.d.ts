import type { CommandModule } from 'yargs';
export declare const pairingListCommand: CommandModule<object, {
    name: string;
    cwd: string;
}>;
export declare const pairingApproveCommand: CommandModule<object, {
    name: string;
    code: string;
    cwd: string;
}>;
