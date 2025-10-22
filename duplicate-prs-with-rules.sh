#!/bin/bash

# Script to duplicate PRs with updated repository rules
# Usage: ./duplicate-prs-with-rules.sh

set -e  # Exit on error

# Configuration
REPO="alexander142017-blip/youdating"
BASE_BRANCH="main"
PR_NUMBERS=(1 2 3 4 5 6 7 8 15)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Results tracking
declare -a SUCCESS_PRS
declare -a FAILED_PRS
declare -a SKIPPED_PRS

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if PR exists and is open
check_pr_status() {
    local pr_num=$1
    local status=$(gh pr view $pr_num --json state --jq '.state' 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$status" == "NOT_FOUND" ]; then
        echo "NOT_FOUND"
    elif [ "$status" == "OPEN" ]; then
        echo "OPEN"
    else
        echo "CLOSED"
    fi
}

# Function to apply updated rules to the working tree
apply_rules() {
    local pr_num=$1
    log_info "Applying updated rules for PR #$pr_num..."
    
    # 1. Create archive directories
    mkdir -p scripts/archive
    mkdir -p .github/archive
    
    # 2. Move migration scripts to archive if they exist
    if [ -f "scripts/migrate-base44.js" ]; then
        git mv scripts/migrate-base44.js scripts/archive/migrate-base44.js.disabled
        log_info "Moved scripts/migrate-base44.js to archive"
    fi
    
    if [ -f "scripts_migrate-base44_Version2.js" ]; then
        git mv scripts_migrate-base44_Version2.js scripts/archive/scripts_migrate-base44_Version2.js.disabled
        log_info "Moved scripts_migrate-base44_Version2.js to archive"
    fi
    
    # 3. Move workflow files to archive if they exist
    if [ -f ".github/workflows/automated-migration.yml" ]; then
        git mv .github/workflows/automated-migration.yml .github/archive/automated-migration.yml.disabled
        log_info "Moved automated-migration.yml to archive"
    fi
    
    if [ -f "workflows/github_workflows_automated-migration_Version2.yml" ]; then
        git mv workflows/github_workflows_automated-migration_Version2.yml .github/archive/github_workflows_automated-migration_Version2.yml.disabled
        log_info "Moved github_workflows_automated-migration_Version2.yml to archive"
    fi
    
    # 4. Update README.md
    if [ -f "README.md" ]; then
        # Remove lines referencing migrate-base44 and @base44/sdk
        sed -i '/migrate-base44/d' README.md
        sed -i '/@base44\/sdk/d' README.md
        
        # Ensure it mentions archived scripts (if not already present)
        if ! grep -q "legacy.*archive" README.md; then
            cat >> README.md << 'EOF'

## Legacy Scripts
Legacy migration scripts related to Base44 have been archived in `scripts/archive/` and `.github/archive/`. The app now uses Supabase exclusively.

## Required Environment Variables
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
EOF
        fi
        log_info "Updated README.md"
    fi
    
    # 5. Update REVIEWER_INSTRUCTIONS.md
    if [ -f ".github/REVIEWER_INSTRUCTIONS.md" ]; then
        # Remove migration script instructions and Base44 references
        sed -i '/run.*migration.*script/Id' .github/REVIEWER_INSTRUCTIONS.md
        sed -i '/Base44/d' .github/REVIEWER_INSTRUCTIONS.md
        sed -i '/base44/d' .github/REVIEWER_INSTRUCTIONS.md
        
        # Ensure DB env requirements are present
        if ! grep -q "VITE_SUPABASE" .github/REVIEWER_INSTRUCTIONS.md; then
            sed -i '/required env/a - VITE_SUPABASE_URL\n- VITE_SUPABASE_ANON_KEY' .github/REVIEWER_INSTRUCTIONS.md || true
        fi
        log_info "Updated REVIEWER_INSTRUCTIONS.md"
    fi
    
    # 6. Replace tailwind.config.js with CommonJS guarded version
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
    log_info "Replaced tailwind.config.js with CommonJS guarded version"
    
    # 7. Check for @base44/sdk in package.json and remove if present
    if grep -q '"@base44/sdk"' package.json 2>/dev/null; then
        log_info "Found @base44/sdk in package.json, removing..."
        npm uninstall @base44/sdk
        log_info "Removed @base44/sdk"
    fi
}

# Function to process a single PR
process_pr() {
    local pr_num=$1
    log_info "========================================="
    log_info "Processing PR #$pr_num"
    log_info "========================================="
    
    # Check if PR exists and is open
    local pr_status=$(check_pr_status $pr_num)
    
    if [ "$pr_status" == "NOT_FOUND" ]; then
        log_warn "PR #$pr_num does not exist. Skipping."
        SKIPPED_PRS+=("$pr_num (NOT_FOUND)")
        return 1
    fi
    
    if [ "$pr_status" != "OPEN" ]; then
        log_warn "PR #$pr_num is not open (status: $pr_status). Skipping."
        SKIPPED_PRS+=("$pr_num ($pr_status)")
        return 1
    fi
    
    # Get PR branch name
    local pr_branch=$(gh pr view $pr_num --json headRefName --jq '.headRefName')
    local new_branch="rules-update/pr-$pr_num"
    
    log_info "PR branch: $pr_branch"
    log_info "New branch: $new_branch"
    
    # Checkout the PR branch
    log_info "Checking out PR #$pr_num..."
    if ! gh pr checkout $pr_num; then
        log_error "Failed to checkout PR #$pr_num"
        FAILED_PRS+=("$pr_num (checkout failed)")
        return 1
    fi
    
    # Create new branch from PR branch
    log_info "Creating new branch $new_branch..."
    if ! git checkout -b "$new_branch"; then
        log_error "Failed to create branch $new_branch"
        FAILED_PRS+=("$pr_num (branch creation failed)")
        return 1
    fi
    
    # Apply rules
    if ! apply_rules $pr_num; then
        log_error "Failed to apply rules for PR #$pr_num"
        FAILED_PRS+=("$pr_num (apply rules failed)")
        return 1
    fi
    
    # Stage and commit changes (if there are any)
    if git diff --quiet && git diff --cached --quiet; then
        log_warn "No changes to commit for PR #$pr_num"
    else
        log_info "Committing changes..."
        git add .
        git commit -m "chore(rules): apply updated repository rules — duplicate of PR #$pr_num"
    fi
    
    # Run npm ci and build
    log_info "Running npm ci..."
    if ! npm ci; then
        log_error "npm ci failed for PR #$pr_num"
        FAILED_PRS+=("$pr_num (npm ci failed)")
        return 1
    fi
    
    log_info "Running npm run build..."
    if ! npm run build; then
        log_error "npm run build failed for PR #$pr_num"
        log_error "Build failed. Leaving branch local for manual resolution."
        FAILED_PRS+=("$pr_num (build failed)")
        return 1
    fi
    
    log_info "Build succeeded!"
    
    # Push the new branch
    log_info "Pushing $new_branch to origin..."
    if ! git push origin "$new_branch"; then
        log_error "Failed to push $new_branch"
        FAILED_PRS+=("$pr_num (push failed)")
        return 1
    fi
    
    # Get list of changed files
    local changed_files=$(git diff --name-only origin/$BASE_BRANCH...$new_branch | head -20)
    
    # Create new PR
    local pr_title="rules: apply updated rules — duplicate of #$pr_num"
    local pr_body="This PR is a duplicate of #$pr_num with the repository's updated rules applied.

## Changes Applied
- Created archive directories (\`scripts/archive\` and \`.github/archive\`)
- Moved legacy migration scripts to archive with \`.disabled\` extension
- Updated README.md to note that legacy scripts are archived
- Updated REVIEWER_INSTRUCTIONS.md to remove migration instructions
- Replaced tailwind.config.js with CommonJS guarded version
- Removed @base44/sdk dependency if present

## Build Status
✅ Local build passed successfully

## Changed Files
\`\`\`
$changed_files
\`\`\`

## Original PR
Duplicate of #$pr_num

Closes #$pr_num"
    
    log_info "Creating new PR..."
    local new_pr_url=$(gh pr create --title "$pr_title" --body "$pr_body" --base $BASE_BRANCH --head "$new_branch" 2>&1)
    
    if [ $? -ne 0 ]; then
        log_error "Failed to create PR for $new_branch"
        FAILED_PRS+=("$pr_num (PR creation failed)")
        return 1
    fi
    
    log_info "Created new PR: $new_pr_url"
    
    # Comment on original PR
    local comment="Closing in favor of updated PR: $new_pr_url

This duplicate applies the repository's updated rules and was built locally. Please review the updated PR and merge if acceptable."
    
    log_info "Adding comment to PR #$pr_num..."
    if ! gh pr comment $pr_num --body "$comment"; then
        log_warn "Failed to add comment to PR #$pr_num (continuing anyway)"
    fi
    
    # Close original PR
    log_info "Closing PR #$pr_num..."
    if ! gh pr close $pr_num; then
        log_warn "Failed to close PR #$pr_num (continuing anyway)"
    fi
    
    SUCCESS_PRS+=("$pr_num -> $new_pr_url")
    log_info "Successfully processed PR #$pr_num"
    
    return 0
}

# Main execution
main() {
    log_info "Starting PR duplication with rules update"
    log_info "Repository: $REPO"
    log_info "Base branch: $BASE_BRANCH"
    log_info "PRs to process: ${PR_NUMBERS[*]}"
    echo ""
    
    # Verify gh CLI is available
    if ! command -v gh &> /dev/null; then
        log_error "gh CLI is not installed. Please install it first:"
        log_error "https://cli.github.com/"
        exit 1
    fi
    
    # Verify we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        exit 1
    fi
    
    # Process each PR
    for pr_num in "${PR_NUMBERS[@]}"; do
        process_pr $pr_num || continue
        echo ""
    done
    
    # Print summary
    echo ""
    log_info "========================================="
    log_info "SUMMARY"
    log_info "========================================="
    
    if [ ${#SUCCESS_PRS[@]} -gt 0 ]; then
        log_info "Successful (${#SUCCESS_PRS[@]}):"
        for item in "${SUCCESS_PRS[@]}"; do
            echo "  ✅ $item"
        done
    fi
    
    if [ ${#FAILED_PRS[@]} -gt 0 ]; then
        log_error "Failed (${#FAILED_PRS[@]}):"
        for item in "${FAILED_PRS[@]}"; do
            echo "  ❌ $item"
        done
    fi
    
    if [ ${#SKIPPED_PRS[@]} -gt 0 ]; then
        log_warn "Skipped (${#SKIPPED_PRS[@]}):"
        for item in "${SKIPPED_PRS[@]}"; do
            echo "  ⊘ $item"
        done
    fi
    
    echo ""
    log_info "Processing complete!"
}

# Run main function
main "$@"
