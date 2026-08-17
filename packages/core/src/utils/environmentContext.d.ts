/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content, Part } from '@google/genai';
import type { Config } from '../config/config.js';
import type {
  DeferredToolSummary,
  ToolRegistry,
} from '../tools/tool-registry.js';
import { type AvailableSkillEntry } from '../tools/skill-utils.js';
export declare const SYSTEM_REMINDER_OPEN = '<system-reminder>';
export declare const SYSTEM_REMINDER_CLOSE = '</system-reminder>';
/**
 * Shared date formatter for system-prompt date injection.
 * Pinned to 'en-US' so both the startup context and per-turn
 * reminder produce the same format regardless of system locale.
 */
export declare function formatDateForContext(date?: Date): string;
/**
 * Generates a string describing the current workspace directories and their structures.
 * @param {Config} config - The runtime configuration and services.
 * @returns {Promise<string>} A promise that resolves to the directory context string.
 */
export declare function getDirectoryContextString(
  config: Config,
): Promise<string>;
/**
 * Retrieves environment-related information to be included in the chat context.
 * This includes the current working directory, date, operating system, and folder structure.
 * @param {Config} config - The runtime configuration and services.
 * @returns A promise that resolves to an array of `Part` objects containing environment information.
 */
export declare function getEnvironmentContext(config: Config): Promise<Part[]>;
export declare function buildDeferredToolsReminder(
  toolRegistry: ToolRegistry,
): string | null;
export declare function buildAddedMcpToolsReminder(
  deferredTools: DeferredToolSummary[],
): string | null;
export declare function buildChangedMcpToolsReminder(
  addedTools: DeferredToolSummary[],
  removedToolNames: string[],
): string | null;
export declare function buildMcpServerInstructionsReminder(
  toolRegistry: ToolRegistry,
): string | null;
export interface AvailableSkillsReminderResult {
  reminder: string;
  renderedEntries: AvailableSkillEntry[];
}
/**
 * Builds the session-start `<available_skills>` snapshot for the startup prelude
 * (history[0]). This is where the model sees the skill listing — a STABLE
 * position in the messages prefix — instead of inside the Skill tool's
 * description (which sits at the front of the tools→system→messages cache prefix
 * and would bust the whole cache on every skill change). Built once per session
 * and rebuilt only at session boundaries by the prelude machinery; mid-session
 * skill changes flow through per-turn `<system-reminder>` deltas, never by
 * mutating this snapshot.
 *
 * Returns the reminder string AND the entries it rendered, so the caller can
 * seed dedup state from exactly what the model saw. Returns null when there is
 * no SkillManager.
 */
export declare function buildAvailableSkillsReminder(
  config: Config,
): Promise<AvailableSkillsReminderResult | null>;
/**
 * Builds the per-turn "newly available skills/commands" delta reminder. Used by
 * the client to announce skills enabled mid-session (e.g. via /skills) and MCP
 * prompts added after startup — WITHOUT mutating the cached prefix (it is a tail
 * `<system-reminder>` only). The companion to `buildAddedMcpToolsReminder` for
 * skills. Returns null when there is nothing new to announce.
 */
export declare function buildAddedSkillsReminder(
  entries: AvailableSkillEntry[],
): string | null;
export declare function buildChangedSkillsReminder(
  addedEntries: AvailableSkillEntry[],
  removedNames: string[],
): string | null;
export interface AgentAvailabilityEntry {
  name: string;
  description: string;
}
export declare function buildAddedAgentsReminder(
  agents: AgentAvailabilityEntry[],
): string | null;
export declare function buildChangedAgentsReminder(
  addedAgents: AgentAvailabilityEntry[],
  removedAgentNames: string[],
): string | null;
export declare function buildStartupContextReminder(
  config: Config,
): Promise<string>;
export interface InitialChatHistoryOptions {
  includeDeferredToolsReminder?: boolean;
  includeAvailableSkillsReminder?: boolean;
}
/**
 * Returns `[history, snapshotEntries]` — the startup prelude messages and the
 * skill entries that were actually rendered into the `<available_skills>`
 * snapshot. Callers that need to seed dedup state (e.g. `startChat`) use
 * `snapshotEntries`; callers that don't care can destructure as `[history]`.
 */
export declare function getInitialChatHistory(
  config: Config,
  extraHistory?: Content[],
  options?: InitialChatHistoryOptions,
): Promise<[Content[], AvailableSkillEntry[]]>;
/**
 * Returns the number of initial API entries occupied by structural context
 * that should be skipped when counting real user turns:
 *
 *  - The startup reminder prelude (0 or 1 entry) — a single user message
 *    wrapped in `<system-reminder>…</system-reminder>`, produced by
 *    `getInitialChatHistory`.
 *  - The legacy ack-pair prelude (2 entries) — sessions saved before the
 *    startup context moved into system reminders.
 *  - The compressed-history prefix (2-4 entries) — summary, ack, and
 *    optionally a post-compact attachments entry produced by
 *    `composePostCompactHistory`. These synthetic entries must not be
 *    counted as real user prompts for rewind indexing.
 */
export declare function getStartupContextLength(
  history: Content[],
  options?: {
    includeCompressed?: boolean;
  },
): number;
/**
 * True when `content` is a *pure* system-reminder entry: it has parts and
 * EVERY part is a text part wrapped in `<system-reminder>…</system-reminder>`.
 *
 * These are structural history entries — the startup-context prelude
 * (history[0]) and the mid-history MCP added-tool reminders injected by
 * `GeminiClient.drainPendingAddedMcpToolsReminder` — NOT real user turns.
 *
 * The "every part" requirement is load-bearing. Per-turn reminders (plan
 * mode, subagent list, recalled memory) are prepended as an extra part to the
 * SAME user `Content` as the actual prompt: `GeminiClient.sendMessageStream`
 * assembles `[...systemReminders, ...userPrompt]` into one `createUserContent`
 * that persists in history. Such a turn has a non-reminder prompt part, so it
 * is NOT pure — matching on `parts[0]` alone would misclassify a genuine user
 * prompt as structural (e.g. dropping it from rewind truncation, or
 * preserving an orphaned failed turn whose prompt then leaks via coalescing).
 *
 * Each part must END with the close tag, not merely contain it. IDE mode is
 * the case "every part" alone misses: the editor reminder is concatenated into
 * the prompt's text part (not a separate part), so that part trails the real
 * prompt after the close tag. `wrapSystemReminder`/`wrapIdeContext` emit the
 * close tag last, so genuine reminders still match. Mirrors
 * `getStartupContextLength`'s open+close requirement.
 */
export declare function isSystemReminderContent(content: Content): boolean;
export declare function stripSystemReminderBlocks(text: string): string;
/**
 * Strip the leading startup context reminder from a chat history. Used when
 * forwarding a parent session's history to a child agent that will generate
 * its own startup context for its own working directory.
 */
export declare function stripStartupContext(history: Content[]): Content[];
