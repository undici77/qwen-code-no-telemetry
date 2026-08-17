import type {
  DaemonWorkspaceActions,
  DaemonWorkspaceMcpToolsStatus,
  DaemonWorkspaceMcpResourcesStatus,
} from '@qwen-code/webui/daemon-react-sdk';
type DaemonWorkspaceMcpStatus = Awaited<
  ReturnType<DaemonWorkspaceActions['loadMcpStatus']>
>;
interface SerializedMcpStatusMessage {
  status: DaemonWorkspaceMcpStatus;
  toolsByServer: Record<string, DaemonWorkspaceMcpToolsStatus>;
  /**
   * Per-server MCP resources, preloaded alongside tools so the dialog can
   * browse them offline. Keyed by server name. Optional because messages
   * serialized by older clients omit it — consumers must read defensively
   * (`?? {}`), and the optional type forces that at compile time.
   */
  resourcesByServer?: Record<string, DaemonWorkspaceMcpResourcesStatus>;
  showDescriptions: boolean;
  showSchema: boolean;
  showTips: boolean;
}
declare const serializeMcpStatusMessage: any;
declare function parseMcpStatusMessage(
  content: string,
): SerializedMcpStatusMessage | null;
export {
  serializeMcpStatusMessage,
  parseMcpStatusMessage,
  type SerializedMcpStatusMessage,
};
export declare function McpStatusMessage({
  message,
}: {
  message: SerializedMcpStatusMessage;
}): import('react/jsx-runtime').JSX.Element | null;
