import type { CommandInfo } from '../adapters/types';
import type { useI18n } from '../i18n';
type Translate = ReturnType<typeof useI18n>['t'];
/**
 * Commands that should always appear in the slash-command completion menu,
 * regardless of what ACP sends (ACP filters most BUILT_IN commands to
 * 'interactive' mode only). These are merged with ACP-provided commands,
 * with ACP taking precedence on duplicates.
 */
export declare function getLocalCommands(t: Translate, options?: {
    sideTaskAvailable?: boolean;
}): CommandInfo[];
/**
 * i18n key for a known skill's localized menu description, or undefined for a
 * skill we don't ship a translation for (leave its authored description).
 */
export declare function skillDescriptionKey(name: string): string | undefined;
/**
 * Re-localize built-in command descriptions by name so the slash menu matches
 * the web-shell UI language even when the daemon advertises them in its own
 * process language. Translates when source is explicitly 'builtin-command' or
 * when no source is set (daemon may omit _meta.source in some event paths).
 * Commands with a non-builtin source (e.g. 'skill', 'custom') are left alone.
 * (Skills are localized separately in the skill-tagging step.)
 */
export declare function localizeBuiltinDescriptions(commands: CommandInfo[], t: Translate): CommandInfo[];
export {};
