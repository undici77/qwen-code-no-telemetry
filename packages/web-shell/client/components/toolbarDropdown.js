export function filterToolbarDropdownItems(items, query) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return [...items];
  return items.filter((item) =>
    `${item.label}\n${item.searchText ?? ''}`
      .toLocaleLowerCase()
      .includes(normalized),
  );
}
export function getToolbarItemVisibility({ availableWidth, items }) {
  const visibility = Object.fromEntries(
    items.map((item) => [item.id, item.ready !== false]),
  );
  let usedWidth = items.reduce(
    (total, item) => total + (visibility[item.id] ? item.expansionWidth : 0),
    0,
  );
  for (const item of items) {
    if (usedWidth <= availableWidth) break;
    if (!visibility[item.id]) continue;
    visibility[item.id] = false;
    usedWidth -= item.expansionWidth;
  }
  return visibility;
}
export function getToolbarItemVisibilityWithHysteresis({
  availableWidth,
  items,
  currentVisibility,
  expansionMargin,
}) {
  const collapseVisibility = getToolbarItemVisibility({
    availableWidth,
    items,
  });
  const expansionVisibility = getToolbarItemVisibility({
    availableWidth: Math.max(0, availableWidth - expansionMargin),
    items,
  });
  return Object.fromEntries(
    items.map((item) => [
      item.id,
      currentVisibility[item.id]
        ? collapseVisibility[item.id]
        : expansionVisibility[item.id],
    ]),
  );
}
export function getToolbarExpansionBudget({
  toolbarWidth,
  leadingWidth,
  rightWidth,
  currentExpansionWidth,
  gap,
}) {
  const fixedLeadingWidth = Math.max(0, leadingWidth - currentExpansionWidth);
  return Math.max(0, toolbarWidth - rightWidth - fixedLeadingWidth - gap);
}
export function resolveToolbarModelLabel({
  currentModelLabel,
  lastConfirmedModelLabel,
}) {
  const nextConfirmedModelLabel = currentModelLabel || lastConfirmedModelLabel;
  return {
    modelLabel: nextConfirmedModelLabel,
    modelLabelReady: Boolean(nextConfirmedModelLabel),
    nextConfirmedModelLabel,
  };
}
//# sourceMappingURL=toolbarDropdown.js.map
