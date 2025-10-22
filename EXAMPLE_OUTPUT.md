# Example Script Output

This document shows what the output of `duplicate-prs.sh` looks like when executed.

## Successful Execution Example

```bash
$ ./duplicate-prs.sh

[INFO] Starting PR duplication process
[INFO] Repository: alexander142017-blip/youdating
[INFO] PRs to process: 1 2 3 4 5 6 7 8 15

[INFO] Checking prerequisites...
[SUCCESS] All prerequisites met
[INFO] =========================================
[INFO] Processing PR #1
[INFO] =========================================
[INFO] Step 1: Checking out PR #1...
[INFO] Checked out branch: copilot/remove-base44-sdk-references
[INFO] Step 2: Creating new branch rules-update/pr-1...
[INFO] Step 3: Applying repository rules updates...
[INFO] Applying repository rules updates...
[INFO] Moved scripts/migrate-base44.js to archive
[INFO] Updating README.md...
[INFO] Updating .github/REVIEWER_INSTRUCTIONS.md...
[INFO] Replacing tailwind.config.js...
[SUCCESS] Rules updates applied successfully
[INFO] Step 4: Staging and committing changes...
[SUCCESS] Changes committed
[INFO] Step 5: Running npm ci and npm run build...
[SUCCESS] Build successful
[INFO] Step 6: Pushing branch and creating new PR...
[SUCCESS] Created new PR: https://github.com/alexander142017-blip/youdating/pull/20
[SUCCESS] Commented on original PR #1
[SUCCESS] Closed original PR #1

[INFO] =========================================
[INFO] Processing PR #2
[INFO] =========================================
[INFO] Step 1: Checking out PR #2...
[INFO] Checked out branch: copilot/remove-base44-sdk-and-replace
[INFO] Step 2: Creating new branch rules-update/pr-2...
[INFO] Step 3: Applying repository rules updates...
[INFO] Applying repository rules updates...
[INFO] Updating README.md...
[INFO] Updating .github/REVIEWER_INSTRUCTIONS.md...
[INFO] Replacing tailwind.config.js...
[SUCCESS] Rules updates applied successfully
[INFO] Step 4: Staging and committing changes...
[SUCCESS] Changes committed
[INFO] Step 5: Running npm ci and npm run build...
[SUCCESS] Build successful
[INFO] Step 6: Pushing branch and creating new PR...
[SUCCESS] Created new PR: https://github.com/alexander142017-blip/youdating/pull/21
[SUCCESS] Commented on original PR #2
[SUCCESS] Closed original PR #2

[... similar output for PRs 3-8 ...]

[INFO] =========================================
[INFO] Processing PR #15
[INFO] =========================================
[WARNING] PR #15 does not exist or is not accessible

[INFO] =========================================
[INFO] RESULTS SUMMARY
[INFO] =========================================

PR #1 - https://github.com/alexander142017-blip/youdating/pull/1
  State: created
  New PR: https://github.com/alexander142017-blip/youdating/pull/20
  Files changed:
    .github/REVIEWER_INSTRUCTIONS.md
    README.md
    scripts/archive/migrate-base44.js.disabled
    tailwind.config.js

PR #2 - https://github.com/alexander142017-blip/youdating/pull/2
  State: created
  New PR: https://github.com/alexander142017-blip/youdating/pull/21
  Files changed:
    .github/REVIEWER_INSTRUCTIONS.md
    README.md
    tailwind.config.js

PR #3 - https://github.com/alexander142017-blip/youdating/pull/3
  State: created
  New PR: https://github.com/alexander142017-blip/youdating/pull/22
  Files changed:
    .github/REVIEWER_INSTRUCTIONS.md
    README.md
    tailwind.config.js

PR #4 - https://github.com/alexander142017-blip/youdating/pull/4
  State: created
  New PR: https://github.com/alexander142017-blip/youdating/pull/23
  Files changed:
    .github/REVIEWER_INSTRUCTIONS.md
    README.md
    tailwind.config.js

PR #5 - https://github.com/alexander142017-blip/youdating/pull/5
  State: created
  New PR: https://github.com/alexander142017-blip/youdating/pull/24
  Files changed:
    .github/REVIEWER_INSTRUCTIONS.md
    README.md
    tailwind.config.js

PR #6 - https://github.com/alexander142017-blip/youdating/pull/6
  State: created
  New PR: https://github.com/alexander142017-blip/youdating/pull/25
  Files changed:
    .github/REVIEWER_INSTRUCTIONS.md
    README.md
    tailwind.config.js

PR #7 - https://github.com/alexander142017-blip/youdating/pull/7
  State: created
  New PR: https://github.com/alexander142017-blip/youdating/pull/26
  Files changed:
    .github/REVIEWER_INSTRUCTIONS.md
    README.md
    tailwind.config.js

PR #8 - https://github.com/alexander142017-blip/youdating/pull/8
  State: created
  New PR: https://github.com/alexander142017-blip/youdating/pull/27
  Files changed:
    .github/REVIEWER_INSTRUCTIONS.md
    README.md
    tailwind.config.js

PR #15 - https://github.com/alexander142017-blip/youdating/pull/15
  State: skipped
  Reason: PR does not exist

[SUCCESS] PR duplication process complete
```

## Example: Build Failure Scenario

If a build fails for a specific PR, the output would look like:

```bash
[INFO] =========================================
[INFO] Processing PR #5
[INFO] =========================================
[INFO] Step 1: Checking out PR #5...
[INFO] Checked out branch: copilot/remove-base44-sdk-replace-supabase
[INFO] Step 2: Creating new branch rules-update/pr-5...
[INFO] Step 3: Applying repository rules updates...
[SUCCESS] Rules updates applied successfully
[INFO] Step 4: Staging and committing changes...
[SUCCESS] Changes committed
[INFO] Step 5: Running npm ci and npm run build...
[ERROR] npm run build failed for PR #5

[INFO] =========================================
[INFO] RESULTS SUMMARY
[INFO] =========================================

PR #5 - https://github.com/alexander142017-blip/youdating/pull/5
  State: failed
  Failing step: npm run build
  Error output:
    > youdating@0.0.0 build
    > vite build
    
    vite v7.1.11 building for production...
    ✓ 1844 modules transformed.
    x Build failed in 1.52s
    error during build:
    [vite]: Rollup failed to resolve import "@/components/InvalidComponent" from "src/pages/SomePage.jsx".
    This is most likely unintended because it can break your application at runtime.
    
    [... more error details ...]
```

In this case:
- The branch `rules-update/pr-5` remains local (not pushed)
- The error details are captured and reported
- Processing continues with the next PR
- The user can manually investigate and fix the issue

## Example: Skipped PR Scenario

If a PR is already closed or doesn't exist:

```bash
[INFO] =========================================
[INFO] Processing PR #15
[INFO] =========================================
[WARNING] PR #15 is not open (state: CLOSED)

[INFO] =========================================
[INFO] RESULTS SUMMARY
[INFO] =========================================

PR #15 - https://github.com/alexander142017-blip/youdating/pull/15
  State: skipped
  Reason: PR is CLOSED
```

## Understanding the Results

### State: created
- ✅ PR was successfully processed
- ✅ Build passed
- ✅ New PR created and original closed
- ✅ All files listed in "Files changed"

### State: failed
- ❌ Processing stopped at a specific step
- 📝 Exact error output provided
- 🔍 Branch left local for investigation
- 👉 User can manually fix and continue

### State: skipped
- ℹ️ PR was not processed
- ℹ️ Reason provided (doesn't exist, closed, merged, etc.)
- ➡️ No action taken, script continues to next PR
