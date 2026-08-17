import type { ChannelWebhookTask } from '@qwen-code/channel-base';
export type ChannelWebhookEnqueueErrorCode =
  | 'channel_worker_unavailable'
  | 'channel_webhook_enqueue_timeout'
  | 'channel_webhook_queue_full'
  | 'channel_webhook_target_unavailable'
  | 'channel_webhook_invalid_task'
  | 'channel_webhook_enqueue_failed';
export declare class ChannelWebhookEnqueueError extends Error {
  readonly code: ChannelWebhookEnqueueErrorCode;
  constructor(code: ChannelWebhookEnqueueErrorCode, message: string);
}
export declare function isChannelWebhookEnqueueErrorCode(
  value: unknown,
): value is ChannelWebhookEnqueueErrorCode;
export declare function isChannelWebhookEnqueueError(
  value: unknown,
): value is ChannelWebhookEnqueueError;
export interface ChannelWebhookTaskRequestMessage {
  type: 'webhook_task';
  id: string;
  expiresAt: number;
  task: ChannelWebhookTask;
}
export interface ChannelWebhookTaskResultMessage {
  type: 'webhook_task_result';
  id: string;
  ok: boolean;
  code?: ChannelWebhookEnqueueErrorCode;
  error?: string;
}
export interface ChannelWebhookAccepted {
  accepted: true;
}
export declare const CHANNEL_WEBHOOK_TASK_IPC_TIMEOUT_MS = 30000;
export declare function createChannelWebhookTaskMessage(
  task: ChannelWebhookTask,
): ChannelWebhookTaskRequestMessage;
export declare function isChannelWebhookTaskMessage(
  value: unknown,
): value is ChannelWebhookTaskRequestMessage;
export declare function isChannelWebhookTaskResultMessage(
  value: unknown,
): value is ChannelWebhookTaskResultMessage;
