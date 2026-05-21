const LOG_LEVEL_PRIORITY = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
export class SdkLogger {
    static config = {};
    static effectiveLevel = 'error';
    static configure(config) {
        this.config = config;
        this.effectiveLevel = this.determineLogLevel();
    }
    static determineLogLevel() {
        if (this.config.logLevel) {
            return this.config.logLevel;
        }
        if (this.config.debug) {
            return 'debug';
        }
        const envLevel = process.env['DEBUG_QWEN_CODE_SDK_LEVEL'];
        if (envLevel && this.isValidLogLevel(envLevel)) {
            return envLevel;
        }
        if (process.env['DEBUG_QWEN_CODE_SDK']) {
            return 'debug';
        }
        return 'error';
    }
    static isValidLogLevel(level) {
        return ['debug', 'info', 'warn', 'error'].includes(level);
    }
    static shouldLog(level) {
        return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.effectiveLevel];
    }
    static formatTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    static formatMessage(level, scope, message, args) {
        const timestamp = this.formatTimestamp();
        const levelStr = `[${level.toUpperCase()}]`.padEnd(7);
        let fullMessage = `${timestamp} ${levelStr} [${scope}] ${message}`;
        if (args.length > 0) {
            const argsStr = args
                .map((arg) => {
                if (typeof arg === 'string') {
                    return arg;
                }
                if (arg instanceof Error) {
                    return arg.message;
                }
                try {
                    return JSON.stringify(arg);
                }
                catch {
                    return String(arg);
                }
            })
                .join(' ');
            fullMessage += ` ${argsStr}`;
        }
        return fullMessage;
    }
    static log(level, scope, message, args) {
        if (!this.shouldLog(level)) {
            return;
        }
        const formattedMessage = this.formatMessage(level, scope, message, args);
        if (this.config.stderr) {
            this.config.stderr(formattedMessage);
        }
        else {
            if (level === 'warn' || level === 'error') {
                process.stderr.write(formattedMessage + '\n');
            }
            else {
                process.stdout.write(formattedMessage + '\n');
            }
        }
    }
    static createLogger(scope) {
        return {
            debug: (message, ...args) => {
                this.log('debug', scope, message, args);
            },
            info: (message, ...args) => {
                this.log('info', scope, message, args);
            },
            warn: (message, ...args) => {
                this.log('warn', scope, message, args);
            },
            error: (message, ...args) => {
                this.log('error', scope, message, args);
            },
        };
    }
    static getEffectiveLevel() {
        return this.effectiveLevel;
    }
}
//# sourceMappingURL=logger.js.map