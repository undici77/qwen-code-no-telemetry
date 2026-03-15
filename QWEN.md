# Qwen Code - Developer Memory

## Project Overview

This is a **no-telemetry fork** of [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code) v0.12.3, designed for maximum privacy while maintaining compatibility with upstream changes.

### Key Characteristics

- **Privacy-first**: All telemetry and tracking have been removed/replaced with no-op implementations
- **Monorepo structure**: Uses npm workspaces with multiple packages (`cli`, `core`, `sdk-*`, etc.)
- **Tech stack**: TypeScript, React (for TUI with Ink), Node.js >= 20
- **Architecture**: CLI application with MCP (Model Context Protocol) server management and extension system

### No-Telemetry Implementation Strategy

Instead of deleting telemetry files (which made merging difficult), this fork uses a **dummy layer approach**:

1. All `@opentelemetry/*` packages removed from dependencies
2. Telemetry exports in `packages/core/src/telemetry/` replaced with no-op functions
3. `InstallationManager.getInstallationId()` returns static UUID: `00000000-0000-0000-0000-000000000000`
4. Usage statistics and auto-updates disabled by default

This keeps the application codebase aligned with upstream while ensuring zero external data leakage.

---

## Project Structure

```
/workspace/
├── packages/                    # Monorepo workspaces
│   ├── cli/                     # Command-line interface (main entry point)
│   ├── core/                    # Core backend logic, telemetry dummy layer
│   ├── sdk-java/                # Java SDK for Qwen Code
│   ├── sdk-typescript/          # TypeScript SDK for Qwen Code
│   ├── test-utils/              # Shared testing utilities
│   ├── vscode-ide-companion/    # VS Code extension
│   ├── web-templates/           # Web UI templates
│   ├── webui/                   # Web-based UI component
│   └── zed-extension/           # Zed editor extension
├── docs/                        # Project documentation (source)
├── docs-site/                   # Next.js documentation site
├── integration-tests/           # End-to-end integration tests
├── scripts/                     # Build, test, and development utilities
├── eslint-rules/                # Custom ESLint rules
├── build.sh / install.sh        # Installation scripts
├── Dockerfile                   # Sandbox container definition
└── Makefile                     # Convenience make targets
```

---

## Building and Running

### Prerequisites

- **Node.js**: Use `~20.19.0` for development (specific version due to dependency issues). Any `>=20` for production.
- **npm**: Default package manager (workspaces enabled)

### Setup

```bash
# Install dependencies (including all workspace packages)
npm install

# Build the entire project
npm run build

# Build everything including sandbox container
npm run build:all
```

### Development Commands

| Command                     | Description                                    |
| --------------------------- | ---------------------------------------------- |
| `npm start`                 | Start the Qwen Code CLI from source            |
| `npm run dev`               | Development mode (watch for changes)           |
| `npm run debug`             | Start with debugger attached (`--inspect-brk`) |
| `make start` / `make debug` | Makefile aliases for above                     |

### Testing

```bash
# Run all unit tests across workspaces
npm run test

# Run integration tests (end-to-end)
npm run test:e2e

# Run all integration tests with different sandbox modes
npm run test:integration:all

# Run CI test suite (includes linting checks)
npm run test:ci

# Terminal benchmark tests
npm run test:terminal-bench
npm run test:terminal-bench:oracle
npm run test:terminal-bench:qwen
```

### Code Quality

```bash
# Run all checks (format, lint, tests)
npm run preflight

# Format code with Prettier
npm run format

# Lint TypeScript/TSX files
npm run lint

# Lint with zero warnings (CI mode)
npm run lint:ci

# Type check all packages
npm run typecheck
```

---

## Key Configuration Files

| File                | Purpose                                                             |
| ------------------- | ------------------------------------------------------------------- |
| `package.json`      | Root config, scripts, dependencies, workspace definitions           |
| `tsconfig.json`     | TypeScript compiler options (strict mode, ES2023, NodeNext modules) |
| `eslint.config.js`  | ESLint configuration for the project                                |
| `.eslintrc.json`    | Legacy ESLint config (if exists)                                    |
| `vitest.config.ts`  | Vitest unit test configuration                                      |
| `esbuild.config.js` | Bundle configuration for production                                 |

---

## Development Conventions

### Coding Style

- **TypeScript**: Strict mode enabled, ES2022 target
- **Module system**: ES modules (`"type": "module"` in package.json)
- **JSX**: React JSX transform (no need to import React)
- **Imports**: No relative imports between packages - use absolute paths like `@qwen-code/qwen-code-core`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) standard:

- `feat(cli): Add --json flag to 'config get' command` ✅
- `fix: Resolve issue with telemetry` ✅
- `docs: Update architecture documentation` ✅

### PR Guidelines

