# Egress proof: runtime procedure and tripwire

The runtime-first privacy check, the opt-in egress inventory and `npm run check:egress`. Part of [NO_TELEMETRY_GUIDELINES.md](../NO_TELEMETRY_GUIDELINES.md): section numbers are global and cited from source comments, so never renumber.

---

## 17. Deep Privacy Check — Runtime-First Procedure (Fast Path)

**Prove egress with syscalls, not with greps.** A traced run of the installed CLI settles "does anything leave the device" in about two minutes. A source sweep of `packages/core` takes tens of minutes, has twice killed the subagent running it out of memory, and even when it succeeds it only enumerates what _could_ connect — not what _does_. Do the runtime pass first; use static analysis only to explain a hit or to cover paths the run did not exercise.

Run against the **installed** artifact (`$HOME/.npm-global/bin/qwen`), not `npm start` from source — the installed tree is what the user executes, and it is built through a different pipeline (`local-install.sh` stages, bundles and packs), so a source-only audit can certify bytes that never ship. Reinstall with `bash local-install.sh` first if the global copy is stale (see §5).

### Step 1 — Trace every socket (this is the proof)

```bash
# Baseline: a no-op invocation must open ZERO network sockets.
strace -f -q -e trace=connect -o /tmp/st_version.log qwen --version
# Live session: one cheap prompt, tracing connects AND outbound datagrams.
strace -f -q -e trace=connect,sendto,sendmsg -s 220 -o /tmp/st_live.log \
  qwen -p "Reply with exactly: OK"
```

Then read every destination. **This extraction is the part people get wrong** — see Step 2:

```bash
grep -oE 'connect\(.*' /tmp/st_live.log | head -40
grep -c 'htons(53)' /tmp/st_live.log   # 0 = no DNS left the box
```

**Interpretation table** — what each shape means:

|Observed|Meaning|Verdict|
|---|---|---|
|`AF_INET … :8000` (or your `model.baseUrl` port)|The LLM API call|Expected — this is the only permitted egress|
|`AF_INET … :0`|Routing probe (`connect` with port 0 selects a local address and sends nothing)|Harmless, no bytes leave|
|`AF_UNIX sun_path="/var/run/nscd/socket"`|Local name-service cache lookup|Harmless, never leaves the box|
|`AF_INET6 … :8000`|Same LLM endpoint over IPv6|Expected|
|`htons(53)`|DNS query egress|Investigate — resolver should be container-local|
|Any other host/port|Real egress|Must be named, gated, and user-initiated|

Resolve the endpoint so you do not mistake a local gateway for an internet host — in a container `host.docker.internal` answers with **both** an IPv4 and an IPv6 address, so checking only one family is not enough:

```bash
node -e "require('dns').lookup('host.docker.internal',{all:true},(e,a)=>console.log(e?e.code:a.map(x=>x.address).join(' ')))"
```

Expected clean result: every destination is the configured model endpoint, plus port-0 routing probes and the nscd socket. `qwen --version` should show **no** connects at all — a connect there means a startup ping came back in with a merge.

### Step 2 — The three traps that report a FALSE CLEAN

These all fail _silent_, which is what makes them dangerous:

1. **Grepping only `inet_addr` drops every IPv6 destination.** strace prints IPv4 as `inet_addr("1.2.3.4")` and IPv6 as `inet_pton(AF_INET6, "fd00::1")`; a one-family regex quietly returns "clean" while the whole session ran over IPv6. Match both, plus `sun_path` for `AF_UNIX`.
2. **URL strings in `dist/` are noise, not egress.** The shipped bundle carries thousands of documentation and SDK reference URLs (chat-channel SDKs alone account for thousands of hits). Presence of a host string proves nothing; the invariant is _exercised_ egress. Never report a host as a leak because it appears in `dist/` — this is the same principle as §1.5's no-word-grep rule, applied to hosts. A directory-wide _host_ grep inside `packages/core/src/tools/` is wrong for the same reason: `packages/core/src/tools/artifact/oss-publisher.ts` legitimately names `*.aliyuncs.com` for artifact uploads, an unrelated feature that §1.7 keeps unreachable by default. The real invariant is **host selection inside the search path** — the request URL in `serpapi-web-search.ts` is a hardcoded `https://serpapi.com/search` template whose only parameters are `q`/`engine`/`hl`/`gl`/`api_key`, so no setting can supply a host. Gate on that, not on a word or a directory.
3. **Two different functions share the name `checkForUpdates`.** One is local-only (reads and migrates settings, no network); the other is the npm-registry version check that shells out to `npm view`. Grepping the bare name finds the wrong one and certifies the wrong file. Always follow the import to the definition before judging. The network one is reachable only through a sentinel process exit code produced by an explicit update, never at startup — which the Step 1 trace independently confirms by showing zero registry connects.

