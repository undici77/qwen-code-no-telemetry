# Fork patches: web search, vision bridge, artifact lockdown

The SerpApi `web_search` seam, the vision-bridge concurrency gate and the artifact remote-upload lockdown. Part of [NO_TELEMETRY_GUIDELINES.md](../NO_TELEMETRY_GUIDELINES.md): section numbers are global and cited from source comments, so never renumber.

---

## 1.5. MANDATORY: WebSearch/SerpApi Patch (Non-Negotiable)

The built-in `web_search` tool **MUST** remain backed by [SerpApi](https://serpapi.com), NOT by DashScope/Google/GLM/Tavily or any other upstream provider. This is a **mandatory, non-removable patch** that applies to every merge and every release.

**Why**: The upstream WebSearch tool historically used DashScope Responses API, which routes through external servers and violates the no-telemetry policy. SerpApi is a neutral, privacy-respecting search aggregator with a free tier (250 queries/month) and no identity leakage.

### How the patch is structured (read this before a merge)

Upstream's `web-search.ts` is a large, actively-changed DashScope implementation (1400+ lines; 4 commits in the two months before v0.23.2). The fork used to carry its SerpApi backend as a whole-file replacement of that file, so **every** upstream change opened an ~800-line semantic conflict. The patch is split so that conflict is structurally impossible:

|File|Owner|Merge rule|Role|
|---|---|---|---|
|`packages/core/src/tools/serpapi-web-search.ts`|**fork**|new file|The whole SerpApi backend: gate, fetch, Markdown conversion, tool class. Upstream never creates it.|
|`packages/core/src/tools/serpapi-web-search.test.ts`|**fork**|new file|The executable §1.5 guarantee (below).|
|`packages/core/src/tools/web-search.ts`|**fork**|`merge=ours`|~5-line re-export of the module above, under the names upstream's consumers import.|
|`packages/core/src/tools/web-search.test.ts`|**fork**|`merge=ours`|Shim guard — fails if the seam is ever resolved toward upstream.|
|`docs/developers/tools/web-search.md`|**fork**|`merge=ours`|Fork documentation.|
|`packages/core/src/config/config.ts` (`webSearch` field docstring)|mixed|small additive hunk|Fork comment marks SerpApi the only backend and upstream's keys inert. Comment only — no behaviour change, but NOT byte-identical to upstream.|
|`packages/cli/src/config/config.ts` (`resolveWebSearchSettings`)|mixed|small additive hunk|Upstream body preserved; four SerpApi keys appended, tagged.|
|`packages/cli/src/config/settingsSchema.ts` (`webSearch` block)|mixed|small additive hunk|Upstream keys kept so the block stays upstream-shaped; descriptions are fork-owned.|

**Upstream's DashScope keys are accepted and inert.** `model`, `webExtractor`, `baseUrl` and `apiKeyEnv` stay in the schema and the resolver because deleting them would re-open a conflict in three files for no privacy gain — the fork has no DashScope backend, so no code path can turn those values into a request. They are documented as ignored in `settingsSchema.ts`, `settings.schema.json` and the tool docs.

**Enablement follows upstream's opt-out shape.** The tool registers whenever `evaluateWebSearchGate` resolves a SerpApi API key (`tools.webSearch.apiKey` or `SERPAPI_API_KEY`) and `enabled !== false`. With nothing configured the gate returns `silent: true`, so the tool stays off with no startup notice. That is what lets upstream's registration _call sites_ survive untouched — the fork adds tagged keys inside the resolver and a tagged comment on the `webSearch` field, but never rewrites the registration itself. No `config.ts` is byte-identical to upstream; the hunks are additive and tagged, which is what makes them cheap to re-apply and easy to spot.

`merge=ours` is **not** a built-in git merge driver — it must be registered in `.git/config`, which git does not clone. `npm install` registers it (`postinstall` → `node scripts/check-merge-drivers.js --fix`); `npm run check:merge-drivers` fails if the `.gitattributes` declaration and the registration drift apart.

### Verification checklist after every merge

The guarantee is now enforced by tests, not by grep. `src/tools/web-search.test.ts` is **no longer excluded** in `packages/core/vitest.config.ts` — it used to be, which left the mandatory patch with zero coverage while upstream's DashScope suite sat against a SerpApi implementation.

```bash
# 1. Executable guarantee: intercepts every outbound request and asserts the
#    host is serpapi.com — including when the config carries upstream's
#    DashScope model / baseUrl / apiKeyEnv values.
cd packages/core && npx vitest run src/tools/serpapi-web-search.test.ts src/tools/web-search.test.ts

# 2. SerpApi must be the only host the search path can contact. The word
#    "DashScope" stays in the tree ON PURPOSE — inert settings keys, the seam
#    comment, and the tests that prove those keys cannot produce a request all
#    name it. Grepping for the word matches the conflict-reduction strategy
#    itself, and "fixing" a hit means deleting inert upstream code, which
#    re-opens the ~800-line conflict the seam exists to prevent.
grep -n "https://" packages/core/src/tools/serpapi-web-search.ts
# Only the request template `https://serpapi.com/search` (a hardcoded URL whose
# only parameters are q/engine/hl/gl/api_key, so no setting can supply a host)
# and the `example.com` attribution text in the tool description may appear.

# 3. The seam must still point at the fork backend.
grep -n "serpapi-web-search" packages/core/src/tools/web-search.ts
# Must return the re-export line.

# 4. Merge drivers declared in .gitattributes must be registered.
npm run check:merge-drivers
```

**Conflict resolution priority**: if upstream WebSearch code ever conflicts with the SerpApi patch, **always resolve in favor of SerpApi** and document the resolution in the commit message. Because the seams are `merge=ours`, a conflict here means the driver was never registered — fix the driver (`git config --local merge.ours.driver true`) rather than hand-porting code.

**Merge reporting**: `merge=ours` discards upstream's changes silently, so list what was discarded after every merge and decide whether any of it is a generic fix worth porting:

```bash
git log --oneline <previous-upstream>..<new-upstream> -- packages/core/src/tools/web-search.ts
```

---

## 1.6. MANDATORY: Vision-Bridge Image Concurrency Patch (Non-Negotiable)

The vision bridge (`packages/core/src/services/visionBridge/vision-bridge-service.ts`) **MUST NEVER** permanently reject an image because of how many images were requested in one turn. It **MUST** only throttle how many bridge calls run _concurrently_ (capped at `VISION_BRIDGE_MAX_IMAGES`, currently 4), queuing the rest until a slot frees up. Every valid image is eventually converted — none are dropped.

**Why**: Upstream/legacy code tracked a per-turn `WeakMap` (`turnImageCounts`) and permanently failed any image past the 4th in a turn with `"image conversion budget was exhausted"`. With a text-only primary model + local vision-bridge model, asking about e.g. 9 images in one turn silently dropped 5 of them — the primary model was told those images were "unavailable," even though the bridge model could process them fine. This is a **user-data-loss bug**, not a resource-safety feature: a real per-image-count cap discards user data for no technical reason. The correct safety mechanism is a **concurrency gate**, not a **rejection cap** — it protects a shared local model server from being hit by too many simultaneous requests without ever losing an image.

**Rule**: On every merge from `main`, if upstream reintroduces a per-turn/per-image-count rejection cap in the vision bridge (a `WeakMap`/counter that fails images past some N), **replace it with the concurrency-gate pattern** (`tryAcquireBridgeSlotSync` / `waitForBridgeSlot` / `releaseBridgeSlot` in `vision-bridge-service.ts`). Never accept a design where the Nth+1 image in a turn returns `status: 'failed'` due to volume alone.

**Verification checklist after every merge**:

```bash
# Must return zero lines — no rejection cap tracking has crept back in
grep -n "turnImageCounts\|budget was exhausted" packages/core/src/services/visionBridge/vision-bridge-service.ts
# Must reference the concurrency gate
grep -n "tryAcquireBridgeSlotSync\|waitForBridgeSlot\|releaseBridgeSlot" packages/core/src/services/visionBridge/vision-bridge-service.ts | head -5
```

**Conflict resolution priority**: If upstream vision-bridge code conflicts with this patch, **always resolve in favor of the concurrency gate** (throttle, never reject on count). Document the resolution in the commit message.

---

## 1.7. MANDATORY: Artifact Remote-Upload Lockdown (Non-Negotiable)

Remote artifact publishing **MUST** be hard-locked off, and artifact publishing **MUST** always require a human confirmation — even under `yolo` and `auto_edit`. This is a **mandatory, non-removable patch** that applies to every merge and every release.

**Why**: upstream does the obvious thing right — `ArtifactTool.getDefaultPermission()` returns `'ask'`, and the confirmation text names the remote host. That `'ask'` is then **silently discarded** by two upstream approval-mode overrides in `packages/core/src/core/permissionFlow.ts`:

```ts
// needsConfirmation(): YOLO auto-approves everything except ask_user_question
if (approvalMode === ApprovalMode.YOLO && !isAskUserQuestionTool) return false;

// isAutoEditApproved(): AUTO_EDIT auto-approves any 'info' confirmation
return (
  approvalMode === ApprovalMode.AUTO_EDIT &&
  (confirmationDetails?.type === 'edit' || confirmationDetails?.type === 'info')
);
```

`ArtifactTool`'s confirmation is `type: 'info'`, so **both** modes skip the prompt. Combined with `artifact.publisher` set to `oss` or `host`, the model picks an absolute `file_path`, reads up to 16 MB, and uploads it with **no prompt at all** — repeatable, file by file, across a whole codebase. `host` is worse still: it runs the configured `uploadCommand` as a subprocess. This is not an upstream bug and not sabotage; it is a gap between two independently reasonable mechanisms. `auto_edit` is the dangerous one precisely because it does not sound alarming.

**What was already safe**: the publisher default is `local` at both layers, so with no explicit `artifact.publisher` there is no egress even under YOLO — it writes a local file. And headless `-p` plus background agents **fail closed** (`'ask'` becomes deny when nobody can prompt). The patch closes the remaining window: remote armed **and** an auto-approving mode.

### How the patch is structured (read this before a merge)

|File|Owner|Merge rule|Role|
|---|---|---|---|
|`packages/core/src/tools/artifact/no-remote-publish.ts`|**fork**|new file|All lockdown logic. Upstream never creates this path, so it can never conflict.|
|`packages/core/src/tools/artifact/no-remote-publish.test.ts`|**fork**|new file|The executable §1.7 guarantee (below).|
|`packages/core/src/tools/artifact/create-publisher.ts`|mixed|small additive hunk|One tagged call wrapping the kind before upstream's `switch`. The `host`/`oss` branches stay in the file and stay type-valid, just unreachable.|
|`packages/core/src/tools/artifact/artifact-tool.ts`|mixed|small additive hunk|Tagged `requiresUserInteraction()` override — the existing upstream lever (same one `exitPlanMode` uses) that forces `'ask'` past YOLO and AUTO_EDIT.|
|`packages/core/src/tools/artifact/create-publisher.test.ts`|mixed|small additive hunk|Upstream asserted `HostPublisher`/`OssPublisher`; retagged to assert the collapse to `LocalPublisher`.|
|`packages/cli/src/config/settingsSchema.ts` (`artifact.publisher`)|mixed|description text only|`'host'`/`'oss'` stay in the enum so the block keeps upstream's shape; the description says they are accepted and ignored. Keys are **not** deleted. Regenerate the vscode schema copy after editing.|

**No escape hatch, by design.** There is deliberately no env var or settings key that re-arms remote publishing. Re-enabling it means editing `no-remote-publish.ts`, so the decision is always visible in a diff. Do not add a bypass "for convenience".

**Unknown kinds must still throw.** The guard collapses only `'host'` and `'oss'`. An unrecognised kind passes through so upstream's `default` branch keeps failing loudly instead of a typo silently becoming `'local'`.

### Verification checklist after every merge

```bash
# 1. Executable guarantee: a fully armed hostile config (real upload command,
#    real bucket+endpoint) still yields LocalPublisher, and the prompt cannot
#    be silenced by YOLO or AUTO_EDIT.
cd packages/core && npx vitest run src/tools/artifact/

# 2. Both hooks must still be present and tagged.
grep -n "enforceNoRemoteArtifactPublisher" packages/core/src/tools/artifact/create-publisher.ts
grep -n "requiresUserInteraction" packages/core/src/tools/artifact/artifact-tool.ts
# Each must return a hit. If either disappears, the lockdown is gone.

# 3. No remote publisher may be constructed anywhere but the unreachable branches.
git grep -n "new OssPublisher\|new HostPublisher" -- 'packages/*/src/**' ':!*.test.ts'
# Must return EXACTLY two lines, both in create-publisher.ts: the `case 'host':`
# and `case 'oss':` branches. Those branches stay in the file on purpose (see the
# table above) and are unreachable because enforceNoRemoteArtifactPublisher() has
# already collapsed the kind to 'local'. A hit in ANY other file is a real leak
# path. Do not delete these two branches to force a zero count — that breaks the
# `never` exhaustiveness check on the default case and re-opens the upstream
# conflict for no privacy gain.

# 4. The approval-mode hole must still be the shape this patch assumes. If
#    upstream ever narrows YOLO or the 'info' auto-approve, re-read this
#    section — the patch may become redundant, which is fine, but the test
#    that pins the hole will fail and must be re-evaluated, not deleted.
grep -n "ApprovalMode.YOLO\|type === 'info'" packages/core/src/core/permissionFlow.ts
```

**Runtime proof** (once per release, method in §17): set `artifact.publisher` to `"oss"` with a real bucket and endpoint, then publish under `--approval-mode=yolo` while tracing sockets. Expect a `file://` result, a debug line saying the publisher was disabled, and **zero** non-provider connects.

**Conflict resolution priority**: if upstream changes conflict with this patch, **always resolve in favor of the lockdown** (local-only + always-confirm) and document the resolution in the commit message. If upstream adds a _new_ publisher backend, add it to the collapse list in `no-remote-publish.ts` — a backend not in that list is an open egress path.

---
