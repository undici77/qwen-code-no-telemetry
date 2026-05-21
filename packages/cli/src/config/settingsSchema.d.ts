/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { MCPServerConfig, BugCommandSettings, TelemetrySettings, AuthType, ChatCompressionSettings, ModelProvidersConfig } from '@qwen-code/qwen-code-core';
import { ApprovalMode } from '@qwen-code/qwen-code-core';
import type { CustomTheme } from '../ui/themes/theme.js';
export type SettingsType = 'boolean' | 'string' | 'number' | 'array' | 'object' | 'enum';
export type SettingsValue = boolean | string | number | string[] | object | undefined;
/**
 * Setting datatypes that "toggle" through a fixed list of options
 * (e.g. an enum or true/false) rather than allowing for free form input
 * (like a number or string).
 */
export declare const TOGGLE_TYPES: ReadonlySet<SettingsType | undefined>;
export interface SettingEnumOption {
    value: string | number;
    label: string;
}
export declare enum MergeStrategy {
    REPLACE = "replace",
    CONCAT = "concat",
    UNION = "union",
    SHALLOW_MERGE = "shallow_merge"
}
export interface SettingDefinition {
    type: SettingsType;
    label: string;
    category: string;
    requiresRestart: boolean;
    default: SettingsValue;
    description?: string;
    parentKey?: string;
    key?: string;
    properties?: SettingsSchema;
    showInDialog?: boolean;
    mergeStrategy?: MergeStrategy;
    /** Enum type options  */
    options?: readonly SettingEnumOption[];
    /** Schema for array items when type is 'array' */
    items?: SettingItemDefinition;
    /**
     * Primitive shapes a field accepted before it was expanded to its current
     * type. The exported JSON Schema wraps the field in `anyOf` so values from
     * those older shapes don't trip the IDE validator while the runtime
     * migration is still pending. Has no runtime effect — it's purely a
     * compatibility hint for editors.
     *
     * Narrowed to the subset our generator can faithfully emit as a
     * one-liner `{ type: <legacyType> }` schema fragment. `'enum'` is
     * not a valid JSON Schema `type` value at all (enum constraints
     * use the `enum` keyword, not `type: 'enum'`), so allowing it here
     * would silently produce an invalid `settings.schema.json`.
     * `'object'` IS a valid JSON Schema type, but a bare
     * `{ type: 'object' }` legacy entry would accept ANY object value
     * — most likely not what the field's pre-expansion shape actually
     * permitted. Future legacy shapes that need `enum` / structured-
     * object compatibility should land their own branch in
     * `convertSettingToJsonSchema` (with proper `enum:` / `properties:`
     * companions) instead of widening this set.
     */
    legacyTypes?: ReadonlyArray<'boolean' | 'string' | 'number' | 'array'>;
    /**
     * Escape hatch for the JSON Schema generator: when set, this object is
     * emitted verbatim under the setting's properties entry instead of the
     * shape derived from `type`/`properties`/etc. The `description` is still
     * carried forward from the SettingDefinition.
     *
     * Use sparingly — for most settings the generator's normal mapping is
     * preferable so the source schema stays the single source of truth. The
     * one valid case so far is settings whose accepted runtime shape is a
     * union (e.g. string | { path } | { small, large }) that the
     * SettingDefinition `type` field cannot express.
     */
    jsonSchemaOverride?: Record<string, unknown>;
}
/**
 * Schema definition for array item types.
 * Supports simple types (string, number, boolean) and complex object types.
 */
export interface SettingItemDefinition {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    properties?: Record<string, SettingItemDefinition & {
        required?: boolean;
        enum?: string[];
        additionalProperties?: SettingItemDefinition;
    }>;
    items?: SettingItemDefinition;
    required?: boolean;
    enum?: string[];
    description?: string;
    additionalProperties?: boolean | SettingItemDefinition;
}
export interface SettingsSchema {
    [key: string]: SettingDefinition;
}
/**
 * Source for a single tier of custom ASCII art. Either an inline string
 * or a reference to a file on disk that contains the art.
 */
export type AsciiArtSource = string | {
    path: string;
};
/**
 * Setting value for `ui.customAsciiArt`. Accepts a bare source (treated as
 * both width tiers), or a width-aware `{small, large}` object.
 */
export type CustomAsciiArtSetting = AsciiArtSource | {
    small?: AsciiArtSource;
    large?: AsciiArtSource;
};
export type MemoryImportFormat = 'tree' | 'flat';
export type DnsResolutionOrder = 'ipv4first' | 'verbatim';
/**
 * The canonical schema for all settings.
 * The structure of this object defines the structure of the `Settings` type.
 * `as const` is crucial for TypeScript to infer the most specific types possible.
 */