1. **Link to existing issue** - All PRs should reference an open issue
2. **Small and focused** - One change per PR
3. **Use Draft PRs** for work-in-progress feedback
4. **All checks must pass** - Run `npm run preflight` before submitting
5. **Update documentation** for user-facing changes

### Testing Practices

- Unit tests in each package's `__tests__/` directory
- Integration tests in `integration-tests/` root
- Tests use Vitest with DOM testing library for TUI components
- Run tests with `npm run test` before committing

---

## Sandboxing

The project supports multiple sandbox modes for secure code execution:

- **Docker** (`QWEN_SANDBOX=docker`)
- **Podman** (`QWEN_SANDBOX=podman`)
- **None/Disabled** (`QWEN_SANDBOX=false` or unset)

To build the sandbox container:

```bash
npm run build:sandbox
# Or include in build:all
npm run build:all
```

Sandbox image URI is configured in root `package.json` as `config.sandboxImageUri`.

---

## Debugging

### VS Code

1. Press `F5` to attach to the CLI
2. Or run `npm run debug` and attach via Chrome DevTools

### React DevTools (for TUI debugging)

```bash
DEV=true npm start
# In another terminal:
npx react-devtools@4.28.5
```

### Debug Mode in Container

```bash
DEBUG=1 qwen-code
```

Note: Use `.qwen-code/.env` for qwen-specific debug settings (`.env` files in projects are excluded).

---

## LM Studio Configuration

To use Qwen Code with a local model via [LM Studio](https://lmstudio.ai/):

1. Start LM Studio and load your model
2. Enable local server (default: port 1234)
3. Edit `~/.qwen/settings.json`:

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

For Docker, use `host.docker.internal` to reach the host machine.

---

## Documentation Development

The documentation site uses Next.js:

```bash
cd docs-site
npm install
npm run link     # Link ../docs to content/
npm run dev      # Start dev server at http://localhost:3000
```

Changes to `docs/` files are immediately reflected.

---

## No-Telemetry Merge Protocol

**CRITICAL**: When merging upstream `main` into this branch:

### DO NOT use `git merge main` directly!

**Correct approach:**

```bash
# 1. Start from current no-telemetry branch
git checkout v0.12.3-no-telemetry
git pull origin v0.12.3-no-telemetry

# 2. Create new branch for changes
git checkout -b v0.12.4-no-telemetry

# 3. Find merge base and cherry-pick commits
MERGE_BASE=$(git merge-base v0.12.3-no-telemetry main)
git log --oneline $MERGE_BASE..main

# 4. Cherry-pick each commit from main
git cherry-pick <commit-hash> || {
  echo "Conflict - resolve manually"
  break
}

# 5. After merge, verify no-telemetry files exist
git diff v0.12.3-no-telemetry..v0.12.4-no-telemetry --name-status
```

### Files that must be preserved:

- `NO_TELEMETRY_GUIDELINES.md`
- `build.sh`, `install.sh`, `local-install.sh`
- Dockerfile (may need special handling)
- Telemetry dummy layer in `packages/core/src/telemetry/`

### Post-Merge Verification:

```bash
# Check version consistency
grep -r "version.*no-telemetry" package.json packages/*/package.json

# Verify no telemetry packages in dependencies
grep -r "@opentelemetry" package.json packages/*/package.json || echo "No OTEL found ✓"

# Build and test
npm run build:packages && npm run lint && npm run test
```

See `NO_TELEMETRY_GUIDELINES.md` for detailed merge strategy.

---

## Important Notes

### Version String Convention

The version displayed in the UI must follow this format:

```
[VERSION]-no-telemetry · ❌📡 · [SHORT GIT HASH]
```

The clean version (for User-Agent headers) must remain ASCII-only.

### Build Scripts

Key scripts in `/scripts/`:

- `build.js` - Main build process
- `build_sandbox.js` - Build Docker sandbox image
- `build_vscode_companion.js` - Build VS Code extension
- `start.js` - CLI entry point
- `dev.js` - Development watch mode

### Workspace Packages

Each package in `/packages/` has its own `package.json` and follows the monorepo pattern. Common package types:

- `cli/` - Main command-line interface
- `core/` - Shared logic and telemetry dummy layer
- `sdk-*` - Language-specific SDKs

---

## Quick Reference Commands

| Task           | Command                                 |
| -------------- | --------------------------------------- |
| Install deps   | `npm install`                           |
| Build          | `npm run build` or `make build`         |
| Run CLI        | `npm start` or `make start`             |
| Run tests      | `npm run test`                          |
| Format code    | `npm run format`                        |
| Lint code      | `npm run lint`                          |
| Full preflight | `npm run preflight` or `make preflight` |
| Debug mode     | `npm run debug`                         |

---

_This QWEN.md was auto-generated based on project analysis. Update as needed for new conventions or project evolution._
