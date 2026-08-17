import type { CommandModule } from 'yargs';
interface StopArgs {
  'daemon-url'?: string;
  token?: string;
  timeout?: number;
}
export declare const stopCommand: CommandModule<unknown, StopArgs>;
export {};
