# Qwen Code Configuration

> [!tip]
>
> **Authentication / API keys:** Authentication (API Key, Alibaba Cloud Coding Plan) and auth-related environment variables (like `OPENAI_API_KEY`) are documented in **[Authentication](../configuration/authentication.md)**.

The Qwen Code CLI can be configured via a JSON file. The default location is:

- **Linux:** `~/.config/qwen/settings.json`
- **macOS:** `~/Library/Application Support/qwen/settings.json`
- **Windows:** `%APPDATA%\qwen\settings.json`

## Example Settings

```json
{
  "model": "qwen-2.5-coder-32b",
  "temperature": 0,
  "maxTokens": 4096,
  "contextWindow": 128000,
  "systemPrompt": "You are Qwen Code, an expert AI assistant...",
  "enableAutoUpdate": false,
  "gitCoAuthor": false,
  "privacy": {
    "usageStatisticsEnabled": false
  }
}
```

> [!note]
>
> In the no-telemetry version, all telemetry collection is replaced with no-op implementations. No data is sent to external servers regardless of these setting.
