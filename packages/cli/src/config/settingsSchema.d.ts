/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { MCPServerConfig, BugCommandSettings, TelemetrySettings, OutboundCorrelationSettings, AuthType, ChatCompressionSettings, ModelProvidersConfig, ProviderProtocolConfig } from '@qwen-code/qwen-code-core';
import { ApprovalMode } from '@qwen-code/qwen-code-core';
import type { CustomTheme } from '../ui/themes/theme.js';
export declare const DEFAULT_OPENAI_LOG_RETENTION_DAYS = 7;
export type SettingsType = 'boolean' | 'string' | 'number' | 'integer' | 'array' | 'object' | 'enum';
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
    /** Minimum value for number/integer-type settings. */
    minimum?: number;
    /** Maximum value for number/integer-type settings. */
    maximum?: number;
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
        readonly requiresRestart: false;
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
    readonly serve: {
        readonly type: "object";
        readonly label: "Serve";
        readonly category: "Advanced";
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: "Persistent qwen serve settings.";
        readonly showInDialog: false;
        readonly mergeStrategy: MergeStrategy.SHALLOW_MERGE;
        readonly properties: {
            readonly channels: {
                readonly type: "array";
                readonly label: "Startup Channels";
                readonly category: "Advanced";
                readonly requiresRestart: true;
                readonly default: string[];
                readonly description: "Messaging channels to start automatically when the daemon boots.";
                readonly showInDialog: false;
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly maxConcurrentSubSessionsPerCaller: {
                readonly type: "integer";
                readonly label: "Max Concurrent Sub-Sessions Per Caller";
                readonly category: "Advanced";
                readonly requiresRestart: true;
                readonly default: 16;
                readonly minimum: 1;
                readonly description: "Per-session ceiling on concurrent in-flight sub-sessions spawned via the create_sub_session tool.";
                readonly showInDialog: false;
            };
            readonly maxConcurrentSubSessionsTotal: {
                readonly type: "integer";
                readonly label: "Max Concurrent Sub-Sessions Total";
                readonly category: "Advanced";
                readonly requiresRestart: true;
                readonly default: 24;
                readonly minimum: 1;
                readonly maximum: 1024;
                readonly description: "Workspace-wide ceiling on concurrent in-flight sub-sessions across all callers.";
                readonly showInDialog: false;
            };
        };
    };
    readonly modelProviders: {
        readonly type: "object";
        readonly label: "Model Providers";
        readonly category: "Model";
        readonly requiresRestart: false;
        readonly default: ModelProvidersConfig;
        readonly description: "Model providers configuration keyed by provider id (a built-in AuthType such as \"openai\" or \"gemini\", or a custom id mapped via providerProtocol). Each entry is an array of model configurations.";
        readonly showInDialog: false;
        readonly mergeStrategy: MergeStrategy.REPLACE;
    };
    readonly providerProtocol: {
        readonly type: "object";
        readonly label: "Provider Protocols";
        readonly category: "Model";
        readonly requiresRestart: true;
        readonly default: ProviderProtocolConfig;
        readonly description: "Maps a custom modelProviders provider id to the SDK protocol that routes its requests (e.g. {\"idealab\": \"openai\"}). Lets a custom provider id reuse a built-in protocol. Built-in provider ids (openai, gemini, anthropic, vertex-ai, qwen-oauth) are routed automatically and need no entry.";
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
            readonly voice: {
                readonly type: "object";
                readonly label: "Voice Dictation";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: {};
                readonly description: "Voice dictation settings.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly enabled: {
                        readonly type: "boolean";
                        readonly label: "Voice Dictation";
                        readonly category: "General";
                        readonly requiresRestart: false;
                        readonly default: false;
                        readonly description: "Enable voice dictation in the prompt input.";
                        readonly showInDialog: false;
                    };
                    readonly mode: {
                        readonly type: "enum";
                        readonly label: "Voice Dictation Mode";
                        readonly category: "General";
                        readonly requiresRestart: false;
                        readonly default: "hold";
                        readonly description: "How push-to-talk behaves: \"hold\" to talk while held, or \"tap\" to start and tap (or pause) to stop and submit.";
                        readonly showInDialog: false;
                        readonly options: readonly [{
                            readonly value: "hold";
                            readonly label: "Hold to talk";
                        }, {
                            readonly value: "tap";
                            readonly label: "Tap to toggle";
                        }];
                    };
                    readonly language: {
                        readonly type: "string";
                        readonly label: "Voice Dictation Language";
                        readonly category: "General";
                        readonly requiresRestart: false;
                        readonly default: "";
                        readonly description: "Preferred spoken language for voice transcription (e.g. \"english\", \"chinese\"). Leave empty to auto-detect.";
                        readonly showInDialog: false;
                    };
                    readonly keytermsFile: {
                        readonly type: "string";
                        readonly label: "Voice Dictation Keyterms File";
                        readonly category: "General";
                        readonly requiresRestart: false;
                        readonly default: "";
                        readonly description: "Path to a custom keyterms file (one term per line, \"#\" for comments) that biases voice transcription toward domain-specific terms. Relative paths resolve from the workspace root; defaults to \".qwen/voice-keyterms.txt\" when present. The file contents are sent to the ASR provider and it is read only in trusted workspaces. Only applies to Qwen ASR models (qwen3-asr-*).";
                        readonly showInDialog: false;
                    };
                    readonly refineTranscript: {
                        readonly type: "boolean";
                        readonly label: "Refine Voice Transcript";
                        readonly category: "General";
                        readonly requiresRestart: false;
                        readonly default: true;
                        readonly description: "Clean up voice transcripts with the fast model before inserting them — removes filler words and fixes recognition errors while preserving meaning. Falls back to the raw transcript on failure, and is skipped when no fast model is configured.";
                        readonly showInDialog: false;
                    };
                };
            };
            readonly enableAutoUpdate: {
                readonly type: "boolean";
                readonly label: "Enable Auto Update";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: true;
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
                readonly minimum: 1;
                readonly description: "How many minutes the terminal must be blurred before an auto-recap fires on the next focus-in. Matches Claude Code's default of 5 minutes; raise if you briefly alt-tab and do not want recaps to pile up.";
                readonly showInDialog: true;
            };
            readonly cleanupPeriodDays: {
                readonly type: "number";
                readonly label: "Cleanup Period (days)";
                readonly category: "General";
                readonly requiresRestart: true;
                readonly default: 30;
                readonly minimum: 0;
                readonly description: "Number of days to retain ~/.qwen/file-history/ session backups used by /rewind and background subagent transcripts under <projectDir>/subagents/. Data older than this is removed by a background housekeeping pass that runs at most once per day. Set to 0 for minimum retention (~1 hour) — protects sessions touched in the last hour, plus the currently active session.";
                readonly showInDialog: true;
            };
            readonly gitCoAuthor: {
                readonly type: "object";
                readonly label: "Attribution";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: {
                    readonly commit: true;
                    readonly pr: true;
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
                        readonly default: true;
                        readonly description: "Add a Co-authored-by trailer to git commit messages AND attach a per-file AI-attribution git note (`refs/notes/ai-attribution`) for commits made through Qwen Code. Disabling skips both.";
                        readonly showInDialog: true;
                    };
                    readonly pr: {
                        readonly type: "boolean";
                        readonly label: "Attribution: PR";
                        readonly category: "General";
                        readonly requiresRestart: false;
                        readonly default: true;
                        readonly description: "Append a Qwen Code attribution line to PR descriptions when running `gh pr create`.";
                        readonly showInDialog: true;
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
            readonly notificationMode: {
                readonly type: "enum";
                readonly label: "Notification Mode";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: "all";
                readonly description: string;
                readonly showInDialog: true;
                readonly options: readonly [{
                    readonly value: "all";
                    readonly label: "All (approvals + task completion)";
                }, {
                    readonly value: "task-complete";
                    readonly label: "Task completion only";
                }];
            };
            readonly preventSystemSleep: {
                readonly type: "boolean";
                readonly label: "Prevent System Sleep While Running";
                readonly category: "General";
                readonly requiresRestart: true;
                readonly default: true;
                readonly description: "Prevent the system from sleeping while Qwen Code is streaming a model response or executing tools. Idle prompt time and permission prompts do not inhibit sleep.";
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
            readonly showTimestamps: {
                readonly type: "boolean";
                readonly label: "Show Timestamps";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Show [HH:MM:SS] timestamp before each assistant response.";
                readonly showInDialog: true;
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
                    respectUserColors?: boolean;
                    hideContextIndicator?: boolean;
                } | {
                    type: "preset";
                    items: string[];
                    useThemeColors?: boolean;
                    hideContextIndicator?: boolean;
                }) | undefined;
                readonly description: "Status line display configuration. Use `type: \"preset\"` with built-in item ids, or `type: \"command\"` with a shell command. Optional command `refreshInterval` (seconds, >= 1) re-runs the command on a timer so external data stays fresh. Set `respectUserColors: true` to preserve ANSI color codes in command output instead of applying dim/theme styling. Set `hideContextIndicator: true` to hide the built-in context usage indicator in the footer right section, or `false` to always show it. When `hideContextIndicator` is unset, the footer indicator is hidden automatically for preset status lines that already include `context-used` or `context-remaining`, and shown otherwise (including for `command` status lines). When unset (default), the built-in default preset (model, git branch, context usage, current dir) is shown automatically; set to `null` to explicitly disable the status line.";
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
            readonly disableWorkflowKeywordTrigger: {
                readonly type: "boolean";
                readonly label: "Disable Workflow Keyword Trigger";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "When true, mentioning the word `workflow` in a prompt no longer softly steers the turn toward the Workflow tool (and the Footer `workflow active` indicator is suppressed). Only applies when workflows are enabled.";
                readonly showInDialog: true;
            };
            readonly showStatusInTitle: {
                readonly type: "boolean";
                readonly label: "Show Status in Title";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Show Qwen Code session name and status in the terminal window title";
                readonly showInDialog: true;
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
            readonly history: {
                readonly type: "object";
                readonly label: "History";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: {};
                readonly description: "History display settings.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly collapseOnResume: {
                        readonly type: "boolean";
                        readonly label: "Collapse On Resume";
                        readonly category: "UI";
                        readonly requiresRestart: false;
                        readonly default: false;
                        readonly description: "Whether to collapse history by default when resuming a session.";
                        readonly showInDialog: false;
                    };
                    readonly collapsePreviewCount: {
                        readonly type: "number";
                        readonly label: "Collapse Preview Count";
                        readonly category: "UI";
                        readonly requiresRestart: false;
                        readonly default: 0;
                        readonly description: "Number of most recent user turns to keep visible when collapsing history on resume. 0 collapses all restored history by default; -1 shows all restored history.";
                        readonly showInDialog: false;
                    };
                };
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
            readonly showResponseTokensPerSecond: {
                readonly type: "boolean";
                readonly label: "Show Response Tokens Per Second";
                readonly category: "UI";
                readonly requiresRestart: true;
                readonly default: false;
                readonly description: "Show a live tokens/sec estimate next to the response token counter while the model is streaming. Takes effect in the next session.";
                readonly showInDialog: true;
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
                readonly default: true;
                readonly description: "Show context-aware follow-up suggestions after task completion. Press Tab, Right Arrow, or Enter to accept into the input buffer.";
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
                readonly description: "Compact view (web shell only; not used by the TUI).";
                readonly showInDialog: false;
            };
            readonly useTerminalBuffer: {
                readonly type: "boolean";
                readonly label: "Virtualized History (reduces flicker on long sessions)";
                readonly category: "UI";
                readonly requiresRestart: true;
                readonly default: true;
                readonly description: "Render conversation history in an in-app scrollable viewport instead of the terminal scrollback buffer. Enabled by default in compatible interactive terminals to avoid flicker, scroll-storm, and interface freeze on long sessions, after Ctrl+O, after Ctrl+E / Ctrl+F (expand), after window resize, or when alt-tabbing back. Screen reader mode and non-interactive output such as piped stdout or CI use append-only terminal output instead. Scroll with Shift+↑/↓ (line), PgUp/PgDn (page), Ctrl+Home/End (top/bottom), or the mouse wheel. Also enables mouse interactions: click an option in a menu/dialog to select it, hover to highlight it, and click in the prompt to position the cursor. Does NOT use the host terminal scrollback while enabled. Drag to select text in the viewport (double/triple click selects a word/line), copied on release. To use the terminal’s own selection instead, hold Shift (or Option on macOS) while dragging. These mouse interactions are controlled by ui.mouseTracking; disable that setting to restore native right-click and OSC 8 hyperlink clicks.";
                readonly showInDialog: true;
            };
            readonly showScrollbar: {
                readonly type: "boolean";
                readonly label: "Show Scrollbar (Virtualized History)";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Show the auto-hiding scrollbar in the in-app scrollable viewport (Virtualized History). The bar appears while scrolling and fades out when idle. Disable to hide it entirely.";
                readonly showInDialog: true;
            };
            readonly mouseTracking: {
                readonly type: "boolean";
                readonly label: "Mouse Tracking";
                readonly category: "UI";
                readonly requiresRestart: true;
                readonly default: true;
                readonly description: "Enable in-app SGR mouse tracking. While enabled, Qwen Code captures mouse events for text selection, click-to-position in text inputs, row hover, history-item toggling, and viewport scrolling. Because the terminal forwards all mouse events to the app, it cannot show native right-click context menus or open OSC 8 hyperlink clicks. Disable to restore native right-click and clickable URL links; this turns off all in-app mouse interaction, and in Virtualized History the wheel no longer scrolls the transcript — use Shift+↑/↓, PgUp/PgDn, or Ctrl+Home/End instead (pair with ui.useTerminalBuffer: false to restore native terminal scrollback).";
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
                readonly default: true;
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
                readonly userId: {
                    readonly description: "Stable end-user identifier written to GenAI spans as gen_ai.user.id for ARMS session analysis. This value is linkable personal data: prefer a pseudonymous ID, and configure it only when one process represents one user.";
                    readonly type: "string";
                };
                readonly includeSensitiveSpanAttributes: {
                    readonly description: "When enabled, user prompts, system prompts, tool inputs/outputs, and model responses are written to native OTel span attributes in addition to the log-to-span bridge. Warning: this may expose sensitive data (file contents, shell commands, conversation history) to your OTLP backend.";
                    readonly type: "boolean";
                    readonly default: false;
                };
                readonly sensitiveSpanAttributeMaxLength: {
                    readonly description: "Maximum JavaScript string length for each sensitive native OTel span attribute content payload. Default: 1048576 (1 MiB). Maximum: 104857600 (100 MiB). Set lower if your collector or backend rejects large span attributes.";
                    readonly type: "integer";
                    readonly minimum: 1;
                    readonly maximum: number;
                    readonly default: number;
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
    readonly outboundCorrelation: {
        readonly type: "object";
        readonly label: "Outbound Correlation";
        readonly category: "Advanced";
        readonly requiresRestart: true;
        readonly default: OutboundCorrelationSettings | undefined;
        readonly description: "SECURITY-RELEVANT. Controls what client-side correlation data qwen-code writes into outbound LLM API requests (DashScope, OpenAI, Anthropic, etc.) — separate from `telemetry.*` which governs data flow into the operator's OWN OTLP collector. All values default to off. Opt in only when the LLM provider also reports into your OTel collector for cross-process trace stitching (e.g. ARMS Tracing + DashScope).";
        readonly showInDialog: false;
        readonly jsonSchemaOverride: {
            readonly type: "object";
            readonly properties: {
                readonly propagateTraceContext: {
                    readonly description: "Requires `telemetry.enabled: true`. Inject W3C `traceparent` on outbound `fetch` requests (LLM SDK calls, MCP StreamableHTTP, WebFetch, ...) AND as a `TRACEPARENT` environment variable in shell child processes (Bash tool, hooks, monitor). When enabled, any existing `TRACEPARENT` in the parent environment is overwritten with qwen-code's own trace context. Default: false — trace context stays internal to the operator's OTLP collector. Set true when you want cross-process trace stitching with an OTel-aware LLM provider (e.g. ARMS+DashScope) or need shell scripts / CLI tools to participate in distributed tracing.";
                    readonly type: "boolean";
                    readonly default: false;
                };
            };
            readonly additionalProperties: false;
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
    readonly visionModel: {
        readonly type: "string";
        readonly label: "Vision Model";
        readonly category: "Model";
        readonly requiresRestart: false;
        readonly default: "";
        readonly description: "Image-capable model used as the vision bridge: when a text-only main model receives an image, it is transcribed by this model first. Set with /model --vision. Leave empty to auto-pick a same-provider vision model.";
        readonly showInDialog: true;
    };
    readonly compactionModel: {
        readonly type: "string";
        readonly label: "Compaction Model";
        readonly category: "Model";
        readonly requiresRestart: false;
        readonly default: "";
        readonly description: "Model used for chat compression (auto-compaction). Set with /model --compaction. Leave empty to fall back to the main model. A smaller/faster model reduces compression latency and cost.";
        readonly showInDialog: false;
    };
    readonly imageModel: {
        readonly type: "string";
        readonly label: "Image Model";
        readonly category: "Model";
        readonly requiresRestart: false;
        readonly default: "";
        readonly description: "Model used by the built-in image_gen tool. Set with /model --image. The selected model must be marked imageOnly in modelProviders.";
        readonly showInDialog: false;
    };
    readonly visionBridgeTimeoutMs: {
        readonly type: "integer";
        readonly label: "Vision Bridge Timeout (ms)";
        readonly category: "Model";
        readonly requiresRestart: true;
        readonly default: number | undefined;
        readonly minimum: 1;
        readonly maximum: 2147483647;
        readonly description: "Per-attempt timeout in milliseconds for the vision bridge image transcription call (a positive integer up to 2147483647). Unset uses the built-in 30s. Raise for slow or proxied vision endpoints.";
        readonly showInDialog: false;
    };
    readonly modelFallbacks: {
        readonly type: "string";
        readonly label: "Model Fallbacks";
        readonly category: "Model";
        readonly requiresRestart: true;
        readonly default: "";
        readonly description: "Ordered list of fallback model IDs (comma-separated, max 3) to try when the primary model hits capacity errors (429/503/529). Example: \"qwen-plus,qwen-turbo\". Set via CLI with --fallback-model.";
        readonly showInDialog: true;
    };
    readonly voiceModel: {
        readonly type: "string";
        readonly label: "Voice Model";
        readonly category: "Model";
        readonly requiresRestart: false;
        readonly default: "";
        readonly description: "Model used for voice transcription. Set with /model --voice. Leave empty to keep voice dictation disabled until a voice model is selected.";
        readonly showInDialog: false;
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
            readonly baseUrl: {
                readonly type: "string";
                readonly label: "Model Base URL";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: string | undefined;
                readonly description: "Base URL paired with model.name; disambiguates which provider to use when multiple modelProviders entries share the same model id.";
                readonly showInDialog: false;
            };
            readonly reasoningEffort: {
                readonly type: "enum";
                readonly label: "Reasoning Effort";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: string | undefined;
                readonly description: "How hard reasoning-capable models think, applied across all providers. Set with /effort. Each provider maps and clamps this to what the active model supports (e.g. Gemini caps at \"high\"; Anthropic clamps tiers a model lacks). Leave unset to use the model/provider default.";
                readonly showInDialog: true;
                readonly options: readonly [{
                    readonly value: "low";
                    readonly label: "Low";
                }, {
                    readonly value: "medium";
                    readonly label: "Medium";
                }, {
                    readonly value: "high";
                    readonly label: "High";
                }, {
                    readonly value: "xhigh";
                    readonly label: "Extra High";
                }, {
                    readonly value: "max";
                    readonly label: "Max";
                }];
            };
            readonly maxSessionTurns: {
                readonly type: "integer";
                readonly label: "Max Session Turns";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: -1;
                readonly description: "Maximum number of user/model/tool turns to keep in a session. Must be an integer; -1 means unlimited.";
                readonly showInDialog: false;
            };
            readonly maxWallTimeSeconds: {
                readonly type: "number";
                readonly label: "Max Wall-Clock Time (seconds)";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: -1;
                readonly description: "Run-level wall-clock budget for headless / unattended runs, in seconds. -1 means unlimited; otherwise must be in [1, ~2,147,483] (sub-second values and values above ~24 days are rejected as typos). Overridable per-invocation via --max-wall-time (which also accepts duration suffixes like 5m, 1.5h).";
                readonly showInDialog: false;
            };
            readonly maxToolCalls: {
                readonly type: "number";
                readonly label: "Max Tool Calls";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: -1;
                readonly description: "Cumulative tool-call budget for a run (counts every executed tool, success or failure; structured_output under --json-schema is exempt). -1 means unlimited; 0 means \"no tool calls allowed\" (first call aborts). Capped at 1,000,000 to catch typos. Overridable via --max-tool-calls.";
                readonly showInDialog: false;
            };
            readonly maxSubagentDepth: {
                readonly type: "number";
                readonly label: "Max Sub-agent Nesting Depth";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: 5;
                readonly description: "Maximum sub-agent nesting depth (1-based levels: a top-level sub-agent is level 1). 1 keeps sub-agents available but disables nesting; the default 5 allows nesting up to five levels deep. Values clamp to the range 1-100; non-finite values fall back to the default. Teammates, forks, and workflow-spawned agents never nest regardless of this setting. Overridable via --max-subagent-depth.";
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
            readonly skipWorkflowUsageWarning: {
                readonly type: "boolean";
                readonly label: "Skip Workflow Usage Warning";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Suppress the one-time Workflow tool usage banner that describes the QWEN_CODE_MAX_TOKENS_PER_WORKFLOW env knob. The banner fires at most once per session regardless of this setting.";
                readonly showInDialog: false;
            };
            readonly skipLoopDetection: {
                readonly type: "boolean";
                readonly label: "Skip Loop Detection";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Skip the opt-in streaming loop-detection heuristics (content/thought repetition, read-file and action stagnation, global-duplicate and alternating tool-call patterns). Defaults to true to avoid false-positive interruptions; set to false to re-enable them as an unattended-run guardrail. Daemon/ACP sessions run none of the other detectors; setting this to false also enables a global-duplicate tool-call halt there. Core-client sessions keep a minimal always-on guard regardless of this setting (consecutive identical tool calls, shell inspection-command stagnation, and a per-turn tool-call cap, see model.maxToolCallsPerTurn); daemon/ACP sessions keep the per-turn tool-call cap and an invalid-tool-params stagnation guard.";
                readonly showInDialog: false;
            };
            readonly maxToolCallsPerTurn: {
                readonly type: "integer";
                readonly label: "Max Tool Calls Per Turn";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: 100;
                readonly description: "Per-turn tool-call cap (one model turn plus its tool-result continuations; blocking Stop-hook continuations such as /goal iterations start a fresh budget). When set explicitly, this value is a hard cap: the turn halts on the next tool call after it is reached (the released behavior). When left unset (default 100), the cap is adaptive: once the turn exceeds 100 it halts only when the model keeps repeating the same call (a stuck loop); a productive turn (diverse calls) continues up to a hard backstop of 1000, which always halts. The adaptive default applies to the interactive TUI, non-interactive (-p / JSON / stream-JSON) core-client runs, and daemon/ACP sessions alike. Daemon/ACP sessions evaluate the cap once per tool batch, before execution: a batch that would cross an explicit cap or the hard backstop is skipped whole, so a turn never executes past either (it can halt up to one batch short), while the adaptive soft cap is exceeded by design, up to the backstop. They also have no in-session disable. An always-on circuit breaker against runaway turns, independent of model.skipLoopDetection. Set to 0 or a negative value to disable the cap.";
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
            readonly openAILogRetentionDays: {
                readonly type: "number";
                readonly label: "OpenAI Log Retention (days)";
                readonly category: "Model";
                readonly requiresRestart: true;
                readonly default: 7;
                readonly minimum: 0;
                readonly description: "Number of days to retain OpenAI API log files written when enableOpenAILogging is on. Completed background housekeeping passes run at most once per day in interactive, headless, stream-json SDK, and ACP sessions. Short-lived non-interactive processes make best-effort progress, while persistent processes scan to completion. Set to 0 for minimum retention (~1 hour). For a custom openAILoggingDir, configure this at user or system scope; workspace-scoped retention is skipped because one directory can be shared by multiple workspaces.";
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
                    readonly retryInitialDelayMs: {
                        readonly type: "number";
                        readonly label: "Retry Initial Delay";
                        readonly category: "Generation Configuration";
                        readonly requiresRestart: false;
                        readonly default: number | undefined;
                        readonly description: "Initial delay in milliseconds for stream rate-limit retries.";
                        readonly minimum: 1;
                        readonly parentKey: "generationConfig";
                        readonly showInDialog: false;
                    };
                    readonly retryMaxDelayMs: {
                        readonly type: "number";
                        readonly label: "Retry Max Delay";
                        readonly category: "Generation Configuration";
                        readonly requiresRestart: false;
                        readonly default: number | undefined;
                        readonly description: "Maximum delay in milliseconds for stream rate-limit retries.";
                        readonly minimum: 1;
                        readonly parentKey: "generationConfig";
                        readonly showInDialog: false;
                    };
                    readonly enableCacheControl: {
                        readonly type: "boolean";
                        readonly label: "Enable Cache Control";
                        readonly category: "Generation Configuration";
                        readonly requiresRestart: false;
                        readonly default: true;
                        readonly description: "Enable provider prompt-cache controls.";
                        readonly parentKey: "generationConfig";
                        readonly showInDialog: false;
                    };
                    readonly forceGlobalCacheScope: {
                        readonly type: "boolean";
                        readonly label: "Force Global Cache Scope";
                        readonly category: "Generation Configuration";
                        readonly requiresRestart: false;
                        readonly default: false;
                        readonly description: "Force scope:'global' on Anthropic cache_control entries even when the base URL is not an Anthropic-native origin (e.g. proxy providers like Routify, OpenRouter). Requires the proxy to forward cache_control fields and the prompt-caching-scope-2026-01-05 beta.";
                        readonly parentKey: "generationConfig";
                        readonly showInDialog: false;
                    };
                    readonly cacheRetention: {
                        readonly type: "enum";
                        readonly label: "Anthropic Cache Retention";
                        readonly category: "Generation Configuration";
                        readonly requiresRestart: false;
                        readonly default: "ephemeral" | "1h" | undefined;
                        readonly description: "Default Anthropic cache_control retention. 'ephemeral' uses the spec 5-minute default (no ttl on the wire). '1h' requests the extended cache tier (ttl: '1h') -- note the 1h tier writes at 2x base input token cost (vs 1.25x for the 5-minute default; cached reads stay 0.1x for both), so it only pays off when a prefix survives long enough between requests to outlast several 5-minute windows.";
                        readonly parentKey: "generationConfig";
                        readonly showInDialog: false;
                        readonly options: readonly [{
                            readonly value: "ephemeral";
                            readonly label: "Ephemeral (5m, Default)";
                        }, {
                            readonly value: "1h";
                            readonly label: "Extended (1h)";
                        }];
                    };
                    readonly cacheRetentionByBlock: {
                        readonly type: "object";
                        readonly label: "Anthropic Cache Retention By Block";
                        readonly category: "Generation Configuration";
                        readonly requiresRestart: false;
                        readonly default: Partial<Record<"system" | "tool" | "user.last", "ephemeral" | "1h">> | undefined;
                        readonly description: "Optional per-anchor override for Anthropic cache retention. Keys (system, tool, user.last) override generationConfig.cacheRetention when present. Resolution is normalized so retention is monotonically non-increasing in wire order (tool -> system -> user.last, per Anthropic's 'longer TTL must precede shorter TTL' rule): setting one anchor to '1h' promotes every anchor before it on the wire to '1h' as well, so any combination here is valid.";
                        readonly parentKey: "generationConfig";
                        readonly showInDialog: false;
                        readonly jsonSchemaOverride: {
                            readonly type: "object";
                            readonly properties: {
                                readonly system: {
                                    readonly type: "string";
                                    readonly enum: readonly ["ephemeral", "1h"];
                                };
                                readonly tool: {
                                    readonly type: "string";
                                    readonly enum: readonly ["ephemeral", "1h"];
                                };
                                readonly 'user.last': {
                                    readonly type: "string";
                                    readonly enum: readonly ["ephemeral", "1h"];
                                };
                            };
                            readonly additionalProperties: false;
                        };
                    };
                    readonly splitToolMedia: {
                        readonly type: "boolean";
                        readonly label: "Split Tool Result Media";
                        readonly category: "Generation Configuration";
                        readonly requiresRestart: false;
                        readonly default: true;
                        readonly description: "When true, media (images / audio / video / files) returned by tool calls — including the built-in read_file and MCP tools — is split into a follow-up user message instead of being embedded in the `role: \"tool\"` message. The OpenAI Chat Completions spec only permits text on tool messages, so strict OpenAI-compatible servers (e.g., doubao / new-api / LM Studio) silently drop or reject embedded media and the model never sees an image read via read_file (QwenLM/qwen-code#4876, #3616). Default true is spec-compliant and safe for permissive providers; set false only to restore the legacy embed-in-tool-message behavior.";
                        readonly parentKey: "generationConfig";
                        readonly showInDialog: false;
                    };
                    readonly toolResultContentFormat: {
                        readonly type: "enum";
                        readonly label: "Tool Result Content Format";
                        readonly category: "Generation Configuration";
                        readonly requiresRestart: false;
                        readonly default: "parts";
                        readonly description: "Controls how text-only tool results are serialized in OpenAI-compatible requests. Use \"parts\" for the default content-part array shape. Use \"string\" only for legacy OpenAI-compatible runtimes whose tool templates ignore text content parts (for example older GLM-5.1 vLLM/SGLang templates; QwenLM/qwen-code#3361). Tool-returned media is still handled by splitToolMedia.";
                        readonly parentKey: "generationConfig";
                        readonly showInDialog: false;
                        readonly options: readonly [{
                            readonly value: "parts";
                            readonly label: "Content Parts (Default)";
                        }, {
                            readonly value: "string";
                            readonly label: "String";
                        }];
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
                readonly description: "The name of the context file or files.";
                readonly showInDialog: false;
                readonly jsonSchemaOverride: {
                    readonly anyOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    }];
                };
            };
            readonly importFormat: {
                readonly type: "enum";
                readonly label: "Memory Import Format";
                readonly category: "Context";
                readonly requiresRestart: false;
                readonly default: MemoryImportFormat | undefined;
                readonly description: "The format to use when importing memory.";
                readonly showInDialog: false;
                readonly options: readonly [{
                    readonly value: "tree";
                    readonly label: "Tree";
                }, {
                    readonly value: "flat";
                    readonly label: "Flat";
                }];
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
                readonly description: "Settings for clearing stale or oversized tool result context. Use -1 to disable a threshold.";
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
                        readonly description: "Integer number of most-recent compactable tool results to preserve when clearing. Values below 1 are floored to 1.";
                        readonly jsonSchemaOverride: {
                            readonly type: "integer";
                            readonly default: 5;
                            readonly description: "Integer number of most-recent compactable tool results to preserve when clearing. Values below 1 are floored to 1.";
                        };
                        readonly showInDialog: false;
                    };
                    readonly toolResultsTotalCharsThreshold: {
                        readonly type: "number";
                        readonly label: "Tool Results Total Chars Threshold";
                        readonly category: "Context";
                        readonly requiresRestart: false;
                        readonly default: number;
                        readonly description: "Total compactable tool result output characters allowed in history before clearing oldest results. When exceeded, oldest results are cleared down to half this threshold (best effort) to preserve the provider prompt cache on later turns. Use -1 to disable. This is a soft threshold: protected recent tool results may keep the total above it.";
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
                        readonly description: "Respect .qwenignore and configured custom ignore files when searching";
                        readonly showInDialog: true;
                    };
                    readonly customIgnoreFiles: {
                        readonly type: "array";
                        readonly label: "Custom Ignore Files";
                        readonly category: "Context";
                        readonly requiresRestart: true;
                        readonly default: string[];
                        readonly description: "Project-root-relative ignore files to use instead of the defaults (`.agentignore`, `.aiignore`) when respectQwenIgnore is enabled. .qwenignore is always included when respectQwenIgnore is enabled.";
                        readonly showInDialog: false;
                        readonly items: {
                            readonly type: "string";
                        };
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
            readonly autoCompactThreshold: {
                readonly type: "number";
                readonly label: "Auto-Compact Threshold";
                readonly category: "Context";
                readonly requiresRestart: false;
                readonly default: number | undefined;
                readonly description: "Target fraction of the context window at which auto-compaction triggers (greater than 0, up to 1). Acts as a ceiling on the trigger: on large windows this is the effective trigger (~85%); on smaller windows compaction may fire earlier to leave room to summarize. Default is 0.85 (85%).";
                readonly showInDialog: false;
                readonly jsonSchemaOverride: {
                    readonly type: "number";
                    readonly minimum: 0.01;
                    readonly maximum: 1;
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
                readonly default: true;
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
            readonly autoSkillConfirm: {
                readonly type: "boolean";
                readonly label: "Confirm Auto Skills Before Saving";
                readonly category: "Memory";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Ask for confirmation before auto-generated skills are added to the skill library. When off, auto-skills are saved immediately.";
                readonly showInDialog: false;
            };
            readonly agentTimeoutMinutes: {
                readonly type: "number";
                readonly label: "Memory Agent Timeout (minutes)";
                readonly category: "Memory";
                readonly requiresRestart: true;
                readonly default: number | undefined;
                readonly minimum: 0;
                readonly description: "Max runtime in minutes for background memory agents (extraction, dream, remember, skill review). Unset uses each agent's built-in default (2–5 minutes); 0 disables the time limit. Useful for slow local models that need longer than the defaults.";
                readonly showInDialog: false;
            };
            readonly agentMaxTurns: {
                readonly type: "number";
                readonly label: "Memory Agent Max Turns";
                readonly category: "Memory";
                readonly requiresRestart: true;
                readonly default: number | undefined;
                readonly minimum: 0;
                readonly description: "Max turns for background memory agents (extraction, dream, remember, skill review). Unset uses each agent's built-in default (5–8); 0 disables the turn limit.";
                readonly showInDialog: false;
            };
            readonly enableTeamMemory: {
                readonly type: "boolean";
                readonly label: "Enable Team Memory";
                readonly category: "Memory";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Enable a project memory tier shared with collaborators via the git-tracked `.qwen/team-memory/` directory. Off by default; writes to it are secret-scanned and reviewable in the git diff.";
                readonly showInDialog: false;
            };
            readonly enableTeamMemorySync: {
                readonly type: "boolean";
                readonly label: "Enable Team Memory Git Sync";
                readonly category: "Memory";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "When team memory is enabled, automatically commit, fast-forward-pull, and push the `.qwen/team-memory/` directory at session start so collaborators stay in sync. Off by default; requires a configured git upstream.";
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
    readonly skills: {
        readonly type: "object";
        readonly label: "Skills";
        readonly category: "Advanced";
        readonly requiresRestart: false;
        readonly default: {};
        readonly description: string;
        readonly showInDialog: false;
        readonly properties: {
            readonly disabledLevels: {
                readonly type: "array";
                readonly label: "Disabled Skill Levels";
                readonly category: "Advanced";
                readonly requiresRestart: true;
                readonly default: string[] | undefined;
                readonly description: string;
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.UNION;
                readonly items: {
                    readonly type: "string";
                    readonly enum: ["project", "user", "extension", "bundled"];
                };
            };
            readonly disabled: {
                readonly type: "array";
                readonly label: "Disabled Skills";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: string[] | undefined;
                readonly description: string;
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.UNION;
            };
            readonly defaultDisabled: {
                readonly type: "array";
                readonly label: "Default Disabled Skills";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: string[] | undefined;
                readonly description: string;
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.UNION;
            };
            readonly enabled: {
                readonly type: "array";
                readonly label: "Enabled Skills";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: string[] | undefined;
                readonly description: string;
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.UNION;
            };
            readonly directories: {
                readonly type: "array";
                readonly label: "Skill Directories";
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
                    readonly classifier: {
                        readonly type: "object";
                        readonly label: "Auto Mode Classifier";
                        readonly category: "Tools";
                        readonly requiresRestart: true;
                        readonly default: {};
                        readonly description: "Runtime controls for the AUTO approval mode classifier.";
                        readonly showInDialog: false;
                        readonly properties: {
                            readonly timeouts: {
                                readonly type: "object";
                                readonly label: "Auto Mode Classifier Timeouts";
                                readonly category: "Tools";
                                readonly requiresRestart: true;
                                readonly default: {};
                                readonly description: "Timeouts for the two AUTO classifier stages, in milliseconds.";
                                readonly showInDialog: false;
                                readonly properties: {
                                    readonly stage1Ms: {
                                        readonly type: "number";
                                        readonly label: "Auto Mode Stage 1 Timeout";
                                        readonly category: "Tools";
                                        readonly requiresRestart: true;
                                        readonly default: number | undefined;
                                        readonly description: "Timeout in milliseconds for the fast stage-1 AUTO classifier.";
                                        readonly showInDialog: false;
                                    };
                                    readonly stage2Ms: {
                                        readonly type: "number";
                                        readonly label: "Auto Mode Stage 2 Timeout";
                                        readonly category: "Tools";
                                        readonly requiresRestart: true;
                                        readonly default: number | undefined;
                                        readonly description: "Timeout in milliseconds for the stage-2 AUTO classifier review.";
                                        readonly showInDialog: false;
                                    };
                                };
                            };
                            readonly thinking: {
                                readonly type: "object";
                                readonly label: "Auto Mode Classifier Thinking";
                                readonly category: "Tools";
                                readonly requiresRestart: true;
                                readonly default: {};
                                readonly description: "Provider/API-level thinking controls for the AUTO classifier.";
                                readonly showInDialog: false;
                                readonly properties: {
                                    readonly stage2Enabled: {
                                        readonly type: "boolean";
                                        readonly label: "Auto Mode Stage 2 Thinking";
                                        readonly category: "Tools";
                                        readonly requiresRestart: true;
                                        readonly default: false;
                                        readonly description: "Whether stage 2 may use provider/API-level thinking. Stage 1 always keeps thinking disabled.";
                                        readonly showInDialog: false;
                                    };
                                };
                            };
                        };
                    };
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
                            readonly softDeny: {
                                readonly type: "array";
                                readonly label: "Auto Mode Soft-Deny Hints";
                                readonly category: "Tools";
                                readonly requiresRestart: true;
                                readonly default: string[] | undefined;
                                readonly description: string;
                                readonly showInDialog: false;
                                readonly mergeStrategy: MergeStrategy.UNION;
                            };
                            readonly hardDeny: {
                                readonly type: "array";
                                readonly label: "Auto Mode Hard-Deny Hints";
                                readonly category: "Tools";
                                readonly requiresRestart: true;
                                readonly default: string[] | undefined;
                                readonly description: string;
                                readonly showInDialog: false;
                                readonly mergeStrategy: MergeStrategy.UNION;
                            };
                            readonly deny: {
                                readonly type: "array";
                                readonly label: "Auto Mode Deny Hints (legacy)";
                                readonly category: "Tools";
                                readonly requiresRestart: true;
                                readonly default: string[] | undefined;
                                readonly description: string;
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
                    readonly classifyAllShell: {
                        readonly type: "boolean";
                        readonly label: "Classify All Shell Commands";
                        readonly category: "Tools";
                        readonly requiresRestart: true;
                        readonly default: false;
                        readonly description: string;
                        readonly showInDialog: false;
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
                readonly jsonSchemaOverride: {
                    readonly anyOf: readonly [{
                        readonly type: "boolean";
                    }, {
                        readonly type: "string";
                    }];
                };
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
            readonly webSearch: {
                readonly type: "object";
                readonly label: "Web Search";
                readonly category: "Tools";
                readonly requiresRestart: true;
                readonly default: {};
                readonly description: "Settings for the built-in WebSearch tool (DashScope Responses API backend). Opt-in: requires enabled=true and a search model. Fully env-configurable for environments without settings.json: ENABLE_WEB_SEARCH, WEB_SEARCH_MODEL, WEB_SEARCH_BASE_URL, WEB_SEARCH_API_KEY (falls back to DASHSCOPE_API_KEY), WEB_SEARCH_EXTRACTOR. Note: baseUrl and API key are env-only (WEB_SEARCH_BASE_URL / WEB_SEARCH_API_KEY) and cannot be set in settings.json.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly enabled: {
                        readonly type: "boolean";
                        readonly label: "Enable WebSearch";
                        readonly category: "Tools";
                        readonly requiresRestart: true;
                        readonly default: false;
                        readonly description: "Enable the built-in web_search tool. Also requires tools.webSearch.model. Env override: ENABLE_WEB_SEARCH.";
                        readonly showInDialog: true;
                    };
                    readonly model: {
                        readonly type: "string";
                        readonly label: "Search Model";
                        readonly category: "Tools";
                        readonly requiresRestart: true;
                        readonly default: string | undefined;
                        readonly description: "Model selector for the search side request, resolved against modelProviders like fastModel (\"modelId\" or \"authType:modelId\"). Must resolve to a DashScope-compatible entry with an envKey. Recommended: qwen3.6-plus. Env override: WEB_SEARCH_MODEL.";
                        readonly showInDialog: true;
                    };
                    readonly webExtractor: {
                        readonly type: "boolean";
                        readonly label: "Open Result Pages";
                        readonly category: "Tools";
                        readonly requiresRestart: true;
                        readonly default: true;
                        readonly description: "Let the search agent open and read result pages (DashScope web_extractor) for better-grounded answers. Billed separately by DashScope. Env override: WEB_SEARCH_EXTRACTOR.";
                        readonly showInDialog: true;
                    };
                };
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
                    readonly threshold: {
                        readonly type: "number";
                        readonly label: "Deferred Tool Preload Threshold (%)";
                        readonly category: "Tools";
                        readonly requiresRestart: true;
                        readonly default: 10;
                        readonly description: "Context-window percentage used as the session-start budget for preloading deferred tools (bundled built-ins and MCP alike). When every deferred tool schema fits within the budget, all are declared upfront instead of loaded on demand, keeping the prompt prefix stable for KV caching. Set 0 to always load deferred tools on demand.";
                        readonly showInDialog: true;
                        readonly jsonSchemaOverride: {
                            readonly type: "number";
                            readonly minimum: 0;
                            readonly maximum: 100;
                            readonly default: 10;
                        };
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
                        readonly description: "The pager command to use for shell output. Defaults to `cat` on non-Windows platforms and unset on Windows. Set to an empty string to disable pager environment variables.";
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
                    readonly defaultTimeoutMs: {
                        readonly type: "integer";
                        readonly minimum: 0;
                        readonly maximum: 600000;
                        readonly label: "Default Command Timeout (ms)";
                        readonly category: "Tools";
                        readonly requiresRestart: true;
                        readonly default: number | undefined;
                        readonly description: "Default timeout, in milliseconds, for foreground shell commands started by the agent. A per-call timeout on the shell tool overrides this. When unset, foreground commands time out after 120000 ms (2 minutes). Set to 0 to disable the timeout.";
                        readonly showInDialog: false;
                    };
                    readonly heartbeatIntervalMs: {
                        readonly type: "integer";
                        readonly minimum: 0;
                        readonly maximum: 600000;
                        readonly label: "Silent Command Heartbeat Interval (ms)";
                        readonly category: "Tools";
                        readonly requiresRestart: true;
                        readonly default: number | undefined;
                        readonly description: "Interval, in milliseconds, between liveness heartbeats emitted while a foreground shell command produces no output. Heartbeats are forwarded to ACP clients and stream-json consumers so they can tell a silent command from a dead session. When unset, heartbeats fire every 10000 ms (10 seconds). Set to 0 to disable heartbeats.";
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
            readonly visible: {
                readonly type: "array";
                readonly label: "Visible Deferred Tools";
                readonly category: "Tools";
                readonly requiresRestart: true;
                readonly default: string[] | undefined;
                readonly description: "Deferred tool names made visible at startup without requiring tool_search. Listed tools appear alongside core tools in the initial session.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.UNION;
            };
            readonly approvalMode: {
                readonly type: "enum";
                readonly label: "Tool Approval Mode";
                readonly category: "Tools";
                readonly requiresRestart: false;
                readonly default: ApprovalMode.AUTO;
                readonly description: "Approval mode for tool usage. Controls how tools are approved before execution.";
                readonly showInDialog: true;
                readonly options: readonly [{
                    readonly value: ApprovalMode.PLAN;
                    readonly label: "Plan";
                }, {
                    readonly value: ApprovalMode.DEFAULT;
                    readonly label: "Ask permissions";
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
            readonly toolOutputBatchBudget: {
                readonly type: "number";
                readonly label: "Tool Output Batch Budget";
                readonly category: "General";
                readonly requiresRestart: true;
                readonly default: 200000;
                readonly description: "Per-message character budget for the combined text output of one batch of tool calls. Oversized batches are reduced deterministically and recoverable output is persisted when possible. Set to -1 to disable.";
                readonly showInDialog: false;
            };
            readonly computerUse: {
                readonly type: "object";
                readonly label: "Computer Use";
                readonly category: "Tools";
                readonly requiresRestart: true;
                readonly default: {};
                readonly description: "Cross-platform desktop automation via the cua-driver native driver (trycua/cua). On first invocation a pinned, signed + notarized binary (~20MB) is downloaded into ~/.qwen/computer-use/ and the user is walked through macOS Accessibility / Screen Recording permissions if needed. Exposes cua-driver's full tool surface (click, type_text, scroll, drag, press_key, get_window_state, page, launch_app, and more).";
                readonly showInDialog: false;
                readonly properties: {
                    readonly enabled: {
                        readonly type: "boolean";
                        readonly label: "Enable Computer Use";
                        readonly category: "Tools";
                        readonly requiresRestart: true;
                        readonly default: true;
                        readonly description: "When enabled (default), the cua-driver computer_use__* tools are registered as deferred built-ins. Set to false to prevent the driver from being downloaded or spawned.";
                        readonly showInDialog: true;
                    };
                    readonly idleTimeoutMs: {
                        readonly type: "number";
                        readonly label: "Idle Timeout";
                        readonly category: "Tools";
                        readonly requiresRestart: true;
                        readonly default: 300000;
                        readonly minimum: 0;
                        readonly maximum: 2147483647;
                        readonly description: "Milliseconds to keep the cua-driver process alive after the last computer_use__* call. The default is 300000 (5 minutes). Set to 0 to keep it running until qwen-code exits.";
                        readonly showInDialog: false;
                    };
                    readonly maxImageDimension: {
                        readonly type: "number";
                        readonly label: "Max Screenshot Dimension";
                        readonly category: "Tools";
                        readonly requiresRestart: true;
                        readonly default: -1;
                        readonly description: "Longest-edge pixel cap applied to cua-driver screenshots (via set_config's max_image_dimension). -1 (default) keeps cua-driver's built-in default (1568); 0 disables resizing (full resolution); a positive value caps the longest edge. Lower caps cut vision-token cost at the expense of fine detail. Overridable via the QWEN_COMPUTER_USE_MAX_IMAGE_DIMENSION env var.";
                        readonly showInDialog: false;
                    };
                };
            };
        };
    };
    readonly policy: {
        readonly type: "object";
        readonly label: "Daemon Policy";
        readonly category: "Daemon";
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: string;
        readonly showInDialog: false;
        readonly properties: {
            readonly permissionStrategy: {
                readonly type: "enum";
                readonly label: "Permission Mediation Policy";
                readonly category: "Daemon";
                readonly requiresRestart: true;
                readonly default: "first-responder";
                readonly description: string;
                readonly showInDialog: true;
                readonly options: readonly [{
                    readonly value: "first-responder";
                    readonly label: "First Responder";
                }, {
                    readonly value: "designated";
                    readonly label: "Designated Originator";
                }, {
                    readonly value: "consensus";
                    readonly label: "Consensus Quorum";
                }, {
                    readonly value: "local-only";
                    readonly label: "Local Only";
                }];
            };
            readonly consensusQuorum: {
                readonly type: "number";
                readonly label: "Consensus Quorum Override";
                readonly category: "Daemon";
                readonly requiresRestart: true;
                readonly default: number | undefined;
                readonly description: string;
                readonly showInDialog: false;
                readonly jsonSchemaOverride: {
                    readonly type: "integer";
                    readonly minimum: 1;
                    readonly description: string;
                };
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
                readonly requiresRestart: false;
                readonly default: string[] | undefined;
                readonly description: "A list of MCP servers to allow. Supports glob patterns (e.g. \"*puppeteer*\").";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.CONCAT;
            };
            readonly excluded: {
                readonly type: "array";
                readonly label: "Exclude MCP Servers";
                readonly category: "MCP";
                readonly requiresRestart: false;
                readonly default: string[] | undefined;
                readonly description: "A list of MCP servers to exclude. Supports glob patterns (e.g. \"*puppeteer*\"). Takes precedence over mcp.allowed.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.CONCAT;
            };
            readonly toolIdleTimeoutMs: {
                readonly type: "number";
                readonly label: "MCP Tool Idle Timeout (ms)";
                readonly category: "MCP";
                readonly requiresRestart: false;
                readonly default: 300000;
                readonly minimum: 10000;
                readonly maximum: 3600000;
                readonly description: "Idle timeout in milliseconds for MCP tool calls. If the MCP server does not produce any response or progress update within this time, the call is aborted. Default: 300000 (5 minutes). Can be overridden via QWEN_CODE_MCP_TOOL_IDLE_TIMEOUT_MS environment variable.";
                readonly showInDialog: false;
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
            readonly allowPrivateNetworkHooks: {
                readonly type: "boolean";
                readonly label: "Allow Private Network Hooks";
                readonly category: "Security";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "When true, HTTP hooks may target private/link-local IP ranges (the SSRF IP-range checks are skipped). Cloud metadata hostnames (e.g. 169.254.169.254, metadata.google.internal) remain blocked. Only honored from User, System, and SystemDefaults settings scopes; values set in Workspace settings are ignored so a cloned repository cannot self-grant this bypass. Enable only in trusted, managed environments, and pair with security.allowedHttpHookUrls.";
                readonly showInDialog: false;
            };
            readonly allowedInsecureVoiceBaseUrls: {
                readonly type: "array";
                readonly label: "Allowed Insecure Voice Base URLs";
                readonly category: "Security";
                readonly requiresRestart: false;
                readonly default: string[];
                readonly description: "Complete voice base URLs that may use HTTP or private-network addresses. Entries must include an explicit http:// or https:// scheme and the full provider path; only URL serialization and trailing slashes are normalized. Wildcards are not supported; metadata, link-local, local-use NAT64, 6to4, and Teredo addresses remain blocked even when listed, as do hostnames that resolve to loopback; IPv4-mapped, IPv4-compatible, and well-known NAT64 (64:ff9b::/96) literals are classified by their embedded IPv4 address. Only honored from User, System, and SystemDefaults settings scopes; values set in Workspace settings are ignored. Enable only for trusted endpoints in managed private networks. Cleartext HTTP also exposes the provider API key transmitted in the Authorization header. An allowlisted hostname is only as trustworthy as its DNS; prefer IP-literal entries when the gateway address is stable.";
                readonly showInDialog: false;
                readonly items: {
                    readonly type: "string";
                    readonly description: "Complete voice provider base URL with explicit scheme and full path (no wildcards)";
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
                readonly type: "enum";
                readonly label: "DNS Resolution Order";
                readonly category: "Advanced";
                readonly requiresRestart: true;
                readonly default: DnsResolutionOrder | undefined;
                readonly description: "The DNS resolution order.";
                readonly showInDialog: false;
                readonly options: readonly [{
                    readonly value: "ipv4first";
                    readonly label: "IPv4 First";
                }, {
                    readonly value: "verbatim";
                    readonly label: "Verbatim";
                }];
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
        readonly description: "Settings for built-in agents and multi-agent collaboration features (Arena, Team, Swarm).";
        readonly showInDialog: false;
        readonly properties: {
            readonly builtin: {
                readonly type: "object";
                readonly label: "Built-in Agents";
                readonly category: "Advanced";
                readonly requiresRestart: true;
                readonly default: {};
                readonly description: "Settings for built-in subagents.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly exploreModel: {
                        readonly type: "string";
                        readonly label: "Explore Model";
                        readonly category: "Model";
                        readonly requiresRestart: true;
                        readonly default: string;
                        readonly description: "Model selector for the built-in Explore subagent. Use \"inherit\" for the main session model, \"fast\" for fastModel, a model ID, or an authType:model-id selector. Custom same-name agents are unaffected.";
                        readonly showInDialog: false;
                    };
                };
            };
            readonly modelGrades: {
                readonly type: "object";
                readonly label: "Model Grades";
                readonly category: "Model";
                readonly requiresRestart: true;
                readonly default: Record<string, string> | undefined;
                readonly description: "Maps semantic model grade names exposed to the Agent tool to concrete model selectors.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.SHALLOW_MERGE;
                readonly jsonSchemaOverride: {
                    readonly type: "object";
                    readonly additionalProperties: {
                        readonly type: "string";
                    };
                };
            };
            readonly allowedGrades: {
                readonly type: "array";
                readonly label: "Allowed Model Grades";
                readonly category: "Model";
                readonly requiresRestart: true;
                readonly default: string[] | undefined;
                readonly description: "Optional whitelist of model grade names the Agent tool may use.";
                readonly showInDialog: false;
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly maxParallelAgents: {
                readonly type: "number";
                readonly label: "Max Parallel Agents";
                readonly category: "Advanced";
                readonly requiresRestart: true;
                readonly default: number | undefined;
                readonly minimum: 1;
                readonly description: "Global maximum number of background sub-agents that can run concurrently. Additional background agents wait in a queue until a slot is available. Use maxParallelAgentsByModel to cap a specific model below this global limit.";
                readonly showInDialog: false;
                readonly jsonSchemaOverride: {
                    readonly type: "integer";
                    readonly minimum: 1;
                };
            };
            readonly maxParallelAgentsByModel: {
                readonly type: "object";
                readonly label: "Max Parallel Agents Per Model";
                readonly category: "Advanced";
                readonly requiresRestart: true;
                readonly default: Record<string, number> | undefined;
                readonly description: "Per-model maximum number of background sub-agents that can run concurrently, keyed by model ID (e.g. { \"qwen3-max\": 2 }). Useful when a model has a lower concurrency capacity. Takes precedence over the global maxParallelAgents for the matched model; models not listed here fall back to the global limit.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.SHALLOW_MERGE;
                readonly jsonSchemaOverride: {
                    readonly type: "object";
                    readonly additionalProperties: {
                        readonly type: "integer";
                        readonly minimum: 1;
                    };
                };
            };
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
        readonly jsonSchemaOverride: {
            readonly type: "integer";
            readonly minimum: 1;
            readonly default: 8;
        };
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
            readonly UserPromptExpansion: {
                readonly type: "array";
                readonly label: "Prompt Expansion Hooks";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: [];
                readonly description: "Hooks that execute when a slash command expands into a prompt.";
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
            readonly StopFailure: {
                readonly type: "array";
                readonly label: "After Agent Failure Hooks";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: [];
                readonly description: "Hooks that execute when a turn ends due to an API error or loop detection, instead of the normal Stop hooks. Receives error type and details.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.CONCAT;
                readonly items: SettingItemDefinition;
            };
            readonly MessageDisplay: {
                readonly type: "array";
                readonly label: "Message Display Hooks";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: [];
                readonly description: "Hooks that execute repeatedly as the assistant reply streams, before the After Agent (Stop) hooks fire.";
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
            readonly PostToolBatch: {
                readonly type: "array";
                readonly label: "Post Tool Batch Hooks";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: [];
                readonly description: "Hooks that execute once after all tool calls in a batch resolve.";
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
            readonly SessionDelete: {
                readonly type: "array";
                readonly label: "Session Delete Hooks";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: [];
                readonly description: "Hooks that execute after an explicitly selected session is deleted.";
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
            readonly liveVoice: {
                readonly type: "object";
                readonly label: "Live Voice";
                readonly category: "Experimental";
                readonly requiresRestart: false;
                readonly default: {};
                readonly description: "Experimental realtime voice conversations through Qwen Live Host on macOS WebShell.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly enabled: {
                        readonly type: "boolean";
                        readonly label: "Live Voice";
                        readonly category: "Experimental";
                        readonly requiresRestart: false;
                        readonly default: false;
                        readonly description: "Enable experimental realtime voice conversations on macOS WebShell.";
                        readonly showInDialog: false;
                    };
                    readonly apiKey: {
                        readonly type: "string";
                        readonly label: "DashScope Realtime API Key";
                        readonly category: "Experimental";
                        readonly requiresRestart: false;
                        readonly default: string;
                        readonly description: "Dedicated DashScope API key for qwen3.5-omni-plus-realtime.";
                        readonly showInDialog: false;
                    };
                    readonly model: {
                        readonly type: "string";
                        readonly label: "Live Voice Model";
                        readonly category: "Experimental";
                        readonly requiresRestart: false;
                        readonly default: string;
                        readonly description: "Upstream Realtime model used for Live Voice.";
                        readonly showInDialog: false;
                    };
                    readonly endpoint: {
                        readonly type: "string";
                        readonly label: "Live Voice Endpoint";
                        readonly category: "Experimental";
                        readonly requiresRestart: false;
                        readonly default: string;
                        readonly description: "Advanced override for the DashScope Realtime WebSocket endpoint.";
                        readonly showInDialog: false;
                    };
                    readonly voice: {
                        readonly type: "string";
                        readonly label: "Live Voice Output Voice";
                        readonly category: "Experimental";
                        readonly requiresRestart: false;
                        readonly default: string;
                        readonly description: "Voice used for Realtime model audio output.";
                        readonly showInDialog: false;
                    };
                    readonly shortcut: {
                        readonly type: "string";
                        readonly label: "Live Voice Global Shortcut";
                        readonly category: "Experimental";
                        readonly requiresRestart: false;
                        readonly default: string;
                        readonly description: "Electron accelerator registered globally by Qwen Live Host.";
                        readonly showInDialog: false;
                    };
                };
            };
            readonly sessionWorkflow: {
                readonly type: "boolean";
                readonly label: "Session Workflow Plan & Review";
                readonly category: "Experimental";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Enable the daemon Web Shell Session Workflow DAG and present Plan mode as Plan & Review. Disabled by default and does not change ordinary Todo or execution behavior.";
                readonly showInDialog: true;
            };
            readonly cron: {
                readonly type: "boolean";
                readonly label: "Enable Cron/Loop Tools";
                readonly category: "Experimental";
                readonly requiresRestart: true;
                readonly default: true;
                readonly description: "Enable in-session cron/loop tools. When enabled, the model can create recurring prompts using cron_create, cron_list, and cron_delete tools. Can be disabled via QWEN_CODE_DISABLE_CRON=1 environment variable.";
                readonly showInDialog: true;
            };
            readonly todoStopGuard: {
                readonly type: "boolean";
                readonly label: "Enable Daemon Todo Stop Guard";
                readonly category: "Experimental";
                readonly requiresRestart: true;
                readonly default: false;
                readonly description: "Allow daemon and ACP sessions to continue an unfinished top-level Todo list for at most two consecutive primary-model calls without new user input. Mid-turn user input starts a fresh two-attempt stage. Disabled in safe, bare, and Approval plan modes.";
                readonly showInDialog: false;
            };
            readonly sessionWriterLease: {
                readonly type: "boolean";
                readonly label: "Enable ACP Session Writer Lease";
                readonly category: "Experimental";
                readonly requiresRestart: true;
                readonly default: false;
                readonly description: "Enable cross-process write fencing for persisted ACP and daemon sessions. The effective value is frozen when the ACP or daemon process starts. Every concurrent ACP or daemon writer must enable the setting; interactive and headless writers remain outside the protocol.";
                readonly showInDialog: true;
            };
            readonly cronRecurringMaxAgeDays: {
                readonly type: "number";
                readonly label: "Recurring Cron Max Age (Days)";
                readonly category: "Experimental";
                readonly requiresRestart: true;
                readonly default: 7;
                readonly description: "Days a recurring cron/loop job lives before auto-expiring (it fires one final time, then is deleted). Set to 0 to disable expiry so jobs run until deleted — useful for long-running daemon deployments. Can be overridden via the QWEN_CODE_CRON_MAX_AGE_DAYS environment variable.";
                readonly showInDialog: false;
                readonly jsonSchemaOverride: {
                    readonly type: "number";
                    readonly minimum: 0;
                    readonly default: 7;
                };
            };
            readonly agentTeam: {
                readonly type: "boolean";
                readonly label: "Enable Agent Team";
                readonly category: "Experimental";
                readonly requiresRestart: true;
                readonly default: false;
                readonly description: "Enable agent team collaboration tools (experimental). When enabled, the model can create agent teams and coordinate work using team_create, team_delete, send_message, task_create, task_update, and task_list tools. Can also be enabled via QWEN_CODE_ENABLE_AGENT_TEAM=1 environment variable.";
                readonly showInDialog: true;
            };
            readonly artifact: {
                readonly type: "boolean";
                readonly label: "Enable Artifacts";
                readonly category: "Experimental";
                readonly requiresRestart: true;
                readonly default: true;
                readonly description: "Enable artifact tools. Enabled by default. In interactive, non-SDK sessions, the model can publish a self-contained HTML page as an interactive Artifact and open it in the browser. Non-SDK daemon sessions can use the metadata-only record_artifact tool. Set this to false or use QWEN_CODE_DISABLE_ARTIFACT=1 to disable both.";
                readonly showInDialog: true;
            };
            readonly emitToolUseSummaries: {
                readonly type: "boolean";
                readonly label: "Tool Use Summaries";
                readonly category: "Experimental";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Generate a short LLM-based label after each tool batch completes. For a completed tool group the label replaces the generic `Tool × N` header; when the group is force-expanded it appears as a dim `● <label>` line below the tool group. Requires a fast model to be configured; runs in parallel with the next API call so latency is hidden. Currently affects interactive CLI rendering only — SDK / non-interactive emission of the `tool_use_summary` message is not yet wired (the message factory is exported for a follow-up PR). Can be overridden with QWEN_CODE_EMIT_TOOL_USE_SUMMARIES=0 or =1.";
                readonly showInDialog: true;
            };
        };
    };
    readonly artifact: {
        readonly type: "object";
        readonly label: "Artifacts";
        readonly category: "Experimental";
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: "Configuration for artifact publishing. Selects the publish backend and, for the host backend, the upload command and shareable URL template.";
        readonly showInDialog: false;
        readonly properties: {
            readonly autoOpen: {
                readonly type: "boolean";
                readonly label: "Auto-open Artifacts";
                readonly category: "Experimental";
                readonly requiresRestart: true;
                readonly default: true;
                readonly description: "Open published artifacts in the browser automatically. Set to false to publish without launching a browser. QWEN_ARTIFACT_NO_AUTO_OPEN=1 overrides this setting.";
                readonly showInDialog: false;
            };
            readonly publisher: {
                readonly type: "enum";
                readonly label: "Artifact Publisher";
                readonly category: "Experimental";
                readonly requiresRestart: true;
                readonly default: "local";
                readonly description: "Where artifacts are published: 'local' (a file:// page on disk, the default), 'host' (upload via artifact.host.uploadCommand and return a shareable link), or 'oss' (native Aliyun OSS upload).";
                readonly showInDialog: false;
                readonly options: readonly [{
                    readonly value: "local";
                    readonly label: "Local (file://)";
                }, {
                    readonly value: "host";
                    readonly label: "Host (shareable link)";
                }, {
                    readonly value: "oss";
                    readonly label: "Aliyun OSS";
                }];
            };
            readonly host: {
                readonly type: "object";
                readonly label: "Artifact Host";
                readonly category: "Experimental";
                readonly requiresRestart: true;
                readonly default: {};
                readonly description: "Host-backend config, used when artifact.publisher is \"host\".";
                readonly showInDialog: false;
                readonly properties: {
                    readonly uploadCommand: {
                        readonly type: "string";
                        readonly label: "Upload Command";
                        readonly category: "Experimental";
                        readonly requiresRestart: true;
                        readonly default: "";
                        readonly description: "Command that uploads the artifact, run with execFile (no shell). {file} = local HTML path, {key} = remote object key. e.g. \"aws s3 cp {file} s3://bucket/{key} --content-type text/html\".";
                        readonly showInDialog: false;
                    };
                    readonly urlTemplate: {
                        readonly type: "string";
                        readonly label: "URL Template";
                        readonly category: "Experimental";
                        readonly requiresRestart: true;
                        readonly default: "";
                        readonly description: "Shareable URL template; {key} is substituted. e.g. \"https://bucket.example.com/{key}\".";
                        readonly showInDialog: false;
                    };
                    readonly keyPrefix: {
                        readonly type: "string";
                        readonly label: "Key Prefix";
                        readonly category: "Experimental";
                        readonly requiresRestart: true;
                        readonly default: "artifacts";
                        readonly description: "Remote key prefix; the object key is \"{prefix}/{id}/index.html\".";
                        readonly showInDialog: false;
                    };
                };
            };
            readonly oss: {
                readonly type: "object";
                readonly label: "Artifact OSS";
                readonly category: "Experimental";
                readonly requiresRestart: true;
                readonly default: {};
                readonly description: "Native Aliyun OSS backend, used when artifact.publisher is \"oss\". Credentials are read from OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET (or ALIBABA_CLOUD_*), never from settings.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly bucket: {
                        readonly type: "string";
                        readonly label: "OSS Bucket";
                        readonly category: "Experimental";
                        readonly requiresRestart: true;
                        readonly default: "";
                        readonly description: "OSS bucket name.";
                        readonly showInDialog: false;
                    };
                    readonly endpoint: {
                        readonly type: "string";
                        readonly label: "OSS Endpoint";
                        readonly category: "Experimental";
                        readonly requiresRestart: true;
                        readonly default: "";
                        readonly description: "OSS endpoint host, e.g. \"oss-cn-hangzhou.aliyuncs.com\".";
                        readonly showInDialog: false;
                    };
                    readonly keyPrefix: {
                        readonly type: "string";
                        readonly label: "Key Prefix";
                        readonly category: "Experimental";
                        readonly requiresRestart: true;
                        readonly default: "artifacts";
                        readonly description: "Remote key prefix; the object key is \"{prefix}/{id}/index.html\".";
                        readonly showInDialog: false;
                    };
                    readonly acl: {
                        readonly type: "string";
                        readonly label: "Object ACL";
                        readonly category: "Experimental";
                        readonly requiresRestart: true;
                        readonly default: "public-read";
                        readonly description: "Object ACL applied on upload. \"public-read\" (default) makes the link shareable.";
                        readonly showInDialog: false;
                    };
                    readonly publicBaseUrl: {
                        readonly type: "string";
                        readonly label: "Public Base URL";
                        readonly category: "Experimental";
                        readonly requiresRestart: true;
                        readonly default: "";
                        readonly description: "Optional CDN / custom-domain base for the returned URL. Upload still goes through endpoint. e.g. \"https://cdn.example.com\".";
                        readonly showInDialog: false;
                    };
                };
            };
        };
    };
    readonly worktree: {
        readonly type: "object";
        readonly label: "Worktree";
        readonly category: "Advanced";
        readonly requiresRestart: false;
        readonly default: {};
        readonly description: string;
        readonly showInDialog: false;
        readonly properties: {
            readonly symlinkDirectories: {
                readonly type: "array";
                readonly label: "Symlink Directories Into Worktrees";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: string[] | undefined;
                readonly description: string;
                readonly showInDialog: false;
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
