/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { execSync } from 'node:child_process';
import { getPackageJson } from './package.js';

function getGitShortHash(): string {
  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
    }).trim();
  } catch (_error) {
    // If git command fails (e.g., not a git repo or no commits), return empty string
    return '';
  }
}

export async function getCliVersion(): Promise<string> {
  const pkgJson = await getPackageJson();
  const version = process.env['CLI_VERSION'] || pkgJson?.version || 'unknown';
  const gitHash = getGitShortHash();
  
  if (gitHash) {
    return `${version} · ${gitHash}`;
  }
  return version;
}
