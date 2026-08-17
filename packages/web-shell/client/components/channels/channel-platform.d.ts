/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonChannelTypeDescriptor } from '@qwen-code/sdk/daemon';
export declare const PLATFORM_MARKS: Record<string, string>;
export declare function isSupportedChannelType(
  type: unknown,
): type is 'dingtalk' | 'wecom' | 'feishu' | 'github' | 'gitlab';
export declare function isChannelPlatformAvailable(
  descriptor: DaemonChannelTypeDescriptor,
): boolean;
