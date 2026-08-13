export declare const DEFAULT_TIMEOUT = 120000;
/**
 * Sentinel request timeout (ms) representing a *disabled* timeout.
 *
 * The OpenAI and Anthropic SDKs treat `timeout: 0` as an immediate abort rather
 * than "no timeout", so a configured `0` (disable — matching the
 * `QWEN_STREAM_IDLE_TIMEOUT_MS=0` convention) is mapped to the maximum JS timer
 * delay (2^31 − 1 ms ≈ 24.8 days). `setTimeout` silently compresses larger
 * delays to 1ms, so this is the effective ceiling.
 */
export declare const DISABLED_REQUEST_TIMEOUT_MS = 2147483647;
/**
 * Resolve the request timeout (ms) to pass to a provider SDK client.
 *
 * - `undefined` / `null` → {@link DEFAULT_TIMEOUT}
 * - `0` or negative → disabled ({@link DISABLED_REQUEST_TIMEOUT_MS})
 * - otherwise → the configured value
 */
export declare function resolveRequestTimeout(timeout: number | null | undefined): number;
export declare const DEFAULT_STREAM_IDLE_TIMEOUT_MS = 240000;
export declare const QWEN_STREAM_IDLE_TIMEOUT_MS_ENV = "QWEN_STREAM_IDLE_TIMEOUT_MS";
export declare const MAX_STREAM_GUARD_TIMEOUT_MS = 2147483647;
export declare const DEFAULT_STREAM_MAX_LIFETIME_MS = 900000;
export declare const QWEN_STREAM_MAX_LIFETIME_MS_ENV = "QWEN_STREAM_MAX_LIFETIME_MS";
export declare const DEFAULT_MAX_RETRIES = 3;
export declare const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
export declare const DEFAULT_DASHSCOPE_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
export declare const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";
export declare const DEFAULT_OPEN_ROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export declare const DASHSCOPE_PROXY_BASE_URL: string | undefined;
