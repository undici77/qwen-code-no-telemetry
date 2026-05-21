export declare function serializeJsonLine(message: unknown): string;
export declare function parseJsonLineSafe(line: string, context?: string): unknown | null;
export declare function isValidMessage(message: unknown): boolean;
export declare function parseJsonLinesStream(lines: AsyncIterable<string>, context?: string): AsyncGenerator<unknown, void, unknown>;
