import React from 'react';
import type { UseVoiceDictationReturn } from './useVoiceDictation';
/**
 * The circular voice control in the composer toolbar: an idle mic that starts
 * dictation, or — while recording/connecting — a stop button (square in a soft
 * circle, like the reference). Transcribing shows a spinner.
 */
export interface VoiceMicControlProps {
    voice: UseVoiceDictationReturn;
    /** Composer disabled (mid-turn) — blocks starting, not stopping. */
    disabled?: boolean;
}
export declare function VoiceMicControl({ voice, disabled, }: VoiceMicControlProps): React.JSX.Element;
