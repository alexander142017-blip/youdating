#!/usr/bin/env bash
set -euo pipefail

echo "--- apply-updated-rules.sh: starting"

# Ensure archive dirs exist
mkdir -p scripts/archive .github/archive

# Archive known migration scripts/workflows if present
if [ -f "scripts/migrate-base44.js" ]; then
  git mv scripts/migrate-base44.js scripts/archive/migrate-base44.js.disabled
  echo "Archived scripts/migrate-base44.js"
fi

if [ -f "scripts_migrate-base44_Version2.js" ]; then
  git mv scripts_migrate-base44_Version2.js scripts/archive/scripts_migrate-base44_Version2.js.disabled || true
  echo "Archived scripts_migrate-base44_Version2.js"
fi

if [ -f ".github/workflows/automated-migration.yml" ]; then
  mkdir -p .github/archive
  git mv .github/workflows/automated-migration.yml .github/archive/automated-migration.yml.disabled
  echo "Archived .github/workflows/automated-migration.yml"
fi

if [ -f "workflows/github_workflows_automated-migration_Version2.yml" ]; then
  mkdir -p .github/archive
  git mv workflows/github_workflows_automated-migration_Version2.yml .github/archive/github_workflows_automated-migration_Version2.yml.disabled
  echo "Archived workflows/github_workflows_automated-migration_Version2.yml"
fi

# Update README.md: remove migrate-base44 and @base44/sdk mentions and append short note
if [ -f "README.md" ]; then
  # portable sed usage: try GNU sed then fallback to BSD/macOS sed
  if sed --version >/dev/null 2>&1; then
    sed -i.bak '/migrate-base44/d; /@base44\/sdk/d' README.md || true
  else
    sed -i.bak '/migrate-base44/d' README.md || true
    sed -i.bak '/@base44\/sdk/d' README.md || true
  fi

  if ! grep -q "Current stack: Vite + React + Tailwind + Supabase" README.md 2>/dev/null; then
    cat >> README.md <<'EOF'

Current stack: Vite + React + Tailwind + Supabase.

Required env vars (for local dev):
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

Legacy migration scripts related to the previous Base44 SDK have been archived in scripts/archive/ and .github/archive/. These are historical references only and are not executed by CI/workflows.
EOF
  fi
  echo "Updated README.md"
fi

# Update reviewer instructions: remove migration-run / Base44 instructions (keep other content)
if [ -f ".github/REVIEWER_INSTRUCTIONS.md" ]; then
  if sed --version >/dev/null 2>&1; then
    sed -i.bak '/migrate-base44/d; /Base44/d' .github/REVIEWER_INSTRUCTIONS.md || true
  else
    sed -i.bak '/migrate-base44/d' .github/REVIEWER_INSTRUCTIONS.md || true
    sed -i.bak '/Base44/d' .github/REVIEWER_INSTRUCTIONS.md || true
  fi
  echo "Updated .github/REVIEWER_INSTRUCTIONS.md"
fi

# Write guarded CommonJS tailwind.config.js
cat > tailwind.config.js <<'EOF'
let animatePlugin;
try {
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
  theme: { extend: {} },
  plugins: [
    ...(animatePlugin ? [animatePlugin] : [])
  ]
};
EOF
echo "Wrote tailwind.config.js"

# If package files reference @base44/sdk, uninstall it (updates package-lock.json)
if git grep -n '"@base44/sdk"' package.json package-lock.json >/dev/null 2>&1; then
  echo "@base44/sdk found in package files; attempting npm uninstall @base44/sdk ..."
  npm uninstall @base44/sdk || echo "npm uninstall returned non-zero (you may need to run manually)"
else
  echo "@base44/sdk not found in package files"
fi

# Stage changes for commit (caller will commit)
git add -A

echo "--- apply-updated-rules.sh: finished"
