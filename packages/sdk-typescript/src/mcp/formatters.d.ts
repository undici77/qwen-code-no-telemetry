/**
 * Tool result formatting utilities for MCP responses
 *
 * Converts various output types to MCP content blocks.
 */
export type McpContentBlock = {
    type: 'text';
    text: string;
} | {
    type: 'image';
    data: string;
    mimeType: string;
} | {
    type: 'resource';
    uri: string;
    mimeType?: string;
    text?: string;
};
export interface ToolResult {
    content: McpContentBlock[];
    isError?: boolean;
}
export declare function formatToolResult(result: unknown): ToolResult;
export declare function formatToolError(error: Error | string): ToolResult;
export declare function formatTextResult(text: string): ToolResult;
export declare function formatJsonResult(data: unknown): ToolResult;
export declare function mergeToolResults(results: ToolResult[]): ToolResult;
export declare function isValidContentBlock(block: unknown): block is McpContentBlock;
