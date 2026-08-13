/**
 * Batch voice transcription via the DashScope / Qwen-ASR OpenAI-compatible
 * protocol: the audio rides as an `input_audio` chat message and the transcript
 * comes back as the assistant message content. (DashScope does NOT serve the
 * Whisper-style `/audio/transcriptions` endpoint — it 404s.)
 *
 * Ported from the CLI voice pipeline (packages/cli/src/ui/voice/voice-transcriber.ts),
 * reduced to the batch path and decoupled from CLI settings: it takes a resolved
 * `{ model, baseUrl, apiKey }` so the desktop can supply credentials from its own
 * LLM-connection store.
 */
const INFERENCE_TIMEOUT_MS = 60_000;
// Qwen-ASR caps each audio file at 10 MB / ~5 minutes.
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
function trimTrailingSlashes(value) {
    return value.replace(/\/+$/, '');
}
function inputAudioFormat(mimeType) {
    return mimeType.split(';', 1)[0]?.replace(/^audio\//, '') || 'wav';
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
export function sanitizeResponseDetails(raw, apiKey) {
    let redacted = raw.replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]');
    if (apiKey) {
        redacted = redacted.replace(new RegExp(escapeRegExp(apiKey), 'g'), '[REDACTED]');
    }
    return redacted.length > 200 ? `${redacted.slice(0, 200)}...` : redacted;
}
export async function transcribeQwenAsrBatch(audio, config, options = {}, fetchFn = fetch) {
    if (audio.data.byteLength > MAX_AUDIO_BYTES) {
        throw new Error('Recording is too long for transcription (max ~5 minutes / 10 MB). Try a shorter dictation.');
    }
    const dataUrl = `data:${audio.mimeType};base64,${Buffer.from(audio.data).toString('base64')}`;
    const messages = [
        {
            role: 'user',
            content: [
                {
                    type: 'input_audio',
                    input_audio: {
                        data: dataUrl,
                        format: inputAudioFormat(audio.mimeType),
                    },
                },
            ],
        },
    ];
    const asrOptions = { enable_itn: true };
    if (options.language) {
        asrOptions['language'] = options.language;
    }
    const headers = {
        'Content-Type': 'application/json',
    };
    if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
    }
    const timeoutSignal = AbortSignal.timeout(INFERENCE_TIMEOUT_MS);
    const signal = options.signal
        ? AbortSignal.any([options.signal, timeoutSignal])
        : timeoutSignal;
    let response;
    try {
        response = await fetchFn(`${trimTrailingSlashes(config.baseUrl)}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: config.model,
                messages,
                asr_options: asrOptions,
            }),
            redirect: 'error',
            signal,
        });
    }
    catch (error) {
        if (error instanceof DOMException && error.name === 'TimeoutError') {
            throw new Error(`Voice transcription timed out after ${INFERENCE_TIMEOUT_MS / 1000}s. Check ASR service health and retry.`);
        }
        throw error;
    }
    if (!response.ok) {
        let details = '';
        try {
            details = sanitizeResponseDetails(await response.text(), config.apiKey);
        }
        catch {
            details = '';
        }
        if (/model_not_supported|unsupported model/i.test(details)) {
            throw new Error('This voice model cannot be used for batch transcription. Use qwen3-asr-flash for batch transcription.');
        }
        const suffix = details ? `: ${details}` : '';
        // The status line is attacker-influenced too (a non-standard ASR proxy can
        // set an arbitrary reason phrase), so sanitize it like the body.
        const statusText = sanitizeResponseDetails(response.statusText, config.apiKey);
        throw new Error(`Voice transcription request failed (${response.status} ${statusText})${suffix}`);
    }
    const json = (await response.json());
    const content = json.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
        throw new Error('Voice transcription response did not include text.');
    }
    return content.trim();
}
//# sourceMappingURL=transcribe.js.map