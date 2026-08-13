import * as path from 'node:path';
export function findCliEntryPath() {
    const mainModule = process.argv[1];
    if (mainModule) {
        return path.resolve(mainModule);
    }
    throw new Error('Cannot determine CLI entry path');
}
//# sourceMappingURL=cli-entry-path.js.map