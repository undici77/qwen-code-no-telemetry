import { stat } from 'fs/promises';
/**
 * Basic file-name validation for Git Bash executable paths.
 * Accepts Windows-style and POSIX-style separators to support cross-platform tests.
 */
export function isGitBashExecutablePath(filePath) {
    return /(?:^|[\\/])bash\.exe$/i.test(filePath.trim());
}
/**
 * Validate a user-provided Git Bash executable path.
 * Enforces bash.exe filename and existence on disk.
 */
export async function validateGitBashPath(filePath) {
    const trimmedPath = filePath.trim();
    if (!isGitBashExecutablePath(trimmedPath)) {
        return { valid: false, error: 'Path must point to bash.exe' };
    }
    try {
        const info = await stat(trimmedPath);
        if (!info.isFile()) {
            return { valid: false, error: 'Path must point to a file' };
        }
        return { valid: true, path: trimmedPath };
    }
    catch {
        return { valid: false, error: 'File does not exist at the specified path' };
    }
}
/**
 * Check if a Git Bash path is usable without returning UI-facing errors.
 */
export async function isUsableGitBashPath(filePath) {
    const result = await validateGitBashPath(filePath);
    return result.valid;
}
//# sourceMappingURL=git-bash.js.map