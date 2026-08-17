export declare const CHANNEL_WORKER_PROMPT_AUTHORIZATION_META_KEY =
  'qwen.daemon.channelPromptAuthorization';
export declare function registerChannelWorkerPromptAuthorization(
  token: string,
  workspaceCwd: string,
): void;
export declare function revokeChannelWorkerPromptAuthorization(
  token: string,
): void;
export declare function isChannelWorkerPromptAuthorized(
  token: unknown,
  workspaceCwd: string,
): boolean;