### Step 3 — Opt-in egress inventory (start here, do not rediscover)

Every path that can leave the device, and the gate that holds it. All are **off or user-triggered** by default; verify the gate, not the existence of the code.

|Path|Destination|Gate and default|
|---|---|---|
|Model / LLM API|configured `model.baseUrl`|The permitted traffic|
|`web_search`|`serpapi.com`|Requires a resolved SerpApi key; no key ⇒ `ok:false, silent:true`, tool never registers (§1.5)|
|Update check|npm registry|Explicit `/update` only, behind a sentinel relaunch exit code; `enableAutoUpdate` forced `false` (§1.5 in §3, §1)|
|Update download, skill install|GitHub / release hosts|Explicit `/update` or skill-install action|
|GitHub repo metadata, `git fetch`|`api.github.com`, `github.com`|Explicit GitHub-setup and `/review` commands|
|Chat channels (Feishu, Telegram, …)|per-channel hosts|Require user-supplied tokens; unconfigured ⇒ no traffic. v0.27.2 added a WeChat QR login started from Web Shell — an explicit user action, no token needed, no traffic until clicked|
|`session_id` request header|three https Routify hosts|Hardcoded list in `outbound-session-id.ts`; sent to nothing else (tests cover other hosts, `http:` and lookalike hostnames) and the list is pinned by `check:context`. A new host there is a new per-session identifier egress path|
|MCP servers|user-configured URLs|Only servers the user added|
|Artifact publish|`https://<bucket>.<endpoint>/<key>`|Publisher defaults to **`local`**; `oss` needs explicit selection **and** bucket **and** endpoint, endpoint is regex-pinned to `*.aliyuncs.com`; publishing is permission `ask` and the prompt names the host|
|Artifact host publish|whatever the user wrote|Runs the user's own `uploadCommand`|
|live-host install|asset CDN + GitHub releases|Explicit install command|
|Model catalog refresh|`models.dev/api.json`|Upstream fires this from `Config.initializeInternal()`; v0.26.7 added the operator `model.catalogRefresh` switch and coupled the call to `privacy.usageStatisticsEnabled`, which §1 pins to `false`. The fork gates it on `modelCatalogRefreshEnabled && QWEN_CODE_MODELS_DEV_REFRESH=on`, so it never fires automatically and the opt-in still works; the bundled `model-registry.json` serves limits and modalities locally. Found by `check:egress`, not by any grep|
|Web Shell `unpkg.com`|browser, not CLI|Appears only as a CSP `connect-src` allowance; the CLI never fetches it|

Two things to keep flagging rather than "fixing": the OSS publisher's object ACL defaults to **`public-read`**, so an artifact you deliberately publish is world-readable at a predictable key unless you set `acl`; and the artifact tool itself is registered by default, which is safe only because of the publisher-default and `ask` gates above. If either gate moves, that becomes a real leak path.

### Step 4 — Confirm the gates in code (fast, after the trace)

Read the actual default at each assignment; never infer it from a schema description.

```bash
grep -rn "enableAutoUpdate" packages/cli/src/config/settings.ts | grep -v "\.test\."
grep -rn "usageStatisticsEnabled = " packages/core/src/config/config.ts
grep -rn "00000000-0000-0000-0000-000000000000" packages/core/src/config/installationManager.ts
grep -rni "publisher ?? 'local'" packages/cli/src/config/config.ts packages/core/src/config/config.ts
# Must return BOTH files. Case-insensitive on purpose: the two layers spell the
# same default with different identifiers (`settings.artifact?.publisher` in the
# cli resolver, `params.artifactPublisher` in core), so a case- or format-
# sensitive pattern matches one file and looks clean while missing the other.
grep -rn "getDefaultPermission" packages/core/src/tools/artifact/artifact-tool.ts
grep -rn "artifactEnabled ?? true\|omniEnabled ?? false" packages/core/src/config/config.ts
grep -n "refreshModelCatalog" packages/core/src/config/config.ts
# Must show the call inside a guard that still requires
# `MODEL_CATALOG_REFRESH_ENV === 'on'` (v0.26.7 wraps it in
# `modelCatalogRefreshEnabled &&` — keep both terms).
# A bare `void refreshModelCatalog();` means upstream's opt-out default returned —
# that is automatic models.dev egress on every startup, and `check:egress` reports
# it as LEAK. No grep in this document catches it; only the tripwire does.
```

