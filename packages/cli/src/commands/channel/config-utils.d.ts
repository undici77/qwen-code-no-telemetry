import type {
  ChannelConfig,
  ChannelWebhookConfig,
} from '@qwen-code/channel-base';
export { findCliEntryPath } from './cli-entry-path.js';
type WebhookEnvironment = Readonly<Record<string, string | undefined>>;
export declare function resolveEnvVars(
  value: string,
  env?: WebhookEnvironment,
): string;
/**
 * false: leave string values unchanged.
 * true: resolve $VAR references with the legacy generic not-set error.
 * 'available': resolve $VAR references with explicit unset vs empty errors.
 */
type EnvResolution = boolean | 'available';
export declare function parseChannelWebhookConfig(
  channelName: string,
  rawConfig: Record<string, unknown>,
  env?: WebhookEnvironment,
): ChannelWebhookConfig | undefined;
export declare function parseChannelWebhookConfigLenient(
  channelName: string,
  rawConfig: Record<string, unknown>,
  onSourceError?: (source: string, error: unknown) => void,
  env?: WebhookEnvironment,
): ChannelWebhookConfig | undefined;
export declare function parseChannelConfig(
  name: string,
  rawConfig: Record<string, unknown>,
  defaultCwd?: string,
  options?: {
    resolveEnvVars?: EnvResolution;
  },
): Promise<ChannelConfig & Record<string, unknown>>;
