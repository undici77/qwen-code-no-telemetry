export interface WebShellShadowDomOptions {
  /** Isolate the plugin manager page body from host-page CSS. */
  plugins?: boolean;
  /** Isolate every Web Shell portal surface from host-page CSS. */
  portals?: boolean;
  /** Additional CSS applied inside every enabled Web Shell ShadowRoot. */
  styles?: string;
}
export type WebShellShadowDom = boolean | WebShellShadowDomOptions;
export interface ResolvedWebShellShadowDomOptions {
  plugins: boolean;
  portals: boolean;
  styles?: string;
}
export declare function isPluginShadowPanel(panel: string | null): boolean;
export declare function resolveWebShellShadowDom(
  value: WebShellShadowDom | undefined,
): ResolvedWebShellShadowDomOptions;
export declare function installWebShellShadowStyles(
  shadowRoot: ShadowRoot,
  additionalStyles?: string,
): () => void;
