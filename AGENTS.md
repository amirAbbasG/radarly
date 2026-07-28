<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

---

# ECC - OpenCode Instructions

## Security Guidelines (CRITICAL)

### Mandatory Security Checks

Before ANY commit:

- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized HTML)
- [ ] CSRF protection enabled
- [ ] Authentication/authorization verified
- [ ] Rate limiting on all endpoints
- [ ] Error messages don't leak sensitive data

### Secret Management

```typescript
// NEVER: Hardcoded secrets
const apiKey = "sk-proj-xxxxx";

// ALWAYS: Environment variables
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY not configured");
}
```

### Security Response Protocol

If security issue found:

1. STOP immediately
2. Use **security-reviewer** agent
3. Fix CRITICAL issues before continuing
4. Rotate any exposed secrets
5. Review entire codebase for similar issues

---

## Testing Requirements

### Minimum Test Coverage: 80%

Test Types (ALL required):

1. **Unit Tests** - Individual functions, utilities, components
2. **Integration Tests** - API endpoints, database operations
3. **E2E Tests** - Critical user flows (Playwright)

### Test-Driven Development

Use tdd-guide for:

- Business logic, data transforms, utility functions
- API/data-fetching layers, state management
- Bug fixes (write a regression test first)

Skip tdd-guide for:

- Presentational/UI components still being visually iterated on
- Styling, layout, animation work
- Throwaway prototypes/spikes

Coverage target: 80%+ on logic modules; UI components are exempt from the coverage gate.

### Troubleshooting Test Failures

1. Use **tdd-guide** agent
2. Check test isolation
3. Verify mocks are correct
4. Fix implementation, not tests (unless tests are wrong)

---

## Performance Optimization

### Context Window Management

Avoid last 20% of context window for:

- Large-scale refactoring
- Feature implementation spanning multiple files
- Debugging complex interactions

### Build Troubleshooting

If build fails:

1. Use **build-error-resolver** agent
2. Analyze error messages
3. Fix incrementally
4. Verify after each fix

---

## OpenCode-Specific Notes

Since OpenCode does not support hooks, the following actions that were automated in Claude Code must be done manually:

### After Writing/Editing Code

- Run `prettier --write <file>` to format JS/TS files
- Run `npx tsc --noEmit` to check for TypeScript errors
- Check for console.log statements and remove them

### Commands Available

Use these commands in OpenCode:

- `/plan` - Create implementation plan
- `/tdd` - Enforce TDD workflow
- `/code-review` - Review code changes
- `/build-fix` - Fix build errors
- `/e2e` - Generate E2E tests
- `/orchestrate` - Multi-agent workflow

---

## Success Metrics

You are successful when:

- All tests pass (80%+ coverage)
- No security vulnerabilities
- Code is readable and maintainable
- Performance is acceptable
- User requirements are met

---

## Folder Structure (Battle-Tested Next.js)

Source: Burpdeepak's battle-tested structure, consolidated with community best practices.

### Directory Layout

```
├── public/                         # Static files
│
├── src/                            # Source code
│   ├── app/                        # App router (Next.js 13+)
│   │   ├── (auth)/                 # Auth group route
│   │   ├── (main)/                 # Main app group route
│   │   ├── api/                    # API routes
│   │   │   └── [version]/          # API versioning
│   │   ├── layouts/                # Layout components
│   │   │   ├── root-layout.tsx
│   │   │   └── auth-layout.tsx
│   │   └── [...not-found].tsx      # Catch-all route
│   │
│   ├── components/                 # Reusable UI components
│   │   ├── common/                 # Common components (buttons, inputs, etc.)
│   │   ├── ui/                     # UI primitives (shadcn/ui style)
│   │   ├── sections/               # Section components
│   │   ├── templates/              # Page templates
│   │   ├── forms/                  # Form components
│   │   └── icons/                  # Icon components
│   │
│   ├── config/                     # Configuration files
│   │   ├── constants.ts            # App constants
│   │   ├── navigation.ts           # Navigation config
│   │   └── theme.ts                # Theme config
│   │
│   ├── features/                   # Feature-based modules (scalable approach)
│   │   ├── auth/                   # Authentication feature
│   │   │   ├── components/         # Feature-specific components
│   │   │   ├── hooks/              # Feature-specific hooks
│   │   │   ├── services/           # API services
│   │   │   ├── types/              # Type definitions
│   │   │   └── utils/              # Utility functions
│   │   ├── dashboard/              # Dashboard feature
│   │   └── .../                    # Other features
│   │
│   ├── hooks/                      # Global custom hooks
│   │   ├── use-debounce.ts
│   │   └── use-local-storage.ts
│   │
│   ├── lib/                        # Library code
│   │   ├── api/                    # API clients
│   │   │   └── axios.ts            # Axios instance
│   │   ├── utils/                  # Utility functions
│   │   └── services/               # Business logic services
│   │
│   ├── providers/                  # Global providers
│   │   ├── app-providers.tsx        # Combines all providers
│   │   ├── theme-provider.tsx
│   │   └── query-provider.tsx      # React Query / TanStack Query
│   │
│   ├── stores/                     # State management
│   │   ├── slices/                 # Redux slices
│   │   └── store.ts                # Redux store
│   │
│   ├── styles/                     # Global styles
│   │   ├── base/                   # Base styles
│   │   ├── components/             # Component styles
│   │   ├── themes/                 # Theme definitions
│   │   └── globals.css
│   │
│   └── types/                      # Global TypeScript types
│       ├── api/                    # API response types
│       └── index.ts                # Main types export
```

### Rules

1. **Always use `src/`** — keeps root clean; config files (`package.json`, `next.config.ts`, `.env.*`) stay at root.
2. **File names: kebab-case** — `user-profile.tsx`, `auth-utils.ts`, `get-user.ts`. Never `UserProfile.ts` or `authUtils.ts`.
3. **Route groups are examples, not requirements** — `(auth)`, `(main)` are placeholder names. Name your route groups after the actual domain/flow (e.g., `(public)`, `(protected)`, `(onboarding)`).
4. **Components by role, not type** — `ui/` for primitives, `common/` for shared components, `sections/` for page blocks, `forms/` for form logic, `icons/` for icon components.
5. **`features/` for domain modules** — each feature co-locates its own `components/`, `hooks/`, `services/`, `types/`, `utils/`. Promote to top-level only when shared across 3+ features.
6. **Don't over-abstract** — if a component is only used in one route, keep it colocated in that route folder instead of `components/`.
7. **Server components by default** — mark client components explicitly with `"use client"`.
8. **`lib/` for library code** — API clients (`lib/api/`), utility functions (`lib/utils/`), business logic services (`lib/services/`).
9. **`providers/` for global providers** — combine all providers in `app-providers.tsx`. Keep React Query, Theme, Auth providers separate.
10. **`stores/` for state management** — Redux slices in `stores/slices/`, store config in `stores/store.ts`.
11. **`config/` for app configuration** — constants, navigation, theme. Never hardcode values in components.
12. **`types/` for global TypeScript types** — API response types in `types/api/`, main export in `types/index.ts`.
13. **Colocate related files** — keep types, constants, and utilities close to where they're used. Only promote when shared across 3+ features.

<!-- END:nextjs-agent-rules -->
