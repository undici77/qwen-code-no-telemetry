/**
 * Prepare sharp native module symlinks.
 *
 * When sharp is installed with prebuilt @img/* packages, the .node binary
 * ends up in @img/sharp-<platform>/lib/ but sharp's dist/sharp.cjs expects
 * it at sharp/src/build/Release/sharp-<platform>-<version>.node.
 * This script creates the expected symlinks so that bundlers (esbuild, etc.)
 * can resolve the native module references.
 */

import { existsSync, mkdirSync, readFileSync, symlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const sharpRoot = join(root, 'node_modules', 'sharp');
const imgRoot = join(root, 'node_modules', '@img');

if (!existsSync(sharpRoot)) {
  console.log('sharp not installed, skipping sharp prepare');
  process.exit(0);
}

const sharpPkg = JSON.parse(
  readFileSync(join(sharpRoot, 'package.json'), 'utf8'),
);
const sharpVersion = sharpPkg.version;

// Find the prebuilt platform package
let platformPkg = null;
try {
  platformPkg = JSON.parse(
    readFileSync(
      join(
        imgRoot,
        `sharp-${process.platform}-${process.arch}`,
        'package.json',
      ),
      'utf8',
    ),
  );
} catch {
  // No prebuilt for this platform
}

const releaseDir = join(sharpRoot, 'src', 'build', 'Release');
mkdirSync(releaseDir, { recursive: true });

if (platformPkg) {
  const libDir = join(
    imgRoot,
    `sharp-${process.platform}-${process.arch}`,
    'lib',
  );
  const binaryName = `sharp-${process.platform}-${process.arch}-${sharpVersion}.node`;
  const dest = join(releaseDir, binaryName);
  const src = join(libDir, binaryName);
  if (existsSync(src) && !existsSync(dest)) {
    symlinkSync(src, dest);
    console.log(`  sharp: linked ${binaryName}`);
  }
}

// Also link wasm32 if available
try {
  const wasmSrc = join(imgRoot, 'sharp-wasm32', 'sharp.node');
  const wasmDest = join(releaseDir, `sharp-wasm32-${sharpVersion}.node`);
  if (existsSync(wasmSrc) && !existsSync(wasmDest)) {
    symlinkSync(wasmSrc, wasmDest);
    console.log(`  sharp: linked sharp-wasm32-${sharpVersion}.node`);
  }
} catch {
  // No wasm32 package
}

console.log('  sharp prepare done');
