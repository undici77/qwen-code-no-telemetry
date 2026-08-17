/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Mirror of the CLI's `resolveVoiceTransport` id patterns (voice-model.ts): true
 * for ids the daemon has an ASR transport for. Kept in sync by hand because the
 * Web Shell can't import the CLI's voice modules.
 */
export function isVoiceModelId(id) {
  const s = id.toLowerCase();
  return (
    /^qwen3-asr-flash-realtime(?:-|$)/.test(s) ||
    /^qwen3-asr-flash(?:-\d{4}-\d{2}-\d{2})?$/.test(s) ||
    /^(fun-asr|paraformer).*realtime(?:-|$)/.test(s)
  );
}
/**
 * Extract selectable voice models from a `/workspace/providers` status. Voice
 * models are hidden from the session's main model list (`voiceOnly`), so the
 * picker sources them from the providers surface instead.
 */
export function extractVoiceModels(status) {
  const seen = new Set();
  const out = [];
  for (const provider of status?.providers ?? []) {
    for (const model of provider.models ?? []) {
      const id = model.baseModelId;
      if (!id || model.isRuntime || !isVoiceModelId(id) || seen.has(id)) {
        continue;
      }
      seen.add(id);
      out.push({
        id,
        ...(model.name ? { label: model.name } : {}),
        ...(provider.authType ? { authType: provider.authType } : {}),
        ...(model.baseUrl ? { baseUrl: model.baseUrl } : {}),
        ...(typeof model.contextLimit === 'number'
          ? { contextWindow: model.contextLimit }
          : {}),
        modalities: { audio: true },
      });
    }
  }
  return out;
}
//# sourceMappingURL=voiceModels.js.map
