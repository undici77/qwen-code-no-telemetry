---
paths:
  - "NOTICE"
  - "LICENSE"
description: No-telemetry fork §21 — Apache-2.0 notice obligations
---

### License notice (§21)

The upstream license requires the license text, the copyright and license headers, and a prominent statement that files were changed (Apache-2.0 §4(a)-(c)). `LICENSE` and the per-file `@license` headers stay exactly as upstream has them. `NOTICE` carries the modification statement and the trademark disclaimer (§6); it is a fork-only file, so upstream never conflicts with it.

After every merge: `git diff <new-upstream-tag> -- LICENSE` must be empty, `NOTICE` must name the new `Upstream base:` version, and any new fork patch gets one line in its list. `check:context` asserts the first two.
