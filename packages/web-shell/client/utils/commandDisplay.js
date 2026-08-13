export const DEFAULT_COMMAND_CATEGORY_ORDER = [
    'custom',
    'skill',
    'system',
];
export function getCommandDisplayCategory(command) {
    if (command.displayCategory)
        return command.displayCategory;
    if (command.source === 'builtin-command')
        return 'system';
    if (command.source === 'bundled-skill' || command.source === 'skill') {
        return 'skill';
    }
    return 'custom';
}
export function compareCommandsByCategory(a, b, order = DEFAULT_COMMAND_CATEGORY_ORDER) {
    return (getCategoryRank(getCommandDisplayCategory(a), order) -
        getCategoryRank(getCommandDisplayCategory(b), order));
}
export function getCategoryRank(category, order = DEFAULT_COMMAND_CATEGORY_ORDER) {
    const rank = order.indexOf(category);
    return rank >= 0
        ? rank
        : order.length + DEFAULT_COMMAND_CATEGORY_ORDER.indexOf(category);
}
//# sourceMappingURL=commandDisplay.js.map