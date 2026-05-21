import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Text, useIsScreenReaderEnabled } from 'ink';
import Spinner from 'ink-spinner';
import { useStreamingContext } from '../contexts/StreamingContext.js';
import { StreamingState } from '../types.js';
import { SCREEN_READER_LOADING, SCREEN_READER_RESPONDING, } from '../textConstants.js';
import { theme } from '../semantic-colors.js';
const TMUX_SPINNER_INTERVAL_MS = 750;
const TMUX_SPINNER_FRAMES = ['.  ', '.. ', '...'];
export const GeminiRespondingSpinner = ({ nonRespondingDisplay, spinnerType = 'dots' }) => {
    const streamingState = useStreamingContext();
    const isScreenReaderEnabled = useIsScreenReaderEnabled();
    if (streamingState === StreamingState.Responding) {
        return (_jsx(GeminiSpinner, { spinnerType: spinnerType, altText: SCREEN_READER_RESPONDING }));
    }
    else if (nonRespondingDisplay) {
        return isScreenReaderEnabled ? (_jsx(Text, { children: SCREEN_READER_LOADING })) : (_jsx(Text, { color: theme.text.primary, children: nonRespondingDisplay }));
    }
    return null;
};
export const GeminiSpinner = ({ spinnerType = 'dots', altText, }) => {
    const isScreenReaderEnabled = useIsScreenReaderEnabled();
    const isTmux = Boolean(process.env['TMUX']);
    const [tmuxFrameIndex, setTmuxFrameIndex] = useState(0);
    useEffect(() => {
        if (isScreenReaderEnabled || !isTmux) {
            return;
        }
        const interval = setInterval(() => {
            setTmuxFrameIndex((index) => (index + 1) % TMUX_SPINNER_FRAMES.length);
        }, TMUX_SPINNER_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [isScreenReaderEnabled, isTmux]);
    if (isScreenReaderEnabled) {
        return _jsx(Text, { children: altText });
    }
    if (isTmux) {
        // Note: must NOT wrap in <Box> here — GeminiSpinner is rendered inside a
        // <Text> in Footer.tsx (`<Text>...<GeminiSpinner /> {msg}</Text>`), and
        // Ink forbids <Box> nested inside <Text>. The 3-char fixed-width frames
        // already give us stable layout without an explicit width container.
        return (_jsx(Text, { color: theme.text.primary, children: TMUX_SPINNER_FRAMES[tmuxFrameIndex] }));
    }
    return (_jsx(Text, { color: theme.text.primary, children: _jsx(Spinner, { type: spinnerType }) }));
};
//# sourceMappingURL=GeminiRespondingSpinner.js.map