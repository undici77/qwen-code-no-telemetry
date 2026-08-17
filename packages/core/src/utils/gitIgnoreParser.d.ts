/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface GitIgnoreFilter {
  isIgnored(filePath: string): boolean;
}
export declare class GitIgnoreParser implements GitIgnoreFilter {
  private projectRoot;
  private cache;
  private globalPatterns;
  private ignorerCache;
  constructor(projectRoot: string);
  private loadPatternsForFile;
  isIgnored(filePath: string): boolean;
  /**
   * Builds (and memoizes) the compiled ignore matcher for a directory: the
   * union of `.git`, `.git/info/exclude`, and every `.gitignore` from the
   * project root down to `leafDir`. Honors git's rule that once an ancestor
   * directory is itself ignored, deeper `.gitignore` files are not consulted.
   */
  private getIgnorerForDir;
}
