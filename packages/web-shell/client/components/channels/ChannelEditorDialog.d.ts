/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonChannelInstanceSnapshot, DaemonChannelPairingApprovalResult, DaemonChannelPairingApprovalsSnapshot, DaemonChannelPairingRequestsSnapshot, DaemonChannelPairingRevocationRequest, DaemonChannelPairingRevocationResult, DaemonChannelTypeDescriptor, DaemonChannelUpsertRequest } from '@qwen-code/sdk/daemon';
export interface ChannelEditorDialogProps {
    open: boolean;
    descriptor: DaemonChannelTypeDescriptor;
    instance?: DaemonChannelInstanceSnapshot;
    expectedRevision: string;
    existingNames: readonly string[];
    onOpenChange: (open: boolean) => void;
    onSave: (name: string, request: DaemonChannelUpsertRequest) => Promise<unknown>;
    onReload: () => Promise<unknown>;
    listPairingRequests: (name: string) => Promise<DaemonChannelPairingRequestsSnapshot>;
    approvePairingRequest: (name: string, code: string) => Promise<DaemonChannelPairingApprovalResult>;
    listPairingApprovals: (name: string) => Promise<DaemonChannelPairingApprovalsSnapshot>;
    revokePairingApproval: (name: string, request: DaemonChannelPairingRevocationRequest) => Promise<DaemonChannelPairingRevocationResult>;
}
export declare function ChannelEditorDialog({ open, descriptor, instance, expectedRevision, existingNames, onOpenChange, onSave, onReload, listPairingRequests, approvePairingRequest, listPairingApprovals, revokePairingApproval, }: ChannelEditorDialogProps): import("react/jsx-runtime").JSX.Element;
