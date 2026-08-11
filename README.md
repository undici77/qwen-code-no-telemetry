# QWEN-CODE

> This README replaces the original one to document this fork specifically.
> For full documentation on features, configuration, and usage refer to the
> [original README at v0.21.10](https://github.com/QwenLM/qwen-code/blob/v0.21.10/README.md).

---

## What is this?

This is a fork of [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code) with all telemetry removed.
No data is sent to external servers during usage.

<a href="https://qwenlm.github.io/qwen-code-docs/zh/users/overview">中文</a> |
<a href="https://qwenlm.github.io/qwen-code-docs/de/users/overview">Deutsch</a> |
<a href="https://qwenlm.github.io/qwen-code-docs/fr/users/overview">français</a> |
<a href="https://qwenlm.github.io/qwen-code-docs/ja/users/overview">日本語</a> |
<a href="https://qwenlm.github.io/qwen-code-docs/ru/users/overview">Русский</a> |
<a href="https://qwenlm.github.io/qwen-code-docs/pt-BR/users/overview">Português (Brasil)</a> |
<a href="https://qwenlm.github.io/qwen-code-docs/ko/users/overview">한국어</a>

---

### Notable Changes from Upstream

- **No Telemetry**: All OpenTelemetry dependencies removed. `InstallationManager` returns a static ID, all loggers are no-ops.
- **WebSearch Tool**: Migrated from DashScope Responses API to [SerpApi](https://serpapi.com) (free tier: 250 queries/month). See [docs/developers/tools/web-search.md](docs/developers/tools/web-search.md) for details.
- **Vision Bridge**: Images are never dropped — the bridge throttles to 4 concurrent conversions instead of rejecting anything past the 4th image in a turn.

---

### The Evolution of No-Telemetry

- **Until v0.12.1-no-telemetry**: The policy was to **delete all telemetry-related files**. While effective for privacy, this made it difficult to maintain the fork and align it with upstream updates.
- **From v0.12.3-no-telemetry onwards**: We have switched to a "privacy-first" dummy implementation. We now remove all `@opentelemetry/*` packages and replace the telemetry logic with an **empty/dummy layer**. This keeps the application code untouched and easy to merge, while ensuring maximum privacy.

### Privacy Analysis

The current implementation provides a high level of security:

- **Zero External Tracking**: All OpenTelemetry dependencies are gone.
- **Neutralized Core**: The `InstallationManager` returns a static non-unique ID, and all network-bound loggers are replaced with no-op functions.
- **Local Only**: Data is only saved for local session history and hierarchical memory, as required for the application's core functionality.

---

## Installation

### Option 1 — Install script (local, no root required)

Installs Node.js via NVM and Qwen Code into your home directory.
Safe to use inside ephemeral Docker containers.

```bash
curl -fsSL https://raw.githubusercontent.com/undici77/qwen-code-no-telemetry/v0.21.10-no-telemetry/install.sh \
    | bash -s v0.21.10-no-telemetry
```

### Option 2 — Windows (PowerShell, no admin required)

Installs a portable Node.js and Qwen Code under `%LOCALAPPDATA%` — no admin
rights needed. Requires [Git for Windows](https://git-scm.com/download/win)
(npm needs `git.exe` on PATH to fetch the package from GitHub).

```powershell
iwr https://raw.githubusercontent.com/undici77/qwen-code-no-telemetry/v0.21.10-no-telemetry/install.ps1 -OutFile install.ps1
.\install.ps1 v0.21.10-no-telemetry
```

### Option 3 — Docker

**Build the image:**

```bash
docker build -t qwen-coder-sandbox .
```

**Run (sharing the current directory as workspace):**

```bash
docker run -it \
    --net=host \
    --add-host=host.docker.internal:host-gateway \
    -v "$(pwd)":/workspace \
    -w /workspace \
    qwen-coder-sandbox
```

---

For full documentation on features, configuration, and usage, please refer to the [original README at v0.21.10](https://github.com/QwenLM/qwen-code/blob/v0.21.10/README.md).
