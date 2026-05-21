/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { MCPServerDisplayInfo, GroupedServers } from './types.js';
/**
 * 按来源分组服务器
 */
export declare function groupServersBySource(servers: MCPServerDisplayInfo[]): GroupedServers[];
/**
 * 获取状态颜色
 */
export declare function getStatusColor(status: string): 'green' | 'yellow' | 'red' | 'gray';
/**
 * 获取状态图标
 */
export declare function getStatusIcon(status: string): string;
/**
 * 截断文本
 */
export declare function truncateText(text: string, maxLength: number): string;
/**
 * 格式化服务器命令显示
 */
export declare function formatServerCommand(server: MCPServerDisplayInfo): string;
/**
 * Check if a tool is valid (has both name and description required by LLM)
 * @param name - Tool name
 * @param description - Tool description
 * @returns boolean indicating if the tool is valid
 */
export declare function isToolValid(name?: string, description?: string): boolean;
/**
 * Get the reason why a tool is invalid
 * @param name - Tool name
 * @param description - Tool description
 * @returns Array of missing fields
 */
export declare function getToolInvalidReasons(name?: string, description?: string): string[];
