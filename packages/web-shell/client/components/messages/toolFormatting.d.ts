import type { ACPToolCall } from '../../adapters/types';
export { isActiveToolStatus } from '../../adapters/toolClassification';
/**
 * Internal-tool-name → display-name lookup. This is a standalone copy of
 * core's `ToolDisplayNames` (mapped to wire names, as the CLI's shared
 * `tool-display-map.ts` does): the web-shell is a browser bundle and
 * intentionally does not depend on `@qwen-code/qwen-code-core`, so the map
 * can't be imported. Keep the canonical tool entries in sync with core's
 * `ToolDisplayNames`; the extra lowercase ACP aliases below (bash, read,
 * write, …) are web-shell-only conveniences with no core equivalent.
 */
export declare const TOOL_DISPLAY_NAMES: Record<string, string>;
export declare function sanitizeControlChars(text: string): string;
export declare function formatToolDisplayName(toolName: string): string;
/**
 * Locale-aware tool display name for chat-stream badges. Looks up the
 * `toolName.<wire_name>` i18n key; when the active language has no entry the
 * translator returns the key verbatim, in which case we fall back to the
 * English {@link formatToolDisplayName}. Pass the `t` from `useI18n()`.
 */
export declare function localizeToolDisplayName(
  toolName: string,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string;
export declare function isAskUserQuestionToolName(toolName: string): boolean;
export declare function truncateText(text: string, max: number): string;
export declare function getToolDescription(
  tool: ACPToolCall,
  workspaceCwd?: string,
): string;
export declare function getToolSummaryDescription(
  tool: ACPToolCall,
  workspaceCwd?: string,
): string;
export declare function getShellToolSemanticDescription(
  tool: ACPToolCall,
): string;
export declare function extractText(tool: ACPToolCall): string | null;
export declare function getToolResultSummary(tool: ACPToolCall): string;
export declare function isShellToolName(name: string): boolean;
export declare function isSkillToolName(name: string): boolean;
export declare function toolContainsCallId(
  tool: ACPToolCall,
  toolCallId: string,
): boolean;
export declare function getTaskExecutionRecord(
  rawOutput: unknown,
): Record<string, unknown> | undefined;
export declare function getAgentCancellationReason(agent: ACPToolCall): string;
export declare function isAgentCancelled(agent: ACPToolCall): boolean;
export declare function getAgentDisplayStatus(
  agent: ACPToolCall,
): ACPToolCall['status'];
export declare function formatTokenCount(tokens: number): string;
export declare function getAgentType(agent: ACPToolCall): string;
export declare function isDefaultAgentType(agentType: string): boolean;
/**
 * Locale-aware agent type display name. Looks up `agentType.<name>`
 * (case-insensitive) via the translator; falls back to the raw name
 * for user-defined agents that have no i18n entry.
 */
export declare function localizeAgentTypeName(
  agentType: string,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string;
export declare function getAgentDescription(agent: ACPToolCall): string;
export declare function getAgentCurrentToolHint(
  agent: ACPToolCall,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string;
