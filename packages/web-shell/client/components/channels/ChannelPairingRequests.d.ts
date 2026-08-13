/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonChannelPairingApprovalResult, DaemonChannelPairingApprovalsSnapshot, DaemonChannelPairingRequestsSnapshot, DaemonChannelPairingRevocationRequest, DaemonChannelPairingRevocationResult } from '@qwen-code/sdk/daemon';
export interface ChannelPairingRequestsProps {
    channelName: string;
    listRequests: (name: string) => Promise<DaemonChannelPairingRequestsSnapshot>;
    approveRequest: (name: string, code: string) => Promise<DaemonChannelPairingApprovalResult>;
    listApprovals: (name: string) => Promise<DaemonChannelPairingApprovalsSnapshot>;
    revokeApproval: (name: string, request: DaemonChannelPairingRevocationRequest) => Promise<DaemonChannelPairingRevocationResult>;
    staticAllowedUsers?: readonly string[];
}
export declare function ChannelPairingRequests({ channelName, listRequests, approveRequest, listApprovals, revokeApproval, staticAllowedUsers, }: ChannelPairingRequestsProps): import("react/jsx-runtime").JSX.Element;
