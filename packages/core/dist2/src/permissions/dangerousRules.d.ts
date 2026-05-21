/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Detection of allow rules whose breadth would defeat the AUTO mode
 * classifier. Such rules are stripped from the working PermissionManager
 * while the user is in AUTO and restored when they leave (see
 * PermissionManager.stripDangerousRulesForAutoMode / restoreDangerousRules).
 *
 * `settings.json` is never modified — strip / restore is a runtime-only
 * concern.
 */
import type { PermissionRule } from './types.js';
/**
 * Returns true when an allow rule on the Bash / Monitor tools is broad enough
 * to defeat the classifier:
 *   - Tool-level (no specifier, `*`, `""`)
 *   - An interpreter token paired with a wildcard, in any of:
 *     - `python` / `python:*` / `python*` / `python *` (bare or wildcard)
 *     - `python -c *`, `node -e *` (flag-style)
 *     - `bun run *`, `npm run *` (multi-token subcommand)
 *     - `/usr/bin/python3 *` (absolute-path form)
 *
 * Literal concrete commands like `Bash(python script.py)` or `Bash(npm test)`
 * are NOT flagged — the user has spelled out the exact command they trust,
 * which is precisely what the strip is meant to *not* override.
 */
export declare function isDangerousBashRule(rule: PermissionRule): boolean;
/**
 * Any allow rule on the Agent (sub-agent spawn) tool defeats the classifier:
 * once a sub-agent is launched, its own prompt evades classifier review
 * because the orchestrator only sees the outer Agent call.
 */
export declare function isDangerousAgentRule(rule: PermissionRule): boolean;
/**
 * Any allow rule on the Skill tool defeats the classifier: skill execution
 * loads user-defined code, which can perform arbitrary actions outside the
 * classifier's view.
 */
export declare function isDangerousSkillRule(rule: PermissionRule): boolean;
/**
 * Aggregate predicate combining all dangerous-rule categories.
 */
export declare function isDangerousAllowRule(rule: PermissionRule): boolean;
/**
 * Filter a list of allow rules to those that would defeat the classifier.
 * Caller is expected to physically remove these from the active rule set
 * (via PermissionManager.stripDangerousRulesForAutoMode) and stash them
 * for restore on AUTO exit.
 */
export declare function findDangerousAllowRules(allowRules: readonly PermissionRule[]): PermissionRule[];
