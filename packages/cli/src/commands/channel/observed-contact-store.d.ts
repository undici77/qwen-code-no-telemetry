import type {
  ObservedChannelContactGraph,
  ObservedChannelContactObservation,
} from '@qwen-code/channel-base';
export declare const OBSERVED_CONTACT_MAX_FRESH_WITHIN_SECONDS: number;
interface ObservedChannelContactStoreOptions {
  now?: () => Date;
  maxObservations?: number;
}
interface ListObservedContactsOptions {
  freshWithinSeconds: number;
}
export declare class ObservedChannelContactStore {
  private readonly filePath;
  private readonly now;
  private readonly maxObservations;
  constructor(filePath: string, options?: ObservedChannelContactStoreOptions);
  observe(
    channelName: string,
    observation: ObservedChannelContactObservation,
  ): void;
  list(options: ListObservedContactsOptions): ObservedChannelContactGraph;
  private readObservations;
  private parseObservation;
  private parseIdentity;
  private validateObservation;
  private isIdentity;
  private normalizeIdentity;
  private truncateLabel;
  private observationKey;
  private identityKey;
  private persist;
  private isBoundedString;
  private isCanonicalTimestamp;
}
export {};
