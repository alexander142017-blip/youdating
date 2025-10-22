# Reviewer checklist and context — Youdating migration

Summary
- The repository README was updated to reflect the YouDating project (Vite + React + Supabase + Tailwind).
- These PRs migrate/remove Base44 SDK references and add Supabase-backed helpers. Reviewers must verify the migration, ensure no legacy secrets or env vars were reintroduced, and confirm the build & CI expectations.

Quick checklist (run locally before approving)
1. Pull the PR branch and merge or rebase main locally:
   git fetch origin
   git checkout -b review-<pr-number> origin/<head_ref>
   git merge origin/main

2. Install & build:
   npm ci
   npm run build

3. Lint:
   npm run lint

What to verify in this PR
- README compliance
  - Confirm README.md no longer mentions Base44.
  - Confirm README instructions for running locally and required env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are present.

- No legacy keywords or secrets
  - Search repo for banned terms: Base44, base44, VITE_BASE44, any literal secrets.
  - Ensure no secrets or secret-like values were committed.

- Imports & API usage
  - All former base44.* usages are replaced or proxied via the compatibility layer/helpers (imports should point to src/api/*).
  - If a compatibility layer remains (base44Compat/base44Client), confirm it doesn't import @base44/sdk.

- CI / Build
  - CI should run build + lint. If CI failing, get logs and require the author to fix.
  - If the build requires env vars, confirm TODOs are documented in PR and no secret was added.

- Runtime TODOs & stubs
  - If the PR contains integration stubs (sendEmail, file uploads, invokeLLM), ensure they are clearly marked with TODO and do not throw unhandled errors in normal build runs.
  - Verify PR description lists remaining TODOs and database/storage requirements.

- DB/Env requirements
  - Confirm PR documents Supabase tables required (profiles, likes, matches, messages, blocks, reports, purchases, config, analytics_events) and any storage buckets.
  - Check for `.env.example` presence and that it lists VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.

- Tests (if present)
  - Run or review tests. If repository has no tests, confirm the PR adds no unreviewed production logic without TODOs.

How to respond in the PR
- If everything above is satisfied: leave an approval comment and (optionally) request a maintainer merge.
- If there are issues:
  - Add a clear list of failures (build/lint/blocked strings).
  - Request changes and point to the exact files/lines to fix.
  - If the PR requires secrets to fully verify, mark those items as TODO and request the author to document how they will be supplied in the deployment environment.

Suggested reviewer comment (copy/paste)
> Thanks for the PR. I ran the local build/lint checks and reviewed the migration against the new README. Two notes: (1) [describe issue], (2) [describe issue]. Please address these and push; I'll re-run the checks and update my review.

Contact / escalation
- If the PR author is a bot (Copilot) and changes look risky, request a human maintainer review.
- For infra/secret questions, tag repo owner: @alexander142017-blip

Notes
- The repository is case-sensitive on CI (Linux), so ensure filenames match import casing (e.g., App.jsx vs app.jsx).
- Do NOT merge PRs that reintroduce "VITE_BASE44" or any credential-like values.
