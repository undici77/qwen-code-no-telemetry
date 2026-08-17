import type { CommandModule } from 'yargs';
interface StatusArgs {
  'daemon-url'?: string;
  token?: string;
  timeout?: number;
}
export declare const statusCommand: CommandModule<unknown, StatusArgs>;
export {};
