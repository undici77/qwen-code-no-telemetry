# AGENTS.md

This file provides guidance to Qwen Code when working with code in this repository.

This is a **no-telemetry fork** of [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code), designed for maximum privacy while maintaining compatibility with upstream changes.

## Common Commands

- `npm install` - Install all dependencies
- `npm run build` - Build all packages (TypeScript compilation + asset copying)
- `npm run build:all` - Build everything including sandbox container
- `npm run bundle` - Bundle dist/ into a single dist/cli.js via esbuild (requires build first)
- `npm start` - Start the Qwen Code CLI from source
- `npm run dev` - Development mode (watch for changes)
- `npm run preflight` - Full check: clean → install → format → lint → build → typecheck → test

## Key Characteristics

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

### Versioning Strategy

**Two-Layer Version Management:**

| Layer                                     | Purpose                                      | How to Handle                                            |
| ----------------------------------------- | -------------------------------------------- | -------------------------------------------------------- |
| **Upstream version** (e.g., `0.14.3`)     | Package compatibility, dependency resolution | **Keep identical** to upstream `main` to avoid conflicts |
| **No-telemetry suffix** (`-no-telemetry`) | Identify privacy fork                        | **Always append** to indicate no-telemetry policy        |

**Conflict Resolution Priority:**

When merging from `main`, conflicts may arise due to:

- `@opentelemetry/*` packages (dependencies or imports)
- Metrics/analytics/tracking code
- Installation ID generation

**RULE: No-telemetry policy ALWAYS takes priority. If there's a conflict, REMOVAL is mandatory.**

- ❌ **DO NOT** keep telemetry packages "just to match versions"
- ✅ **ALWAYS** remove/replace with no-op implementations
- ✅ Version strings in `package.json` must match upstream (e.g., `"version": "0.14.3"`), but the no-telemetry policy overrides any telemetry-related code

---

### Release Process: Updating Version References

When releasing a new version (e.g., bumping from `v0.14.5-no-telemetry` to `v0.15.1-no-telemetry`), update **ALL** references across the codebase:

| File                                         | What to Update                              |
| -------------------------------------------- | ------------------------------------------- |
| `Dockerfile`                                 | `ARG QWEN_REF="v[version]-no-telemetry"`    |
| All `.md` files                              | Any `[old-version]-no-telemetry` references |
| `install.sh`, `build.sh`, `local-install.sh` | Any hardcoded version references            |
| CI/CD configuration files                    | Version tags and refs                       |

**Search command to find all occurrences:**

```bash
grep -r "v[old-version]-no-telemetry" --exclude-dir=node_modules .
```

**Important:** The `package.json` version field should match upstream exactly (e.g., `"0.14.3"`), without `-no-telemetry`. The suffix is only for UI display and branch naming.

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

## Unit Testing

Tests must be run from within the specific package directory, not the project root.

**Run individual test files** (always preferred):

```bash
cd packages/core && npx vitest run src/path/to/file.test.ts
cd packages/cli && npx vitest run src/path/to/file.test.ts
```

**Update snapshots:**

```bash
cd packages/cli && npx vitest run src/path/to/file.test.ts --update
```

### Integration Testing

Build the bundle first: `npm run build && npm run bundle`

Run from the project root using the dedicated npm scripts:

```bash
npm run test:integration:cli:sandbox:none
npm run test:integration:interactive:sandbox:none
```

---

## Code Conventions

- **Module system**: ESM throughout (`"type": "module"` in all packages)
- **TypeScript**: Strict mode with `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `verbatimModuleSyntax`
- **Formatting**: Prettier — single quotes, semicolons, trailing commas, 2-space indent, 80-char width
- **Linting**: No `any` types, consistent type imports, no relative imports between packages
- **Tests**: Collocated with source (`file.test.ts` next to `file.ts`), vitest framework
- **Commits**: Conventional Commits (e.g., `feat(cli): Add --json flag`)
- **Node.js**: Development requires `~20.19.0`; production requires `>=20`

---

## Testing, Debugging, and Bug Fixes

- **Bug reproduction & verification**: spawn the `test-engineer` agent. It reads code and docs to understand the bug, then reproduces it via E2E testing (or a test-script fallback). It also handles post-fix verification. It cannot edit source code — only observe and report.
- **Hard bugs**: use the `structured-debugging` skill when debugging requires more than a quick glance — especially when the first attempt at a fix didn't work or the behavior seems impossible.
- **E2E testing**: the `e2e-testing` skill covers headless mode, interactive (tmux) mode, MCP server testing, and API traffic inspection. The `test-engineer` agent invokes this skill internally — you typically don't need to use it directly.

---

_This QWEN.md was updated to maintain no-telemetry guidelines while aligning with upstream changes._
