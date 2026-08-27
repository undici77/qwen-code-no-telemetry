import { ipcRenderer } from 'electron';
import { HostAudioLifecycle } from './audio-lifecycle.ts';
import { audioInputConstraints, hasAudioInputDevice, isUnavailableDevicePreference, shouldRecheckAudioInput, } from './audio-input-policy.ts';
import { scheduleOutputFrame } from './audio-output-queue.ts';
const OUTPUT_SAMPLE_RATE = 24_000;
const MICROPHONE_DEVICE_STORAGE_KEY = 'qwen-live-microphone-input-device-id';
function errorCode(error) {
    if (error instanceof DOMException && error.name)
        return error.name;
    return 'audio_unavailable';
}
export class HostAudioEngine {
    onInputLevel;
    onDiagnostic;
    captureContext;
    captureStream;
    captureOutputStream;
    captureSource;
    captureNode;
    outputContext;
    outputSources = new Set();
    outputCursor = 0;
    outputGeneration = 0;
    outputMuted = false;
    captureRequested = false;
    inputMuted = false;
    captureEpoch;
    captureGeneration = 0;
    mediaDeviceListenerInstalled = false;
    microphoneAllowed = false;
    serviceActive = false;
    selfCheckGeneration = 0;
    firstCaptureFrameEpoch;
    lifecycle = new HostAudioLifecycle();
    constructor(onInputLevel = () => { }, onDiagnostic = () => { }) {
        this.onInputLevel = onInputLevel;
        this.onDiagnostic = onDiagnostic;
    }
    handleDeviceChange = () => {
        if (this.captureRequested && this.captureContext && this.captureNode) {
            void this.lifecycle
                .runIfCurrent(() => this.refreshCaptureInput())
                .catch(() => this.reportCaptureError());
            return;
        }
        if (shouldRecheckAudioInput(this.captureRequested)) {
            void this.recheck('audio_device_changed');
        }
    };
    initialize(microphoneAllowed) {
        return this.lifecycle.activate(async () => {
            this.serviceActive = true;
            this.microphoneAllowed = microphoneAllowed;
            this.installMediaDeviceListener();
            await this.recheckCurrent('audio_initialize');
        });
    }
    async listInputDevices() {
        const selectedDeviceId = this.selectedInputDeviceId();
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices
            .filter((device) => device.kind === 'audioinput' &&
            device.deviceId.length > 0 &&
            device.deviceId !== 'default')
            .map((device, index) => ({
            deviceId: device.deviceId,
            label: device.label || `麦克风 ${index + 1}`,
            selected: device.deviceId === selectedDeviceId,
        }));
    }
    setInputDevice(deviceId) {
        if (deviceId)
            localStorage.setItem(MICROPHONE_DEVICE_STORAGE_KEY, deviceId);
        else
            localStorage.removeItem(MICROPHONE_DEVICE_STORAGE_KEY);
        return this.lifecycle.runIfCurrent(() => this.refreshCaptureInput());
    }
    recheck(reason) {
        return this.lifecycle.runIfCurrent(() => this.recheckCurrent(reason));
    }
    async recheckCurrent(reason) {
        if (!this.serviceActive)
            return;
        const generation = ++this.selfCheckGeneration;
        this.captureRequested = false;
        this.captureEpoch = undefined;
        ipcRenderer.send('live:audio:self-check', {
            audioInput: false,
            audioOutput: false,
            inputError: reason,
            outputError: reason,
        });
        if (!this.serviceActive || generation !== this.selfCheckGeneration)
            return;
        await this.resetAudioContexts();
        if (!this.serviceActive || generation !== this.selfCheckGeneration)
            return;
        await this.runSelfCheck(generation);
    }
    async runSelfCheck(generation) {
        const result = {
            audioInput: false,
            audioOutput: false,
        };
        try {
            await this.checkOutput();
            result.audioOutput = true;
        }
        catch (error) {
            result.outputError = errorCode(error);
        }
        if (this.microphoneAllowed) {
            try {
                await this.checkInput();
                result.audioInput = true;
            }
            catch (error) {
                result.inputError = errorCode(error);
            }
        }
        if (this.serviceActive && generation === this.selfCheckGeneration) {
            ipcRenderer.send('live:audio:self-check', result);
        }
    }
    setCapture(enabled, muted, epoch) {
        return this.lifecycle.runIfCurrent(() => this.setCaptureCurrent(enabled, muted, epoch));
    }
    async setCaptureCurrent(enabled, muted, epoch) {
        if (enabled && !this.serviceActive)
            throw new Error('audio_service_inactive');
        if (enabled &&
            (epoch === undefined || !Number.isSafeInteger(epoch) || epoch < 0)) {
            throw new Error('audio_epoch_unavailable');
        }
        const epochChanged = this.captureEpoch !== epoch;
        this.captureRequested = enabled;
        this.inputMuted = muted;
        this.captureEpoch = epoch;
        if (epochChanged)
            this.firstCaptureFrameEpoch = undefined;
        if (!enabled) {
            this.onInputLevel(0);
            await this.stopCapture();
            return;
        }
        if (epochChanged && this.captureContext)
            await this.stopCapture();
        await this.startCapture();
        this.setCaptureMuted(muted);
        this.onDiagnostic('capture_ready', {
            epoch,
            muted,
            contextState: this.captureContext?.state,
        });
    }
    setOutputMuted(muted) {
        this.outputMuted = muted;
        if (muted)
            this.clearOutput();
    }
    async play(frame) {
        if (!this.serviceActive ||
            this.outputMuted ||
            frame.byteLength === 0 ||
            frame.byteLength % 2 !== 0) {
            this.onDiagnostic('output_frame_skipped', {
                bytes: frame.byteLength,
                serviceActive: this.serviceActive,
                outputMuted: this.outputMuted,
            });
            return;
        }
        const generation = this.outputGeneration;
        const context = await this.ensureOutputContext();
        if (generation !== this.outputGeneration || this.outputMuted) {
            this.onDiagnostic('output_frame_stale', {
                bytes: frame.byteLength,
                generation,
                currentGeneration: this.outputGeneration,
                outputMuted: this.outputMuted,
            });
            return;
        }
        const samples = frame.byteLength / 2;
        const audioBuffer = context.createBuffer(1, samples, OUTPUT_SAMPLE_RATE);
        const channel = audioBuffer.getChannelData(0);
        const view = new DataView(frame.buffer, frame.byteOffset, frame.byteLength);
        let peak = 0;
        let sumSquares = 0;
        let zeroCrossings = 0;
        let previous = 0;
        for (let index = 0; index < samples; index += 1) {
            const sample = view.getInt16(index * 2, true) / 0x8000;
            channel[index] = sample;
            peak = Math.max(peak, Math.abs(sample));
            sumSquares += sample * sample;
            if (index > 0 &&
                ((previous < 0 && sample >= 0) || (previous >= 0 && sample < 0))) {
                zeroCrossings += 1;
            }
            previous = sample;
        }
        const schedule = scheduleOutputFrame(context.currentTime, this.outputCursor, audioBuffer.duration);
        const source = context.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(context.destination);
        source.onended = () => {
            this.outputSources.delete(source);
            this.onDiagnostic('output_source_ended', {
                generation,
                currentGeneration: this.outputGeneration,
                remainingSources: this.outputSources.size,
            });
        };
        this.outputSources.add(source);
        source.start(schedule.startAt);
        this.outputCursor = schedule.endAt;
        this.onDiagnostic('output_frame_scheduled', {
            bytes: frame.byteLength,
            generation,
            contextState: context.state,
            contextTime: context.currentTime,
            startAt: schedule.startAt,
            endAt: schedule.endAt,
            queuedSeconds: Math.max(0, schedule.endAt - context.currentTime),
            activeSources: this.outputSources.size,
            contextSampleRate: context.sampleRate,
            sourceSampleRate: OUTPUT_SAMPLE_RATE,
            rms: Math.sqrt(sumSquares / samples),
            peak,
            zeroCrossings,
        });
    }
    clearOutput() {
        this.onDiagnostic('output_clear', {
            generation: this.outputGeneration,
            activeSources: this.outputSources.size,
            contextState: this.outputContext?.state,
            contextTime: this.outputContext?.currentTime,
            outputCursor: this.outputCursor,
        });
        this.outputGeneration += 1;
        for (const source of this.outputSources) {
            try {
                source.stop();
            }
            catch {
                // A source that ended between iteration and stop is already clear.
            }
        }
        this.outputSources.clear();
        const context = this.outputContext;
        this.outputContext = undefined;
        this.outputCursor = 0;
        void context?.close().catch(() => undefined);
    }
    dispose() {
        let captureClose = Promise.resolve();
        return this.lifecycle.deactivate(() => {
            this.serviceActive = false;
            this.selfCheckGeneration += 1;
            this.clearOutput();
            this.captureRequested = false;
            this.captureEpoch = undefined;
            this.microphoneAllowed = false;
            captureClose = this.stopCapture();
            if (this.mediaDeviceListenerInstalled) {
                navigator.mediaDevices.removeEventListener('devicechange', this.handleDeviceChange);
                this.mediaDeviceListenerInstalled = false;
            }
        }, async () => {
            await captureClose;
            await this.resetAudioContexts();
        });
    }
    async checkInput() {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!hasAudioInputDevice(devices)) {
            throw new Error('audio_input_unavailable');
        }
    }
    async checkOutput() {
        if (typeof AudioContext === 'undefined')
            throw new Error('audio_output_unavailable');
    }
    async ensureOutputContext() {
        const context = this.outputContext ??
            new AudioContext({
                latencyHint: 'interactive',
            });
        this.outputContext = context;
        if (context.state === 'suspended')
            await context.resume();
        if (context.state !== 'running')
            throw new Error('audio_output_unavailable');
        return context;
    }
    async startCapture() {
        const epoch = this.captureEpoch;
        if (this.captureContext || !this.captureRequested || epoch === undefined)
            return;
        const generation = ++this.captureGeneration;
        const stream = await this.openInputStream();
        if (generation !== this.captureGeneration ||
            !this.captureRequested ||
            this.captureEpoch !== epoch) {
            for (const track of stream.getTracks())
                track.stop();
            return;
        }
        const context = new AudioContext({ latencyHint: 'interactive' });
        try {
            await context.audioWorklet.addModule(new URL('./audio-input-worklet.js', window.location.href).href);
            if (generation !== this.captureGeneration ||
                !this.captureRequested ||
                this.captureEpoch !== epoch) {
                for (const track of stream.getTracks())
                    track.stop();
                await context.close();
                return;
            }
            const source = context.createMediaStreamSource(stream);
            const worklet = new AudioWorkletNode(context, 'qwen-pcm16-input', {
                channelCount: 1,
                channelCountMode: 'explicit',
                outputChannelCount: [1],
            });
            const destination = context.createMediaStreamDestination();
            destination.channelCount = 1;
            source.connect(worklet);
            worklet.connect(destination);
            worklet.port.onmessage = (event) => {
                const { level, pcm16 } = event.data;
                this.onInputLevel(level);
                if (!this.inputMuted &&
                    this.captureRequested &&
                    this.captureEpoch === epoch &&
                    pcm16.byteLength > 0) {
                    ipcRenderer.send('live:audio:input', {
                        epoch,
                        pcm16: new Uint8Array(pcm16),
                    });
                    if (this.firstCaptureFrameEpoch !== epoch) {
                        this.firstCaptureFrameEpoch = epoch;
                        this.onDiagnostic('capture_first_frame', {
                            epoch,
                            bytes: pcm16.byteLength,
                            contextState: context.state,
                        });
                    }
                }
            };
            this.captureStream = stream;
            this.captureOutputStream = destination.stream;
            this.captureSource = source;
            this.captureContext = context;
            this.captureNode = worklet;
            this.setCaptureMuted(this.inputMuted);
            this.monitorInputTracks(stream, generation);
            if (context.state === 'suspended')
                await context.resume();
        }
        catch (error) {
            for (const track of stream.getTracks())
                track.stop();
            await context.close().catch(() => undefined);
            throw error;
        }
    }
    async stopCapture() {
        this.captureGeneration += 1;
        const source = this.captureSource;
        const node = this.captureNode;
        const stream = this.captureStream;
        const outputStream = this.captureOutputStream;
        const context = this.captureContext;
        this.captureSource = undefined;
        this.captureNode = undefined;
        this.captureStream = undefined;
        this.captureOutputStream = undefined;
        this.captureContext = undefined;
        source?.disconnect();
        node?.disconnect();
        for (const track of stream?.getTracks() ?? [])
            track.stop();
        for (const track of outputStream?.getTracks() ?? [])
            track.stop();
        await context?.close().catch(() => undefined);
    }
    async refreshCaptureInput() {
        const context = this.captureContext;
        const worklet = this.captureNode;
        if (!context || !worklet || !this.captureRequested)
            return;
        const generation = ++this.captureGeneration;
        const stream = await this.openInputStream();
        if (generation !== this.captureGeneration ||
            !this.captureRequested ||
            context !== this.captureContext ||
            worklet !== this.captureNode) {
            for (const track of stream.getTracks())
                track.stop();
            return;
        }
        for (const track of stream.getAudioTracks()) {
            track.enabled = !this.inputMuted;
        }
        const source = context.createMediaStreamSource(stream);
        source.connect(worklet);
        this.monitorInputTracks(stream, generation);
        const previousSource = this.captureSource;
        const previousStream = this.captureStream;
        this.captureSource = source;
        this.captureStream = stream;
        previousSource?.disconnect();
        for (const track of previousStream?.getTracks() ?? [])
            track.stop();
    }
    monitorInputTracks(stream, generation) {
        for (const track of stream.getAudioTracks()) {
            const handleUnavailable = () => {
                if (generation === this.captureGeneration) {
                    void this.recheck('audio_input_track_unavailable');
                }
            };
            track.addEventListener('ended', handleUnavailable, { once: true });
        }
    }
    setCaptureMuted(muted) {
        for (const track of this.captureStream?.getAudioTracks() ?? []) {
            track.enabled = !muted;
        }
    }
    reportCaptureError() {
        ipcRenderer.send('live:audio:capture-error', {
            code: 'audio_input_unavailable',
        });
    }
    selectedInputDeviceId() {
        const selected = localStorage
            .getItem(MICROPHONE_DEVICE_STORAGE_KEY)
            ?.trim();
        return selected || undefined;
    }
    async openInputStream() {
        const selectedDeviceId = this.selectedInputDeviceId();
        if (selectedDeviceId) {
            try {
                return await navigator.mediaDevices.getUserMedia({
                    audio: audioInputConstraints(selectedDeviceId),
                    video: false,
                });
            }
            catch (error) {
                if (!isUnavailableDevicePreference(error))
                    throw error;
            }
        }
        try {
            return await navigator.mediaDevices.getUserMedia({
                audio: audioInputConstraints(),
                video: false,
            });
        }
        catch (error) {
            if (!(error instanceof DOMException) ||
                error.name !== 'NotSupportedError') {
                throw error;
            }
            const fallback = (await navigator.mediaDevices.enumerateDevices()).find((device) => device.kind === 'audioinput' &&
                device.deviceId.length > 0 &&
                device.deviceId !== 'default');
            if (!fallback)
                throw error;
            return navigator.mediaDevices.getUserMedia({
                audio: audioInputConstraints(fallback.deviceId),
                video: false,
            });
        }
    }
    async resetAudioContexts() {
        this.clearOutput();
        await this.stopCapture();
        const outputContext = this.outputContext;
        this.outputContext = undefined;
        this.outputCursor = 0;
        await outputContext?.close().catch(() => undefined);
    }
    installMediaDeviceListener() {
        if (this.mediaDeviceListenerInstalled)
            return;
        navigator.mediaDevices.addEventListener('devicechange', this.handleDeviceChange);
        this.mediaDeviceListenerInstalled = true;
    }
}
//# sourceMappingURL=audio-engine.js.map