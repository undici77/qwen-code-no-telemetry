/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type VariableSchema, VARIABLE_SCHEMA } from './variableSchema.js';
import type { HookDefinition } from '../hooks/types.js';
import type { HookEventName } from '../hooks/types.js';
export type { HookDefinition };
export declare const EXTENSIONS_DIRECTORY_NAME: string;
export declare const EXTENSIONS_CONFIG_FILENAME = 'qwen-extension.json';
export declare const INSTALL_METADATA_FILENAME = '.qwen-extension-install.json';
export declare const EXTENSION_SETTINGS_FILENAME = '.env';
export type JsonObject = {
  [key: string]: JsonValue;
};
export type JsonArray = JsonValue[];
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;
export type VariableContext = {
  [key in keyof typeof VARIABLE_SCHEMA]?: string;
};
export declare function validateVariables(
  variables: VariableContext,
  schema: VariableSchema,
): void;
export declare function hydrateString(
  str: string,
  context: VariableContext,
): string;
export declare function recursivelyHydrateStrings(
  obj: JsonValue,
  values: VariableContext,
): JsonValue;
/**
 * Substitute variables in hook configurations, particularly ${CLAUDE_PLUGIN_ROOT}
 * @param hooks - The hooks configuration object
 * @param basePath - The path to substitute for ${CLAUDE_PLUGIN_ROOT}
 * @returns A deep cloned hooks object with variables substituted
 */
export declare function substituteHookVariables(
  hooks:
    | {
        [K in HookEventName]?: HookDefinition[];
      }
    | undefined,
  basePath: string,
):
  | {
      [K in HookEventName]?: HookDefinition[];
    }
  | undefined;
/**
 * Perform variable replacement in all markdown and shell script files of the extension.
 * This is done during the conversion phase to avoid modifying files during every extension load.
 * @param extensionPath - The path to the extension directory to edit
 * @param pluginRoot - The installed path to substitute for ${CLAUDE_PLUGIN_ROOT}
 */
export declare function performVariableReplacement(
  extensionPath: string,
  pluginRoot?: string,
): void;
