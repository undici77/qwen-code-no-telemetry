import type { CommandModule } from 'yargs';
interface ReloadArgs {
    'daemon-url'?: string;
    token?: string;
    timeout?: number;
}
export declare const reloadCommand: CommandModule<unknown, ReloadArgs>;
export {};
