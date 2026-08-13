#!/usr/bin/env npx tsx
/**
 * PR #6580 evidence capture — subagent observability (issue #6569).
 *
 * Drives two deterministic scenarios against a fake OpenAI server and
 * captures PNG screenshots for the PR's Before/After section:
 *
 *   detail  (yolo): the subagent performs 11 read_file calls, then runs a
 *           long shell command that sleeps. While it sleeps we open the
 *           background-tasks dialog detail view and capture:
 *             - Progress rows (5 truncated on main vs 10 + wrapped live
 *               row on the branch)
 *             - Transcript section (branch only)
 *   approval (default approval mode): the subagent performs 2 read_file
 *           calls, then a shell command that parks an approval. We capture
 *           the inline "Approval requested by" banner (bare on main vs
 *           with prior-call context lines on the branch).
 *
 * Usage:
 *   npm run build && npm run bundle
 *   cd integration-tests/terminal-capture
 *   npx tsx observability-6569-capture.ts <detail|approval> <outputDir> <label>
 */
export {};
