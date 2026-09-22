---
paths:
  - "package.json"
  - "Dockerfile"
  - "install.sh"
  - "install.ps1"
  - "README.md"
description: Fork versioning and release rules — the -no-telemetry suffix and the Single-Merge Strategy
---

## Versioning & Release

- **Version rule**: `package.json` `"version"` is the single source of truth. On release, update: **Dockerfile** (`ARG QWEN_REF="v[version]-no-telemetry"`), **install.sh** + **install.ps1** (all example version references), **README.md** (install script URLs + original README link). The `-no-telemetry` suffix is always the same — never change it.
- **Two-layer versioning**: upstream version stays identical to upstream `main` (dependency resolution); the `-no-telemetry` suffix identifies the privacy fork.
- **Single-Merge Strategy** (single release commit, `main` stays aligned): `git reset --hard [LAST_TAG]` → `git merge --no-ff main -m "feat: release [VERSION]"` → resolve/neutralize → `git commit --amend`. Avoid `reset --soft` afterwards — it breaks the history link to `main`. See NTG §5.
