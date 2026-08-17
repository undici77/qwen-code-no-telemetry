export interface PairingRequest {
  senderId: string;
  senderName: string;
  subject: PairingSubject;
  code: string;
  createdAt: number;
}
export interface PairingSubject {
  type: 'user' | 'group';
  id: string;
  name: string;
}
export type CreatePairingRequestResult =
  | {
      code: string;
    }
  | {
      rejected: 'sender_pending' | 'cap_reached';
    };
export declare class PairingStore {
  private dir;
  private pendingPath;
  private allowlistPath;
  private groupAllowlistPath;
  private migratedSentinelPath;
  /**
   * @param channelName Channel name the state is keyed by.
   * @param workspaceCwd Workspace working directory to scope the state to.
   *   When provided, files live under
   *   `<qwen-home>/channels/<workspace-scope>/` so two workspaces using the
   *   same channel name never share pairing requests or allowlist entries
   *   (see #7017 — sharing them is an authorization-boundary violation in
   *   multi-workspace daemon deployments). Omitting it preserves the legacy
   *   global layout (`<qwen-home>/channels/`).
   */
  constructor(channelName: string, workspaceCwd?: string);
  /**
   * One-time grandfathering of pre-scoping state: the first time this
   * (workspace, channel) pair is constructed, copy the legacy GLOBAL files in
   * so senders that were already approved stay approved after upgrading.
   *
   * Gated by a per-channel sentinel file inside the scope directory — NOT by
   * the directory itself: one workspace can start several channels in turn,
   * and a directory-level gate would let only the first channel ever migrate.
   * The sentinel is written even when there was nothing to copy, so a legacy
   * file written later (e.g. by an older version still running concurrently)
   * is never absorbed into a scope that already went through this decision.
   *
   * Each file is copied independently and best-effort (an unreadable pairing
   * file must not block the allowlist, and vice versa), via a
   * uniquely-named temp file + atomic rename so a crash mid-copy cannot
   * leave a truncated scoped file behind the closed gate. A file the scoped
   * store already has is never overwritten.
   *
   * Copy, not move: another workspace upgrading later must be able to
   * grandfather the same baseline, and an older qwen version running
   * concurrently still reads the global files.
   *
   * Revocation therefore means removing entries from this store's allowlist,
   * not deleting files or mutating the legacy global baseline.
   */
  private migrateLegacyState;
  isApproved(senderId: string): boolean;
  isGroupApproved(groupId: string): boolean;
  /**
   * Create a pairing request for an unknown sender.
   * Returns the code if created; if the subject already has a non-expired
   * pending request, returns that code. Rejects with `sender_pending` when
   * the sender already holds a request for another subject, or
   * `cap_reached` when the pending cap is reached.
   */
  createRequest(
    senderId: string,
    senderName: string,
  ): CreatePairingRequestResult;
  createGroupRequest(
    groupId: string,
    groupName: string,
    senderId: string,
    senderName: string,
  ): CreatePairingRequestResult;
  private createSubjectRequest;
  /**
   * Approve a pairing request by code.
   * Returns the request if found, or null if not found / expired.
   */
  approve(code: string): PairingRequest | null;
  listPending(): PairingRequest[];
  getAllowlist(): string[];
  getGroupAllowlist(): string[];
  revoke(senderId: string): boolean;
  revokeGroup(groupId: string): boolean;
  private ensureDir;
  private readPending;
  private writePending;
  private readAllowlist;
  private writeAllowlist;
  private readGroupAllowlist;
  private writeGroupAllowlist;
}
