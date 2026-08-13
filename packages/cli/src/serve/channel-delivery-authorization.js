/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
function authorizationKey(workspaceCwd, sessionId, id) {
    return JSON.stringify([workspaceCwd, sessionId, id]);
}
function targetsEqual(left, right) {
    return (left.channelName === right.channelName &&
        left.type === right.type &&
        left.id === right.id);
}
export class ChannelDeliveryAuthorizationStore {
    #prompts = new Map();
    #scheduledTasks = new Map();
    authorizePrompt(workspaceCwd, authorization) {
        this.#prompts.set(authorizationKey(workspaceCwd, authorization.sessionId, authorization.deliveryId), authorization.target);
    }
    revokePrompt(workspaceCwd, sessionId, deliveryId) {
        this.#prompts.delete(authorizationKey(workspaceCwd, sessionId, deliveryId));
    }
    registerScheduledTask(workspaceCwd, authorization) {
        const key = authorizationKey(workspaceCwd, authorization.sessionId, authorization.taskId);
        const current = this.#scheduledTasks.get(key);
        this.#scheduledTasks.set(key, {
            sessionId: authorization.sessionId,
            taskId: authorization.taskId,
            target: authorization.target,
            recurring: authorization.recurring,
            lastConsumedAt: current?.lastConsumedAt ?? authorization.lastFiredAt ?? 0,
        });
    }
    revokeScheduledTask(workspaceCwd, sessionId, taskId) {
        this.#scheduledTasks.delete(authorizationKey(workspaceCwd, sessionId, taskId));
    }
    consume(workspaceCwd, request) {
        if (request.source === 'prompt') {
            if (request.promptId !== request.deliveryId)
                return false;
            const key = authorizationKey(workspaceCwd, request.sessionId, request.deliveryId);
            const target = this.#prompts.get(key);
            if (!target || !targetsEqual(target, request.target))
                return false;
            this.#prompts.delete(key);
            return true;
        }
        if (typeof request.taskId !== 'string' ||
            typeof request.firedAt !== 'number' ||
            request.deliveryId !== `${request.taskId}:${request.firedAt}`) {
            return false;
        }
        const key = authorizationKey(workspaceCwd, request.sessionId, request.taskId);
        const authorization = this.#scheduledTasks.get(key);
        if (!authorization ||
            request.firedAt <= authorization.lastConsumedAt ||
            !targetsEqual(authorization.target, request.target)) {
            return false;
        }
        if (authorization.recurring) {
            authorization.lastConsumedAt = request.firedAt;
        }
        else {
            this.#scheduledTasks.delete(key);
        }
        return true;
    }
}
//# sourceMappingURL=channel-delivery-authorization.js.map