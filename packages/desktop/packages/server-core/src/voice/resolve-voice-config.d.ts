/**
 * Resolve the ASR endpoint + credentials for desktop voice dictation.
 *
 * The desktop drives Qwen over ACP and stores no voice baseUrl/apiKey of its
 * own — the real credentials live in Qwen's trusted configuration. We resolve
 * them from, in order:
 *   1. Exact model provider — the trusted-settings provider whose `id` matches
 *                           the selected voice model; authoritative (resolved
 *                           before OAuth, failing closed when incomplete) only
 *                           when its baseUrl needs a network-policy decision —
 *                           allowlisted, cleartext, private-network, or
 *                           loopback. Public HTTPS entries fall through to keep
 *                           the legacy credential precedence.
 *   2. OAuth login        — `~/.qwen/oauth_creds.json` (access_token + resource_url)
 *   3. Legacy DashScope provider — a shared DashScope compatible-mode provider
 *                           in trusted settings
 *   4. Environment        — DASHSCOPE_API_KEY, or OPENAI_API_KEY with OPENAI_BASE_URL
 *
 * The voice model is the user-selected one persisted in desktop settings
 * (defaults to qwen3-asr-flash); its transport (batch vs realtime) is derived
 * downstream from the model id.
 */
import type { VoiceConfig } from './transcribe';
interface ResolveDesktopVoiceConfigDeps {
    readQwenJson?: <T>(file: string) => Promise<T | undefined>;
    readSystemJson?: <T>(file: string) => Promise<T | undefined>;
    readHomeEnvFile?: (file: string) => Promise<string | undefined>;
    systemSettingsPath?: string;
    systemDefaultsPath?: string;
    getVoiceModel?: () => string;
    env?: NodeJS.ProcessEnv;
    now?: () => number;
    platform?: NodeJS.Platform;
}
/**
 * Normalize a base URL: prepend `https://` when no authority scheme is present,
 * preserve explicit schemes for protocol validation later, strip trailing
 * slashes, and ensure a `/v1` suffix. Throws on embedded credentials
 * (`user:pass@host`), which a legitimate endpoint never carries. Exported for tests.
 */
export declare function normalizeBaseUrl(raw: string): string;
/**
 * Resolve the global qwen config dir, mirroring core's
 * `Storage.getGlobalQwenDir()` so desktop voice reads the SAME `~/.qwen`
 * credentials the qwen CLI writes. QWEN_HOME is normalized exactly as core does:
 * a leading `~`/`~/` expands to homedir() and a relative value resolves to an
 * absolute path; an unset/empty value falls back to `~/.qwen`. Reading the raw
 * env value would point voice at a different dir than the rest of Qwen.
 * Exported for tests.
 */
export declare function getQwenConfigDir(): string;
/** Parse home .env content exactly like dotenv@17. Exported for tests. */
export declare function parseEnvFileContent(content: string): Record<string, string>;
/** qwen3-asr models live on the DashScope OpenAI-compatible endpoint. Exported for tests. */
export declare function isDashscopeCompatible(url: string): boolean;
export declare function resolveDesktopVoiceConfig(deps?: ResolveDesktopVoiceConfigDeps): Promise<VoiceConfig>;
export {};
