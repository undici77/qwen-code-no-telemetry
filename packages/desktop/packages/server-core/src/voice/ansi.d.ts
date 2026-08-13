/**
 * JSON-escape any ANSI/control escape sequences so a hostile upstream (ASR)
 * server error message can't move the cursor or recolor the terminal when it
 * gets logged. The pattern mirrors `ansi-regex@6` (matches CSI sequences and
 * OSC sequences terminated by BEL, ST `ESC \`, or C1 ``).
 */
export declare function escapeAnsiCtrlCodes(text: string): string;
