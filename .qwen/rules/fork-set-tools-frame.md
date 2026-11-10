---
paths:
  - "packages/core/src/core/client.ts"
description: No-telemetry fork §20 — main-chat tool declarations are built outside agent frames
---

### Main-chat tool declarations are built outside agent frames (§20)

`LlmClient.setTools()` builds the main chat's declarations once. Some depend on the model: `read_file`'s description is rebuilt from `Config.getEffectiveInputModalities()`, which resolves through `getContentGeneratorConfig()` and so through the async-local runtime view that background and fast-model runs push (the #7156 leak class). Built inside such a frame, the declarations picked up another model's modalities — `read_file` grew by 474 characters at a new user turn and invalidated the prefix cache from the tool block onward.

The build in `setTools()` goes through `runOutsideAgentContext(() => toolRegistry.getFunctionDeclarations())`. The call site carries no `[no-telemetry fork]` tag on purpose: the §14 hook count for `client.ts` is exact, so `check:context` asserts the call itself. Test: `builds the declarations outside any leaked agent frame` in `client.test.ts`.

Conflict resolution: keep upstream's refactor of `setTools()` and re-apply the wrapper. If upstream makes the declarations independent of the async-local view, the wrapper becomes redundant but harmless.
