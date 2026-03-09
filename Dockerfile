FROM docker.io/library/node:20-slim

ARG QWEN_REF="v0.12.0-no-telemetry"
ARG REPO_URL="https://github.com/undici77/qwen-code-no-telemetry"

ENV QWEN_REF=${QWEN_REF}

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    man-db \
    curl \
    dnsutils \
    less \
    jq \
    bc \
    gh \
    git \
    unzip \
    rsync \
    ripgrep \
    procps \
    psmisc \
    lsof \
    socat \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set up npm global package folder
RUN mkdir -p /usr/local/share/npm-global
ENV NPM_CONFIG_PREFIX=/usr/local/share/npm-global
ENV PATH=$PATH:/usr/local/share/npm-global/bin

# Build and install qwen-code directly from GitHub
RUN cd /tmp \
    && npm pack "${REPO_URL}#${QWEN_REF}" \
    && npm install -g /tmp/qwen-code-*.tgz \
    && npm cache clean --force \
    && rm -f /tmp/qwen-code-*.tgz

# Create default settings.json for LM Studio
RUN mkdir -p /root/.qwen && cat > /root/.qwen/settings.json << 'SETTINGS'
{
  "general": {
    "enableAutoUpdate": false
  },
  "modelProviders": {
    "openai": [
    {
        "id": "qwen/qwen3-coder-30b",
        "name": "qwen/qwen3-coder-30b",
        "baseUrl": "http://host.docker.internal:1234/v1",
        "description": "Qwen3-Coder-30b via LM STUDIO",
        "envKey": "DASHSCOPE_API_KEY",
        "generationConfig": {
          "timeout": 600000,
          "maxRetries": 3,
          "extra_body": {
            "stream": true
          }
        }
      },
      {
        "id": "qwen/qwen3-coder-next",
        "name": "qwen/qwen3-coder-next",
        "baseUrl": "http://host.docker.internal:1234/v1",
        "description": "Qwen3-Coder-Next via LM STUDIO",
        "envKey": "DASHSCOPE_API_KEY",
        "generationConfig": {
          "timeout": 600000,
          "maxRetries": 3,
          "extra_body": {
            "stream": true
          }
        }
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
    "name": "qwen/qwen3-coder-30b"
  },
  "$version": 3
}
SETTINGS

CMD ["qwen"]
