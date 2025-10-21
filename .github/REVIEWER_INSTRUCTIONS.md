# Reviewer checklist — YouDating

Summary
- The project uses Supabase for backend helpers and no runtime dependency on the old Base44 SDK.
- This checklist helps reviewers confirm PRs are safe to merge.

Quick checklist (run locally before approving)
1. Pull the PR branch and merge or rebase main:
   git fetch origin
   git checkout -b review-<pr-number> origin/<head_ref>
   git merge origin/main

2. Install & build:
   npm ci
   npm run build

3. Lint (if present):
   npm run lint

What to verify in this PR
- README & docs
  - Confirm README.md reflects the current stack and lists required env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).

- No secrets or credentials
  - Search repo for credential-like strings. Ensure no secrets are committed.

- Imports & API usage
  - Ensure runtime imports point to local API helpers (src/api/*) or Supabase usage.
  - Confirm there are no direct imports of legacy SDKs in runtime code.

- CI / Build
  - CI should run build (and lint if configured). If CI fails, request fixes and re-run.

- Runtime TODOs & stubs
  - If there are stubs or TODOs (e.g., sendEmail, file uploads), ensure they are clearly marked and do not break build.

How to respond in a PR
- If everything passes: leave an approval and optionally request a maintainer merge.
- If issues found: list failures, request changes, and point to exact files/lines to fix.
