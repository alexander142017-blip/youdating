```markdown
# YouDating

YouDating — a client app built with Vite + React + Supabase + Tailwind.

This repository is a standalone frontend that uses Supabase (auth + database) and React Query.

Quick start
1. Copy the env template:
   cp .env.example .env

2. Add required environment variables to .env:
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key

3. Install and run:
   npm install
   npm run dev

Production build:
   npm run build

Notes:
- This project no longer relies on any external Base44 SDK. Replace any TODOs in src/api/* helper modules to match your database schema.
- Do not commit any secrets to the repo. Use environment variables or your CI secret store.
```