Then prove the telemetry layer is inert **structurally**, not by vocabulary — the durable argument is that no exporter exists to send anything, so a retained `otlp*Endpoint` key is harmless:

```bash
grep -n "sdk-impl" packages/core/src/telemetry/sdk.ts            # zero: never imported
grep -n "startTelemetrySdk" packages/core/src/telemetry/sdk-impl.ts  # stub, resolves sdk: undefined
grep -c "uiTelemetryService" packages/core/src/telemetry/loggers.ts  # local-only sinks; names: §11's awk (6)
```

And certify the shipped bytes, remembering `dist/cli.js` is a thin entry (§3 step 4 note) — grep the tree:

```bash
grep -rl "@opentelemetry/" "$HOME/.npm-global/lib/node_modules/@qwen-code/qwen-code/dist/"   # empty
grep -rho "0\.[0-9]*\.[0-9]*-no-telemetry[^\"'\`]*" "$HOME/.npm-global/lib/node_modules/@qwen-code/qwen-code/dist/" | sort -u
```

The version string there embeds the build-time HEAD hash, so it doubles as proof of _which_ commit was installed.

### Step 5 — If you delegate, scope narrowly

Broad "very thorough" whole-repo sweeps have killed subagents here with host GPU out-of-memory, twice, after 13–32 tool calls and 250k–360k tokens each. Concurrency multiplies it: do not run two big agents plus a live traced session at once. Give each agent a short list of directories, a bounded question, and a word limit on the answer.

### What this still does not prove

Say so explicitly when reporting:

- **Unexercised paths.** A trace certifies only the code that ran. `qwen serve`, Web Shell, chat channels, `/update`, `/review`, extension install and computer use need their own traced runs, or they rest on static gates alone.
- **Prompt content.** The permitted LLM call still carries the prompt and any file context out of the process. A local endpoint keeps it on the machine; it is not the same as never leaving the process.
- **Native binaries and dependencies.** Tracing `qwen` covers the Node process tree it spawns, not arbitrary native helpers reached by another route.
- **DNS of inert URL strings.** Thousands of documented hosts are never contacted; this method does not prove each one unreachable, only that no socket was opened to any of them during the traced runs.

---

## 18. MANDATORY: Egress Tripwire at Every Release (Non-Negotiable)

`npm run check:egress` **MUST** pass, with no `LEAK` rows, before any release is cut. It is the only check in this document that observes the running binary instead of its source, and therefore the only one that catches an arbitrary new egress path — including one introduced by an upstream merge, a new dependency, or code that never touches any subsystem the other gates watch.

**Why this exists when §1–§17 exist.** Every other check inspects source or shipped bytes, so each proves only what the code _says_ it does. A grep cannot see a leak that a refactor assembled at runtime. This gate watches every way out of Node — `net`/`tls`/`http`/`https` sockets, `fetch`, `dgram`, `WebSocket`, DNS resolution, and `child_process` spawns (a `curl` or `git` subprocess bypasses the entire Node stack, so its argv is inspected instead; an interpreter that opens its own sockets is verdicted `BLIND`, never `ok`).

### Run it

```bash
npm run check:egress                              # fast scenario, ~45s
node scripts/check-egress.mjs --cli=<path>       # trace a specific entry
```

It runs four scenarios — `--version` (which must open **zero** sockets), a headless session that makes the model call a tool, `web_search` with a key, and an artifact publish with `oss` armed under `yolo` — then prints every destination it saw. Exit `0` = clean, `1` = leak found **or an unacknowledged `BLIND` child**, `2` = the detector itself is broken **or the session never completed a model round-trip**.

