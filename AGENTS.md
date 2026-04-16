<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project structure

All source code lives under `src/`. Never create source files at the repo root.

```
src/
  app/         Next.js App Router (pages, layouts, global CSS)
  components/  React components
  hooks/       Custom React hooks
  lib/         Pure utility functions (no React, no side effects)
  types/       Shared TypeScript types and constants
```

The `@/*` path alias resolves to `src/*`.
Use `@/components/Foo`, `@/hooks/useBar`, `@/lib/baz`, `@/types` — never relative `../../` imports across these directories.

## React component conventions

Every file in `src/components/` must follow these rules:

- **File name** — `PascalCase.tsx`, matches the component name exactly
- **Component** — `export const Name: React.FC<NameProps> = (props) => { ... }`, PascalCase, matches the filename
- **Props type** — `type NameProps = { ... }`, always `Name` + `Props`, never bare `Props`
- **Export style** — always named exports (`export const Name`), never `export default`
- **`'use client'`** — line 1 only when the component uses hooks, browser APIs, or event handlers; omit for server components
- **One component per file** — no secondary component exports
- **Handlers** — named `handleEventNoun` inside the component (e.g. `handleSubmit`)
- **Callback props** — named `onEventNoun` (e.g. `onSubmit`, `onChange`)

File structure order: `'use client'` → `import React` → other imports → `type NameProps` → local types → constants → helper functions → component.

The full template and checklist live in `.claude/commands/react-component.md`.
