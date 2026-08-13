export type VoiceTransport = 'qwen-asr-chat' | 'qwen-asr-realtime' | 'dashscope-task-realtime' | 'unsupported';
/** Map a model id to the ASR transport it uses, or 'unsupported'. */
export declare function resolveVoiceTransport(model: string): VoiceTransport;
/** True when the model streams over a realtime WebSocket transport. */
export declare function isStreamingVoiceModel(model: string): boolean;
