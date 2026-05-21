/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Per-run AsyncLocalStorage frame for agent execution.
 *
 * Tools capture `this.config` at construction time, so a sub-agent running
 * with a different model cannot rely on the constructor-bound Config to
 * report the right ContentGenerator or modalities. This frame lets
 * `Config.getContentGenerator{,Config}()` resolve to the active sub-agent
 * view, and lets nested `agent` tool launches discover their parent's id —
 * both without threading extra parameters through every call site.
 *
 * Helpers patch one field at a time and merge with whatever is already on
 * the stack, so wrapping at different layers preserves every set field.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
const storage = new AsyncLocalStorage();
export function runWithAgentContext(agentId, fn) {
    const current = storage.getStore() ?? {};
    return storage.run({ ...current, agentId }, fn);
}
export function runWithRuntimeContentGenerator(view, fn) {
    const current = storage.getStore() ?? {};
    return storage.run({ ...current, runtimeView: view }, fn);
}
export function getCurrentAgentId() {
    return storage.getStore()?.agentId ?? null;
}
export function getRuntimeContentGenerator() {
    return storage.getStore()?.runtimeView;
}
//# sourceMappingURL=agent-context.js.map