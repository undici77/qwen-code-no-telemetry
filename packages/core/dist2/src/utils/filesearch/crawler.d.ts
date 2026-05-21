/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Ignore } from './ignore.js';
export interface CrawlOptions {
    crawlDirectory: string;
    cwd: string;
    maxDepth?: number;
    maxFiles?: number;
    ignore: Ignore;
    useGitignore?: boolean;
    cache: boolean;
    cacheTtl: number;
}
interface CommandResult {
    success: boolean;
    lines: string[];
}
interface RunCommandOptions {
    collectLines?: boolean;
    onLine?: (line: string) => boolean;
    silentOnFailure?: boolean;
    yieldEveryLines?: number;
    /** Use NUL records (e.g. `git ls-files -z`) instead of newline-terminated lines. */
    recordDelimiter?: '\n' | '\0';
}
declare function runCommand(command: string, args: string[], cwd: string, timeoutMs?: number, options?: RunCommandOptions): Promise<CommandResult>;
type CommandRunner = typeof runCommand;
export declare function __setCommandRunnerForTests(runner?: CommandRunner): void;
export declare function __resetCrawlerStateForTests(): void;
export declare function crawl(options: CrawlOptions): Promise<string[]>;
export {};
