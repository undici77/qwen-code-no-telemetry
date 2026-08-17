import type { WebShellSlashCommandHandler } from '../App';
export declare const SLASH_COMMAND_PATTERN: RegExp;
export declare function invokeSlashCommandHandler(
  input: string,
  handler: WebShellSlashCommandHandler | undefined,
  reportError: (error: unknown, fallback: string) => void,
): boolean;
