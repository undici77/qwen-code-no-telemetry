---
paths:
  - "packages/core/src/services/visionBridge/**"
description: No-telemetry fork §1.6 — vision bridge throttles, never rejects per turn
---

### Vision-bridge image concurrency (§1.6)

The vision bridge (`packages/core/src/services/visionBridge/vision-bridge-service.ts`) MUST NEVER reject an image on a per-turn count. It throttles concurrent bridge calls to `VISION_BRIDGE_MAX_IMAGES` (4) and queues the rest — every valid image is eventually converted. If upstream reintroduces a per-turn rejection cap (a `WeakMap`/counter failing images past N), replace it with the concurrency gate (`tryAcquireBridgeSlotSync` / `waitForBridgeSlot` / `releaseBridgeSlot`). `check:context` asserts both directions, and the positive ones are load-bearing: the gate and its `VISION_BRIDGE_MAX_IMAGES` bound must be present, while the negative check only matches the _names_ this fork deleted, so an upstream cap under a new name is invisible to it.
