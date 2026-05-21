import type { ClaudeMarketplaceConfig, ExtensionConfig, ExtensionRequestOptions, SkillConfig, SubagentConfig } from '@qwen-code/qwen-code-core';
import type { ConfirmationRequest } from '../../ui/types.js';
/**
 * Requests consent from the user to perform an action, by reading a Y/n
 * character from stdin.
 *
 * This should not be called from interactive mode as it will break the CLI.
 *
 * @param consentDescription The description of the thing they will be consenting to.
 * @returns boolean, whether they consented or not.
 */
export declare function requestConsentNonInteractive(consentDescription: string): Promise<boolean>;
/**
 * Requests plugin selection from the user in non-interactive mode.
 * Displays an interactive list with arrow key navigation.
 *
 * This should not be called from interactive mode as it will break the CLI.
 *
 * @param marketplace The marketplace config containing available plugins.
 * @returns The name of the selected plugin.
 */
export declare function requestChoicePluginNonInteractive(marketplace: ClaudeMarketplaceConfig): Promise<string>;
/**
 * Requests consent from the user to perform an action, in interactive mode.
 *
 * This should not be called from non-interactive mode as it will not work.
 *
 * @param consentDescription The description of the thing they will be consenting to.
 * @param addExtensionUpdateConfirmationRequest A function to actually add a prompt to the UI.
 * @returns boolean, whether they consented or not.
 */
export declare function requestConsentInteractive(consentDescription: string, addExtensionUpdateConfirmationRequest: (value: ConfirmationRequest) => void): Promise<boolean>;
/**
 * Builds a consent string for installing an extension based on it's
 * extensionConfig.
 */
export declare function extensionConsentString(extensionConfig: ExtensionConfig, commands?: string[], skills?: SkillConfig[], subagents?: SubagentConfig[], originSource?: string): string;
/**
 * Requests consent from the user to install an extension (extensionConfig), if
 * there is any difference between the consent string for `extensionConfig` and
 * `previousExtensionConfig`.
 *
 * Always requests consent if previousExtensionConfig is null.
 *
 * Throws if the user does not consent.
 */
export declare const requestConsentOrFail: (requestConsent: (consent: string) => Promise<boolean>, options?: ExtensionRequestOptions) => Promise<void>;
