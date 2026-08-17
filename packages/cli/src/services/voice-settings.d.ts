/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { SettingScope, type LoadedSettings } from '../config/settings.js';
export type VoiceMode = 'hold' | 'tap';
export declare function readVoiceModel(settings: {
  merged?: {
    voiceModel?: unknown;
  };
}): string | undefined;
export declare function isVoiceEnabled(settings: {
  merged?: {
    general?: {
      voice?: {
        enabled?: unknown;
      };
    };
  };
}): boolean;
export declare function readVoiceMode(settings: {
  merged?: {
    general?: {
      voice?: {
        mode?: unknown;
      };
    };
  };
}): VoiceMode;
export declare function readVoiceLanguage(settings: LoadedSettings): string;
export declare function getVoiceSettingsScope(
  settings: {
    isTrusted?: boolean;
    workspace?: {
      settings?: {
        general?: {
          voice?: {
            enabled?: unknown;
          };
        };
      };
    };
  },
  workspaceTrusted?: boolean,
): SettingScope;
export declare function isVoiceMode(value: unknown): value is VoiceMode;
