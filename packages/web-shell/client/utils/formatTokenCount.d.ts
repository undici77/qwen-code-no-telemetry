export declare function formatTokenCount(count: number): string;
/**
 * Context-usage token count — k/M with one decimal (e.g. `53.6k`, `1.0M`),
 * shared by the composer ring tooltip and the /context panel so both
 * surfaces describe the same session identically.
 */
export declare function formatContextTokens(count: number): string;
/** `53.6k / 1.0M tokens (5.4%)` — the context ring's hover detail. */
export declare function formatContextUsageDetail(
  used: number,
  size: number,
): string;
/**
 * Token count in megatokens — always `M` with one decimal (e.g. `810.7M`,
 * `9382.8M`), the usage dashboard's convention where even billions read as M.
 * Sub-1M values render raw with locale grouping (e.g. `80`, `12,345`).
 */
export declare function formatMegaTokens(count: number): string;
