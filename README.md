# QWEN-CODE

> This README replaces the original one to document this fork specifically.
> For full documentation on features, configuration, and usage refer to the
> [original README at v0.12.3](https://github.com/QwenLM/qwen-code/blob/v0.12.3/README.md).

---

## What is this?

This is a fork of [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code) with all telemetry removed.
No data is sent to external servers during usage.

---

## Privacy & Telemetry Policy

### The Evolution of No-Telemetry
*   **Until v0.12.1-no-telemetry**: The policy was to **delete all telemetry-related files**. While effective for privacy, this made it difficult to maintain the fork and align it with upstream updates.
*   **From v0.12.3-no-telemetry onwards**: We have switched to a "privacy-first" dummy implementation. We now remove all `@opentelemetry/*` packages and replace the telemetry logic with an **empty/dummy layer**. This keeps the application code untouched and easy to merge, while ensuring maximum privacy.

### Privacy Analysis
The current implementation provides a high level of security:
*   **Zero External Tracking**: All OpenTelemetry dependencies are gone.
*   **Neutralized Core**: The `InstallationManager` returns a static non-unique ID, and all network-bound loggers are replaced with no-op functions.
*   **Local Only**: Data is only saved for local session history and hierarchical memory, as required for the application's core functionality.

### Development Experience
This transition has been an insightful experience, proving how advanced AI models like **Claude Sonnet 4.6** can be exceptionally "strong" in maintaining, merging, and aligning different complex codebases. We have chosen this "easy but secure" path to ensure Qwen Code remains both up-to-date and private.

---

## Installation

### Option 1 — Install script (local, no root required)

Installs Node.js via NVM and Qwen Code into your home directory.
Safe to use inside ephemeral Docker containers.

```bash
curl -fsSL https://raw.githubusercontent.com/undici77/qwen-code-no-telemetry/v0.12.3-no-telemetry/install.sh \
    | bash -s v0.12.3-no-telemetry
```

After installation, add this to your `~/.bashrc` if not already present:

```bash
export NVM_DIR="${HOME}/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20 >/dev/null 2>&1
export PATH="${HOME}/.npm-global/bin:$PATH"
```

Then run:

```bash
source ~/.bashrc
qwen
```

---

### Option 2 — Docker

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

## Updating

When a new upstream version is released, the "no-telemetry" dummy layer and configuration must be applied to the new tag.

---

## LM Studio Configuration

To use Qwen Code with a local model served by [LM Studio](https://lmstudio.ai/):

1. Start LM Studio and load your model (e.g. `qwen3-coder-30b`)
2. Enable the local server in LM Studio (default port: `1234`)
3. Create or edit `~/.qwen/settings.json`:

```json
{
  "modelProviders": {
    "openai": [
      {
        "id": "qwen/qwen3-coder-30b",
        "name": "qwen/qwen3-coder-30b",
        "baseUrl": "http://host.docker.internal:1234/v1",
        "description": "Qwen3-Coder via LM STUDIO",
        "envKey": "DASHSCOPE_API_KEY"
      }
    ]
  },
  "env": {
    "DASHSCOPE_API_KEY": "none"
  },
  "security": {
    "auth": {
      "selectedType": "openai"
    }
  },
  "model": {
    "name": "qwen3-coder-30b"
  },
  "$version": 3
}
```

> **Note:** `host.docker.internal` resolves to your host machine from inside the container.
> If running outside Docker, replace it with `localhost` or `127.0.0.1`.

The `DASHSCOPE_API_KEY` is set to `"none"` because LM Studio does not require authentication.

---

## License

Same as the original project. See [LICENSE](LICENSE).