**Read the `entry :` line back before believing the verdict.** `resolveCli` prefers an explicit `--cli`, then `$QWEN_CODE_CLI`, then the repo entry — and `QWEN_CODE_CLI` is stamped by every live `qwen` session to point at the CLI running it. So `npm run check:egress` from inside a session traces the **installed release**, not the tree being released: confirmed at v0.27.2, where the documented command printed `/root/.npm-global/.../scripts/cli-entry.js` while the checkout was newer. The verdict is then about a different artifact. To certify the tree, unset the inherited session environment and check the line names the repo:

```bash
SCRUB=$(env | grep -oE '^[A-Z0-9_]*QWEN[A-Z0-9_]*' | sed 's/^/-u /')
env -u FORCE_COLOR -u COLORTERM $SCRUB npm run check:egress   # entry : <repo>/scripts/cli-entry.js
```

The same scrub applies to every test suite run from inside a session (`QWEN_MEMORY_APPEND_ONLY=1` and `FORCE_COLOR` manufacture failures that look like merge regressions), and `run_shell_command` inherits the session env, so it is not optional there either.

The session scenario is **hermetic**: the script serves a loopback fake model itself and runs the CLI with a throwaway `QWEN_HOME` and `OPENAI_*` pointing at it, so it needs no configuration and the only legitimate peer is that loopback port. It requires the session to exit `0` and the fake model to serve at least two requests (the tool call, then the follow-up carrying its result). Before this, a machine with no model configured exited 1 before any request, saw 0 attempts, and still printed clean.

**Scenarios.** Each model scenario gets its own fake model, throwaway `QWEN_HOME` and a forced tool call:

|Scenario|Proves|
|---|---|
|startup (`--version`)|zero sockets at startup|
|session with one tool call|the permitted model call is the only egress|
|`web_search` with a key|§1.5 at runtime: serpapi.com is contacted and nothing else; requires an attempt at it, so a tool that never ran fails the run|
|artifact publish, `oss` armed, `--approval-mode yolo`|§1.7 at runtime: the endpoint is deliberately NOT allowlisted, so any attempt at it is a LEAK. Headless denies an `ask` tool, so this exercises fail-closed; it catches the dangerous regression where the prompt gate and the publisher collapse are both gone|

