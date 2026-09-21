/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import type { Config } from '../../config/config.js';
import type { ArtifactHostConfig } from './publisher.js';
import { createArtifactPublisher } from './create-publisher.js';
import { LocalPublisher } from './local-publisher.js';

const cfg = (
  kind: 'local' | 'host' | 'oss',
  host?: ArtifactHostConfig,
): Config =>
  ({
    getArtifactPublisherKind: () => kind,
    getArtifactHostConfig: () => host,
    getArtifactOssConfig: () => ({
      bucket: 'artifact-bucket',
      endpoint: 'oss-cn-hangzhou.aliyuncs.com',
    }),
  }) as unknown as Config;

describe('createArtifactPublisher', () => {
  it('returns LocalPublisher for the local kind', () => {
    expect(createArtifactPublisher(cfg('local'))).toBeInstanceOf(
      LocalPublisher,
    );
  });

  // [no-telemetry fork] §1.7 — remote publishing is hard-locked off, so every
  // remote kind collapses to LocalPublisher. Upstream asserted HostPublisher /
  // OssPublisher here; see no-remote-publish.test.ts for the full guarantee.
  it('collapses the host kind to LocalPublisher (§1.7)', () => {
    const pub = createArtifactPublisher(
      cfg('host', {
        uploadCommand: 'up {file}',
        urlTemplate: 'https://h/{key}',
      }),
    );
    expect(pub).toBeInstanceOf(LocalPublisher);
  });

  it('collapses a configured host to LocalPublisher (§1.7)', () => {
    expect(createArtifactPublisher(cfg('host'))).toBeInstanceOf(LocalPublisher);
  });

  it('collapses the oss kind to LocalPublisher (§1.7)', () => {
    expect(createArtifactPublisher(cfg('oss'))).toBeInstanceOf(LocalPublisher);
  });

  it('rejects unknown publisher kinds', () => {
    const config = {
      getArtifactPublisherKind: () => 's3',
    } as unknown as Config;

    expect(() => createArtifactPublisher(config)).toThrow(
      /unknown artifact publisher kind/i,
    );
  });
});
