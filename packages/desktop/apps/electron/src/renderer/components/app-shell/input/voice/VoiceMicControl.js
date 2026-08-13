import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Loader2, Mic, Square } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@craft-agent/ui';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
export function VoiceMicControl({ voice, disabled, }) {
    const { isRecording, isConnecting, isTranscribing, isError } = voice;
    if (isTranscribing) {
        return (_jsx("span", { role: "status", "aria-label": "Transcribing\u2026", className: "flex items-center justify-center h-7 w-7 rounded-full shrink-0 ml-1 text-muted-foreground", children: _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) }));
    }
    if (isRecording || isConnecting) {
        const label = isConnecting ? 'Cancel' : 'Stop dictation';
        return (_jsx("button", { type: "button", "aria-label": label, title: label, onClick: () => (isConnecting ? voice.abort() : voice.stop()), className: "flex items-center justify-center h-7 w-7 rounded-full shrink-0 ml-1 bg-foreground/10 hover:bg-foreground/15 active:bg-foreground/20 transition-colors", children: isConnecting ? (_jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" })) : (_jsx(Square, { className: "h-3 w-3 fill-current" })) }));
    }
    const label = isError
        ? `Voice error — click to retry${voice.errorMessage ? `: ${voice.errorMessage}` : ''}`
        : voice.notice
            ? 'No speech detected — click to retry'
            : 'Start voice dictation';
    return (_jsxs(Tooltip, { delayDuration: 150, children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Button, { type: "button", size: "icon", variant: "ghost", "aria-label": label, className: cn('h-7 w-7 rounded-full shrink-0 ml-1', isError && 'text-red-500 hover:text-red-500'), disabled: Boolean(disabled), onClick: () => voice.start(), children: _jsx(Mic, { className: "h-4 w-4" }) }) }), _jsx(TooltipContent, { children: voice.errorMessage ?? voice.notice ?? label })] }));
}
//# sourceMappingURL=VoiceMicControl.js.map