**Header audit.** The probe verdicts destinations; it cannot see what a request carries. The fake model records every request header name across the session scenarios and anything outside the pinned list (standard HTTP, `user-agent`, the OpenAI SDK's `x-stainless-*` platform fingerprint) is a finding, so a new identifier header cannot ride the sanctioned channel. v0.27.2 baseline: 17 distinct names, none unexpected, no session or installation id. Extend deliberately with `QWEN_EGRESS_HEADER_ALLOW=name1,name2` and record why. The `x-stainless-*` fingerprint (arch, OS, runtime version) does reach the model endpoint on every request.

**Peer rows.** A resolved address is `ok` only when it was resolved from an allowed hostname; a connection by bare IP keeps its own verdict (proved with a stand-in that dials serpapi's address directly: LEAK, exit 1). Before this fix the probe read the lookup event's address *family* as a port and flagged every allowed remote hostname's IP as a LEAK.

**Kernel cross-check (`--strace`, Linux, opt-in).** The probe is JavaScript inside the traced process, so a child that clears `NODE_OPTIONS` or a native addon is invisible to it. `npm run check:egress -- --strace` (or `QWEN_EGRESS_STRACE=1`) runs every scenario under `strace -f -e trace=connect` and requires each non-local address the kernel was asked to connect to to also appear in the probe's records; one that does not is a probe blind spot and exits `2`. Ports `0` (routing probes) and `53` (resolver) are not judged; resolver connects are counted and printed. Verified against a stand-in whose child clears `NODE_OPTIONS` and dials a public address: the probe records nothing and the cross-check names the address. It is opt-in because ptrace can be restricted (containers, some CI); run it on Linux at least once per major release, which is the automated form of §17's `strace` pass.

### The allowlist is derived, never hardcoded

Trusted hosts are collected by walking the user's **own** settings (`~/.qwen/settings.json`, `QWEN_HOME`, workspace `.qwen/settings.json`) and **every string in it**, plus any exported `*_BASE_URL` / `*_ENDPOINT`, plus loopback and the container gateway. Anything else is a leak.

This is deliberate and it is the load-bearing design decision:

- A machine whose model endpoint is remote is not falsely accused — its endpoint is trusted because _its owner_ configured it.
- Because the walk is generic rather than a list of known keys, **a new remote option added by an upstream merge surfaces as a finding instead of being silently trusted.** Enumerating keys would have gone stale the first time upstream added an option.
- The resolved allowlist is printed at the top of every run. Read it. If a host is trusted that you did not configure, that is itself the finding.

`QWEN_EGRESS_ALLOW=host1,host2` exists for legitimate one-offs. Using it means the run was no longer an unmodified test — record why in the release notes, the same rule §5 applies to every other waiver.

### `BLIND`: unobserved is not clean

A spawn was recorded with no host, and `isLocalHost(undefined)` is true — so **every spawn row verdicted `ok`, unconditionally**. Interpreters outside the network-CLI list (`python`, `ruby`, `java`, …) were never matched and recorded nothing at all. A subprocess could reach anywhere and the run still printed clean.

Now a network CLI whose argv names a URL is verdicted against the allowlist like any other destination, and a spawn of a non-Node interpreter is `BLIND` — not clean, not a leak, **unobserved**. `BLIND` blocks the release. Acknowledge a runtime you trust with `QWEN_EGRESS_BLIND_ACK=<exe>[,<exe>…]` and record why in the release notes, the same discipline as `QWEN_EGRESS_ALLOW` above.

### The self-test is not optional decoration

Every run begins by reaching for `egress-tripwire-selftest.invalid` — a host that can never be allowed — and asserting the probe flags it as `LEAK`. If it does not, the run exits `2` (broken), **not** `0`. The run also spawns an interpreter child and exits `2` if no `BLIND` row appears, so this category cannot rot back into silence.

This rule was earned, not designed in: the first version of this gate reported _"0 egress attempts, no unexpected egress"_ while strace showed six sockets open. The launcher and the CLI it spawns both preload the probe and shared one log file, and the launcher — which makes no requests and exits last — overwrote the child's real hits with an empty list. A gate that can only ever say "clean" is indistinguishable from a dead one. It was also silently recording every connection as `0.0.0.0`, because undici passes an options object whose `host`/`port` are unpopulated at call time; destinations are now captured from the socket's `lookup`/`connect` events, which is ground truth.

**How to apply:** never "fix" a green run by trusting it. Confirm the attempt count is plausible and the peers match the configured endpoint, and if you change the probe, verify against an independent `strace` run before believing it.

### What it cannot see

State these limits when reporting a pass — a clean verdict is scoped, not absolute:

- **Your own settings.** The session scenario runs with a throwaway `QWEN_HOME`, so your `settings.json` (remote model, MCP servers, channels) is not exercised; the allowlist is still derived from it and printed. Trace a real configured session separately (§17) when that is the question.
- **External agent binaries.** `codex-subagent-executor` deletes `NODE_OPTIONS` from its children, so those processes run untraced. Their _spawn_ is recorded as `BLIND`, their sockets are not.
- **Non-Node native helpers** doing raw syscalls bypass every hook; spawned directly they surface as `BLIND`. That is what the §17 `strace` pass is for — run it on Linux at least once per major release.
- **The sanctioned channel.** The model endpoint is trusted by definition, and it carries the prompt and every file the model reads. If `model.baseUrl` is remote, your content leaves the machine by design and this gate will correctly call that clean. §1 prints the endpoint loudly for exactly this reason.
- **Unexercised paths.** Only code that ran is certified. `qwen serve`, Web Shell, channels, Mods completions, `/update` and `/review` are not scenarios; they need their own traced runs.

### Where it goes in the workflow

- **Every release:** `npm run check:egress` is a blocking step, alongside `check:context` and `check:merge-drivers`; add `-- --strace` once per major release on Linux.
- **After any merge that touches network code, a dependency, or an approval-mode path:** run it. This is the check that would have caught the §1.7 artifact window on its own.
- **CI:** deliberately **not** wired into the merged upstream workflows. Adding a job there re-conflicts on every merge; the fork's gates are run by hand at release, which is the same trade §1.5 makes with its `merge=ours` seams.

---
