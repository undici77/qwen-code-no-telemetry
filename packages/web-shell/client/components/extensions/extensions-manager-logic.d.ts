import type { DaemonExtensionEntry } from '@qwen-code/sdk/daemon';
export declare function preserveSelectedExtensionName(name: string | null, extensions: readonly DaemonExtensionEntry[]): string | null;
export declare function filterExtensions(extensions: readonly DaemonExtensionEntry[], query: string): DaemonExtensionEntry[];
