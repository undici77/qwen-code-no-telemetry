/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

// No-telemetry fork patch — see NO_TELEMETRY_GUIDELINES.md §1.7 for why this
// exists and which upstream file it hooks into
// (`packages/core/src/tools/artifact/create-publisher.ts`,
// `createArtifactPublisher`).

import { createDebugLogger } from '../../utils/debugLogger.js';
import type { ArtifactPublisherKind } from './publisher.js';

const debugLogger = createDebugLogger('artifact');

/**
 * Remote artifact publishing is hard-locked off in this fork. Upstream's
 * default publisher is already `local`, so this is not the normal path — it
 * closes the case where `artifact.publisher` is set to `oss` or `host` and
 * the publish is then auto-approved: `needsConfirmation()` in
 * `core/permissionFlow.ts` returns false for every tool under
 * `ApprovalMode.YOLO`, and `isAutoEditApproved()` auto-approves any
 * confirmation whose `type === 'info'` under `ApprovalMode.AUTO_EDIT` — which
 * is exactly the confirmation shape `ArtifactTool` returns. Without this guard
 * a model-chosen `file_path` could be uploaded with no prompt at all.
 *
 * There is deliberately no environment-variable or settings escape hatch.
 * Re-enabling remote publishing requires editing this file, so the change is
 * visible in the diff.
 *
 * The return type is the widened union, not the `'local'` literal, so the
 * caller's `switch` stays type-valid and its `host`/`oss` branches keep
 * compiling — they simply become unreachable at runtime. That is what keeps
 * this patch a one-line hook instead of a rewrite of upstream's factory, and
 * leaves `HostPublisher`/`OssPublisher` imported (dropping them would trip
 * `noUnusedLocals`).
 */
export function enforceNoRemoteArtifactPublisher(
  kind: ArtifactPublisherKind,
): ArtifactPublisherKind {
  // Only the known remote kinds are collapsed. Anything unrecognised passes
  // through untouched so upstream's `default` branch still throws an
  // actionable error instead of silently publishing locally.
  if (kind === 'host' || kind === 'oss') {
    debugLogger.warn(
      `Artifact publisher '${kind}' is disabled in this no-telemetry fork; ` +
        `publishing to a local file instead. Remote publishing is hard-locked ` +
        `off in tools/artifact/no-remote-publish.ts.`,
    );
    return 'local';
  }
  return kind;
}

/**
 * Artifact publishing always requires a human, even under `yolo` and
 * `auto_edit`. Remote publishing is already blocked upstream of this, but the
 * local publisher still writes outside the project directory, and a future
 * upstream backend added to the factory would otherwise inherit the silent
 * auto-approve hole described above.
 */
export function artifactPublishRequiresUserInteraction(): boolean {
  return true;
}
