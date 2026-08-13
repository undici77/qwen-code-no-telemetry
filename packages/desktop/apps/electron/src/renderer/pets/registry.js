import qwenSpritesheet from '@/assets/pets/qwen-spritesheet.webp';
export const DEFAULT_PET_ID = 'qwen';
export const BUILT_IN_PETS = [
    {
        id: 'qwen',
        displayName: 'Qwen',
        description: 'Your Qwen capybara companion.',
        spritesheetUrl: qwenSpritesheet,
    },
];
/** Built-in pets followed by any custom pets (custom ids cannot shadow built-ins). */
export function mergeCustomPets(custom) {
    if (!custom || custom.length === 0)
        return BUILT_IN_PETS;
    const builtinIds = new Set(BUILT_IN_PETS.map((p) => p.id));
    const extras = custom
        .filter((c) => c.id && !builtinIds.has(c.id))
        .map((c) => ({
        id: c.id,
        displayName: c.displayName || c.id,
        description: c.description,
        spritesheetUrl: c.spritesheetDataUrl,
        custom: true,
    }));
    return [...BUILT_IN_PETS, ...extras];
}
/** Resolve a pet by id, falling back to the default then the first available. */
export function resolvePet(id, pets = BUILT_IN_PETS) {
    return (pets.find((p) => p.id === id) ??
        pets.find((p) => p.id === DEFAULT_PET_ID) ??
        pets[0] ??
        BUILT_IN_PETS[0]);
}
//# sourceMappingURL=registry.js.map