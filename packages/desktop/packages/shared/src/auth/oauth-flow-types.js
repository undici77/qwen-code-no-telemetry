/**
 * Shared types for the server-owned OAuth prepare/exchange flow.
 *
 * These types decouple the two halves of an OAuth flow:
 *   1. prepare  — build the authUrl + PKCE (server-side)
 *   2. exchange — swap the authorization code for tokens (server-side)
 *
 * The client's only job is to open the browser and forward the code.
 */
export {};
//# sourceMappingURL=oauth-flow-types.js.map