export declare const MAX_DROPPED_VOICE_FRAMES = 3;
interface VoiceFrameSocket {
    readonly OPEN: number;
    readyState: number;
    send(frame: ArrayBuffer): void;
}
export declare function sendVoicePcmFrame(ws: VoiceFrameSocket, pcm: ArrayBuffer, droppedFrames: number, onTooManyDroppedFrames: () => void): number;
export {};
