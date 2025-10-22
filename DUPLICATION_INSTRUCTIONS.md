# PR Duplication Instructions

This document explains how to duplicate open PRs [1,2,3,4,5,6,7,8,15] with updated repository rules.

## Prerequisites

Before running the duplication script, ensure you have:

1. **GitHub CLI (`gh`) installed and authenticated**
   ```bash
   # Install gh CLI (if not installed)
   # macOS:
   brew install gh
   
   # Linux:
   # See: https://github.com/cli/cli/blob/trunk/docs/install_linux.md
   
   # Windows:
   # See: https://github.com/cli/cli#installation
   
   # Authenticate
   gh auth login
   ```

2. **Git configured with write access to the repository**
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

3. **Node.js and npm installed**
   ```bash
   node --version  # Should be v16 or higher
   npm --version
   ```

## Running the Script

1. **Clone the repository (if not already done)**
   ```bash
   git clone https://github.com/alexander142017-blip/youdating.git
   cd youdating
   ```

2. **Ensure you're on the main branch with latest changes**
   ```bash
   git checkout main
   git pull origin main
   ```

3. **Run the duplication script**
   ```bash
   ./duplicate-prs.sh
   ```

The script will automatically:
- Process each PR (1, 2, 3, 4, 5, 6, 7, 8, 15)
- Create a new branch `rules-update/pr-N` for each
- Apply the required updates
- Run `npm ci` and `npm run build`
- Push the new branch
- Create a new PR
- Comment on the original PR
- Close the original PR

## What the Script Does

For each PR number N, the script:

1. **Checks out the PR branch** using `gh pr checkout N`

2. **Creates a new branch** `rules-update/pr-N` from the PR head

3. **Applies these updates:**
   - Creates `scripts/archive` and `.github/archive` directories
   - Moves migration scripts to archive with `.disabled` extension:
     - `scripts/migrate-base44.js` → `scripts/archive/migrate-base44.js.disabled`
     - `scripts_migrate-base44_Version2.js` → `scripts/archive/scripts_migrate-base44_Version2.js.disabled`
     - `.github/workflows/automated-migration.yml` → `.github/archive/automated-migration.yml.disabled`
     - `workflows/github_workflows_automated-migration_Version2.yml` → `.github/archive/github_workflows_automated-migration_Version2.yml.disabled`
   - Updates `README.md` to:
     - Remove references to migrate-base44 and @base44/sdk
     - Add documentation about the current stack (Vite + React + Tailwind + Supabase)
     - Document required environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
   - Updates `.github/REVIEWER_INSTRUCTIONS.md` to:
     - Remove migration-run instructions
     - Remove Base44 references
     - Keep essential checklist items
   - Replaces `tailwind.config.js` with CommonJS guarded version
   - Uninstalls `@base44/sdk` if present in package.json

4. **Commits changes** with message: `chore(rules): apply updated repository rules — duplicate of PR #N`

5. **Runs build verification:**
   ```bash
   npm ci
   npm run build
   ```
   - If build fails, stops processing this PR and reports error
   - Leaves branch local (does not push)
   - Reports detailed error output

6. **If build succeeds:**
   - Pushes the `rules-update/pr-N` branch
   - Creates a new PR with title: `rules: apply updated rules — duplicate of #N`
   - PR body includes:
     - Link to original PR
     - List of changes applied
     - Build verification status
     - Files changed
   - Comments on original PR with link to new PR
   - Closes original PR (does NOT delete branches)

## Output Format

After processing all PRs, the script outputs a summary for each:

```
PR #N - https://github.com/alexander142017-blip/youdating/pull/N
  State: created|failed|skipped
  
  If created:
    New PR: <URL>
    Files changed: <list>
  
  If failed:
    Failing step: <step name>
    Error output: <exact error>
  
  If skipped:
    Reason: <reason>
```

## Troubleshooting

### Script fails with "gh CLI is not authenticated"
```bash
gh auth login
# Follow the prompts to authenticate
```

### Build fails for a specific PR
The script will:
- Stop processing that PR
- Leave the branch local (not pushed)
- Report the exact error output
- Continue to the next PR

You can manually investigate:
```bash
git checkout rules-update/pr-N
npm ci
npm run build
# Fix issues, commit, and manually push
```

### PR #15 doesn't exist
If PR #15 doesn't exist or is closed, the script will skip it and report:
```
PR #15
  State: skipped
  Reason: PR does not exist
```

## Manual Process (Alternative)

If you prefer to process PRs manually or the script fails, you can follow these steps:

```bash
# For each PR N:

# 1. Checkout PR
gh pr checkout N

# 2. Create new branch
git checkout -b rules-update/pr-N

# 3. Apply updates (run these commands)
mkdir -p scripts/archive .github/archive

# Move migration scripts if they exist
[ -f "scripts/migrate-base44.js" ] && mv scripts/migrate-base44.js scripts/archive/migrate-base44.js.disabled
[ -f "scripts_migrate-base44_Version2.js" ] && mv scripts_migrate-base44_Version2.js scripts/archive/scripts_migrate-base44_Version2.js.disabled
[ -f ".github/workflows/automated-migration.yml" ] && mv .github/workflows/automated-migration.yml .github/archive/automated-migration.yml.disabled
[ -f "workflows/github_workflows_automated-migration_Version2.yml" ] && mv workflows/github_workflows_automated-migration_Version2.yml .github/archive/github_workflows_automated-migration_Version2.yml.disabled

# Update README.md and REVIEWER_INSTRUCTIONS.md
# (Edit manually or use script)

# Uninstall @base44/sdk if present
if grep -q "@base44/sdk" package.json; then
    npm uninstall @base44/sdk
fi

# 4. Commit
git add .
git commit -m "chore(rules): apply updated repository rules — duplicate of PR #N"

# 5. Build
npm ci
npm run build

# 6. If build succeeds
git push origin rules-update/pr-N
gh pr create --title "rules: apply updated rules — duplicate of #N" --base main --head rules-update/pr-N
gh pr comment N --body "Closing in favor of updated PR"
gh pr close N
```

## Constraints

- **No branches deleted:** Original PR branches are NOT deleted
- **No secrets added:** Script does not add any secrets or credentials
- **Stops on failure:** If a build fails for any PR, that PR is left local and the error is reported
- **Continues on skip:** If a PR doesn't exist or is closed, it's skipped and the script continues

## Support

If you encounter issues:

1. Check the script output for detailed error messages
2. Verify all prerequisites are installed and configured
3. Check GitHub permissions (write access required)
4. Review build logs in `/tmp/npm-ci-N.log` and `/tmp/npm-build-N.log`
