import { spawnSync } from 'child_process';
import * as path from 'path';
function parseCodesignField(output, field) {
    const match = output.match(new RegExp(`^${field}=(.*)$`, 'm'));
    return match?.[1]?.trim();
}
export function getMacAppBundlePath(executablePath) {
    return path.dirname(path.dirname(path.dirname(executablePath)));
}
export function parseMacCodeSignatureStatus(appBundlePath, exitStatus, output) {
    if (exitStatus !== 0) {
        return {
            trustedForAutoUpdate: false,
            appBundlePath,
            reason: 'codesign-failed',
            diagnostic: output.trim(),
        };
    }
    const signature = parseCodesignField(output, 'Signature');
    const teamIdentifier = parseCodesignField(output, 'TeamIdentifier');
    if (signature === 'adhoc') {
        return {
            trustedForAutoUpdate: false,
            appBundlePath,
            reason: 'adhoc-signature',
            signature,
            teamIdentifier,
        };
    }
    if (!teamIdentifier || teamIdentifier === 'not set') {
        return {
            trustedForAutoUpdate: false,
            appBundlePath,
            reason: 'missing-team-identifier',
            signature,
            teamIdentifier,
        };
    }
    return {
        trustedForAutoUpdate: true,
        appBundlePath,
        signature,
        teamIdentifier,
    };
}
export function getCurrentMacCodeSignatureStatus(executablePath) {
    const appBundlePath = getMacAppBundlePath(executablePath);
    const result = spawnSync('/usr/bin/codesign', ['-d', '-vvv', appBundlePath], {
        encoding: 'utf8',
    });
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
    return parseMacCodeSignatureStatus(appBundlePath, result.status, output);
}
//# sourceMappingURL=auto-update-signature.js.map