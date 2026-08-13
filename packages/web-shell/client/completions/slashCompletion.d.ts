import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import type { CommandInfo } from '../adapters/types';
import type { WebShellLanguage } from '../i18n';
import { type CommandDisplayCategory, type CommandDisplayCategoryOrder } from '../utils/commandDisplay';
export interface SkillInfo {
    name: string;
    description: string;
    argumentHint?: string;
}
export type SlashCommandCompletionKind = 'command' | 'subcommand';
export interface SlashCommandCompletionItem {
    id: string;
    label: string;
    apply: string;
    detail?: string;
    category?: CommandDisplayCategory;
    section?: string;
    type?: 'command-info' | 'skill';
}
export interface SlashCommandCompletionResult {
    kind: SlashCommandCompletionKind;
    from: number;
    to: number;
    query: string;
    items: SlashCommandCompletionItem[];
}
type Translate = (key: string) => string;
export declare function getMissingSlashPrefixCompletion(text: string, commands: CommandInfo[]): string | null;
export declare function getImplicitTabCompletion(text: string, commands: CommandInfo[], language: WebShellLanguage): string | null;
export declare function getSlashCommandArgumentHint(text: string, commands: CommandInfo[], language: WebShellLanguage): string | null;
export declare function getSlashCommandCompletionResult(text: string, cursor: number, commands: CommandInfo[], skills?: SkillInfo[], language?: WebShellLanguage, translate?: Translate, categoryOrder?: CommandDisplayCategoryOrder): SlashCommandCompletionResult | null;
export declare function slashCompletionSource(getCommands: () => CommandInfo[], getSkills?: () => SkillInfo[], getLanguage?: () => WebShellLanguage, translate?: Translate, getCategoryOrder?: () => CommandDisplayCategoryOrder | undefined): (context: CompletionContext) => CompletionResult | null;
export {};
