---
paths:
  - "packages/core/src/tools/*web-search*.ts"
  - "packages/core/src/config/config.ts"
  - ".gitattributes"
  - "scripts/check-merge-drivers*"
  - "scripts/check-context-docs.js"
description: No-telemetry fork §1.5 — web_search stays SerpApi-backed; the merge=ours seam
---

### WebSearch / SerpApi (§1.5)

The built-in `web_search` tool MUST remain backed by SerpApi, NOT DashScope/Google/GLM/Tavily. `tools/serpapi-web-search.ts` is **fork-owned** and holds the entire backend, so upstream can never conflict with it; `tools/web-search.ts` is a ~5-line `merge=ours` re-export under the names upstream's consumers import, so upstream's registration block in `config/config.ts` runs against the SerpApi backend with **zero fork edits**. Enablement follows upstream's **opt-out** shape: with no SerpApi key and `enabled` unset the gate returns `ok: false, silent: true`, so the tool stays off with no startup notice (`enabled: true` with no key is the one case that does nag). Upstream's DashScope settings keys stay in the schema and resolver, accepted and **inert** — no backend exists to turn them into a request, and deleting them re-opens a conflict in three files for no privacy gain.

**Traps:** `merge=ours` is not a built-in git merge driver — it must be registered in `.git/config` (git does not clone it); `npm install` registers it, and if a web-search file ever conflicts _that_ is the cause — fix the driver, do not hand-port. And `merge=ours` discards upstream **silently** — after every merge run `git log --oneline <prev>..<new> -- packages/core/src/tools/web-search.ts` and decide what is worth porting.

**Never add a `dashscope` word-gate** — `check:context` fails it. The word stays in the tree on purpose: inert keys, the seam comment and the tests that prove those keys cannot produce a request all name it, so "fixing" a hit deletes the conflict-reduction strategy itself. The invariant is **host selection inside the search path**, not a word or a directory.
