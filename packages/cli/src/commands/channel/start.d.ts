import type { CommandModule } from 'yargs';
export { resolveExtensionChannelEntrySpecifier } from './runtime.js';
export { resolveProxy } from './proxy.js';
export declare const BRIDGE_SESSION_RESTORE_TIMEOUT_MS: number;
export declare const startCommand: CommandModule<
  object,
  {
    name?: string;
  }
>;
