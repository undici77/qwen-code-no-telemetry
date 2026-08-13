import React from 'react';
/** Full-width recording strip: dotted leader → live waveform → elapsed timer. */
export interface VoiceRecordingBarProps {
    levels: number[];
    elapsedMs: number;
    /** Live interim transcript (realtime models); floated above the bar. */
    interimText?: string;
}
export declare function VoiceRecordingBar({ levels, elapsedMs, interimText, }: VoiceRecordingBarProps): React.JSX.Element;
