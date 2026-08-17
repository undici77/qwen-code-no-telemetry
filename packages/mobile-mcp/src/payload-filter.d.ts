import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import type {
  Transport,
  TransportSendOptions,
} from '@modelcontextprotocol/sdk/shared/transport.js';
export declare const encodeFilteredText: (value: string) => string;
export declare const decodeFilteredText: (value: string) => string;
export declare const encodePayloadMessage: (
  message: JSONRPCMessage,
) => JSONRPCMessage;
export declare const decodePayloadMessage: (
  message: JSONRPCMessage,
) => JSONRPCMessage;
export declare class PayloadFilteringTransport implements Transport {
  private readonly transport;
  private readonly inheritedCloseHandler;
  private readonly inheritedErrorHandler;
  private closeHandler;
  private errorHandler;
  private messageHandler;
  constructor(transport: Transport);
  get sessionId(): string | undefined;
  get onclose(): (() => void) | undefined;
  set onclose(handler: (() => void) | undefined);
  get onerror(): ((error: Error) => void) | undefined;
  set onerror(handler: ((error: Error) => void) | undefined);
  get onmessage(): Transport['onmessage'];
  set onmessage(handler: Transport['onmessage']);
  start(): Promise<void>;
  send(message: JSONRPCMessage, options?: TransportSendOptions): Promise<void>;
  close(): Promise<void>;
  setProtocolVersion(version: string): void;
}
