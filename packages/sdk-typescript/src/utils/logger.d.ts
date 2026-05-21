export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LoggerConfig {
    debug?: boolean;
    stderr?: (message: string) => void;
    logLevel?: LogLevel;
}
export interface ScopedLogger {
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
}
export declare class SdkLogger {
    private static config;
    private static effectiveLevel;
    static configure(config: LoggerConfig): void;
    private static determineLogLevel;
    private static isValidLogLevel;
    private static shouldLog;
    private static formatTimestamp;
    private static formatMessage;
    private static log;
    static createLogger(scope: string): ScopedLogger;
    static getEffectiveLevel(): LogLevel;
}
