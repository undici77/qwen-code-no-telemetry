# Web Search

Qwen Code provides web search two ways:

1. **Built-in `web_search` tool** (opt-in) — backed by [SerpApi](https://serpapi.com), a universal search engine API. Works with a SerpApi API key (free tier: 250 queries/month). No extra provider or MCP setup needed.
2. **MCP (Model Context Protocol) integrations** — connect any external search service (Tavily, GLM, and others). Use this when you need a different provider or exceed SerpApi's free quota.

## Built-in `web_search` (opt-in)

The built-in tool fetches structured results from SerpApi and returns them as Markdown with sections for organic results, knowledge graph, answer box, related questions, top stories, shopping, jobs, local results, recipes, sports, images, videos, and Twitter/X. It never activates implicitly — two settings are required:

```json
{
  "tools": {
    "webSearch": {
      "enabled": true,
      "apiKey": "YOUR_SERPAPI_KEY"
    }
  }
}
```

| Setting                   | Env override        | Meaning                                                                                                              |
| ------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `tools.webSearch.enabled` | `ENABLE_WEB_SEARCH` | Opt-in flag. Required.                                                                                               |
| `tools.webSearch.apiKey`  | `SERPAPI_API_KEY`   | SerpApi API key. Get one at https://serpapi.com/manage-api-key. Free tier: 250 queries/month.                        |
| `tools.webSearch.engine`  | —                   | Search engine to use. Supported: `google`, `bing`, `baidu`, `yahoo`, `duckduckgo`, `yandex`, etc. Default: `google`. |
| `tools.webSearch.hl`      | —                   | Language parameter (hl). Default: `en`. Examples: `zh`, `ja`, `de`, `fr`, `es`.                                      |
| `tools.webSearch.gl`      | —                   | Country parameter (gl). Default: `us`. Examples: `cn`, `jp`, `de`, `fr`, `uk`.                                       |

### Env-only configuration (no settings.json)

For environments where you cannot write a settings file (locked-down containers, CI
with env injection only), the tool can be configured entirely through environment
variables:

```bash
export ENABLE_WEB_SEARCH=true
export SERPAPI_API_KEY=YOUR_KEY_HERE
```

Misconfiguration still surfaces as a startup notice.

Notes:

- The tool asks for confirmation by default; approving with "always allow" persists a standard `WebSearch` permission rule, like other tools.
- If enabled but misconfigured (no API key), the tool stays off and a startup notice explains the failure.
- SerpApi's free tier includes 250 queries per month — sufficient for personal use. For higher volumes, see [SerpApi pricing](https://serpapi.com/pricing).
- The `engine`, `hl`, and `gl` parameters are optional and default to `google`, `en`, `us` respectively.

## MCP alternatives

If you don't have a SerpApi key, or need a different provider, web search is available by connecting an external MCP server — see the services below.

## ⚠️ Historical Breaking Changes

### Original built-in `web_search` removed (V0.0.7+)

The original built-in `web_search` tool (Tavily/Google/GLM/DashScope multi-provider) and its configuration were **removed**. The new opt-in built-in tool above is a different implementation with different configuration. If you were using any of the following, migrate either to the new built-in tool (SerpApi) or to MCP:

| Removed                                                                | What to do                                                        |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `webSearch` block in `settings.json`                                   | Configure an MCP server in `mcpServers` instead (see below)       |
| `advanced.tavilyApiKey` in `settings.json`                             | Use the [Tavily MCP server](#tavily-websearch)                    |
| `TAVILY_API_KEY` environment variable                                  | Use the [Tavily MCP server](#tavily-websearch)                    |
| `DASHSCOPE_API_KEY` for web search                                     | Use the [built-in `web_search` tool](#built-in-web_search-opt-in) |
| `GLM_API_KEY` for web search                                           | Use the [GLM WebSearch Prime MCP](#glm-websearch-prime-zhipuai)   |
| `--tavily-api-key` / `--glm-api-key` / `--dashscope-api-key` CLI flags | Configure via `mcpServers` in `settings.json`                     |

### Built-in `web_search` backend changed from DashScope to SerpApi (V0.20.0+)

The built-in `web_search` tool was migrated from the DashScope Responses API backend to [SerpApi](https://serpapi.com). The configuration schema changed:

| Old setting                    | New setting               | Notes                                                 |
| ------------------------------ | ------------------------- | ----------------------------------------------------- |
| `tools.webSearch.enabled`      | `tools.webSearch.enabled` | Same                                                  |
| `tools.webSearch.model`        | `tools.webSearch.apiKey`  | Now requires a SerpApi API key                        |
| `tools.webSearch.webExtractor` | —                         | Removed — SerpApi returns structured results directly |
| `tools.webSearch.baseUrl`      | —                         | Removed — no longer needed                            |
| `tools.webSearch.apiKeyEnv`    | —                         | Removed                                               |
| —                              | `tools.webSearch.engine`  | New — search engine (google, bing, baidu, etc.)       |
| —                              | `tools.webSearch.hl`      | New — language parameter                              |
| —                              | `tools.webSearch.gl`      | New — country parameter                               |

**Migration:** Replace your old `webSearch` config with the new schema:

```json
{
  "tools": {
    "webSearch": {
      "enabled": true,
      "apiKey": "YOUR_SERPAPI_KEY"
    }
  }
}
```

Get a free SerpApi key at https://serpapi.com/manage-api-key (250 queries/month on the free tier).

---

## Supported MCP Web Search Services

### Tavily WebSearch

A production-ready MCP server providing real-time web search, extract, map, and crawl capabilities.

- **Repository:** https://github.com/tavily-ai/tavily-mcp
- **Cost:** Paid (free tier available)
- **Get API Key:** https://app.tavily.com/home
- **Best for:** General-purpose web search with high-quality AI-generated answers

#### Available Tools

- `tavily_search` — Real-time web search
- `tavily_extract` — Intelligent data extraction from web pages
- `tavily_map` — Create a structured map of a website
- `tavily_crawl` — Systematically explore websites

#### Setup

**Method 1: CLI command (Remote MCP)**

```bash
qwen mcp add tavily \
  -t http \
  "https://mcp.tavily.com/mcp/?tavilyApiKey=${TAVILY_API_KEY}"
```

**Method 2: `settings.json` (Remote MCP)**

```json
{
  "mcpServers": {
    "tavily": {
      "httpUrl": "https://mcp.tavily.com/mcp/?tavilyApiKey=${TAVILY_API_KEY}"
    }
  }
}
```

Replace `${TAVILY_API_KEY}` with your actual API key, or set it as an environment variable.

**Method 3: `settings.json` (Local NPX)**

```json
{
  "mcpServers": {
    "tavily-mcp": {
      "command": "npx",
      "args": ["-y", "tavily-mcp@latest"],
      "env": {
        "TAVILY_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

---

### GLM WebSearch Prime (ZhipuAI)

The official web search Remote MCP service provided by ZhipuAI (智谱AI), designed for GLM Coding Plan users. Provides real-time web search including news, stock prices, weather, and more.

- **Documentation:** https://docs.bigmodel.cn/cn/coding-plan/mcp/search-mcp-server
- **Cost:** Included in GLM Coding Plan subscription (Lite: 100 calls/month, Pro: 1,000/month, Max: 4,000/month)
- **Get API Key:** https://open.bigmodel.cn/apikey/platform
- **Best for:** Chinese-language queries, real-time information retrieval

#### Available Tools

- `webSearchPrime` — Web search returning page title, URL, summary, site name, and favicon

#### Setup

**Method 1: CLI command**

```bash
qwen mcp add web-search-prime \
  -t http \
  "https://open.bigmodel.cn/api/mcp/web_search_prime/mcp" \
  -H "Authorization: Bearer ${GLM_API_KEY}"
```

**Method 2: `settings.json`**

```json
{
  "mcpServers": {
    "web-search-prime": {
      "httpUrl": "https://open.bigmodel.cn/api/mcp/web_search_prime/mcp",
      "headers": {
        "Authorization": "Bearer ${GLM_API_KEY}"
      }
    }
  }
}
```

Replace `${GLM_API_KEY}` with your actual ZhipuAI API key, or set it as an environment variable.

---
