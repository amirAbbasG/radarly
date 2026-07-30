# Task 3 Report: useDebounce Hook

## Status: Done

## Commits

- `98bc117` — feat: add useDebounce hook

## Summary

Created `src/hooks/use-debounce.ts` — a generic `useDebounce<T>(value, delayMs)` hook using `useState` + `useEffect` with `setTimeout`/`clearTimeout`. Returns the debounced value after `delayMs` of inactivity.

## Verification

- **Prettier:** passed
- **TypeScript (`tsc --noEmit`):** no errors in the new file (8 pre-existing errors in other files, unrelated)
- **ESLint:** not installed in the project (pre-existing)

## Concerns

None. Simple, standard pattern. No dependencies, no edge cases to handle.

## Report Path

`.superpowers/sdd/task-3-report.md`
