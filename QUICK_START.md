# Quick Start: PR Duplication

**TL;DR:** Run `./duplicate-prs.sh` to automatically duplicate PRs 1-8, 15 with updated repository rules.

## Prerequisites (One-Time Setup)

```bash
# 1. Install GitHub CLI
brew install gh  # macOS
# or see: https://cli.github.com/manual/installation

# 2. Authenticate
gh auth login

# 3. Verify
gh auth status
```

## Execute

```bash
# Navigate to repository
cd /path/to/youdating

# Run the script
./duplicate-prs.sh
```

That's it! The script handles everything automatically.

## What Happens

For each PR (1, 2, 3, 4, 5, 6, 7, 8, 15):

1. ✅ Checks out PR branch
2. ✅ Creates new branch `rules-update/pr-N`
3. ✅ Applies repository rules:
   - Archives migration scripts
   - Updates README.md
   - Updates REVIEWER_INSTRUCTIONS.md
   - Ensures tailwind.config.js is correct
   - Removes @base44/sdk if present
4. ✅ Runs `npm ci` and `npm run build`
5. ✅ If build succeeds:
   - Pushes branch
   - Creates new PR
   - Comments on original
   - Closes original
6. ❌ If build fails:
   - Reports error
   - Leaves branch local
   - Continues to next PR

## Results

After completion, you'll see a summary like:

```
PR #1 - State: created
  New PR: https://github.com/.../pull/20
  Files changed: [list]

PR #2 - State: created
  New PR: https://github.com/.../pull/21
  Files changed: [list]

...

PR #15 - State: skipped
  Reason: PR does not exist
```

## Troubleshooting

**Script can't authenticate?**
```bash
gh auth login
```

**Build fails for a PR?**
- Check the error output in the summary
- Manually investigate: `git checkout rules-update/pr-N`
- Fix issues and manually push

**Want more details?**
- See `DUPLICATION_INSTRUCTIONS.md` for comprehensive guide
- See `EXAMPLE_OUTPUT.md` for detailed output examples

## Manual Alternative

If you prefer manual control:

```bash
# For each PR N:
gh pr checkout N
git checkout -b rules-update/pr-N
# ... apply changes ...
npm ci && npm run build
git push origin rules-update/pr-N
gh pr create --title "rules: apply updated rules — duplicate of #N"
gh pr comment N --body "Closing in favor of updated PR"
gh pr close N
```

See `DUPLICATION_INSTRUCTIONS.md` for complete manual steps.
