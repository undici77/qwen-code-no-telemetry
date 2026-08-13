/**
 * Session Tools Core - Context Interface
 *
 * Defines the abstract context interface that session tool runtimes provide.
 *
 * This enables writing tool handlers once and running them in every environment.
 */
// ============================================================
// Context Factory Helpers
// ============================================================
/**
 * Create a basic file system implementation using Node.js fs.
 */
export function createNodeFileSystem() {
    // Dynamic import to work in both environments
    const fs = require('node:fs');
    return {
        exists: (path) => fs.existsSync(path),
        readFile: (path) => fs.readFileSync(path, 'utf-8'),
        readFileBuffer: (path) => fs.readFileSync(path),
        writeFile: (path, content) => fs.writeFileSync(path, content, 'utf-8'),
        isDirectory: (path) => fs.existsSync(path) && fs.statSync(path).isDirectory(),
        readdir: (path) => fs.readdirSync(path),
        stat: (path) => {
            const stats = fs.statSync(path);
            return {
                size: stats.size,
                isDirectory: () => stats.isDirectory(),
            };
        },
    };
}
//# sourceMappingURL=context.js.map