### Task 10: GitHub Actions workflow

**Files:**
- Create: .github/workflows/ingest.yml

- [ ] **Step 1: Create directory and workflow file**
```bash
$null = New-Item -ItemType Directory -Path ".github/workflows" -Force
```

```yaml
name: Ingest tools
on:
  schedule:
    - cron: ${{ vars.INGEST_CRON || '0 */12 * * *' }}
  workflow_dispatch:

jobs:
  devto:
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsS -H "Authorization: Bearer ${{ secrets.INGEST_SECRET }}" "${{ vars.APP_URL }}/api/ingest/devto"

  hackernews:
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsS -H "Authorization: Bearer ${{ secrets.INGEST_SECRET }}" "${{ vars.APP_URL }}/api/ingest/hackernews"

  github:
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsS -H "Authorization: Bearer ${{ secrets.INGEST_SECRET }}" "${{ vars.APP_URL }}/api/ingest/github"

  producthunt:
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsS -H "Authorization: Bearer ${{ secrets.INGEST_SECRET }}" "${{ vars.APP_URL }}/api/ingest/producthunt"

  process:
    needs: [devto, hackernews, github, producthunt]
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsS -H "Authorization: Bearer ${{ secrets.INGEST_SECRET }}" "${{ vars.APP_URL }}/api/ingest/process"
```

**GitHub repo setup required:**
- Secrets: `INGEST_SECRET`
- Variables: `INGEST_CRON` (defaults to `0 */12 * * *`), `APP_URL` (your Vercel deployment URL)

- [ ] **Step 2: Commit**
```bash
git add .github/workflows/ingest.yml
git commit -m "feat: add GitHub Actions ingest workflow"
```

---
