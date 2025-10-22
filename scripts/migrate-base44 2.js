/**
 * scripts/migrate-base44.js
 *
 * Safe, idempotent migration script to:
 *  - update package.json (name -> "youdating", remove @base44/sdk)
 *  - delete old Base44 files if present
 *  - create new helper modules & bootstrap files (minimal)
 *
 * The workflow that runs this script will commit & open a PR using create-pull-request action.
 *
 * Review the script before running on a production repo. It makes limited, explicit changes.
 */

const fs = require('fs').promises;
const path = require('path');

const root = process.cwd();

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function writeFileEnsureDir(relPath, content) {
  const p = path.join(root, relPath);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, content, 'utf8');
  console.log('Wrote', relPath);
}

async function deleteIfExists(relPath) {
  const p = path.join(root, relPath);
  if (await exists(p)) {
    await fs.unlink(p);
    console.log('Deleted', relPath);
  }
}

async function updatePackageJson() {
  const p = path.join(root, 'package.json');
  if (!(await exists(p))) {
    console.warn('package.json not found — skipping package updates');
    return;
  }
  const raw = await fs.readFile(p, 'utf8');
  let pkg;
  try {
    pkg = JSON.parse(raw);
  } catch (err) {
    console.warn('Could not parse package.json:', err.message);
    return;
  }

  pkg.name = 'youdating';
  if (pkg.dependencies && pkg.dependencies['@base44/sdk']) {
    delete pkg.dependencies['@base44/sdk'];
    console.log('Removed @base44/sdk from dependencies');
  }

  // ensure build script exists so CI can run
  pkg.scripts = pkg.scripts || {};
  if (!pkg.scripts.build) pkg.scripts.build = 'vite build';

  await fs.writeFile(p, JSON.stringify(pkg, null, 2), 'utf8');
  console.log('Updated package.json');
}

async function main() {
  console.log('Starting migration script...');

  try {
    await updatePackageJson();
  } catch (err) {
    console.warn('Could not update package.json:', err.message);
  }

  // Delete old Base44 files if present
  await deleteIfExists('src/api/base44Client.js');
  await deleteIfExists('src/api/entities.js');
  await deleteIfExists('src/api/integrations.js'); // we'll create a safe stub below

  // Write new files (minimal safe implementations)
  await writeFileEnsureDir('index.html', `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>YouDating</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`);

  await writeFileEnsureDir('src/main.jsx', `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
`);

  await writeFileEnsureDir('src/index.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; }
`);

  await writeFileEnsureDir('src/App.jsx', `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl font-bold">YouDating</h1>
    </div>
  );
}
`);

  await writeFileEnsureDir('src/api/supabase.js', `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`);

  await writeFileEnsureDir('src/api/auth.js', `import { supabase } from './supabase';

export async function getCurrentUser() {
  const { data: { user } = {}, error: authErr } = await supabase.auth.getUser();
  if (authErr) {
    console.warn('supabase.auth.getUser error', authErr);
  }
  if (!user) return null;

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileErr) console.warn('failed to load profile', profileErr);

  return {
    ...user,
    ...(profile || {})
  };
}
`);

  await writeFileEnsureDir('src/api/profiles.js', `import { supabase } from './supabase';

export async function getProfile({ userId, email }) {
  if (userId) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    return data;
  }
  if (email) {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    return data;
  }
  return null;
}

export async function upsertProfile(profile) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function markOnboardingComplete(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ profile_completed: true })
    .eq('id', userId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}
`);

  await writeFileEnsureDir('src/api/purchases.js', `import { supabase } from './supabase';

export async function createPurchase({ userId, productId, metadata = {} }) {
  const payload = {
    user_id: userId,
    product_id: productId,
    metadata,
    created_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from('purchases').insert([payload]).select().maybeSingle();
  if (error) throw error;
  return data;
}
`);

  await writeFileEnsureDir('src/api/integrations.js', `export function sendEmail() {
  throw new Error('sendEmail integration not implemented. Implement your email provider integration in src/api/integrations.js');
}

export function invokeLLM() {
  throw new Error('invokeLLM integration not implemented. Implement your LLM provider integration in src/api/integrations.js');
}
`);

  await writeFileEnsureDir('README.md', `# YouDating

YouDating — a client app built with Vite + React + Supabase + Tailwind.

Quick start

1. Copy .env.example to .env and set:
   VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

2. Install and run:
   npm install
   npm run dev

Notes
- This repo no longer uses the Base44 SDK. API helpers live in src/api/* and are minimal; update them to match your DB schema and integrations.
- Do not commit secrets to the repo.
`);

  await writeFileEnsureDir('vite.config.js', `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const resolveRuntime = (name) => path.resolve(__dirname, 'node_modules', 'react', name);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'react/jsx-runtime': resolveRuntime('jsx-runtime.js'),
      'react/jsx-dev-runtime': resolveRuntime('jsx-dev-runtime.js')
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', '@tanstack/react-query']
  }
});
`);

  // small CI helper workflow (already written above); included as convenience
  await writeFileEnsureDir('.github/workflows/ci-build.yml', `name: CI - Build

on:
  push:
    branches:
      - main
      - 'copilot/*'
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
`);
  console.log('Migration script finished. Workspace contains the new/updated files.');
  console.log('Do NOT commit here if you want create-pull-request to make the commit for you.');
}

main().catch((err) => {
  console.error('Migration script failed:', err);
  process.exit(1);
});