/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  DaemonChannelInstanceSnapshot,
  DaemonChannelSecretUpdate,
  DaemonChannelTypeDescriptor,
  DaemonChannelUpsertRequest,
} from '@qwen-code/sdk/daemon';
export type ChannelSenderPolicy = 'pairing' | 'open' | '';
export interface ChannelSecretDraft {
  operation: DaemonChannelSecretUpdate['operation'];
  value?: string;
}
export interface ChannelEditorDraft {
  name: string;
  values: Record<string, string | boolean>;
  secrets: Record<string, ChannelSecretDraft>;
  senderPolicy: ChannelSenderPolicy;
}
export type ChannelEditorValidationCode =
  | 'required'
  | 'credential'
  | 'duplicate'
  | 'invalid'
  | 'invalidOption'
  | 'number'
  | 'outOfRange'
  | 'policy';
export type ChannelEditorValidationErrors = Record<
  string,
  ChannelEditorValidationCode
>;
export declare function hasDescriptorSenderPolicy(
  descriptor: DaemonChannelTypeDescriptor,
): boolean;
export declare function createChannelEditorDraft(
  descriptor: DaemonChannelTypeDescriptor,
  instance?: DaemonChannelInstanceSnapshot,
): ChannelEditorDraft;
export declare function validateChannelEditorDraft(
  descriptor: DaemonChannelTypeDescriptor,
  draft: ChannelEditorDraft,
  existingNames: readonly string[],
): ChannelEditorValidationErrors;
export declare function buildChannelUpsertRequest(
  descriptor: DaemonChannelTypeDescriptor,
  draft: ChannelEditorDraft,
  expectedRevision: string,
  instance?: DaemonChannelInstanceSnapshot,
): DaemonChannelUpsertRequest;
