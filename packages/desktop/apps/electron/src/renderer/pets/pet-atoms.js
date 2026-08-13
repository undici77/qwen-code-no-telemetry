/** Shared pet-companion state so the picker and the floating overlay stay in sync. */
import { atom } from 'jotai';
import { DEFAULT_PET_ID } from './registry';
import { DEFAULT_PET_SIZE } from './pet-size';
export const selectedPetIdAtom = atom(DEFAULT_PET_ID);
export const petEnabledAtom = atom(true);
export const petSettingsLoadedAtom = atom(false);
export const petSizeAtom = atom(DEFAULT_PET_SIZE);
export const customPetsAtom = atom([]);
//# sourceMappingURL=pet-atoms.js.map