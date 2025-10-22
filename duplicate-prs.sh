#!/usr/bin/env bash
#
# duplicate-prs.sh
#
# Duplicates open PRs by creating new branches that apply updated repository rules,
# run build, open new PRs, comment on and close originals.
#
# Usage: ./duplicate-prs.sh
#
# Requirements:
# - gh CLI installed and authenticated
# - git configured
# - npm installed
# - Write access to the repository

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="alexander142017-blip"
REPO_NAME="youdating"
TARGET_BRANCH="main"
PRS_TO_DUPLICATE=(1 2 3 4 5 6 7 8 15)

# Results tracking
declare -A PR_RESULTS

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v gh &> /dev/null; then
        log_error "gh CLI is not installed. Please install from https://cli.github.com/"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        log_error "git is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check gh authentication
    if ! gh auth status &> /dev/null; then
        log_error "gh CLI is not authenticated. Run: gh auth login"
        exit 1
    fi
    
    log_success "All prerequisites met"
}

# Apply repository rules updates
apply_rules_updates() {
    log_info "Applying repository rules updates..."
    
    # 1. Create archive directories
    mkdir -p scripts/archive
    mkdir -p .github/archive
    
    # 2. Move migration scripts to archive
    if [ -f "scripts/migrate-base44.js" ]; then
        mv scripts/migrate-base44.js scripts/archive/migrate-base44.js.disabled
        log_info "Moved scripts/migrate-base44.js to archive"
    fi
    
    if [ -f "scripts_migrate-base44_Version2.js" ]; then
        mv scripts_migrate-base44_Version2.js scripts/archive/scripts_migrate-base44_Version2.js.disabled
        log_info "Moved scripts_migrate-base44_Version2.js to archive"
    fi
    
    if [ -f ".github/workflows/automated-migration.yml" ]; then
        mv .github/workflows/automated-migration.yml .github/archive/automated-migration.yml.disabled
        log_info "Moved .github/workflows/automated-migration.yml to archive"
    fi
    
    if [ -f "workflows/github_workflows_automated-migration_Version2.yml" ]; then
        mv workflows/github_workflows_automated-migration_Version2.yml .github/archive/github_workflows_automated-migration_Version2.yml.disabled
        log_info "Moved workflows/github_workflows_automated-migration_Version2.yml to archive"
    fi
    
    # 3. Update README.md
    log_info "Updating README.md..."
    cat > README.md << 'EOF'
# YouDating

YouDating is a modern dating application built with Vite, React, Tailwind CSS, and Supabase.

## Stack

- **Frontend:** Vite + React
- **Styling:** Tailwind CSS
- **Backend:** Supabase (authentication, database, storage)

## Environment Variables

The application requires the following environment variables:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Quick Start

1. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm ci
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Notes

- Legacy migration scripts related to the previous Base44 SDK have been archived in `scripts/archive/` and `.github/archive/`.
- The app no longer depends on `@base44/sdk`.
- If you see references to Base44 in archive directories or in CHANGELOGs/history, those are historical only and do not affect runtime.
EOF
    
    # 4. Update .github/REVIEWER_INSTRUCTIONS.md
    log_info "Updating .github/REVIEWER_INSTRUCTIONS.md..."
    cat > .github/REVIEWER_INSTRUCTIONS.md << 'EOF'
# Reviewer Checklist — YouDating

## Summary

- The project uses Supabase for backend services
- This checklist helps reviewers confirm PRs are safe to merge

## Quick Checklist (run locally before approving)

1. **Pull the PR branch:**
   ```bash
   git fetch origin
   git checkout -b review-<pr-number> origin/<head_ref>
   git merge origin/main
   ```

2. **Install & build:**
   ```bash
   npm ci
   npm run build
   ```

3. **Lint (if present):**
   ```bash
   npm run lint
   ```

## What to Verify in This PR

### README & Documentation
- Confirm README.md reflects the current stack
- Lists required env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

### No Secrets or Credentials
- Search repo for credential-like strings
- Ensure no secrets are committed

### Imports & API Usage
- Ensure runtime imports point to local API helpers (src/api/*) or Supabase usage
- Confirm there are no direct imports of legacy SDKs in runtime code

### CI / Build
- CI should run build (and lint if configured)
- If CI fails, request fixes and re-run

### Database Environment Variables
- Confirm VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are properly configured
- Check that no hardcoded credentials exist

## How to Respond in a PR

- **If everything passes:** Leave an approval and optionally request a maintainer merge
- **If issues found:** List failures, request changes, and point to exact files/lines to fix
EOF
    
    # 5. Replace tailwind.config.js with CommonJS guarded version
    log_info "Replacing tailwind.config.js..."
    cat > tailwind.config.js << 'EOF'
// Use CommonJS to avoid ESM/CJS interop issues when Tailwind loads the config.
// Gracefully handle missing optional plugin (tailwindcss-animate).
let animatePlugin;
try {
  // try to require the plugin; if not installed, keep animatePlugin null
  // eslint-disable-next-line global-require
  animatePlugin = require('tailwindcss-animate');
} catch (e) {
  animatePlugin = null;
}

module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {}
  },
  plugins: [
    // include plugin only if available
    ...(animatePlugin ? [animatePlugin] : [])
  ]
};
EOF
    
    # 6. Check and uninstall @base44/sdk if present
    if grep -q '"@base44/sdk"' package.json 2>/dev/null; then
        log_info "Removing @base44/sdk from dependencies..."
        npm uninstall @base44/sdk
    fi
    
    log_success "Rules updates applied successfully"
}

# Process a single PR
process_pr() {
    local pr_number=$1
    local original_pr_url="https://github.com/${REPO_OWNER}/${REPO_NAME}/pull/${pr_number}"
    local new_branch="rules-update/pr-${pr_number}"
    
    log_info "========================================="
    log_info "Processing PR #${pr_number}"
    log_info "========================================="
    
    # Check if PR exists and is open
    if ! gh pr view ${pr_number} &> /dev/null; then
        log_warning "PR #${pr_number} does not exist or is not accessible"
        PR_RESULTS[$pr_number]="skipped|PR does not exist"
        return
    fi
    
    local pr_state=$(gh pr view ${pr_number} --json state -q '.state')
    if [ "$pr_state" != "OPEN" ]; then
        log_warning "PR #${pr_number} is not open (state: ${pr_state})"
        PR_RESULTS[$pr_number]="skipped|PR is ${pr_state}"
        return
    fi
    
    # Step 1: Checkout PR branch
    log_info "Step 1: Checking out PR #${pr_number}..."
    if ! gh pr checkout ${pr_number}; then
        log_error "Failed to checkout PR #${pr_number}"
        PR_RESULTS[$pr_number]="failed|checkout|Failed to checkout PR"
        return
    fi
    
    local pr_head_branch=$(git rev-parse --abbrev-ref HEAD)
    log_info "Checked out branch: ${pr_head_branch}"
    
    # Step 2: Create new branch from PR head
    log_info "Step 2: Creating new branch ${new_branch}..."
    if ! git checkout -b ${new_branch}; then
        log_error "Failed to create branch ${new_branch}"
        PR_RESULTS[$pr_number]="failed|branch creation|Failed to create branch"
        git checkout ${TARGET_BRANCH}
        return
    fi
    
    # Step 3: Apply updates
    log_info "Step 3: Applying repository rules updates..."
    apply_rules_updates
    
    # Step 4: Stage and commit changes (if any)
    log_info "Step 4: Staging and committing changes..."
    git add .
    
    if git diff --cached --quiet; then
        log_info "No changes to commit"
    else
        git commit -m "chore(rules): apply updated repository rules — duplicate of PR #${pr_number}"
        log_success "Changes committed"
    fi
    
    # List files changed
    local files_changed=$(git diff --name-only ${TARGET_BRANCH} || echo "")
    
    # Step 5: Build
    log_info "Step 5: Running npm ci and npm run build..."
    
    if ! npm ci 2>&1 | tee /tmp/npm-ci-${pr_number}.log; then
        log_error "npm ci failed for PR #${pr_number}"
        local npm_ci_output=$(tail -50 /tmp/npm-ci-${pr_number}.log)
        PR_RESULTS[$pr_number]="failed|npm ci|${npm_ci_output}"
        git checkout ${TARGET_BRANCH}
        return
    fi
    
    if ! npm run build 2>&1 | tee /tmp/npm-build-${pr_number}.log; then
        log_error "npm run build failed for PR #${pr_number}"
        local build_output=$(tail -50 /tmp/npm-build-${pr_number}.log)
        PR_RESULTS[$pr_number]="failed|npm run build|${build_output}"
        git checkout ${TARGET_BRANCH}
        return
    fi
    
    log_success "Build successful"
    
    # Step 6: Push branch and create PR
    log_info "Step 6: Pushing branch and creating new PR..."
    
    if ! git push origin ${new_branch}; then
        log_error "Failed to push branch ${new_branch}"
        PR_RESULTS[$pr_number]="failed|git push|Failed to push branch"
        git checkout ${TARGET_BRANCH}
        return
    fi
    
    # Create PR body
    local pr_body="This PR applies updated repository rules to the changes from PR #${pr_number}.

## Original PR
- Original PR: #${pr_number}
- Original URL: ${original_pr_url}

## Changes Applied
- ✅ Archived legacy migration scripts to \`scripts/archive/\` and \`.github/archive/\`
- ✅ Updated README.md to document current stack and environment variables
- ✅ Updated REVIEWER_INSTRUCTIONS.md to remove legacy migration references
- ✅ Ensured tailwind.config.js uses CommonJS guarded version
- ✅ Verified no @base44/sdk dependency
- ✅ Local build passed successfully

## Files Changed
\`\`\`
${files_changed}
\`\`\`

## Verification
- ✅ \`npm ci\` completed successfully
- ✅ \`npm run build\` completed successfully

## Related
Closes #${pr_number}"
    
    local new_pr_url
    if new_pr_url=$(gh pr create \
        --title "rules: apply updated rules — duplicate of #${pr_number}" \
        --body "${pr_body}" \
        --base ${TARGET_BRANCH} \
        --head ${new_branch} 2>&1); then
        
        log_success "Created new PR: ${new_pr_url}"
        
        # Comment on original PR
        local comment="🔄 This PR has been duplicated with updated repository rules applied.

**New PR:** ${new_pr_url}

The new PR includes:
- Archived legacy migration scripts
- Updated documentation
- Verified build passes

Please review and merge the updated PR. This PR will be closed."
        
        if gh pr comment ${pr_number} --body "${comment}"; then
            log_success "Commented on original PR #${pr_number}"
        else
            log_warning "Failed to comment on original PR #${pr_number}"
        fi
        
        # Close original PR (but don't delete branch)
        if gh pr close ${pr_number}; then
            log_success "Closed original PR #${pr_number}"
        else
            log_warning "Failed to close original PR #${pr_number}"
        fi
        
        PR_RESULTS[$pr_number]="created|${new_pr_url}|${files_changed}"
    else
        log_error "Failed to create PR: ${new_pr_url}"
        PR_RESULTS[$pr_number]="failed|gh pr create|${new_pr_url}"
    fi
    
    # Return to main branch
    git checkout ${TARGET_BRANCH}
}

# Print results summary
print_results() {
    log_info "========================================="
    log_info "RESULTS SUMMARY"
    log_info "========================================="
    
    for pr_number in "${PRS_TO_DUPLICATE[@]}"; do
        local result="${PR_RESULTS[$pr_number]}"
        local state=$(echo "$result" | cut -d'|' -f1)
        
        echo ""
        echo "PR #${pr_number} - https://github.com/${REPO_OWNER}/${REPO_NAME}/pull/${pr_number}"
        echo "  State: ${state}"
        
        case $state in
            created)
                local new_pr_url=$(echo "$result" | cut -d'|' -f2)
                local files=$(echo "$result" | cut -d'|' -f3)
                echo "  New PR: ${new_pr_url}"
                echo "  Files changed:"
                echo "${files}" | sed 's/^/    /'
                ;;
            failed)
                local failing_step=$(echo "$result" | cut -d'|' -f2)
                local error_output=$(echo "$result" | cut -d'|' -f3-)
                echo "  Failing step: ${failing_step}"
                echo "  Error output:"
                echo "${error_output}" | sed 's/^/    /'
                ;;
            skipped)
                local reason=$(echo "$result" | cut -d'|' -f2)
                echo "  Reason: ${reason}"
                ;;
        esac
    done
    
    echo ""
    log_info "========================================="
}

# Main execution
main() {
    log_info "Starting PR duplication process"
    log_info "Repository: ${REPO_OWNER}/${REPO_NAME}"
    log_info "PRs to process: ${PRS_TO_DUPLICATE[*]}"
    echo ""
    
    check_prerequisites
    
    # Ensure we're on main branch
    git checkout ${TARGET_BRANCH}
    git pull origin ${TARGET_BRANCH}
    
    # Process each PR
    for pr_number in "${PRS_TO_DUPLICATE[@]}"; do
        process_pr ${pr_number}
        echo ""
    done
    
    # Print summary
    print_results
    
    log_success "PR duplication process complete"
}

# Run main function
main
