# PR Duplication Automation Package

This package contains everything needed to duplicate open PRs [1,2,3,4,5,6,7,8,15] with updated repository rules.

## 📦 Package Contents

| File | Purpose | Lines |
|------|---------|-------|
| `duplicate-prs.sh` | Main automation script (executable) | 455 |
| `QUICK_START.md` | Quick execution guide (TL;DR) | 80 |
| `DUPLICATION_INSTRUCTIONS.md` | Comprehensive manual | 198 |
| `EXAMPLE_OUTPUT.md` | Expected output examples | 209 |
| `PR_DUPLICATION_README.md` | This file | - |

## 🚀 Quick Start

**Want to get started immediately?** See [`QUICK_START.md`](QUICK_START.md)

```bash
gh auth login            # One-time setup
./duplicate-prs.sh       # Execute
```

## 📚 Documentation

### For Most Users
Start with [`QUICK_START.md`](QUICK_START.md) - it has everything you need in 2 minutes.

### Need More Details?
See [`DUPLICATION_INSTRUCTIONS.md`](DUPLICATION_INSTRUCTIONS.md) for:
- Detailed prerequisites
- Step-by-step walkthrough
- Troubleshooting guide
- Manual fallback procedures

### Want to See Output?
Check [`EXAMPLE_OUTPUT.md`](EXAMPLE_OUTPUT.md) for:
- Successful execution example
- Build failure scenario
- Skipped PR scenario
- Result interpretation guide

## 🎯 What This Does

The automation script processes PRs 1, 2, 3, 4, 5, 6, 7, 8, and 15:

### For Each PR:

1. **Checkout** - Gets the PR branch locally
2. **Branch** - Creates `rules-update/pr-N` from PR head
3. **Update** - Applies repository rules:
   - Archives migration scripts to `scripts/archive/` and `.github/archive/`
   - Updates `README.md` to document current stack and env vars
   - Updates `.github/REVIEWER_INSTRUCTIONS.md` to remove migration steps
   - Ensures `tailwind.config.js` uses CommonJS guarded version
   - Removes `@base44/sdk` dependency if present
4. **Commit** - Saves changes with proper message
5. **Build** - Runs `npm ci` and `npm run build` to verify
6. **Publish** - If build succeeds:
   - Pushes the new branch
   - Creates new PR with title: `rules: apply updated rules — duplicate of #N`
   - Comments on original PR with link to new PR
   - Closes original PR (keeps branch)
7. **Report** - If build fails:
   - Leaves branch local (not pushed)
   - Reports exact error output
   - Continues to next PR

### Results Summary

After processing all PRs, you get a detailed summary:

```
PR #N - State: created|failed|skipped
  [Detailed information based on state]
```

## ✅ Features

- **Safe** - No secrets added, no branches deleted
- **Robust** - Validates prerequisites, handles errors
- **Clear** - Colored output, detailed logging
- **Complete** - Tracks every PR, reports all results
- **Flexible** - Continues on failures, skips closed PRs

## ⚙️ Requirements

- GitHub CLI (`gh`) - [Install guide](https://cli.github.com/manual/installation)
- Git - Configured with write access
- Node.js + npm - v16 or higher
- Authentication - `gh auth login`

## 🔧 Troubleshooting

**Script won't run?**
```bash
chmod +x duplicate-prs.sh
```

**Authentication issues?**
```bash
gh auth login
gh auth status
```

**Build fails for a PR?**
- Check error output in results summary
- Investigate: `git checkout rules-update/pr-N`
- Fix and manually push

**Want to skip a PR?**
- Edit the `PRS_TO_DUPLICATE` array in `duplicate-prs.sh`

## 📊 Expected Results

Based on current PR states:

| PR | Expected State | Reason |
|----|----------------|--------|
| 1 | created | Open, likely buildable |
| 2 | created | Open, likely buildable |
| 3 | created | Open, likely buildable |
| 4 | created | Open, likely buildable |
| 5 | created | Open, likely buildable |
| 6 | created | Open, likely buildable |
| 7 | created | Open, likely buildable |
| 8 | created | Open, likely buildable |
| 15 | skipped | Does not exist |

**Note:** Actual results depend on PR state at execution time.

## 🐛 Issues or Questions?

1. Check [`DUPLICATION_INSTRUCTIONS.md`](DUPLICATION_INSTRUCTIONS.md) - comprehensive troubleshooting section
2. Review [`EXAMPLE_OUTPUT.md`](EXAMPLE_OUTPUT.md) - see expected outputs
3. Check script logs in `/tmp/npm-ci-N.log` and `/tmp/npm-build-N.log`
4. Verify prerequisites are properly installed and configured

## 🔄 Manual Alternative

Prefer to do it manually? See the "Manual Process" section in [`DUPLICATION_INSTRUCTIONS.md`](DUPLICATION_INSTRUCTIONS.md) for step-by-step commands.

## 📝 Technical Details

### Repository Rules Applied

The script applies these specific updates to match repository standards:

1. **Archive Creation**
   - Creates `scripts/archive/` for old migration scripts
   - Creates `.github/archive/` for old workflows

2. **File Moves** (with `.disabled` extension)
   - `scripts/migrate-base44.js`
   - `scripts_migrate-base44_Version2.js`
   - `.github/workflows/automated-migration.yml`
   - `workflows/github_workflows_automated-migration_Version2.yml`

3. **README.md Updates**
   - Removes references to `migrate-base44` and `@base44/sdk`
   - Documents current stack: Vite + React + Tailwind + Supabase
   - Lists required environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

4. **REVIEWER_INSTRUCTIONS.md Updates**
   - Removes migration-run instructions
   - Removes Base44 references
   - Keeps essential checklist items (no-secrets, build/lint, env requirements)

5. **tailwind.config.js Replacement**
   - Uses CommonJS module.exports
   - Gracefully handles missing tailwindcss-animate plugin
   - Proper ESM/CJS interop

6. **Dependency Cleanup**
   - Uninstalls `@base44/sdk` if present in package.json

### Commit Message Format

```
chore(rules): apply updated repository rules — duplicate of PR #N
```

### New PR Format

- **Title:** `rules: apply updated rules — duplicate of #N`
- **Body:** Links to original, lists changes, shows build status
- **Base:** `main`
- **Head:** `rules-update/pr-N`

## 🎉 Success Criteria

The script is successful when:

- ✅ All open PRs processed (created, failed, or skipped)
- ✅ New PRs created for buildable original PRs
- ✅ Original PRs closed with comment linking to new PR
- ✅ Failed PRs reported with exact error details
- ✅ No branches deleted
- ✅ No secrets added
- ✅ Comprehensive results summary provided

---

**Ready to begin?** Start with [`QUICK_START.md`](QUICK_START.md) or run `./duplicate-prs.sh` now!
