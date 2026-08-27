export declare function shouldRecheckAudioInput(captureRequested: boolean): boolean;
export declare function audioInputConstraints(selectedDeviceId?: string): MediaTrackConstraints;
export declare function isUnavailableDevicePreference(error: unknown): boolean;
export declare function hasAudioInputDevice(devices: readonly Pick<MediaDeviceInfo, 'kind'>[]): boolean;
