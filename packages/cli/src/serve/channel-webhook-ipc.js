import { randomUUID } from 'node:crypto';
const CHANNEL_WEBHOOK_ENQUEUE_ERROR_CODES = new Set([
    'channel_worker_unavailable',
    'channel_webhook_enqueue_timeout',
    'channel_webhook_queue_full',
    'channel_webhook_target_unavailable',
    'channel_webhook_invalid_task',
    'channel_webhook_enqueue_failed',
]);
export class ChannelWebhookEnqueueError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'ChannelWebhookEnqueueError';
    }
}
export function isChannelWebhookEnqueueErrorCode(value) {
    return (typeof value === 'string' && CHANNEL_WEBHOOK_ENQUEUE_ERROR_CODES.has(value));
}
export function isChannelWebhookEnqueueError(value) {
    return (value instanceof ChannelWebhookEnqueueError ||
        (typeof value === 'object' &&
            value !== null &&
            isChannelWebhookEnqueueErrorCode(value.code) &&
            typeof value.message === 'string'));
}
export const CHANNEL_WEBHOOK_TASK_IPC_TIMEOUT_MS = 30_000;
export function createChannelWebhookTaskMessage(task) {
    return {
        type: 'webhook_task',
        id: randomUUID(),
        expiresAt: Date.now() + CHANNEL_WEBHOOK_TASK_IPC_TIMEOUT_MS,
        task,
    };
}
export function isChannelWebhookTaskMessage(value) {
    return (typeof value === 'object' &&
        value !== null &&
        value.type === 'webhook_task' &&
        typeof value.id === 'string' &&
        typeof value.expiresAt === 'number' &&
        typeof value.task === 'object' &&
        value.task !== null);
}
export function isChannelWebhookTaskResultMessage(value) {
    return (typeof value === 'object' &&
        value !== null &&
        value.type === 'webhook_task_result' &&
        typeof value.id === 'string' &&
        typeof value.ok === 'boolean');
}
//# sourceMappingURL=channel-webhook-ipc.js.map