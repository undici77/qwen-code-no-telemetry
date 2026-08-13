import { debug } from "../utils/debug";
const VERSIONS_URL = null;
export async function getLatestVersion() {
    if (VERSIONS_URL == null) {
        debug('[manifest] Update manifest fetch is disabled');
        return null;
    }
    try {
        const response = await fetch(`${VERSIONS_URL}/latest`);
        const data = await response.json();
        const version = data.version;
        if (typeof version !== 'string') {
            debug('[manifest] Latest version is not a valid string');
            return null;
        }
        return version ?? null;
    }
    catch (error) {
        debug(`[manifest] Failed to get latest version: ${error}`);
    }
    return null;
}
export async function getManifest(version) {
    if (VERSIONS_URL == null) {
        debug(`[manifest] Update manifest fetch is disabled for version: ${version}`);
        return null;
    }
    try {
        const url = `${VERSIONS_URL}/${version}/manifest.json`;
        debug(`[manifest] Getting manifest for version: ${url}`);
        const response = await fetch(url);
        const data = await response.json();
        return data;
    }
    catch (error) {
        debug(`[manifest] Failed to get manifest: ${error}`);
    }
    return null;
}
//# sourceMappingURL=manifest.js.map