# QWEN-CODE

> This README replaces the original one to document this fork specifically.
> For full documentation on features, configuration, and usage refer to the
> [original README at v0.10.6](https://github.com/QwenLM/qwen-code/blob/v0.10.6/README.md).

---

## What is this?

This is a fork of [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code) with all telemetry removed.
No data is sent to external servers during usage.

---

## Installation

### Option 1 — Install script (local, no root required)

Installs Node.js via NVM and Qwen Code into your home directory.
Safe to use inside ephemeral Docker containers.

```bash
curl -fsSL https://raw.githubusercontent.com/undici77/qwen-code-no-telemetry/v0.10.6-no-telemetry/install.sh \
    | bash -s v0.10.6-no-telemetry
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

When a new upstream version is released:

1. Apply the no-telemetry patch to the new tag:

```bash
git fetch upstream --tags
git checkout v0.10.6-no-telemetry
./apply-no-telemetry.sh v0.10.6
```

---

## LM Studio Configuration

To use Qwen Code with a local model served by [LM Studio](https://lmstudio.ai/):

1. Start LM Studio and load your model (e.g. `qwen3-coder-30b`)
2. Enable the local server in LM Studio (default port: `1234`)
3. Create or edit `~/.qwen/settings.json`:

```json
{
  "modelProviders": {
    "anthropic": [
      {
        "id": "qwen/qwen3-coder-30b",
        "name": "qwen/qwen3-coder-30b",
        "baseUrl": "http://host.docker.internal:1234",
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
      "selectedType": "anthropic"
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

