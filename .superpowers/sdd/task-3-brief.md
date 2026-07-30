### Task 3: useDebounce Hook

**Files:**

- Create: `src/hooks/use-debounce.ts`

**Interfaces:**

- Produces: `useDebounce<T>(value: T, delayMs: number): T` — returns debounced value

- [ ] **Step 1: Create the hook**

```ts
"use client";

import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-debounce.ts
git commit -m "feat: add useDebounce hook"
```

---

