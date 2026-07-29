### Task 14: Environment variables and final verification

**Files:**
- Modify: .env.example (create if missing)
- Modify: .env (add new vars)

- [ ] **Step 1: Create/update .env.example**

```env
# Database
DATABASE_URL=postgresql://...

# Ingestion
INGEST_SECRET=  # Random string, shared between GH Actions secrets and Vercel env
GITHUB_TOKEN=   # GitHub personal access token (for search API, 5k req/hr free)
PRODUCTHUNT_TOKEN=  # Product Hunt OAuth developer token
GEMINI_API_KEY=  # Google AI Studio API key (Gemini Flash free tier)
```

- [ ] **Step 2: Add new vars to .env**

Append to the existing .env:
```env
INGEST_SECRET=dev-secret-change-me
GITHUB_TOKEN=
PRODUCTHUNT_TOKEN=
GEMINI_API_KEY=
```

- [ ] **Step 3: Full TypeScript check**
```bash
npx tsc --noEmit
```
Expected: clean, no errors across all modified files.

- [ ] **Step 4: Verify app builds**

The app should build cleanly with dynamic pages:
```bash
npx next build
```
Expected: successful build. May show warnings about missing env vars (ignore for dev). No static generation errors since generateStaticParams was removed.

- [ ] **Step 5: Test empty state locally**

Start dev server and visit pages. With empty DB, pages should show empty/zero states gracefully (0 tools tracked, no tool of week, empty category pages).

- [ ] **Step 6: Commit**
```bash
git add .env.example .env
git commit -m "chore: add ingestion environment variables"
```

---

## Optional: Dev seed script

To manually test the ingest flow locally before deploying:

```bash
# Set INGEST_SECRET in .env first
curl -H "Authorization: Bearer dev-secret-change-me" http://localhost:3000/api/ingest/devto
curl -H "Authorization: Bearer dev-secret-change-me" http://localhost:3000/api/ingest/hackernews
curl -H "Authorization: Bearer dev-secret-change-me" http://localhost:3000/api/ingest/process
```

Or trigger all at once by calling individual routes, then process.

---

## Post-implementation checklist

After all code is merged and deployed:

- [ ] GitHub repo secrets set: `INGEST_SECRET`
- [ ] GitHub repo variables set: `INGEST_CRON` (e.g. `0 */12 * * *`), `APP_URL` (Vercel deployment URL)
- [ ] Vercel environment variables set: `INGEST_SECRET`, `GEMINI_API_KEY`, `GITHUB_TOKEN`, `PRODUCTHUNT_TOKEN`
- [ ] DB migration applied to Neon production branch (`npx drizzle-kit migrate`)
- [ ] Manual ingest test via GitHub Actions `workflow_dispatch` succeeds
- [ ] Home page shows real tools from DB (not hardcoded)
- [ ] Tool detail pages load by slug
- [ ] Category pages show correct counts grouped by category
- [ ] Cron schedule fires on configured interval
---
