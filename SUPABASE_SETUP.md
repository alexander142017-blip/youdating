# Supabase Environment Setup Guide

## 📋 Quick Setup Checklist

✅ **Supabase client configured** (`src/api/supabase.js`)
✅ **Environment variables defined** (`.env.example`)  
✅ **API functions ready** (`src/api/auth.js`, `src/api/profiles.js`)
✅ **Connection test added** (`src/App.jsx`)

## 🔧 To Complete Setup:

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Add your Supabase credentials to `.env`:**
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Get your Supabase credentials from:**
   - Go to [supabase.com](https://supabase.com)
   - Navigate to your project dashboard
   - Settings > API
   - Copy the `URL` and `anon/public` key

## 🧪 Testing the Connection

When you run `npm run dev`, check the browser console for:
- ✅ `Supabase connected successfully!` (with credentials)
- ⚠️ `Supabase environment variables not found` (without credentials)

## 📁 API Structure Overview

Your API is organized and ready to use:

```
src/api/
├── supabase.js     # Base Supabase client
├── auth.js         # Authentication functions
├── profiles.js     # Profile management
├── purchases.js    # Premium features
└── ...
```

## 🔗 How to Use in Components

```javascript
import { getCurrentUser } from '@/api/auth';
import { getProfile, upsertProfile } from '@/api/profiles';

// Example: Get current user
const user = await getCurrentUser();

// Example: Update profile
await upsertProfile({ 
  id: user.id, 
  name: 'John Doe',
  bio: 'Hello world!' 
});
```