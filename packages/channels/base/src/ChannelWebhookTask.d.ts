import type { SessionTarget } from './types.js';
export interface ChannelWebhookTargetConfig {
  chatId: string;
  senderId: string;
  threadId?: string;
  isGroup?: boolean;
}
export interface ChannelWebhookSourceConfig {
  secret?: string;
  secretEnv?: string;
  targets: Record<string, ChannelWebhookTargetConfig>;
}
export interface ChannelWebhookConfig {
  sources: Record<string, ChannelWebhookSourceConfig>;
}
export interface ChannelWebhookTask {
  channelName: string;
  source: string;
  eventType: string;
  targetRef: string;
  title: string;
  summary?: string;
  payload: Record<string, unknown>;
}
export interface ChannelWebhookRunOptions {
  timeoutMs?: number;
}
export declare function resolveChannelWebhookTarget(
  channelName: string,
  config: ChannelWebhookConfig,
  source: string,
  targetRef: string,
): SessionTarget;
export declare function buildChannelWebhookPrompt(
  task: ChannelWebhookTask,
  target: SessionTarget,
): string;
/**
 * User-visible projection of a webhook task (session-bus displayText,
 * transcript). Mirrors the model-prompt treatment in
 * buildChannelWebhookPrompt — same per-field caps and sanitizePromptText —
 * so an oversized or crafted title/summary cannot reach the transcript
 * uncapped while the model side stays bounded and sanitized.
 */
export declare function buildChannelWebhookDisplayText(
  task: ChannelWebhookTask,
): string;
