### Task 10: GitHub Actions workflow — DONE

**Commit:** 864dcb0

**Created:** `.github/workflows/ingest.yml`

**Jobs:**

- `devto` — curl `/api/ingest/devto`
- `hackernews` — curl `/api/ingest/hackernews`
- `github` — curl `/api/ingest/github`
- `producthunt` — curl `/api/ingest/producthunt`
- `process` — curl `/api/ingest/process` (needs all above)

**Schedule:** `${{ vars.INGEST_CRON || '0 */12 * * *' }}` + manual dispatch

**Repo setup needed:**

- Secret: `INGEST_SECRET`
- Variables: `INGEST_CRON`, `APP_URL`
