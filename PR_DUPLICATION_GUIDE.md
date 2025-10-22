# PR Duplication with Rules Update - Guide

## Overview

This guide explains how to duplicate PRs #1-8, 15 from the `alexander142017-blip/youdating` repository with updated repository rules applied.

## Why This Cannot Be Automated by Copilot Agent

The Copilot coding agent has the following limitations that prevent it from completing this task:

### What the Agent CAN do:
- ✅ Read PR information
- ✅ Make code changes locally
- ✅ Commit and push to the current PR branch only
- ✅ Create helper scripts

### What the Agent CANNOT do:
- ❌ Create new pull requests
- ❌ Close pull requests
- ❌ Add comments to pull requests
- ❌ Push to arbitrary branches (only current PR)

## Solution: Automation Script

I've created a bash script (`duplicate-prs-with-rules.sh`) that automates the entire process. You can run this script locally with your GitHub credentials.

## Prerequisites

1. **GitHub CLI (`gh`)** - Install from https://cli.github.com/
2. **Node.js and npm** - For building the project
3. **Git** - Standard git installation
4. **GitHub Authentication** - Run `gh auth login` to authenticate

## Instructions

### Step 1: Download the Script

The script is available at `/tmp/duplicate-prs-with-rules.sh` in the agent's environment. Copy it to your local repository:

```bash
cd /path/to/youdating
# Copy the script content to a new file
nano duplicate-prs-with-rules.sh
# Paste the content and save

# Make it executable
chmod +x duplicate-prs-with-rules.sh
```

### Step 2: Review the Script

Before running, review the script to understand what it does:

```bash
less duplicate-prs-with-rules.sh
```

### Step 3: Run the Script

```bash
./duplicate-prs-with-rules.sh
```

The script will:
1. Check each PR (1,2,3,4,5,6,7,8,15) to see if it exists and is open
2. Skip PRs that are closed or don't exist (like PR 15)
3. For each open PR:
   - Checkout the PR branch
   - Create a new branch `rules-update/pr-N`
   - Apply all rule updates
   - Commit the changes
   - Run `npm ci` and `npm run build`
   - If build succeeds: push the branch, create new PR, comment on old PR, close old PR
   - If build fails: leave branch local and report the error

### Step 4: Review Results

The script will print a summary showing:
- ✅ Successfully processed PRs with new PR URLs
- ❌ Failed PRs with error reasons
- ⊘ Skipped PRs (closed or non-existent)

## Rules Applied to Each PR

The script applies the following changes to each PR branch:

### 1. Create Archive Directories
- `scripts/archive/`
- `.github/archive/`

### 2. Move Files to Archive

If these files exist, they are moved and renamed with `.disabled` extension:

| Original Path | New Path |
|--------------|----------|
| `scripts/migrate-base44.js` | `scripts/archive/migrate-base44.js.disabled` |
| `scripts_migrate-base44_Version2.js` | `scripts/archive/scripts_migrate-base44_Version2.js.disabled` |
| `.github/workflows/automated-migration.yml` | `.github/archive/automated-migration.yml.disabled` |
| `workflows/github_workflows_automated-migration_Version2.yml` | `.github/archive/github_workflows_automated-migration_Version2.yml.disabled` |

### 3. Update README.md

- Remove lines referencing `migrate-base44` and `@base44/sdk`
- Add a note about legacy scripts being archived
- List required environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### 4. Update `.github/REVIEWER_INSTRUCTIONS.md`

- Remove instructions to run migration scripts
- Remove references to Base44
- Keep checklist items about:
  - No secrets
  - Build/lint checks
  - Database environment requirements

### 5. Replace `tailwind.config.js`

Replace with CommonJS guarded version that:
- Uses `module.exports` instead of ESM export
- Gracefully handles missing `tailwindcss-animate` plugin
- Uses try/catch to avoid errors if plugin not installed

### 6. Remove @base44/sdk Dependency

If `package.json` references `@base44/sdk`:
- Run `npm uninstall @base44/sdk`
- Update `package-lock.json`

## Manual Execution (Alternative)

If you prefer to process PRs manually, here's the process for each PR:

```bash
# For each PR number N:

# 1. Checkout the PR
gh pr checkout N

# 2. Create new branch
git checkout -b rules-update/pr-N

# 3. Apply rules (see "Rules Applied" section above)
mkdir -p scripts/archive .github/archive
# ... apply each rule manually ...

# 4. Commit changes
git add .
git commit -m "chore(rules): apply updated repository rules — duplicate of PR #N"

# 5. Build and test
npm ci
npm run build

# 6. If build succeeds, push and create PR
git push origin rules-update/pr-N
gh pr create \
  --title "rules: apply updated rules — duplicate of #N" \
  --body "Duplicate of #N with updated rules" \
  --base main \
  --head rules-update/pr-N

# 7. Comment on and close original PR
gh pr comment N --body "Closing in favor of updated PR: [URL]"
gh pr close N
```

## Expected Outcomes

### For Each PR:

**If Successful:**
- New branch created: `rules-update/pr-N`
- New PR opened with title: "rules: apply updated rules — duplicate of #N"
- Original PR receives comment linking to new PR
- Original PR is closed (branch NOT deleted)
- New PR includes build status and list of changed files

**If Build Fails:**
- New branch left locally for manual debugging
- Error reported with exact build output
- Original PR remains open and unchanged
- User can manually fix issues and continue

**If PR is Closed/Non-existent:**
- PR is skipped with a note in the summary
- No changes made

### For PR #15:
PR #15 does not exist in the repository, so it will be skipped with a note: "PR #15 does not exist. Skipping."

## Troubleshooting

### "gh: command not found"
Install GitHub CLI: https://cli.github.com/

### "gh: authentication required"
Run: `gh auth login`

### "npm ci failed"
- Check if `node_modules` exists and delete it
- Verify Node.js version compatibility
- Check for corrupted `package-lock.json`

### "build failed"
- Review the build error output
- The branch will be left locally for debugging
- Fix issues manually, then run:
  ```bash
  npm run build  # verify fix
  git add . && git commit --amend --no-edit
  git push origin rules-update/pr-N
  gh pr create ...  # create PR manually
  ```

### Script stops unexpectedly
- Check the summary output for which PR failed
- Fix the issue manually for that PR
- Re-run the script (it will skip already-processed PRs if branches exist)

## Notes on Branch Preservation

- Original PR branches are NOT deleted
- New branches are created alongside originals
- Both branches remain in the repository
- Original PRs are closed but their branches remain for reference

## Security Considerations

The script:
- Does NOT add any secrets to the repository
- Only modifies files according to the documented rules
- Runs `npm ci` and `npm run build` to verify changes don't break the build
- Leaves failed builds local (not pushed) for manual review

## Support

If you encounter issues:

1. Check the script output for specific error messages
2. Review this guide's Troubleshooting section
3. Manually verify the PR status with: `gh pr view N`
4. Check build logs for detailed error information

## Summary Table

| PR # | Expected Status | Reason |
|------|----------------|--------|
| 1    | Will process   | Open draft PR |
| 2    | Will process   | Open draft PR |
| 3    | Will process   | Open draft PR |
| 4    | Will process   | Open draft PR |
| 5    | Will process   | Open draft PR |
| 6    | Will process   | Open draft PR |
| 7    | Will process   | Open draft PR |
| 8    | Will process   | Open PR |
| 15   | Will skip      | Does not exist |
