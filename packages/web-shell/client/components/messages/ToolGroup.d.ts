import type { ACPToolCall, PermissionRequest } from '../../adapters/types';
import { useI18n } from '../../i18n';
import { type ToolHeaderKind } from '../../customization';
interface ToolGroupProps {
  tools: ACPToolCall[];
  pendingApproval?: PermissionRequest | null;
  workspaceCwd?: string;
  isLocateFlashing?: boolean;
}
export declare function hasExpandableContent(tool: ACPToolCall): boolean;
export declare function extractDiff(tool: ACPToolCall): string;
export declare function getRawFileDiff(tool: ACPToolCall): string;
export declare function buildUnifiedDiff(
  oldText: string,
  newText: string,
): string;
export declare function languageForPath(filePath: string): string;
export declare function fencedCodeBlock(language: string, code: string): string;
interface ToolLineProps {
  tool: ACPToolCall;
  approval?: PermissionRequest | null;
  workspaceCwd?: string;
  summaryOnly?: boolean;
  forceExpanded?: boolean;
  forceExpandable?: boolean;
  hideHeader?: boolean;
  hideCollapsedOutput?: boolean;
}
export declare function shouldAutoExpand(tool: ACPToolCall): boolean;
export declare function getToolHeaderKind(tool: ACPToolCall): ToolHeaderKind;
export declare function getActiveTool(tools: ACPToolCall[]): ACPToolCall;
export declare function formatToolGroupSummary(
  tools: ACPToolCall[],
  t: ReturnType<typeof useI18n>['t'],
  workspaceCwd?: string,
): string;
export declare function formatSingleToolSummary(
  tool: ACPToolCall,
  t: ReturnType<typeof useI18n>['t'],
  workspaceCwd?: string,
): string;
export declare function isWebFetchToolName(toolName: string): boolean;
export declare const ToolLine: import('react').NamedExoticComponent<ToolLineProps>;
export declare const ToolGroup: import('react').NamedExoticComponent<ToolGroupProps>;
export {};
