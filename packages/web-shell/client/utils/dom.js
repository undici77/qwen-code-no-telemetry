export function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return !!target.closest(
    'input, textarea, select, [contenteditable="true"], .cm-editor, [data-keyboard-scope]',
  );
}
// document.activeElement retargets to the shadow host when focus is inside
// a shadow root (Web Shell portal mode), so resolve the active element from
// the element's own root instead.
export function getShadowAwareActiveElement(element) {
  const root = element?.getRootNode();
  return root instanceof Document || root instanceof ShadowRoot
    ? root.activeElement
    : null;
}
//# sourceMappingURL=dom.js.map
