import { spawn } from 'bun';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const desktopRoot = join(import.meta.dir, '..');
const defaultRepoRoot = join(desktopRoot, '..', '..');
const electronDir = join(desktopRoot, 'apps', 'electron');
const vendorDir = join(electronDir, 'vendor', 'qwen-code');
const qwenCodePackageName = '@qwen-code/qwen-code';
const qwenCodeMetadataUrl = `https://registry.npmjs.org/${encodeURIComponent(qwenCodePackageName)}`;
function npmCommand() {
    return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}
async function run(cmd, cwd) {
    const proc = spawn({
        cmd,
        cwd,
        stdout: 'inherit',
        stderr: 'inherit',
        stdin: 'inherit',
    });
    const exitCode = await proc.exited;
    if (exitCode !== 0) {
        throw new Error(`${cmd.join(' ')} failed with exit code ${exitCode}`);
    }
}
function isQwenSourceRoot(root) {
    return (existsSync(join(root, 'packages', 'cli', 'package.json')) &&
        existsSync(join(root, 'package.json')));
}
function resolveLocalSourceRootOverride() {
    const root = process.env.QWEN_CODE_ROOT?.trim();
    if (root)
        return resolve(root);
    const path = process.env.QWEN_CODE_PATH?.trim();
    if (path)
        return resolve(path);
    return undefined;
}
function readDefaultQwenCodeVersion() {
    try {
        const pkg = JSON.parse(readFileSync(join(desktopRoot, 'package.json'), 'utf-8'));
        const version = pkg.qwenCodeRuntime?.version?.trim();
        return version || undefined;
    }
    catch {
        return undefined;
    }
}
function verifyVendoredCli() {
    const hasRootCli = existsSync(join(vendorDir, 'cli.js'));
    const hasDistCli = existsSync(join(vendorDir, 'dist', 'cli.js'));
    if (!hasRootCli && !hasDistCli) {
        throw new Error(`Qwen Code CLI not found in ${vendorDir}. Expected cli.js or dist/cli.js.`);
    }
}
async function vendorLocalCheckout(repoRoot) {
    if (!isQwenSourceRoot(repoRoot)) {
        throw new Error(`Qwen Code source checkout not found at ${repoRoot}. Set QWEN_CODE_VERSION, QWEN_CODE_TARBALL, or QWEN_CODE_ROOT.`);
    }
    console.log(`Building Qwen Code CLI from ${repoRoot}...`);
    const npm = npmCommand();
    await run([npm, 'run', 'build', '--', '--cli-only'], repoRoot);
    await run([npm, 'run', 'bundle'], repoRoot);
    await run([npm, 'run', 'prepare:package'], repoRoot);
    const localDistDir = join(repoRoot, 'dist');
    if (!existsSync(join(localDistDir, 'cli.js'))) {
        throw new Error(`Local Qwen Code bundle not found at ${join(localDistDir, 'cli.js')}.`);
    }
    rmSync(vendorDir, { recursive: true, force: true });
    mkdirSync(vendorDir, { recursive: true });
    cpSync(localDistDir, vendorDir, { recursive: true, force: true });
    verifyVendoredCli();
    console.log(`Vendored local Qwen Code CLI into ${vendorDir}`);
}
async function readNpmPackageMetadata() {
    const response = await fetch(qwenCodeMetadataUrl);
    if (!response.ok) {
        throw new Error(`Failed to read ${qwenCodePackageName} metadata from npm: HTTP ${response.status}`);
    }
    return (await response.json());
}
async function resolveNpmVersionOrTag(versionOrTag) {
    const requested = versionOrTag.trim();
    if (!requested) {
        throw new Error('Qwen Code npm version or dist-tag is required.');
    }
    const metadata = await readNpmPackageMetadata();
    const version = metadata.versions?.[requested]
        ? requested
        : metadata['dist-tags']?.[requested];
    if (!version) {
        throw new Error(`Could not resolve ${qwenCodePackageName}@${requested} from npm.`);
    }
    const tarballUrl = metadata.versions?.[version]?.dist?.tarball;
    if (!tarballUrl) {
        throw new Error(`Could not find npm tarball for ${qwenCodePackageName}@${version}.`);
    }
    return { tarballUrl, version };
}
async function vendorNpmVersion(versionOrTag) {
    const { tarballUrl, version } = await resolveNpmVersionOrTag(versionOrTag);
    const sourceLabel = versionOrTag === version ? version : `${versionOrTag} (${version})`;
    console.log(`Downloading Qwen Code ${sourceLabel} from npm...`);
    const tempDir = mkdtempSync(join(tmpdir(), 'qwen-code-vendor-'));
    const tarballPath = join(tempDir, `qwen-code-${version}.tgz`);
    try {
        const response = await fetch(tarballUrl);
        if (!response.ok) {
            throw new Error(`Failed to download ${tarballUrl}: HTTP ${response.status}`);
        }
        await Bun.write(tarballPath, await response.arrayBuffer());
        rmSync(vendorDir, { recursive: true, force: true });
        mkdirSync(vendorDir, { recursive: true });
        const tar = process.platform === 'win32' ? 'tar.exe' : 'tar';
        await run([tar, '-xzf', tarballPath, '-C', vendorDir, '--strip-components=1'], desktopRoot);
        verifyVendoredCli();
        console.log(`Vendored ${qwenCodePackageName}@${version} into ${vendorDir}`);
    }
    finally {
        rmSync(tempDir, { recursive: true, force: true });
    }
}
async function vendorTarball(tarballPath) {
    const source = resolve(tarballPath);
    if (!existsSync(source)) {
        throw new Error(`Qwen Code tarball not found: ${source}`);
    }
    console.log(`Vendoring Qwen Code from tarball ${source}...`);
    rmSync(vendorDir, { recursive: true, force: true });
    mkdirSync(vendorDir, { recursive: true });
    const tar = process.platform === 'win32' ? 'tar.exe' : 'tar';
    await run([tar, '-xzf', source, '-C', vendorDir, '--strip-components=1'], desktopRoot);
    verifyVendoredCli();
    console.log(`Vendored Qwen Code tarball into ${vendorDir}`);
}
async function main() {
    const tarballPath = process.env.QWEN_CODE_TARBALL?.trim();
    if (tarballPath) {
        await vendorTarball(tarballPath);
        return;
    }
    const npmVersion = process.env.QWEN_CODE_VERSION?.trim();
    if (npmVersion) {
        await vendorNpmVersion(npmVersion);
        return;
    }
    const sourceRootOverride = resolveLocalSourceRootOverride();
    if (sourceRootOverride) {
        await vendorLocalCheckout(sourceRootOverride);
        return;
    }
    if (isQwenSourceRoot(defaultRepoRoot)) {
        await vendorLocalCheckout(defaultRepoRoot);
        return;
    }
    const defaultVersion = readDefaultQwenCodeVersion();
    if (defaultVersion) {
        await vendorNpmVersion(defaultVersion);
        return;
    }
    await vendorLocalCheckout(defaultRepoRoot);
}
main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
//# sourceMappingURL=vendor-qwen-code.js.map