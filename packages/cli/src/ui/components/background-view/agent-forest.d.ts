/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Minimal structural view of a task entry — satisfied by both `AgentTask`
 * (registry entries) and the CLI's `DialogEntry` union, so the helpers can
 * be shared without importing either type (and without a type cycle between
 * this module and the view-model hook).
 */
export interface AgentForestNode {
    kind: string;
    agentId?: string;
    parentAgentId?: string | null;
    isBackgrounded?: boolean;
}
/** Per-agent tree metadata for row rendering. */
export interface AgentTreeInfo {
    /**
     * Structural depth among the *visible* entries (0 = rendered at root
     * level). An agent whose ancestors were evicted renders closer to the
     * root than its launch depth — the tree indents only what the user can
     * actually see, so connectors never dangle.
     */
    visibleDepth: number;
    /**
     * True when the entry claims a parent (`parentAgentId` set) that is not
     * in the visible set — the row is promoted to root level and annotated
     * ("from <parent>") instead of indented under nothing.
     */
    orphaned: boolean;
}
/**
 * Regroups agent entries so each agent renders directly beneath its parent
 * (depth-first), while every non-agent entry keeps its exact position: the
 * k-th agent slot in the input is filled by the k-th agent of the grouped
 * order. Agents whose parent is absent (top-level, evicted parent, or a
 * parent-cycle) keep their original relative order as roots; siblings keep
 * their original relative order under their parent.
 */
export declare function reorderChildrenUnderParents<T extends AgentForestNode>(entries: readonly T[]): T[];
/**
 * The LiveAgentPanel's row order: the snapshot arrives newest-first (the
 * dialog convention), the panel renders oldest-first, then groups each
 * nested agent under its parent. Shared with the composer's panel-focus
 * keyboard handler (InputPrompt), which resolves `livePanelSelectedIndex`
 * against this list — the two MUST use the same transform or Enter opens
 * the wrong agent's detail.
 */
export declare function panelDisplayOrder<T extends AgentForestNode>(visibleNewestFirst: readonly T[]): T[];
/** How an ancestor walk ended — see {@link ancestorChain}. */
export type AncestorTermination = 'root' | 'missing' | 'cycle';
/**
 * Walks `node`'s parent chain through `lookup`, collecting the ancestors
 * that are actually present (immediate parent first). The walk stops —
 * without error, per the module contract — at a top-level ancestor
 * (`'root'`), at an evicted/unknown parent id (`'missing'`), or on a
 * repeated id (`'cycle'`). Single home of the eviction/cycle policy shared
 * by tree depth, the `[blocking]` verdict, and the detail-view breadcrumb.
 */
export declare function ancestorChain<T extends AgentForestNode>(node: AgentForestNode, lookup: (id: string) => T | undefined): {
    chain: T[];
    terminatedBy: AncestorTermination;
};
/**
 * Computes {@link AgentTreeInfo} for every agent entry in the visible set.
 * Depth is the length of the parent chain that is actually present.
 */
export declare function computeAgentTreeInfo(entries: readonly AgentForestNode[]): Map<string, AgentTreeInfo>;
/**
 * The agent ids whose cancellation would end the USER's current turn — a
 * foreground entry whose entire ancestor chain is foreground up to the
 * top-level session. A foreground child awaited by a *background* parent
 * blocks that parent, not the user, so it is not tagged; the dialog's
 * `[blocking]` warning exists solely to flag "cancelling this ends your
 * turn". When the chain cannot be proven (evicted ancestor, cycle), the
 * entry is not tagged — a missing warning is a milder failure than a wrong
 * one.
 */
export declare function computeUserBlockingIds(entries: readonly AgentForestNode[]): Set<string>;
export declare const TREE_INDENT_PER_LEVEL = "    ";
export declare const TREE_INDENT_MAX_LEVELS = 3;
/**
 * The tree gutter rendered before a row's status glyph: indent by visible
 * depth plus a `↳` marker on any row spawned by another agent. The marker
 * is kept even for orphans (parent already evicted, depth back at 0) so
 * "this was a nested agent" stays legible.
 */
export declare function treeRowPrefix(entry: AgentForestNode, tree: AgentTreeInfo | undefined): string;
/**
 * Status → glyph vocabulary shared by the panel rows and the detail view's
 * Sub-agents roster: `○` for active slots (running keeps the list visually
 * uniform), distinct marks for terminal states, `⏸` for paused.
 */
export declare function statusGlyph(status: string): string;
