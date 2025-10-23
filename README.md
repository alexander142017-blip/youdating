# YouDating

YouDating is a Vite + React + Tailwind web app using Supabase for backend services.

Current stack
- Vite
- React
- Tailwind CSS
- Supabase (auth, database, storage)
- Twilio Verify (SMS phone verification)

Quick start (local)
1. Copy environment variables into a local `.env` or your dev environment:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY

2. Install and run:
   npm ci
   npm run dev

Build for production
   npm run build

Notes
- Legacy migration scripts related to the previous Base44 SDK have been archived in `scripts/archive/` and `.github/archive/`. The app no longer depends on `@base44/sdk`. If you need the historical migration scripts for reference, look in `scripts/archive/`.
- If you see references to Base44 in archive directories or in CHANGELOGs/history, those are historical only and do not affect runtime.
