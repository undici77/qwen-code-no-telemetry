export declare function isNormalized(): boolean;
export declare function coordinateScale(): number;
export declare function normToPx(
  norm: number,
  dim: number,
  scale: number,
): number;
export declare function cacheScreenSize(
  deviceId: string,
  width: number,
  height: number,
): void;
export declare function invalidateScreenSize(deviceId: string): void;
export declare function getCachedScreenSize(deviceId: string):
  | {
      width: number;
      height: number;
    }
  | undefined;
export declare function denormalizeArgs(
  toolName: string,
  args: Record<string, any>,
  screenWidth: number,
  screenHeight: number,
): void;
export declare function hasCoordFields(toolName: string): boolean;
export declare function ingestScreenSizeFromResult(
  deviceId: string,
  response: string,
): void;
export declare function rewriteDescription(description: string): string;
export declare function coordParamDesc(baseDesc: string): string;
