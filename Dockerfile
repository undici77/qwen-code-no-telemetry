# Build stage
# Digest-pinned: integration_docker builds on the shared ECS pool, whose
# docker daemon image store persists across jobs — a co-resident job can
# retag a mutable base tag with a poisoned image, but a digest cannot be
# moved by `docker tag`. Bump the digest together with the tag.
# ratchet:docker.io/library/node:22-slim
FROM docker.io/library/node:22-slim@sha256:83f487e0a63425e5b4d146fb5e5be574bcbe1b7b843d3ebafdd95eaf7767a7e5 AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 \
  make \
  g++ \
  gcc \
  cmake \
  ninja-build \
  pkg-config \
  gdb \
  git \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Set up npm global package folder
RUN mkdir -p /usr/local/share/npm-global
ENV NPM_CONFIG_PREFIX=/usr/local/share/npm-global
ENV PATH=$PATH:/usr/local/share/npm-global/bin

# Copy source code
COPY . /home/node/app
WORKDIR /home/node/app

# Install dependencies, build workspaces, bundle into a single distributable, and pack.
# QWEN_SKIP_PREPARE=1 stops npm ci's prepare script from building and bundling —
# the explicit build and bundle steps below already do that.
RUN QWEN_SKIP_PREPARE=1 npm ci \
  && npm run build \
  && npm run bundle \
  && npm run prepare:package \
  && cd dist && npm pack

# Runtime stage
# Digest-pinned for the same reason as the builder stage above.
# ratchet:docker.io/library/node:22-slim
FROM docker.io/library/node:22-slim@sha256:83f487e0a63425e5b4d146fb5e5be574bcbe1b7b843d3ebafdd95eaf7767a7e5

ARG QWEN_REF="v0.23.0-no-telemetry"
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

# Build and install qwen-code directly from GitHub.
# patch-package (required by the package's postinstall script, e.g. for
# ink+7.1.1.patch) must be on PATH before the global install, since the
# postinstall runs in a fresh context where node_modules/.bin isn't on PATH.
RUN cd /tmp \
    && npm install -g patch-package --no-audit --no-fund \
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
