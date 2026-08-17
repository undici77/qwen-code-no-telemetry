/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { type ActiveWorkHoldV1 } from '@qwen-code/acp-bridge/bridgeTypes';
/**
 * A Session, as far as active-work reporting is concerned. `collectHolds()`
 * must *derive* its result from whatever subsystem actually owns the work
 * (the background-task registry, the notification queue, ...) rather than
 * read a ledger maintained alongside it: a ledger can miss a release and
 * then pin the Session forever, and a full snapshot would faithfully
 * republish that leak on every report.
 */
export interface ActiveWorkSource {
  readonly sessionId: string;
  collectActiveWorkHolds(): ActiveWorkHoldV1[];
}
type SendNotification = (
  method: string,
  params: Record<string, unknown>,
) => Promise<void>;
/**
 * Publishes channel-wide active-work snapshots to the daemon.
 *
 * One reporter per ACP connection, not per Session. Reporting at channel
 * scope is what keeps the always-on cadence affordable (one small message
 * per interval regardless of Session count) and it lets the daemon treat a
 * Session missing from a fresh snapshot as proof the child released it.
 *
 * Every message is a complete snapshot with a monotonic `seq`. The sequence
 * exists only to discard reordered messages — never to detect gaps — so a
 * dropped report costs at most one interval of staleness and needs no
 * retransmit, ack, or local "last reported" state to diff against.
 */
export declare class ActiveWorkReporter {
  #private;
  private readonly send;
  private readonly listSources;
  readonly intervalMs: number;
  constructor(
    send: SendNotification,
    listSources: () => Iterable<ActiveWorkSource>,
    intervalMs: number,
  );
  /**
   * Note that some Session's derived state may have changed. Coalesced to
   * one snapshot per microtask so a burst of transitions (an agent finishing
   * and its terminal notification enqueuing in the same tick) produces a
   * single message that already reflects the settled state.
   */
  notifyChanged(): void;
  /**
   * Publish now and resolve once the snapshot has been handed to the
   * transport.
   *
   * Callers use this to order a snapshot ahead of an RPC response on the same
   * stream. The prompt path needs it: the daemon drops its own
   * `pendingPromptCount` the moment the prompt response lands, so a hold
   * taken during that prompt (a background agent it started) has to be on the
   * wire *first* or the daemon briefly sees neither fact and may reap the
   * Session.
   */
  flush(): Promise<void>;
  dispose(): void;
}
export {};
