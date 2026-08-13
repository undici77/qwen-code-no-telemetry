/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import express, {} from 'express';
import { loadSettings, SettingScope, } from '../../config/settings.js';
import { getWorkspaceTrustStatus } from '../../config/trustedFolders.js';
import { buildWorkspaceVoiceSettingsWrites, buildWorkspaceVoiceStatus, EMPTY_WORKSPACE_VOICE_UPDATE_ERROR, transcribeWorkspaceVoiceAudio, validateWorkspaceVoiceState, voiceSettingsScopeToWire, WorkspaceVoiceError, } from '../../services/voice-service.js';
import { sanitizeVoiceErrorMessage } from '../../services/voice-transcriber.js';
import { isVoiceEnabled, isVoiceMode, readVoiceModel, } from '../../services/voice-settings.js';
import { MAX_VOICE_LANGUAGE_LENGTH, MAX_VOICE_MODEL_LENGTH, } from '../validation-limits.js';
import { writeStderrLine } from '../../utils/stdioHelpers.js';
import { WorkspaceSettingsPartialPersistError, } from '../workspace-service/types.js';
import { isGenerationClosedError, requireTrustedWorkspaceRuntime, resolveManagedWorkspaceRuntimeFromParam, resolveWorkspaceRuntimeFromParam, sendGenerationClosedError, } from '../workspace-route-runtime.js';
function sendVoiceError(res, err) {
    if (err instanceof WorkspaceVoiceError) {
        res.status(err.status).json({ error: err.message, code: err.code });
        return true;
    }
    return false;
}
function broadcastVoiceWrite(deps, write, clientId) {
    try {
        deps.broadcastSettingsChanged(write.key, write.value, voiceSettingsScopeToWire(write.scope), clientId);
    }
    catch (err) {
        writeStderrLine(`qwen serve: POST /workspace/voice broadcast error (key=${write.key}, scope=${voiceSettingsScopeToWire(write.scope)}): ${err instanceof Error ? err.message : String(err)}`);
    }
}
export function parseWorkspaceVoiceUpdateParams(body) {
    const parsed = {};
    if ('enabled' in body) {
        if (typeof body['enabled'] !== 'boolean') {
            return { error: '`enabled` must be a boolean', code: 'invalid_enabled' };
        }
        parsed.enabled = body['enabled'];
    }
    if ('mode' in body) {
        if (!isVoiceMode(body['mode'])) {
            return {
                error: '`mode` must be either "hold" or "tap"',
                code: 'invalid_voice_mode',
            };
        }
        parsed.mode = body['mode'];
    }
    if ('language' in body) {
        if (typeof body['language'] !== 'string') {
            return {
                error: '`language` must be a string',
                code: 'invalid_voice_language',
            };
        }
        const language = body['language'].trim();
        if (language.length > MAX_VOICE_LANGUAGE_LENGTH) {
            return {
                error: `\`language\` exceeds the ${MAX_VOICE_LANGUAGE_LENGTH}-character limit`,
                code: 'invalid_voice_language',
            };
        }
        parsed.language = language;
    }
    if ('voiceModel' in body) {
        if (typeof body['voiceModel'] !== 'string') {
            return {
                error: '`voiceModel` must be a non-empty string',
                code: 'invalid_voice_model',
            };
        }
        const voiceModel = body['voiceModel'].trim();
        if (!voiceModel) {
            return {
                error: '`voiceModel` must be a non-empty string',
                code: 'invalid_voice_model',
            };
        }
        if (voiceModel.length > MAX_VOICE_MODEL_LENGTH) {
            return {
                error: `\`voiceModel\` exceeds the ${MAX_VOICE_MODEL_LENGTH}-character limit`,
                code: 'invalid_voice_model',
            };
        }
        parsed.voiceModel = voiceModel;
    }
    if (Object.keys(parsed).length === 0) {
        return {
            error: EMPTY_WORKSPACE_VOICE_UPDATE_ERROR,
            code: 'invalid_voice_update',
        };
    }
    return parsed;
}
async function persistVoiceUpdate(deps, settings, update, clientId, workspaceTrusted, assertGenerationOpen) {
    if (!deps.persistSettings && !deps.persistSetting) {
        throw new Error('workspace voice settings persistence is not available');
    }
    const writes = buildWorkspaceVoiceSettingsWrites(settings, update, {
        workspaceTrusted,
        ...(deps.scopeOverride ? { scopeOverride: deps.scopeOverride } : {}),
    });
    if (deps.persistSettings) {
        try {
            if (assertGenerationOpen) {
                await deps.persistSettings(deps.boundWorkspace, writes, assertGenerationOpen);
            }
            else {
                await deps.persistSettings(deps.boundWorkspace, writes);
            }
        }
        catch (err) {
            if (err instanceof WorkspaceSettingsPartialPersistError) {
                assertGenerationOpen?.();
                for (const write of err.committedWrites) {
                    broadcastVoiceWrite(deps, write, clientId);
                }
            }
            throw err;
        }
        assertGenerationOpen?.();
        for (const write of writes) {
            broadcastVoiceWrite(deps, write, clientId);
        }
    }
    else {
        const committed = [];
        for (const write of writes) {
            try {
                if (assertGenerationOpen) {
                    await deps.persistSetting(deps.boundWorkspace, write.scope, write.key, write.value, assertGenerationOpen);
                }
                else {
                    await deps.persistSetting(deps.boundWorkspace, write.scope, write.key, write.value);
                }
                assertGenerationOpen?.();
            }
            catch (err) {
                if (isGenerationClosedError(err))
                    throw err;
                writeStderrLine(`qwen serve: POST /workspace/voice partial persist error (workspace=${deps.boundWorkspace}, committed=${committed.length}/${writes.length}, failedKey=${write.key}, failedScope=${voiceSettingsScopeToWire(write.scope)}): ${err instanceof Error ? err.message : String(err)}`);
                for (const committedWrite of committed) {
                    broadcastVoiceWrite(deps, committedWrite, clientId);
                }
                throw new WorkspaceSettingsPartialPersistError(`Voice settings partial persist failed: committed=${committed.length}/${writes.length}`, committed, err);
            }
            committed.push(write);
        }
        for (const write of committed) {
            broadcastVoiceWrite(deps, write, clientId);
        }
    }
}
function normalizeContentType(req) {
    return req.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
}
function requestAbortSignal(req, res) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    req.once('aborted', abort);
    res.once('close', () => {
        if (!res.writableEnded)
            abort();
    });
    return controller.signal;
}
function loadVoiceSettings(deps) {
    const workspaceTrusted = deps.isWorkspaceTrusted?.();
    return loadSettings(deps.boundWorkspace, deps.env
        ? {
            skipLoadEnvironment: true,
            skipWorkspaceSettings: workspaceTrusted === false,
            workspaceTrusted,
        }
        : {
            consumeCorruptionEnvVars: true,
            skipLoadEnvironment: workspaceTrusted === false,
            skipWorkspaceSettings: workspaceTrusted === false,
            workspaceTrusted,
        });
}
function admissionState(req) {
    return req
        .voiceAdmissionState;
}
function admissionLease(req) {
    return admissionState(req)?.lease;
}
function installAdmissionLease(req, res, deps) {
    const result = deps.acquireVoiceLease?.();
    if (!result)
        return true;
    if (result.kind === 'rejected') {
        if (result.reason === 'draining') {
            sendWorkspaceDraining(res);
        }
        else {
            res.set('Retry-After', '5').status(503).json({
                error: 'Too many voice sessions in progress; try again shortly.',
                code: 'voice_capacity_exceeded',
            });
        }
        return false;
    }
    let released = false;
    const release = () => {
        if (released)
            return;
        released = true;
        result.lease.release();
    };
    const state = {
        lease: result.lease,
        operationStarted: false,
        release,
    };
    req.voiceAdmissionState =
        state;
    const releaseBeforeOperation = () => {
        if (!state.operationStarted)
            release();
    };
    res.once('finish', releaseBeforeOperation);
    res.once('close', releaseBeforeOperation);
    return true;
}
function beginVoiceOperation(req) {
    const state = admissionState(req);
    if (!state)
        return;
    state.operationStarted = true;
    return state.release;
}
function combinedAbortSignal(req, res) {
    const requestSignal = requestAbortSignal(req, res);
    const leaseSignal = admissionLease(req)?.signal;
    return leaseSignal
        ? AbortSignal.any([requestSignal, leaseSignal])
        : requestSignal;
}
function sendWorkspaceDraining(res) {
    res.set('Retry-After', '5').status(503).json({
        error: 'Workspace runtime is being removed',
        code: 'workspace_draining',
    });
}
function isSupportedAudioContentType(contentType) {
    return (typeof contentType === 'string' &&
        (contentType.startsWith('audio/') ||
            contentType === 'application/octet-stream'));
}
function readBinaryBody(req) {
    const body = req.body;
    if (body instanceof Uint8Array || Buffer.isBuffer(body)) {
        return body;
    }
    if (ArrayBuffer.isView(body)) {
        return new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
    }
    return undefined;
}
function sendUnsupportedVoiceContentType(res) {
    res.status(415).json({
        error: 'Content-Type must be audio/* or application/octet-stream for voice transcription',
        code: 'unsupported_voice_content_type',
    });
}
function handleVoiceStatus(res, deps, route) {
    try {
        deps.captureGenerationAssertion?.()?.();
        res
            .status(200)
            .json(buildWorkspaceVoiceStatus(deps.boundWorkspace, loadVoiceSettings(deps)));
    }
    catch (err) {
        if (sendGenerationClosedError(res, err))
            return;
        writeStderrLine(`qwen serve: ${route} error: ${err instanceof Error ? err.message : String(err)}`);
        res.status(500).json({
            error: 'Failed to load voice settings',
            code: 'internal_error',
        });
    }
}
async function handleVoiceUpdate(req, res, deps, route) {
    if (!deps.persistSettings && !deps.persistSetting) {
        res.status(501).json({
            error: 'Workspace voice settings persistence is not available',
            code: 'not_implemented',
        });
        return;
    }
    const assertGenerationOpen = deps.captureGenerationAssertion?.();
    assertGenerationOpen?.();
    const parsed = parseWorkspaceVoiceUpdateParams(deps.safeBody(req));
    if ('error' in parsed) {
        res.status(400).json(parsed);
        return;
    }
    const settings = loadVoiceSettings(deps);
    try {
        validateWorkspaceVoiceState(settings, parsed, { env: deps.env });
    }
    catch (err) {
        if (sendVoiceError(res, err))
            return;
        throw err;
    }
    const clientId = deps.parseAndValidateClientId(req, res);
    if (clientId === null)
        return;
    try {
        const workspaceTrusted = deps.isWorkspaceTrusted?.() ??
            getWorkspaceTrustStatus(settings.merged, deps.boundWorkspace).effective
                .state === 'trusted';
        await persistVoiceUpdate(deps, settings, parsed, clientId, workspaceTrusted, assertGenerationOpen);
    }
    catch (err) {
        if (sendGenerationClosedError(res, err))
            return;
        writeStderrLine(`qwen serve: ${route} persist error (workspace=${deps.boundWorkspace}): ${err instanceof Error ? err.message : String(err)}`);
        res.status(500).json({
            error: 'Failed to persist voice settings',
            code: 'persist_error',
        });
        return;
    }
    try {
        assertGenerationOpen?.();
        res
            .status(200)
            .json(buildWorkspaceVoiceStatus(deps.boundWorkspace, loadVoiceSettings(deps)));
    }
    catch (err) {
        if (sendGenerationClosedError(res, err))
            return;
        writeStderrLine(`qwen serve: ${route} reload error after persist (workspace=${deps.boundWorkspace}): ${err instanceof Error ? err.message : String(err)}`);
        res.status(500).json({
            error: 'Voice settings persisted but failed to reload',
            code: 'internal_error',
        });
    }
}
async function handleVoiceTranscription(req, res, deps, route) {
    const contentType = normalizeContentType(req);
    if (!isSupportedAudioContentType(contentType)) {
        sendUnsupportedVoiceContentType(res);
        return;
    }
    if (admissionLease(req)?.signal.aborted) {
        sendWorkspaceDraining(res);
        return;
    }
    const clientId = deps.parseAndValidateClientId(req, res);
    if (clientId === null)
        return;
    const data = readBinaryBody(req);
    if (!data || data.byteLength === 0) {
        res.status(400).json({
            error: 'Voice audio body must be non-empty binary data',
            code: 'invalid_voice_audio',
        });
        return;
    }
    const settings = loadVoiceSettings(deps);
    if (!isVoiceEnabled(settings)) {
        res.status(403).json({
            error: 'Voice transcription is disabled for this workspace',
            code: 'voice_disabled',
        });
        return;
    }
    const queryVoiceModel = req.query['voiceModel'];
    if (queryVoiceModel !== undefined && typeof queryVoiceModel !== 'string') {
        res.status(400).json({
            error: '`voiceModel` query parameter must be a string',
            code: 'invalid_voice_model',
        });
        return;
    }
    const requestedVoiceModel = typeof queryVoiceModel === 'string' ? queryVoiceModel.trim() : '';
    if (requestedVoiceModel &&
        requestedVoiceModel.length > MAX_VOICE_MODEL_LENGTH) {
        res.status(400).json({
            error: `\`voiceModel\` exceeds the ${MAX_VOICE_MODEL_LENGTH}-character limit`,
            code: 'invalid_voice_model',
        });
        return;
    }
    const voiceModel = requestedVoiceModel || readVoiceModel(settings);
    if (!voiceModel) {
        res.status(400).json({
            error: 'A valid voiceModel is required before transcription.',
            code: 'voice_model_required',
        });
        return;
    }
    try {
        const releaseOperation = beginVoiceOperation(req);
        let result;
        try {
            result = await (deps.transcribe ?? transcribeWorkspaceVoiceAudio)({
                data,
                mimeType: contentType,
                voiceModel,
                settings,
                workspaceCwd: deps.boundWorkspace,
                env: deps.env,
                abortSignal: combinedAbortSignal(req, res),
            });
        }
        finally {
            releaseOperation?.();
        }
        if (admissionLease(req)?.signal.aborted) {
            sendWorkspaceDraining(res);
            return;
        }
        res.status(200).json({ v: 1, ...result });
    }
    catch (err) {
        if (admissionLease(req)?.signal.aborted) {
            sendWorkspaceDraining(res);
            return;
        }
        if (sendVoiceError(res, err))
            return;
        const message = sanitizeVoiceErrorMessage(err instanceof Error ? err.message : String(err));
        writeStderrLine(`qwen serve: ${route} error (workspace=${deps.boundWorkspace}): ${message}`);
        res.status(502).json({
            error: 'Voice transcription failed',
            code: 'voice_transcription_failed',
        });
    }
}
function admitVoiceTranscription(req, res, deps) {
    if (!isSupportedAudioContentType(normalizeContentType(req))) {
        sendUnsupportedVoiceContentType(res);
        return false;
    }
    return installAdmissionLease(req, res, deps);
}
function voiceAudioBodyParser() {
    const parse = express.raw({
        type: (req) => isSupportedAudioContentType(req.headers['content-type']?.split(';', 1)[0]?.trim().toLowerCase()),
        limit: '10mb',
    });
    return (req, res, next) => {
        const signal = admissionLease(req)?.signal;
        let aborted = signal?.aborted === true;
        const onAbort = () => {
            aborted = true;
            if (!res.headersSent)
                sendWorkspaceDraining(res);
            const destroyRequest = () => {
                if (!req.destroyed)
                    req.destroy();
            };
            if (res.writableFinished)
                destroyRequest();
            else {
                res.once('finish', destroyRequest);
                res.once('close', destroyRequest);
            }
        };
        if (aborted) {
            onAbort();
            return;
        }
        signal?.addEventListener('abort', onAbort, { once: true });
        parse(req, res, (err) => {
            signal?.removeEventListener('abort', onAbort);
            if (aborted || signal?.aborted) {
                if (!res.headersSent)
                    sendWorkspaceDraining(res);
                return;
            }
            next(err);
        });
    };
}
export function registerWorkspaceVoiceRoutes(app, deps) {
    app.get('/workspace/voice', (_req, res) => handleVoiceStatus(res, deps, 'GET /workspace/voice'));
    app.post('/workspace/voice', deps.mutate({ strict: true }), async (req, res) => {
        await handleVoiceUpdate(req, res, deps, 'POST /workspace/voice');
    });
    app.post('/workspace/voice/transcribe', deps.mutate({ strict: true }), (req, res, next) => {
        if (admitVoiceTranscription(req, res, deps))
            next();
    }, voiceAudioBodyParser(), async (req, res) => {
        await handleVoiceTranscription(req, res, deps, 'POST /workspace/voice/transcribe');
    });
}
function createRuntimeVoiceDeps(runtime, deps) {
    const env = runtime.env.mode === 'runtime-overlay'
        ? (runtime.env.effectiveEnv ?? {})
        : runtime.env.effectiveEnv;
    return {
        boundWorkspace: runtime.workspaceCwd,
        mutate: deps.mutate,
        safeBody: deps.safeBody,
        persistSetting: deps.persistSetting,
        persistSettings: deps.persistSettings,
        transcribe: deps.transcribe,
        ...(env ? { env } : {}),
        scopeOverride: SettingScope.Workspace,
        acquireVoiceLease: () => deps.acquireVoiceLease(runtime),
        isWorkspaceTrusted: () => runtime.trusted,
        captureGenerationAssertion: () => {
            const guard = runtime.generationGuard;
            return guard ? () => guard.assertOpen() : undefined;
        },
        broadcastSettingsChanged: (key, value, scope, clientId) => {
            if (runtime.primary)
                deps.invalidateServeFeaturesCache();
            runtime.bridge.publishWorkspaceEvent({
                type: 'settings_changed',
                data: { key, value, scope },
                originatorClientId: clientId,
            });
        },
        parseAndValidateClientId: (req, res) => deps.parseAndValidateClientId(req, res, runtime),
    };
}
function resolveQualifiedVoiceTarget(req, res, deps, includeDraining = false) {
    const runtime = includeDraining
        ? resolveManagedWorkspaceRuntimeFromParam(deps.workspaceRegistry, req, res)
        : resolveWorkspaceRuntimeFromParam(deps.workspaceRegistry, req, res);
    if (!runtime || !requireTrustedWorkspaceRuntime(runtime, res))
        return;
    return createRuntimeVoiceDeps(runtime, deps);
}
export function registerWorkspaceQualifiedVoiceRoutes(app, deps) {
    app.get('/workspaces/:workspace/voice', (req, res) => {
        const target = resolveQualifiedVoiceTarget(req, res, deps);
        if (!target)
            return;
        handleVoiceStatus(res, target, 'GET /workspaces/:workspace/voice');
    });
    app.post('/workspaces/:workspace/voice', deps.mutate({ strict: true }), async (req, res) => {
        const target = resolveQualifiedVoiceTarget(req, res, deps);
        if (!target)
            return;
        await handleVoiceUpdate(req, res, target, 'POST /workspaces/:workspace/voice');
    });
    app.post('/workspaces/:workspace/voice/transcribe', deps.mutate({ strict: true }), (req, res, next) => {
        const target = resolveQualifiedVoiceTarget(req, res, deps, true);
        if (!target)
            return;
        req.voiceRouteDeps = target;
        if (admitVoiceTranscription(req, res, target))
            next();
    }, voiceAudioBodyParser(), async (req, res) => {
        const target = req.voiceRouteDeps;
        if (!target)
            return;
        await handleVoiceTranscription(req, res, target, 'POST /workspaces/:workspace/voice/transcribe');
    });
}
//# sourceMappingURL=workspace-voice.js.map