---
paths:
  - "packages/web-shell/**"
description: Web Shell UI conventions — shared primitives, shadcn generation, ref semantics, portal roots
---

### Web Shell UI development

- Prefer the shared primitives in
  `packages/web-shell/client/components/ui` when developing Web Shell UI. Do
  not duplicate an existing primitive or rewrite stable CSS Modules solely for
  consistency.
- If a required primitive is missing, run
  `npx shadcn@latest add <component>` from `packages/web-shell`, then review the
  generated diff. Do not let the CLI overwrite the existing global CSS,
  semantic tokens, CSS scoping, or portal-root integration. Keep generated
  components internal unless a public package API is explicitly required.
- Web Shell supports React 18 and React 19. Generated shadcn components often
  assume React 19 ref semantics, so wrappers that accept or receive refs —
  including Radix `asChild`, `Slot`, `Presence`, and portal children — must use
  `React.forwardRef` and pass the ref to the underlying DOM or Radix primitive.
  Add a regression test for any ref-sensitive component path.
- Use unprefixed Tailwind classes and shadcn semantic color tokens such as
  `background`, `primary`, and `muted`. The package build scopes generated CSS
  to the Web Shell root and portal root and prefixes global animations and CSS
  property registrations; changes must preserve that isolation from host-page
  styles.
- Components with portals, such as dialogs, popovers, dropdown menus, and
  tooltips, must use `useWebShellPortalRoot()` as the Radix portal container so
  themes, scoped CSS, and z-index variables continue to apply. Preserve
  existing `data-web-shell-*` attributes and public `--web-shell-*` CSS
  variables. See `packages/web-shell/README.md` for the full conventions.
