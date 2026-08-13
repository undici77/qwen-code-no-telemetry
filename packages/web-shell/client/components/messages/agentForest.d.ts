/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * agentForest — pure helpers for rendering nested sub-agents as a tree
 * in the tasks panel.
 *
 * Sub-agents may spawn sub-agents (bounded by `maxSubagentDepth`), and every
 * agent in the tree appears in the same flat tasks snapshot
 * (`DaemonSessionTasksStatus`, polled from `GET /session/:id/tasks`). These
 * helpers turn that flat roster into a parent-grouped display order plus
 * per-row tree metadata, without assuming the full tree is visible: entries
 * appear and leave the snapshot independently (foreground agents unregister
 * on completion, registries cap retained terminal entries), so every function
 * here treats a missing parent as a normal case, not an error.
 *
 * The reorder is a post-pass over an already-sorted list on purpose: the
 * panel sorts active-then-terminal, and a tree can span those buckets — a
 * running parent with a just-completed child, or vice versa. Grouping
 * children under whichever position their parent already earned preserves
 * the sort semantics for roots while keeping trees contiguous.
 *
 * Focused port of the TUI's helpers
 * (`packages/cli/src/ui/components/background-view/agent-forest.ts`); no
 * package importable from both surfaces exists, so the two files share
 * semantics via their collocated tests. Keep behavior changes in sync.
 */
/**
 * Minimal structural view of a task entry — satisfied by
 * `DaemonSessionTaskStatus` union members, so the helpers stay decoupled
 * from the SDK types. For agent tasks `id` IS the agent id (the daemon
 * serializer guarantees it), which is what `parentAgentId` references.
 */
export interface AgentForestNode {
    kind: string;
    id?: string;
    parentAgentId?: string | null;
    isBackgrounded?: boolean;
}
/** Per-agent tree metadata for row rendering. */
export interface AgentTreeInfo {
    /**
     * Structural depth among the *visible* entries (0 = rendered at root
     * level). An agent whose ancestors left the snapshot renders closer to
     * the root than its launch depth — the tree indents only what the user
     * can actually see, so connectors never dangle.
     */
    visibleDepth: number;
    /**
     * True when the entry claims a parent (`parentAgentId` set) that is not
     * in the visible set — the row is promoted to root level and annotated
     * ("from <parent>") instead of indented under nothing.
     */
    orphaned: boolean;
}
export declare const TREE_INDENT_MAX_LEVELS = 3;
/**
 * Regroups agent entries so each agent renders directly beneath its parent
 * (depth-first), while every non-agent entry keeps its exact position: the
 * k-th agent slot in the input is filled by the k-th agent of the grouped
 * order. Agents whose parent is absent (top-level, departed parent, or a
 * parent-cycle) keep their original relative order as roots; siblings keep
 * their original relative order under their parent.
 */
export declare function reorderChildrenUnderParents<T extends AgentForestNode>(entries: readonly T[]): T[];
/** How an ancestor walk ended — see {@link ancestorChain}. */
export type AncestorTermination = 'root' | 'missing' | 'cycle';
/**
 * Walks `node`'s parent chain through `lookup`, collecting the ancestors
 * that are actually present (immediate parent first). The walk stops —
 * without error, per the module contract — at a top-level ancestor
 * (`'root'`), at a departed/unknown parent id (`'missing'`), or on a
 * repeated id (`'cycle'`). Single home of the eviction/cycle policy shared
 * by tree depth and the `[blocking]` verdict.
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
 * blocks that parent, not the user, so it is not tagged; the `[blocking]`
 * warning exists solely to flag "cancelling this ends your turn". When the
 * chain cannot be proven (departed ancestor, cycle), the entry is not
 * tagged — a missing warning is a milder failure than a wrong one.
 */
export declare function computeUserBlockingIds(entries: readonly AgentForestNode[]): Set<string>;
