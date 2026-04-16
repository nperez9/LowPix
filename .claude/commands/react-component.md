# React Component

Create or refactor a React component following the project conventions below.

## Conventions

### Naming

- **File:** `PascalCase.tsx` — matches the component name exactly (`Button.tsx`, `UserCard.tsx`)
- **Component:** `export const Name: React.FC<NameProps> = ...` — PascalCase, matches the filename
- **Props type:** `type NameProps = { ... }` — always `Name` + `Props`, never bare `Props` or `IProps`

### Typing

Always type components with `React.FC<NameProps>`. This makes the component type explicit and consistent across the codebase.

```tsx
// correct
export const Name: React.FC<NameProps> = ({ prop }) => { ... };

// wrong — untyped function declaration
export default function Name({ prop }: NameProps) { ... }

// wrong — default export
const Name: React.FC<NameProps> = ({ prop }) => { ... };
export default Name;

// wrong — bare Props
export const Name: React.FC<Props> = ({ prop }) => { ... };
```

For components with no props, omit the generic:

```tsx
export const Name: React.FC = () => { ... };
```

All exports are **named exports**. Never use `export default`. This prevents name collisions when importing and makes refactoring easier.

### File structure (in order)

```tsx
'use client'; // only if the component uses browser APIs, hooks, or event handlers

// 1. External imports — React default import first, then named hooks/types
import React, { useState, useCallback } from 'react';
// 2. Internal imports (@/hooks, @/lib, @/types, other @/components)

// 3. Types — props type first, then any local-only types
type NameProps = {
  // required props first, optional props last
  requiredProp: string;
  optionalProp?: number;
};

// 4. Module-level constants (if any)
const SOME_CONSTANT = 'value';

// 5. Pure helper functions (no hooks, no side effects)
function helperFn(...) { ... }

// 6. Component — named export, arrow function, typed with React.FC
export const Name: React.FC<NameProps> = ({ requiredProp, optionalProp = 0 }) => {
  // hooks first
  // derived state / memos
  // handlers
  // return JSX
};
```

### Rules

- `'use client'` goes on line 1 when needed; omit it for server components
- Props type is always a `type`, never an `interface`
- Only **one** component per file; no secondary named component exports
- Always use **named exports** — never `export default`
- Handler functions inside the component are named `handleEventNoun` (e.g. `handleSubmit`, `handleColorChange`)
- Callbacks received as props are named `onEventNoun` (e.g. `onSubmit`, `onColorChange`)
- No prop-drilling past two levels — pass a callback or lift state instead

### `@/` import alias

Always use the `@/` alias for cross-directory imports. Never use `../../` relative paths between `src/` subdirectories.

```ts
// correct
import { PixelEditor } from '@/components/PixelEditor';
import { usePixelCanvas } from '@/hooks/usePixelCanvas';
import type { Tool } from '@/types';

// wrong
import PixelEditor from '@/components/PixelEditor';
import { usePixelCanvas } from '../../hooks/usePixelCanvas';
```

## Template

Use this as a starting point when creating a new component:

```tsx
'use client';

import React, { useState } from 'react';

type NameProps = {
  label: string;
  onChange: (value: string) => void;
};

export const Name: React.FC<NameProps> = ({ label, onChange }) => {
  const [value, setValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onChange(e.target.value);
  };

  return (
    <div>
      <label>{label}</label>
      <input value={value} onChange={handleChange} />
    </div>
  );
};
```

## Checklist before finishing

- [ ] File name matches component name exactly
- [ ] Component typed as `React.FC<NameProps>`
- [ ] Named export (`export const Name`) — no `export default`
- [ ] Props type named `NameProps` (never bare `Props`)
- [ ] `'use client'` present only if needed
- [ ] Handlers named `handleX`, callback props named `onX`
- [ ] Imports use `@/` alias