declare const SETTINGS_SCHEMA: {
    readonly mcpServers: {
        readonly type: "object";
        readonly label: "MCP Servers";
        readonly category: "Advanced";
        readonly requiresRestart: true;
        readonly default: Record<string, MCPServerConfig>;
        readonly description: "Configuration for MCP servers.";
        readonly showInDialog: false;
        readonly mergeStrategy: MergeStrategy.SHALLOW_MERGE;
    };
    readonly channels: {
        readonly type: "object";
        readonly label: "Channels";
        readonly category: "Advanced";
        readonly requiresRestart: true;
        readonly default: Record<string, Record<string, unknown>>;
        readonly description: "Configuration for messaging channels.";
        readonly showInDialog: false;
        readonly mergeStrategy: MergeStrategy.SHALLOW_MERGE;
    };
    readonly modelProviders: {
        readonly type: "object";
        readonly label: "Model Providers";
        readonly category: "Model";
        readonly requiresRestart: false;
        readonly default: ModelProvidersConfig;
        readonly description: "Model providers configuration grouped by authType. Each authType contains an array of model configurations.";
        readonly showInDialog: false;
        readonly mergeStrategy: MergeStrategy.REPLACE;
    };
    readonly plansDirectory: {
        readonly type: "string";
        readonly label: "Plans Directory";
        readonly category: "Advanced";
        readonly requiresRestart: true;
        readonly default: string | undefined;
        readonly description: "Custom directory for approved Plan Mode files. Relative paths are resolved from the project root, and the resolved path must stay within the project root. Defaults to ~/.qwen/plans.";
        readonly showInDialog: false;
    };
    readonly env: {
        readonly type: "object";
        readonly label: "Environment Variables";
        readonly category: "Advanced";
        readonly requiresRestart: true;
        readonly default: Record<string, string>;
        readonly description: "Environment variables to set as fallback defaults. These are loaded with the lowest priority: system environment variables > .env files > settings.json env field.";
        readonly showInDialog: false;
        readonly mergeStrategy: MergeStrategy.SHALLOW_MERGE;
    };
    readonly proxy: {
        readonly type: "string";
        readonly label: "Proxy";
        readonly category: "Advanced";
        readonly requiresRestart: true;
        readonly default: string | undefined;
        readonly description: "Proxy URL for CLI HTTP requests. Takes precedence over proxy environment variables when --proxy is not provided.";
        readonly showInDialog: false;
    };
    readonly general: {
        readonly type: "object";
        readonly label: "General";
        readonly category: "General";
        readonly requiresRestart: false;
        readonly default: {};
        readonly description: "General application settings.";
        readonly showInDialog: false;
        readonly properties: {
            readonly preferredEditor: {
                readonly type: "string";
                readonly label: "Preferred Editor";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: string | undefined;
                readonly description: "The preferred editor to open files in.";
                readonly showInDialog: true;
            };
            readonly vimMode: {
                readonly type: "boolean";
                readonly label: "Vim Mode";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Enable Vim keybindings";
                readonly showInDialog: true;
            };
            readonly enableAutoUpdate: {
                readonly type: "boolean";
                readonly label: "Enable Auto Update";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Enable automatic update checks and installations on startup.";
                readonly showInDialog: true;
            };
            readonly showSessionRecap: {
                readonly type: "boolean";
                readonly label: "Show Session Recap";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Auto-show a one-line \"where you left off\" recap when returning to the terminal after being away. Off by default. Use /recap to trigger manually regardless of this setting.";
                readonly showInDialog: true;
            };
            readonly sessionRecapAwayThresholdMinutes: {
                readonly type: "number";
                readonly label: "Session Recap Away Threshold (minutes)";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: 5;
                readonly description: "How many minutes the terminal must be blurred before an auto-recap fires on the next focus-in. Matches Claude Code's default of 5 minutes; raise if you briefly alt-tab and do not want recaps to pile up.";
                readonly showInDialog: true;
            };
            readonly gitCoAuthor: {
                readonly type: "object";
                readonly label: "Attribution";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: {
                    readonly commit: false;
                    readonly pr: false;
                };
                readonly description: "Attribution added to git commits and pull requests created through Qwen Code.";
                readonly showInDialog: false;
                readonly legacyTypes: readonly ["boolean"];
                readonly properties: {
                    readonly commit: {
                        readonly type: "boolean";
                        readonly label: "Attribution: commit";
                        readonly category: "General";
                        readonly requiresRestart: false;
                        readonly default: false;
                        readonly description: "Add a Co-authored-by trailer to git commit messages AND attach a per-file AI-attribution git note (`refs/notes/ai-attribution`) for commits made through Qwen Code. Disabling skips both.";
                        readonly showInDialog: true;
                    };
                    readonly pr: {
                        readonly type: "boolean";
                        readonly label: "Attribution: PR";
                        readonly category: "General";
                        readonly requiresRestart: false;
                        readonly default: false;
                        readonly description: "Append a Qwen Code attribution line to PR descriptions when running `gh pr create`.";
                        readonly showInDialog: true;
                    };
                };
            };
            readonly checkpointing: {
                readonly type: "object";
                readonly label: "Checkpointing";
                readonly category: "General";
                readonly requiresRestart: true;
                readonly default: {};
                readonly description: "Session checkpointing settings.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly enabled: {
                        readonly type: "boolean";
                        readonly label: "Enable Checkpointing";
                        readonly category: "General";
                        readonly requiresRestart: true;
                        readonly default: false;
                        readonly description: "Enable session checkpointing for recovery";
                        readonly showInDialog: false;
                    };
                };
            };
            readonly debugKeystrokeLogging: {
                readonly type: "boolean";
                readonly label: "Debug Keystroke Logging";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Enable debug logging of keystrokes to the console.";
                readonly showInDialog: false;
            };
            readonly language: {
                readonly type: "enum";
                readonly label: "Language: UI";
                readonly category: "General";
                readonly requiresRestart: true;
                readonly default: "auto";
                readonly description: string;
                readonly showInDialog: true;
                readonly options: readonly SettingEnumOption[];
            };
            readonly outputLanguage: {
                readonly type: "string";
                readonly label: "Language: Model";
                readonly category: "General";
                readonly requiresRestart: true;
                readonly default: "auto";
                readonly description: string;
                readonly showInDialog: true;
            };
            readonly dynamicCommandTranslation: {
                readonly type: "boolean";
                readonly label: "Language: Dynamic Command Translation";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: string;
                readonly showInDialog: true;
            };
            readonly terminalBell: {
                readonly type: "boolean";
                readonly label: "Terminal Bell Notification";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Play terminal bell sound when response completes or needs approval.";
                readonly showInDialog: true;
            };
            readonly chatRecording: {
                readonly type: "boolean";
                readonly label: "Chat Recording";
                readonly category: "General";
                readonly requiresRestart: true;
                readonly default: true;
                readonly description: "Enable saving chat history to disk. Disabling this will also prevent --continue and --resume from working.";
                readonly showInDialog: false;
            };
            readonly defaultFileEncoding: {
                readonly type: "enum";
                readonly label: "Default File Encoding";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: "utf-8";
                readonly description: "Default encoding for new files. Use \"utf-8\" (default) for UTF-8 without BOM, or \"utf-8-bom\" for UTF-8 with BOM. Only change this if your project specifically requires BOM.";
                readonly showInDialog: false;
                readonly options: readonly [{
                    readonly value: "utf-8";
                    readonly label: "UTF-8 (without BOM)";
                }, {
                    readonly value: "utf-8-bom";
                    readonly label: "UTF-8 with BOM";
                }];
            };
        };
    };
    readonly output: {
        readonly type: "object";
        readonly label: "Output";
        readonly category: "General";
        readonly requiresRestart: false;
        readonly default: {};
        readonly description: "Settings for the CLI output.";
        readonly showInDialog: false;
        readonly properties: {
            readonly format: {
                readonly type: "enum";
                readonly label: "Output Format";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: "text";
                readonly description: "The format of the CLI output.";
                readonly showInDialog: false;
                readonly options: readonly [{
                    readonly value: "text";
                    readonly label: "Text";
                }, {
                    readonly value: "json";
                    readonly label: "JSON";
                }];
            };
        };
    };
    readonly dualOutput: {
        readonly type: "object";
        readonly label: "Dual Output";
        readonly category: "Advanced";
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: string;
        readonly showInDialog: false;
        readonly properties: {
            readonly jsonFile: {
                readonly type: "string";
                readonly label: "JSON Event File";
                readonly category: "Advanced";
                readonly requiresRestart: true;
                readonly default: string | undefined;
                readonly description: string;
                readonly showInDialog: false;
            };
            readonly inputFile: {
                readonly type: "string";
                readonly label: "Remote Input File";
                readonly category: "Advanced";
                readonly requiresRestart: true;
                readonly default: string | undefined;
                readonly description: string;
                readonly showInDialog: false;
            };
        };
    };
    readonly ui: {
        readonly type: "object";
        readonly label: "UI";
        readonly category: "UI";
        readonly requiresRestart: false;
        readonly default: {};
        readonly description: "User interface settings.";
        readonly showInDialog: false;
        readonly properties: {
            readonly theme: {
                readonly type: "string";
                readonly label: "Theme";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: string;
                readonly description: "The color theme for the UI.";
                readonly showInDialog: true;
            };
            readonly autoModeAcknowledged: {
                readonly type: "boolean";
                readonly label: "Auto Mode Acknowledged";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "True once the user has seen the first-time information message about the AUTO approval mode. Set automatically; not intended for manual configuration.";
                readonly showInDialog: false;
            };
            readonly statusLine: {
                readonly type: "object";
                readonly label: "Status Line";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: ({
                    type: "command";
                    command: string;
                    refreshInterval?: number;
                } | {
                    type: "preset";
                    items: string[];
                    useThemeColors?: boolean;
                }) | undefined;
                readonly description: "Status line display configuration. Use `type: \"preset\"` with built-in item ids, or `type: \"command\"` with a shell command. Optional command `refreshInterval` (seconds, >= 1) re-runs the command on a timer so external data stays fresh.";
                readonly showInDialog: false;
            };
            readonly customThemes: {
                readonly type: "object";
                readonly label: "Custom Themes";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: Record<string, CustomTheme>;
                readonly description: "Custom theme definitions.";
                readonly showInDialog: false;
            };
            readonly hideBuiltinWorktreeIndicator: {
                readonly type: "boolean";
                readonly label: "Hide Built-in Worktree Indicator";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "When true, the built-in `⎇ worktree-<branch> (<slug>)` line in the Footer is hidden. The worktree state is still surfaced to custom statusline scripts via the stdin payload (`worktree.{name, path, branch, original_cwd, original_branch}`). Keep at the default `false` unless your custom statusline renders the worktree itself — otherwise an active worktree silently has no UI affordance.";
                readonly showInDialog: false;
            };
            readonly hideWindowTitle: {
                readonly type: "boolean";
                readonly label: "Hide Window Title";
                readonly category: "UI";
                readonly requiresRestart: true;
                readonly default: false;
                readonly description: "Hide the window title bar";
                readonly showInDialog: false;
            };
            readonly showStatusInTitle: {
                readonly type: "boolean";
                readonly label: "Show Status in Title";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Show Qwen Code status and thoughts in the terminal window title";
                readonly showInDialog: false;
            };
            readonly hideTips: {
                readonly type: "boolean";
                readonly label: "Hide Tips";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Hide helpful tips in the UI";
                readonly showInDialog: true;
            };
            readonly showLineNumbers: {
                readonly type: "boolean";
                readonly label: "Show Line Numbers in Code";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Show line numbers in the code output.";
                readonly showInDialog: true;
            };
            readonly renderMode: {
                readonly type: "enum";
                readonly label: "Markdown Render Mode";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: "render";
                readonly description: "Default Markdown display mode. Use \"render\" for rich visual previews, or \"raw\" to show source-oriented Markdown by default. Toggle during a session with Alt/Option+M; on macOS the terminal must send Option as Meta.";
                readonly showInDialog: true;
                readonly options: readonly [{
                    readonly value: "render";
                    readonly label: "Render visual previews";
                }, {
                    readonly value: "raw";
                    readonly label: "Show raw source";
                }];
            };
            readonly showCitations: {
                readonly type: "boolean";
                readonly label: "Show Citations";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Show citations for generated text in the chat.";
                readonly showInDialog: false;
            };
            readonly customWittyPhrases: {
                readonly type: "array";
                readonly label: "Custom Witty Phrases";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: string[];
                readonly description: "Custom witty phrases to display during loading.";
                readonly showInDialog: false;
            };
            readonly enableWelcomeBack: {
                readonly type: "boolean";
                readonly label: "Show Welcome Back Dialog";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Show welcome back dialog when returning to a project with conversation history. Choosing \"Start new chat session\" suppresses the dialog for that project until the project summary changes.";
                readonly showInDialog: true;
            };
            readonly enableUserFeedback: {
                readonly type: "boolean";
                readonly label: "Enable User Feedback";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Show optional feedback dialog after conversations to help improve Qwen performance.";
                readonly showInDialog: true;
            };
            readonly enableFollowupSuggestions: {
                readonly type: "boolean";
                readonly label: "Enable Follow-up Suggestions";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Show context-aware follow-up suggestions after task completion. Press Tab or Right Arrow to accept, Enter to accept and submit.";
                readonly showInDialog: true;
            };
            readonly enableCacheSharing: {
                readonly type: "boolean";
                readonly label: "Enable Cache Sharing for Suggestions";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Use cache-aware forked queries for suggestion generation. Reduces cost on providers that support prefix caching (experimental).";
                readonly showInDialog: false;
            };
            readonly enableSpeculation: {
                readonly type: "boolean";
                readonly label: "Enable Speculative Execution";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Speculatively execute accepted suggestions before submission. Results appear instantly when you accept (experimental).";
                readonly showInDialog: false;
            };
            readonly accessibility: {
                readonly type: "object";
                readonly label: "Accessibility";
                readonly category: "UI";
                readonly requiresRestart: true;
                readonly default: {};
                readonly description: "Accessibility settings.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly enableLoadingPhrases: {
                        readonly type: "boolean";
                        readonly label: "Enable Loading Phrases";
                        readonly category: "UI";
                        readonly requiresRestart: true;
                        readonly default: true;
                        readonly description: "Enable loading phrases (disable for accessibility)";
                        readonly showInDialog: true;
                    };
                    readonly screenReader: {
                        readonly type: "boolean";
                        readonly label: "Screen Reader Mode";
                        readonly category: "UI";
                        readonly requiresRestart: true;
                        readonly default: boolean | undefined;
                        readonly description: "Render output in plain-text to be more screen reader accessible";
                        readonly showInDialog: false;
                    };
                };
            };
            readonly feedbackLastShownTimestamp: {
                readonly type: "number";
                readonly label: "Feedback Last Shown Timestamp";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: 0;
                readonly description: "The last time the feedback dialog was shown.";
                readonly showInDialog: false;
            };
            readonly compactMode: {
                readonly type: "boolean";
                readonly label: "Compact Mode";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Hide tool output and thinking for a cleaner view (toggle with Ctrl+O).";
                readonly showInDialog: true;
            };
            readonly shellOutputMaxLines: {
                readonly type: "number";
                readonly label: "Shell Output Max Lines";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: 5;
                readonly description: "Max number of shell output lines shown inline. Set to 0 to disable the cap and show full output. The hidden line count is still surfaced via the `+N lines` indicator.";
                readonly showInDialog: true;
            };
            readonly hideBanner: {
                readonly type: "boolean";
                readonly label: "Hide Banner";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Hide the startup ASCII banner and info panel.";
                readonly showInDialog: true;
            };
            readonly customBannerTitle: {
                readonly type: "string";
                readonly label: "Custom Banner Title";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: string;
                readonly description: "Replace the default \">_ Qwen Code\" title shown in the banner info panel. The version suffix is always appended.";
                readonly showInDialog: false;
            };
            readonly customBannerSubtitle: {
                readonly type: "string";
                readonly label: "Custom Banner Subtitle";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: string;
                readonly description: "Optional subtitle line rendered between the banner title and the auth/model line. When unset, the info panel keeps its blank spacer row.";
                readonly showInDialog: false;
            };
            readonly customAsciiArt: {
                readonly type: "object";
                readonly label: "Custom ASCII Art";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: CustomAsciiArtSetting | undefined;
                readonly description: "Replace the default QWEN ASCII art. Accepts an inline string, {\"path\": \"...\"}, or {\"small\": ..., \"large\": ...} for width-aware selection.";
                readonly showInDialog: false;
                readonly jsonSchemaOverride: {
                    readonly oneOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly path: {
                                readonly type: "string";
                            };
                        };
                        readonly required: readonly ["path"];
                        readonly additionalProperties: false;
                    }, {
                        readonly type: "object";
                        readonly properties: {
                            readonly small: {
                                readonly oneOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly path: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: readonly ["path"];
                                    readonly additionalProperties: false;
                                }];
                            };
                            readonly large: {
                                readonly oneOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly path: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: readonly ["path"];
                                    readonly additionalProperties: false;
                                }];
                            };
                        };
                        readonly additionalProperties: false;
                    }];
                };
            };
        };
    };
    readonly ide: {
        readonly type: "object";
        readonly label: "IDE";
        readonly category: "IDE";
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: "IDE integration settings.";
        readonly showInDialog: false;
        readonly properties: {
            readonly enabled: {
                readonly type: "boolean";
                readonly label: "Auto-connect to IDE";
                readonly category: "IDE";
                readonly requiresRestart: true;
                readonly default: false;
                readonly description: "Enable IDE integration mode";
                readonly showInDialog: true;
            };
            readonly hasSeenNudge: {
                readonly type: "boolean";
                readonly label: "Has Seen IDE Integration Nudge";
                readonly category: "IDE";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Whether the user has seen the IDE integration nudge.";
                readonly showInDialog: false;
            };
        };
    };
    readonly privacy: {
        readonly type: "object";
        readonly label: "Privacy";
        readonly category: "Privacy";
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: "Privacy-related settings.";
        readonly showInDialog: false;
        readonly properties: {
            readonly usageStatisticsEnabled: {
                readonly type: "boolean";
                readonly label: "Enable Usage Statistics";
                readonly category: "Privacy";
                readonly requiresRestart: true;
                readonly default: false;
                readonly description: "Enable collection of usage statistics";
                readonly showInDialog: true;
            };
        };
    };
    readonly telemetry: {
        readonly type: "object";
        readonly label: "Telemetry";
        readonly category: "Advanced";
        readonly requiresRestart: true;
        readonly default: TelemetrySettings | undefined;
        readonly description: "Telemetry configuration.";
        readonly showInDialog: false;
        readonly jsonSchemaOverride: {
            readonly type: "object";
            readonly properties: {
                readonly includeSensitiveSpanAttributes: {
                    readonly description: "When enabled, user prompts, system prompts, tool inputs/outputs, and model responses are written to native OTel span attributes in addition to the log-to-span bridge. Warning: this may expose sensitive data (file contents, shell commands, conversation history) to your OTLP backend.";
                    readonly type: "boolean";
                    readonly default: false;
                };
                readonly resourceAttributes: {
                    readonly description: "Static resource attributes attached to every span/log/metric the SDK exports (OTLP or file outfile — they share the same Resource). Merged with the OTEL_RESOURCE_ATTRIBUTES env var; settings win on key conflict. Reserved keys (service.version, session.id) are dropped with a warning.";
                    readonly type: "object";
                    readonly additionalProperties: {
                        readonly type: "string";
                    };
                    readonly default: {};
                };
                readonly metrics: {
                    readonly description: "Per-signal cardinality controls for exported metrics.";
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly properties: {
                        readonly includeSessionId: {
                            readonly description: "Include session.id on every metric data point. WARNING: each CLI session creates a new value, causing unbounded metric time-series fan-out at the backend. Only enable for short-term debugging — spans and logs still carry session.id.";
                            readonly type: "boolean";
                            readonly default: false;
                        };
                    };
                };
            };
            readonly additionalProperties: true;
        };
    };
    readonly fastModel: {
        readonly type: "string";
        readonly label: "Fast Model";
        readonly category: "Model";
        readonly requiresRestart: false;
        readonly default: "";
        readonly description: "Model used for generating prompt suggestions and speculative execution. Leave empty to use the main model. A smaller/faster model (e.g., qwen3-coder-flash) reduces latency and cost.";
        readonly showInDialog: true;
    };
    readonly model: {
        readonly type: "object";
        readonly label: "Model";
        readonly category: "Model";
        readonly requiresRestart: false;
        readonly default: {};
        readonly description: "Settings related to the generative model.";
        readonly showInDialog: false;
        readonly properties: {
            readonly name: {
                readonly type: "string";
                readonly label: "Model";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: string | undefined;
                readonly description: "The model to use for conversations.";
                readonly showInDialog: false;
            };
            readonly maxSessionTurns: {
                readonly type: "number";
                readonly label: "Max Session Turns";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: -1;
                readonly description: "Maximum number of user/model/tool turns to keep in a session. -1 means unlimited.";
                readonly showInDialog: false;
            };
            readonly chatCompression: {
                readonly type: "object";
                readonly label: "Chat Compression";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: ChatCompressionSettings | undefined;
                readonly description: "Chat compression settings.";
                readonly showInDialog: false;
            };
            readonly sessionTokenLimit: {
                readonly type: "number";
                readonly label: "Session Token Limit";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: number | undefined;
                readonly description: "The maximum number of tokens allowed in a session.";
                readonly showInDialog: false;
            };
            readonly skipNextSpeakerCheck: {
                readonly type: "boolean";
                readonly label: "Skip Next Speaker Check";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Skip the next speaker check.";
                readonly showInDialog: false;
            };
            readonly skipLoopDetection: {
                readonly type: "boolean";
                readonly label: "Skip Loop Detection";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Disable all loop detection checks (streaming and LLM).";
                readonly showInDialog: false;
            };
            readonly skipStartupContext: {
                readonly type: "boolean";
                readonly label: "Skip Startup Context";
                readonly category: "Model";
                readonly requiresRestart: true;
                readonly default: false;
                readonly description: "Avoid sending the workspace startup context at the beginning of each session.";
                readonly showInDialog: false;
            };
            readonly enableOpenAILogging: {
                readonly type: "boolean";
                readonly label: "Enable OpenAI Logging";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Enable OpenAI logging.";
                readonly showInDialog: false;
            };
            readonly openAILoggingDir: {
                readonly type: "string";
                readonly label: "OpenAI Logging Directory";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: string | undefined;
                readonly description: "Custom directory path for OpenAI API logs. If not specified, defaults to logs/openai in the current working directory.";
                readonly showInDialog: false;
            };
            readonly generationConfig: {
                readonly type: "object";
                readonly label: "Generation Configuration";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: Record<string, unknown> | undefined;
                readonly description: "Generation configuration settings.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly timeout: {
                        readonly type: "number";
                        readonly label: "Timeout";
                        readonly category: "Generation Configuration";
                        readonly requiresRestart: false;
                        readonly default: number | undefined;
                        readonly description: "Request timeout in milliseconds.";
                        readonly parentKey: "generationConfig";
                        readonly showInDialog: false;
                    };
                    readonly maxRetries: {
                        readonly type: "number";
                        readonly label: "Max Retries";
                        readonly category: "Generation Configuration";
                        readonly requiresRestart: false;
                        readonly default: number | undefined;
                        readonly description: "Maximum number of retries for failed requests.";
                        readonly parentKey: "generationConfig";
                        readonly showInDialog: false;
                    };
                    readonly enableCacheControl: {
                        readonly type: "boolean";
                        readonly label: "Enable Cache Control";
                        readonly category: "Generation Configuration";
                        readonly requiresRestart: false;
                        readonly default: true;
                        readonly description: "Enable cache control for DashScope providers.";
                        readonly parentKey: "generationConfig";
                        readonly showInDialog: false;
                    };
                    readonly splitToolMedia: {
                        readonly type: "boolean";
                        readonly label: "Split Tool Result Media";
                        readonly category: "Generation Configuration";
                        readonly requiresRestart: false;
                        readonly default: false;
                        readonly description: "When true, media (images / audio / video / files) returned by MCP tool calls is split into a follow-up user message instead of being embedded in the tool message. Required for strict OpenAI-compatible servers (e.g., LM Studio) that reject non-text content on `role: \"tool\"` messages with HTTP 400 \"Invalid 'messages' in payload\". Default false preserves the prior behavior for permissive providers. See QwenLM/qwen-code#3616.";
                        readonly parentKey: "generationConfig";
                        readonly showInDialog: false;
                    };
                    readonly schemaCompliance: {
                        readonly type: "enum";
                        readonly label: "Tool Schema Compliance";
                        readonly category: "Generation Configuration";
                        readonly requiresRestart: false;
                        readonly default: "auto";
                        readonly description: "The compliance mode for tool schemas sent to the model. Use \"openapi_30\" for strict OpenAPI 3.0 compatibility (e.g., for Gemini).";
                        readonly parentKey: "generationConfig";
                        readonly showInDialog: false;
                        readonly options: readonly [{
                            readonly value: "auto";
                            readonly label: "Auto (Default)";
                        }, {
                            readonly value: "openapi_30";
                            readonly label: "OpenAPI 3.0 Strict";
                        }];
                    };
                    readonly contextWindowSize: {
                        readonly type: "number";
                        readonly label: "Context Window Size";
                        readonly category: "Generation Configuration";
                        readonly requiresRestart: false;
                        readonly default: undefined;
                        readonly description: "Overrides the default context window size for the selected model. Use this setting when a provider's effective context limit differs from Qwen Code's default. This value defines the model's assumed maximum context capacity, not a per-request token limit.";
                        readonly parentKey: "generationConfig";
                        readonly showInDialog: false;
                    };
                };
            };
        };
    };
    readonly modelPricing: {
        readonly type: "object";
        readonly label: "Model Pricing";
        readonly category: "Model";
        readonly requiresRestart: false;
        readonly default: Record<string, {
            inputPerMillionTokens?: number;
            outputPerMillionTokens?: number;
        }> | undefined;
        readonly description: "Optional per-model pricing for cost estimation in /stats model. Example: {\"qwen3-coder\": {\"inputPerMillionTokens\": 0.30, \"outputPerMillionTokens\": 1.20}}";
        readonly showInDialog: false;
    };
    readonly context: {
        readonly type: "object";
        readonly label: "Context";
        readonly category: "Context";
        readonly requiresRestart: false;
        readonly default: {};
        readonly description: "Settings for managing context provided to the model.";
        readonly showInDialog: false;
        readonly properties: {
            readonly fileName: {
                readonly type: "object";
                readonly label: "Context File Name";
                readonly category: "Context";
                readonly requiresRestart: false;
                readonly default: string | string[] | undefined;
                readonly description: "The name of the context file.";
                readonly showInDialog: false;
            };
            readonly importFormat: {
                readonly type: "string";
                readonly label: "Memory Import Format";
                readonly category: "Context";
                readonly requiresRestart: false;
                readonly default: MemoryImportFormat | undefined;
                readonly description: "The format to use when importing memory.";
                readonly showInDialog: false;
            };
            readonly includeDirectories: {
                readonly type: "array";
                readonly label: "Include Directories";
                readonly category: "Context";
                readonly requiresRestart: false;
                readonly default: string[];
                readonly description: "Additional directories to include in the workspace context. Missing directories will be skipped with a warning.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.CONCAT;
            };
            readonly loadFromIncludeDirectories: {
                readonly type: "boolean";
                readonly label: "Load Memory From Include Directories";
                readonly category: "Context";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Whether to load memory files from include directories.";
                readonly showInDialog: false;
            };
            readonly clearContextOnIdle: {
                readonly type: "object";
                readonly label: "Clear Context On Idle";
                readonly category: "Context";
                readonly requiresRestart: false;
                readonly default: {};
                readonly description: "Settings for clearing stale context after idle periods. Use -1 to disable a threshold.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly toolResultsThresholdMinutes: {
                        readonly type: "number";
                        readonly label: "Tool Results Idle Threshold (minutes)";
                        readonly category: "Context";
                        readonly requiresRestart: false;
                        readonly default: number;
                        readonly description: "Minutes of inactivity before clearing old tool result content. Use -1 to disable.";
                        readonly showInDialog: false;
                    };
                    readonly toolResultsNumToKeep: {
                        readonly type: "number";
                        readonly label: "Tool Results Number To Keep";
                        readonly category: "Context";
                        readonly requiresRestart: false;
                        readonly default: number;
                        readonly description: "Number of most-recent compactable tool results to preserve when clearing. Floor at 1.";
                        readonly showInDialog: false;
                    };
                };
            };
            readonly fileFiltering: {
                readonly type: "object";
                readonly label: "File Filtering";
                readonly category: "Context";
                readonly requiresRestart: true;
                readonly default: {};
                readonly description: "Settings for git-aware file filtering.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly respectGitIgnore: {
                        readonly type: "boolean";
                        readonly label: "Respect .gitignore";
                        readonly category: "Context";
                        readonly requiresRestart: true;
                        readonly default: true;
                        readonly description: "Respect .gitignore files when searching";
                        readonly showInDialog: true;
                    };
                    readonly respectQwenIgnore: {
                        readonly type: "boolean";
                        readonly label: "Respect .qwenignore";
                        readonly category: "Context";
                        readonly requiresRestart: true;
                        readonly default: true;
                        readonly description: "Respect .qwenignore files when searching";
                        readonly showInDialog: true;
                    };
                    readonly enableRecursiveFileSearch: {
                        readonly type: "boolean";
                        readonly label: "Enable Recursive File Search";
                        readonly category: "Context";
                        readonly requiresRestart: true;
                        readonly default: true;
                        readonly description: "Enable recursive file search functionality";
                        readonly showInDialog: false;
                    };
                    readonly enableFuzzySearch: {
                        readonly type: "boolean";
                        readonly label: "Enable Fuzzy Search";
                        readonly category: "Context";
                        readonly requiresRestart: true;
                        readonly default: true;
                        readonly description: "Enable fuzzy search when searching for files.";
                        readonly showInDialog: true;
                    };
                };
            };
        };
    };
    readonly memory: {
        readonly type: "object";
        readonly label: "Memory";
        readonly category: "Memory";
        readonly requiresRestart: false;
        readonly default: {};
        readonly description: "Settings for managed auto-memory.";
        readonly showInDialog: false;
        readonly properties: {
            readonly enableManagedAutoMemory: {
                readonly type: "boolean";
                readonly label: "Enable Managed Auto-Memory";
                readonly category: "Memory";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Enable background extraction of memories from conversations.";
                readonly showInDialog: false;
            };
            readonly enableManagedAutoDream: {
                readonly type: "boolean";
                readonly label: "Enable Managed Auto-Dream";
                readonly category: "Memory";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Enable automatic consolidation (dream) of collected memories.";
                readonly showInDialog: false;
            };
            readonly enableAutoSkill: {
                readonly type: "boolean";
                readonly label: "Enable Auto Skill";
                readonly category: "Memory";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Enable background review for reusable project skills after tool-heavy sessions.";
                readonly showInDialog: false;
            };
        };
    };
    readonly slashCommands: {
        readonly type: "object";
        readonly label: "Slash Commands";
        readonly category: "Advanced";
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: string;
        readonly showInDialog: false;
        readonly properties: {
            readonly disabled: {
                readonly type: "array";
                readonly label: "Disabled Slash Commands";
                readonly category: "Advanced";
                readonly requiresRestart: true;
                readonly default: string[] | undefined;
                readonly description: string;
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.UNION;
            };
        };
    };
    readonly permissions: {
        readonly type: "object";
        readonly label: "Permissions";
        readonly category: "Tools";
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: "Permission rules controlling tool usage. Rules are evaluated in priority order: deny > ask > allow.";
        readonly showInDialog: false;
        readonly properties: {
            readonly allow: {
                readonly type: "array";
                readonly label: "Allow Rules";
                readonly category: "Tools";
                readonly requiresRestart: true;
                readonly default: string[] | undefined;
                readonly description: string;
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.UNION;
            };
            readonly ask: {
                readonly type: "array";
                readonly label: "Ask Rules";
                readonly category: "Tools";
                readonly requiresRestart: true;
                readonly default: string[] | undefined;
                readonly description: string;
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.UNION;
            };
            readonly deny: {
                readonly type: "array";
                readonly label: "Deny Rules";
                readonly category: "Tools";
                readonly requiresRestart: true;
                readonly default: string[] | undefined;
                readonly description: string;
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.UNION;
            };
            readonly autoMode: {
                readonly type: "object";
                readonly label: "Auto Mode";
                readonly category: "Tools";
                readonly requiresRestart: true;
                readonly default: {};
                readonly description: "Settings consumed by the AUTO approval mode classifier.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly hints: {
                        readonly type: "object";
                        readonly label: "Classifier Hints";
                        readonly category: "Tools";
                        readonly requiresRestart: true;
                        readonly default: {};
                        readonly description: "Natural-language hints injected into the classifier system prompt.";
                        readonly showInDialog: false;
                        readonly properties: {
                            readonly allow: {
                                readonly type: "array";
                                readonly label: "Auto Mode Allow Hints";
                                readonly category: "Tools";
                                readonly requiresRestart: true;
                                readonly default: string[] | undefined;
                                readonly description: "Natural-language descriptions of actions AUTO mode should allow.";
                                readonly showInDialog: false;
                                readonly mergeStrategy: MergeStrategy.UNION;
                            };
                            readonly deny: {
                                readonly type: "array";
                                readonly label: "Auto Mode Deny Hints";
                                readonly category: "Tools";
                                readonly requiresRestart: true;
                                readonly default: string[] | undefined;
                                readonly description: "Natural-language descriptions of actions AUTO mode should block.";
                                readonly showInDialog: false;
                                readonly mergeStrategy: MergeStrategy.UNION;
                            };
                        };
                    };
                    readonly environment: {
                        readonly type: "array";
                        readonly label: "Auto Mode Environment";
                        readonly category: "Tools";
                        readonly requiresRestart: true;
                        readonly default: string[] | undefined;
                        readonly description: "Environment / context lines injected into the classifier system prompt.";
                        readonly showInDialog: false;
                        readonly mergeStrategy: MergeStrategy.UNION;
                    };
                };
            };
        };
    };
    readonly tools: {
        readonly type: "object";
        readonly label: "Tools";
        readonly category: "Tools";
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: "Settings for built-in and custom tools.";
        readonly showInDialog: false;
        readonly properties: {
            readonly sandbox: {
                readonly type: "object";
                readonly label: "Sandbox";
                readonly category: "Tools";
                readonly requiresRestart: true;
                readonly default: boolean | string | undefined;
                readonly description: "Sandbox execution environment (can be a boolean or a path string).";
                readonly showInDialog: false;
            };
            readonly sandboxImage: {
                readonly type: "string";
                readonly label: "Sandbox Image";
                readonly category: "Tools";
                readonly requiresRestart: true;
                readonly default: string | undefined;
                readonly description: "Sandbox image URI used by Docker/Podman when --sandbox-image and QWEN_SANDBOX_IMAGE are not set.";
                readonly showInDialog: false;
            };
            readonly toolSearch: {
                readonly type: "object";
                readonly label: "Tool Search";
                readonly category: "Tools";
                readonly requiresRestart: true;
                readonly default: {};
                readonly description: "Settings for the ToolSearch discovery mechanism.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly enabled: {
                        readonly type: "boolean";
                        readonly label: "Enable ToolSearch";
                        readonly category: "Tools";
                        readonly requiresRestart: true;
                        readonly default: true;
                        readonly description: "When enabled, MCP tools are loaded on-demand via ToolSearch to reduce prompt size. Disable this for models that rely on prefix-based KV caching (e.g. DeepSeek) to keep the prompt prefix stable and maximize cache hit rates.";
                        readonly showInDialog: true;
                    };
                };
            };
            readonly shell: {
                readonly type: "object";
                readonly label: "Shell";
                readonly category: "Tools";
                readonly requiresRestart: false;
                readonly default: {};
                readonly description: "Settings for shell execution.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly enableInteractiveShell: {
                        readonly type: "boolean";
                        readonly label: "Interactive Shell (PTY)";
                        readonly category: "Tools";
                        readonly requiresRestart: true;
                        readonly default: true;
                        readonly description: "Use node-pty for an interactive shell experience. Falls back to child_process if PTY is unavailable.";
                        readonly showInDialog: true;
                    };
                    readonly pager: {
                        readonly type: "string";
                        readonly label: "Pager";
                        readonly category: "Tools";
                        readonly requiresRestart: false;
                        readonly default: string | undefined;
                        readonly description: "The pager command to use for shell output. Defaults to `cat`.";
                        readonly showInDialog: false;
                    };
                    readonly showColor: {
                        readonly type: "boolean";
                        readonly label: "Show Color";
                        readonly category: "Tools";
                        readonly requiresRestart: false;
                        readonly default: false;
                        readonly description: "Show color in shell output.";
                        readonly showInDialog: false;
                    };
                };
            };
            readonly core: {
                readonly type: "array";
                readonly label: "Core Tools (deprecated)";
                readonly category: "Tools";
                readonly requiresRestart: true;
                readonly default: string[] | undefined;
                readonly description: "Deprecated. Use permissions.allow instead.";
                readonly showInDialog: false;
            };
            readonly allowed: {
                readonly type: "array";
                readonly label: "Allowed Tools (deprecated)";
                readonly category: "Advanced";
                readonly requiresRestart: true;
                readonly default: string[] | undefined;
                readonly description: "Deprecated. Use permissions.allow instead.";
                readonly showInDialog: false;
            };
            readonly exclude: {
                readonly type: "array";
                readonly label: "Exclude Tools (deprecated)";
                readonly category: "Tools";
                readonly requiresRestart: true;
                readonly default: string[] | undefined;
                readonly description: "Deprecated. Use permissions.deny instead.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.UNION;
            };
            readonly disabled: {
                readonly type: "array";
                readonly label: "Disabled Tools";
                readonly category: "Tools";
                readonly requiresRestart: true;
                readonly default: string[] | undefined;
                readonly description: "Tool names hidden from the registry. Differs from permissions.deny: disabled tools are not registered at all, so they never appear in /tools and cannot be discovered by the model. Managed by the daemon mutation route POST /workspace/tools/:name/enable.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.UNION;
            };
            readonly approvalMode: {
                readonly type: "enum";
                readonly label: "Tool Approval Mode";
                readonly category: "Tools";
                readonly requiresRestart: false;
                readonly default: ApprovalMode.DEFAULT;
                readonly description: "Approval mode for tool usage. Controls how tools are approved before execution.";
                readonly showInDialog: true;
                readonly options: readonly [{
                    readonly value: ApprovalMode.PLAN;
                    readonly label: "Plan";
                }, {
                    readonly value: ApprovalMode.DEFAULT;
                    readonly label: "Default";
                }, {
                    readonly value: ApprovalMode.AUTO_EDIT;
                    readonly label: "Auto Edit";
                }, {
                    readonly value: ApprovalMode.AUTO;
                    readonly label: "Auto";
                }, {
                    readonly value: ApprovalMode.YOLO;
                    readonly label: "YOLO";
                }];
            };
            readonly autoAccept: {
                readonly type: "boolean";
                readonly label: "Auto Accept";
                readonly category: "Tools";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Automatically accept and execute tool calls that are considered safe (e.g., read-only operations) without explicit user confirmation.";
                readonly showInDialog: false;
            };
            readonly discoveryCommand: {
                readonly type: "string";
                readonly label: "Tool Discovery Command";
                readonly category: "Tools";
                readonly requiresRestart: true;
                readonly default: string | undefined;
                readonly description: "Command to run for tool discovery.";
                readonly showInDialog: false;
            };
            readonly callCommand: {
                readonly type: "string";
                readonly label: "Tool Call Command";
                readonly category: "Tools";
                readonly requiresRestart: true;
                readonly default: string | undefined;
                readonly description: "Command to run for tool calls.";
                readonly showInDialog: false;
            };
            readonly useRipgrep: {
                readonly type: "boolean";
                readonly label: "Use Ripgrep";
                readonly category: "Tools";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Use ripgrep for file content search instead of the fallback implementation. Provides faster search performance.";
                readonly showInDialog: false;
            };
            readonly useBuiltinRipgrep: {
                readonly type: "boolean";
                readonly label: "Use Builtin Ripgrep";
                readonly category: "Tools";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Use the bundled ripgrep binary. When set to false, the system-level \"rg\" command will be used instead. This setting is only effective when useRipgrep is true.";
                readonly showInDialog: false;
            };
            readonly truncateToolOutputThreshold: {
                readonly type: "number";
                readonly label: "Tool Output Truncation Threshold";
                readonly category: "General";
                readonly requiresRestart: true;
                readonly default: 25000;
                readonly description: "Truncate tool output if it is larger than this many characters. Set to -1 to disable.";
                readonly showInDialog: false;
            };
            readonly truncateToolOutputLines: {
                readonly type: "number";
                readonly label: "Tool Output Truncation Lines";
                readonly category: "General";
                readonly requiresRestart: true;
                readonly default: 1000;
                readonly description: "The number of lines to keep when truncating tool output.";
                readonly showInDialog: false;
            };
        };
    };
    readonly mcp: {
        readonly type: "object";
        readonly label: "MCP";
        readonly category: "MCP";
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: "Settings for Model Context Protocol (MCP) servers.";
        readonly showInDialog: false;
        readonly properties: {
            readonly serverCommand: {
                readonly type: "string";
                readonly label: "MCP Server Command";
                readonly category: "MCP";
                readonly requiresRestart: true;
                readonly default: string | undefined;
                readonly description: "Command to start an MCP server.";
                readonly showInDialog: false;
            };
            readonly allowed: {
                readonly type: "array";
                readonly label: "Allow MCP Servers";
                readonly category: "MCP";
                readonly requiresRestart: true;
                readonly default: string[] | undefined;
                readonly description: "A list of MCP servers to allow.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.CONCAT;
            };
            readonly excluded: {
                readonly type: "array";
                readonly label: "Exclude MCP Servers";
                readonly category: "MCP";
                readonly requiresRestart: true;
                readonly default: string[] | undefined;
                readonly description: "A list of MCP servers to exclude.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.CONCAT;
            };
        };
    };
    readonly security: {
        readonly type: "object";
        readonly label: "Security";
        readonly category: "Security";
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: "Security-related settings.";
        readonly showInDialog: false;
        readonly properties: {
            readonly folderTrust: {
                readonly type: "object";
                readonly label: "Folder Trust";
                readonly category: "Security";
                readonly requiresRestart: false;
                readonly default: {};
                readonly description: "Settings for folder trust.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly enabled: {
                        readonly type: "boolean";
                        readonly label: "Folder Trust";
                        readonly category: "Security";
                        readonly requiresRestart: true;
                        readonly default: false;
                        readonly description: "Setting to track whether Folder trust is enabled.";
                        readonly showInDialog: false;
                    };
                };
            };
            readonly auth: {
                readonly type: "object";
                readonly label: "Authentication";
                readonly category: "Security";
                readonly requiresRestart: true;
                readonly default: {};
                readonly description: "Authentication settings.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly selectedType: {
                        readonly type: "string";
                        readonly label: "Selected Auth Type";
                        readonly category: "Security";
                        readonly requiresRestart: true;
                        readonly default: AuthType | undefined;
                        readonly description: "The currently selected authentication type.";
                        readonly showInDialog: false;
                    };
                    readonly enforcedType: {
                        readonly type: "string";
                        readonly label: "Enforced Auth Type";
                        readonly category: "Advanced";
                        readonly requiresRestart: true;
                        readonly default: AuthType | undefined;
                        readonly description: "The required auth type. If this does not match the selected auth type, the user will be prompted to re-authenticate.";
                        readonly showInDialog: false;
                    };
                    readonly useExternal: {
                        readonly type: "boolean";
                        readonly label: "Use External Auth";
                        readonly category: "Security";
                        readonly requiresRestart: true;
                        readonly default: boolean | undefined;
                        readonly description: "Whether to use an external authentication flow.";
                        readonly showInDialog: false;
                    };
                    readonly apiKey: {
                        readonly type: "string";
                        readonly label: "API Key";
                        readonly category: "Security";
                        readonly requiresRestart: true;
                        readonly default: string | undefined;
                        readonly description: "API key for OpenAI compatible authentication.";
                        readonly showInDialog: false;
                    };
                    readonly baseUrl: {
                        readonly type: "string";
                        readonly label: "Base URL";
                        readonly category: "Security";
                        readonly requiresRestart: true;
                        readonly default: string | undefined;
                        readonly description: "Base URL for OpenAI compatible API.";
                        readonly showInDialog: false;
                    };
                };
            };
            readonly allowedHttpHookUrls: {
                readonly type: "array";
                readonly label: "Allowed HTTP Hook URLs";
                readonly category: "Security";
                readonly requiresRestart: false;
                readonly default: string[];
                readonly description: "Whitelist of URL patterns for HTTP hooks. Supports * wildcard. If empty, all URLs are allowed (subject to SSRF protection).";
                readonly showInDialog: false;
                readonly items: {
                    readonly type: "string";
                    readonly description: "URL pattern (supports * wildcard)";
                };
            };
        };
    };
    readonly advanced: {
        readonly type: "object";
        readonly label: "Advanced";
        readonly category: "Advanced";
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: "Advanced settings for power users.";
        readonly showInDialog: false;
        readonly properties: {
            readonly autoConfigureMemory: {
                readonly type: "boolean";
                readonly label: "Auto Configure Max Old Space Size";
                readonly category: "Advanced";
                readonly requiresRestart: true;
                readonly default: false;
                readonly description: "Automatically configure Node.js memory limits";
                readonly showInDialog: false;
            };
            readonly dnsResolutionOrder: {
                readonly type: "string";
                readonly label: "DNS Resolution Order";
                readonly category: "Advanced";
                readonly requiresRestart: true;
                readonly default: DnsResolutionOrder | undefined;
                readonly description: "The DNS resolution order.";
                readonly showInDialog: false;
            };
            readonly excludedEnvVars: {
                readonly type: "array";
                readonly label: "Excluded Project Environment Variables";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: string[];
                readonly description: "Environment variables to exclude from project context.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.UNION;
            };
            readonly bugCommand: {
                readonly type: "object";
                readonly label: "Bug Command";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: BugCommandSettings | undefined;
                readonly description: "Configuration for the bug report command.";
                readonly showInDialog: false;
            };
            readonly runtimeOutputDir: {
                readonly type: "string";
                readonly label: "Runtime Output Directory";
                readonly category: "Advanced";
                readonly requiresRestart: true;
                readonly default: string | undefined;
                readonly description: string;
                readonly showInDialog: false;
            };
        };
    };
    readonly agents: {
        readonly type: "object";
        readonly label: "Agents";
        readonly category: "Advanced";
        readonly requiresRestart: false;
        readonly default: {};
        readonly description: "Settings for multi-agent collaboration features (Arena, Team, Swarm).";
        readonly showInDialog: false;
        readonly properties: {
            readonly displayMode: {
                readonly type: "enum";
                readonly label: "Display Mode";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: string | undefined;
                readonly description: "Display mode for multi-agent sessions. Currently only \"in-process\" is supported.";
                readonly showInDialog: false;
                readonly options: readonly [{
                    readonly value: "in-process";
                    readonly label: "In-process";
                }];
            };
            readonly arena: {
                readonly type: "object";
                readonly label: "Arena";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: {};
                readonly description: "Settings for Arena (multi-model competitive execution).";
                readonly showInDialog: false;
                readonly properties: {
                    readonly worktreeBaseDir: {
                        readonly type: "string";
                        readonly label: "Worktree Base Directory";
                        readonly category: "Advanced";
                        readonly requiresRestart: true;
                        readonly default: string | undefined;
                        readonly description: "Custom base directory for Arena worktrees. Defaults to ~/.qwen/arena.";
                        readonly showInDialog: false;
                    };
                    readonly preserveArtifacts: {
                        readonly type: "boolean";
                        readonly label: "Preserve Arena Artifacts";
                        readonly category: "Advanced";
                        readonly requiresRestart: false;
                        readonly default: false;
                        readonly description: "When enabled, Arena worktrees and session state files are preserved after the session ends or the main agent exits.";
                        readonly showInDialog: true;
                    };
                    readonly maxRoundsPerAgent: {
                        readonly type: "number";
                        readonly label: "Max Rounds Per Agent";
                        readonly category: "Advanced";
                        readonly requiresRestart: false;
                        readonly default: number | undefined;
                        readonly description: "Maximum number of rounds (turns) each agent can execute. No limit if unset.";
                        readonly showInDialog: false;
                    };
                    readonly timeoutSeconds: {
                        readonly type: "number";
                        readonly label: "Timeout (seconds)";
                        readonly category: "Advanced";
                        readonly requiresRestart: false;
                        readonly default: number | undefined;
                        readonly description: "Total timeout in seconds for the Arena session. No limit if unset.";
                        readonly showInDialog: false;
                    };
                };
            };
            readonly team: {
                readonly type: "object";
                readonly label: "Team";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: {};
                readonly description: "Settings for Agent Team (role-based collaborative execution). Reserved for future use.";
                readonly showInDialog: false;
            };
            readonly swarm: {
                readonly type: "object";
                readonly label: "Swarm";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: {};
                readonly description: "Settings for Agent Swarm (parallel sub-agent execution). Reserved for future use.";
                readonly showInDialog: false;
            };
        };
    };
    readonly disableAllHooks: {
        readonly type: "boolean";
        readonly label: "Disable All Hooks";
        readonly category: "Advanced";
        readonly requiresRestart: true;
        readonly default: false;
        readonly description: "Temporarily disable all hooks without deleting configurations. Default is false (hooks enabled).";
        readonly showInDialog: false;
    };
    readonly stopHookBlockingCap: {
        readonly type: "number";
        readonly label: "Stop Hook Blocking Cap";
        readonly category: "Advanced";
        readonly requiresRestart: true;
        readonly default: 8;
        readonly description: "Maximum consecutive blocking Stop/SubagentStop hook decisions before Qwen Code overrides the hook loop and ends the turn. Can be overridden by QWEN_CODE_STOP_HOOK_BLOCK_CAP.";
        readonly showInDialog: false;
    };
    readonly hooks: {
        readonly type: "object";
        readonly label: "Hooks";
        readonly category: "Advanced";
        readonly requiresRestart: false;
        readonly default: {};
        readonly description: "Hook event configurations for extending CLI behavior at various lifecycle points.";
        readonly showInDialog: false;
        readonly properties: {
            readonly UserPromptSubmit: {
                readonly type: "array";
                readonly label: "Before Agent Hooks";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: [];
                readonly description: "Hooks that execute before agent processing. Can modify prompts or inject context.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.CONCAT;
                readonly items: SettingItemDefinition;
            };
            readonly Stop: {
                readonly type: "array";
                readonly label: "After Agent Hooks";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: [];
                readonly description: "Hooks that execute after agent processing. Can post-process responses or log interactions.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.CONCAT;
                readonly items: SettingItemDefinition;
            };
            readonly Notification: {
                readonly type: "array";
                readonly label: "Notification Hooks";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: [];
                readonly description: "Hooks that execute when notifications are sent.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.CONCAT;
                readonly items: SettingItemDefinition;
            };
            readonly PreToolUse: {
                readonly type: "array";
                readonly label: "Pre Tool Use Hooks";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: [];
                readonly description: "Hooks that execute before tool execution.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.CONCAT;
                readonly items: SettingItemDefinition;
            };
            readonly PostToolUse: {
                readonly type: "array";
                readonly label: "Post Tool Use Hooks";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: [];
                readonly description: "Hooks that execute after successful tool execution.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.CONCAT;
                readonly items: SettingItemDefinition;
            };
            readonly PostToolUseFailure: {
                readonly type: "array";
                readonly label: "Post Tool Use Failure Hooks";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: [];
                readonly description: "Hooks that execute when tool execution fails. ";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.CONCAT;
                readonly items: SettingItemDefinition;
            };
            readonly SessionStart: {
                readonly type: "array";
                readonly label: "Session Start Hooks";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: [];
                readonly description: "Hooks that execute when a new session starts or resumes.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.CONCAT;
                readonly items: SettingItemDefinition;
            };
            readonly SessionEnd: {
                readonly type: "array";
                readonly label: "Session End Hooks";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: [];
                readonly description: "Hooks that execute when a session ends.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.CONCAT;
                readonly items: SettingItemDefinition;
            };
            readonly PreCompact: {
                readonly type: "array";
                readonly label: "Pre Compact Hooks";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: [];
                readonly description: "Hooks that execute before conversation compaction.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.CONCAT;
                readonly items: SettingItemDefinition;
            };
            readonly SubagentStart: {
                readonly type: "array";
                readonly label: "Subagent Start Hooks";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: [];
                readonly description: "Hooks that execute when a subagent (Task tool call) is started.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.CONCAT;
                readonly items: SettingItemDefinition;
            };
            readonly SubagentStop: {
                readonly type: "array";
                readonly label: "Subagent Stop Hooks";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: [];
                readonly description: "Hooks that execute right before a subagent (Task tool call) concludes its response.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.CONCAT;
                readonly items: SettingItemDefinition;
            };
            readonly PermissionRequest: {
                readonly type: "array";
                readonly label: "Permission Request Hooks";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: [];
                readonly description: "Hooks that execute when a permission dialog is displayed.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.CONCAT;
                readonly items: SettingItemDefinition;
            };
        };
    };
    readonly experimental: {
        readonly type: "object";
        readonly label: "Experimental";
        readonly category: "Experimental";
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: "Settings to enable experimental features.";
        readonly showInDialog: false;
        readonly properties: {
            readonly cron: {
                readonly type: "boolean";
                readonly label: "Enable Cron/Loop Tools";
                readonly category: "Experimental";
                readonly requiresRestart: true;
                readonly default: false;
                readonly description: "Enable in-session cron/loop tools (experimental). When enabled, the model can create recurring prompts using cron_create, cron_list, and cron_delete tools. Can also be enabled via QWEN_CODE_ENABLE_CRON=1 environment variable.";
                readonly showInDialog: true;
            };
            readonly emitToolUseSummaries: {
                readonly type: "boolean";
                readonly label: "Tool Use Summaries";
                readonly category: "Experimental";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Generate a short LLM-based label after each tool batch completes. In compact mode the label replaces the generic `Tool × N` header; in full mode it appears as a dim `● <label>` line below the tool group. Requires a fast model to be configured; runs in parallel with the next API call so latency is hidden. Currently affects interactive CLI rendering only — SDK / non-interactive emission of the `tool_use_summary` message is not yet wired (the message factory is exported for a follow-up PR). Can be overridden with QWEN_CODE_EMIT_TOOL_USE_SUMMARIES=0 or =1.";
                readonly showInDialog: true;
            };
        };
    };
};
export type SettingsSchemaType = typeof SETTINGS_SCHEMA;
export declare function getSettingsSchema(): SettingsSchemaType;
type InferSettings<T extends SettingsSchema> = {
    -readonly [K in keyof T]?: T[K] extends {
        properties: SettingsSchema;
    } ? InferSettings<T[K]['properties']> : T[K]['type'] extends 'enum' ? T[K]['options'] extends readonly SettingEnumOption[] ? T[K]['options'][number]['value'] : T[K]['default'] : T[K]['default'] extends boolean ? boolean : T[K]['default'];
};
export type Settings = InferSettings<SettingsSchemaType>;
export {};
