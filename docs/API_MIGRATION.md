# API Migration Documentation

## Overview
This application has been migrated from using the Base44 SDK to using Supabase directly with local helper modules.

## New Helper Modules

### 1. `src/api/auth.js`
Handles authentication operations using Supabase Auth:
- `getCurrentUser()` - Retrieves the current authenticated user with their profile
- `updateCurrentUser(data)` - Updates the current user's profile
- `logout()` - Signs out the current user

### 2. `src/api/profiles.js`
Manages user profiles in Supabase:
- `getProfile(userId)` - Gets a user's profile by ID
- `upsertProfile(userId, profileData)` - Creates or updates a profile
- `markOnboardingComplete(userId)` - Marks onboarding as complete

### 3. `src/api/purchases.js`
Handles purchase tracking:
- `createPurchase({ userId, productId, ... })` - Records a purchase
- `getUserPurchases(userId)` - Retrieves all purchases for a user

### 4. `src/api/supabase.js`
Core Supabase client configuration:
- Uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables
- Configured with persistent sessions and auto-refresh tokens

## Compatibility Layer

The `src/api/base44Client.js` file provides backward compatibility by exposing the same API interface as the old Base44 SDK. This allows existing code to continue working without modifications while using Supabase under the hood.

### Usage in Existing Code

Existing imports like this continue to work:
```javascript
import { base44 } from '@/api/base44Client';

// Authentication
const user = await base44.auth.me();
await base44.auth.updateMe(data);
await base44.auth.logout();

// Purchases
await base44.entities.Purchase.create(purchaseData);

// Analytics
await base44.entities.AnalyticsEvents.create(eventData);

// Config
const config = await base44.entities.Config.list();

// File uploads
const { file_url } = await base44.integrations.Core.UploadFile({ file });
```

## Supabase Schema Requirements

The application expects the following Supabase tables:

### `profiles`
- `id` (uuid, primary key, references auth.users)
- `full_name` (text)
- `date_of_birth` (date)
- `gender` (text)
- `looking_for` (text)
- `city` (text)
- `photos` (text[])
- `bio` (text)
- `profile_completed` (boolean)
- `latitude` (float)
- `longitude` (float)
- `discovery_age_min` (integer)
- `discovery_age_max` (integer)
- `discovery_max_distance` (integer)
- `discovery_show_on_discover` (boolean)
- `isPremium` (boolean)
- `premiumPlan` (text)
- `premiumExpiresAt` (timestamp)
- `super_likes_remaining` (integer)
- `boosts_remaining` (integer)
- `role` (text)
- `updated_at` (timestamp)
- `created_at` (timestamp)

### `purchases`
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles.id)
- `product_id` (text)
- `platform` (text)
- `type` (text)
- `status` (text)
- `started_at` (timestamp)
- `expires_at` (timestamp)
- `created_at` (timestamp)

### `analytics_events`
- `id` (uuid, primary key)
- `user_email` (text)
- `type` (text)
- `context` (jsonb)
- `day` (date)
- `created_at` (timestamp)

### `config`
- `id` (uuid, primary key)
- `key` (text)
- `value` (jsonb)

### Storage Bucket: `public`
Used for file uploads (photos, etc.)

## Environment Variables

Ensure these are set in your `.env` file:
```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Migration Path for Future Development

While the compatibility layer allows existing code to work, new features should:

1. Import helpers directly:
   ```javascript
   import { getCurrentUser, updateCurrentUser } from '@/api/auth';
   import { getProfile, upsertProfile } from '@/api/profiles';
   import { createPurchase } from '@/api/purchases';
   ```

2. Use Supabase client directly for new features:
   ```javascript
   import { supabase } from '@/api/supabase';
   ```

3. Add new helpers to the appropriate modules as needed

## Testing

Run the following commands to verify the migration:

```bash
# Install dependencies
npm install

# Lint the code
npm run lint

# Build the application
npm run build

# Start development server
npm run dev
```

## Notes

- The compatibility layer ensures zero breaking changes for existing code
- All functionality has been preserved while removing the Base44 SDK dependency
- The application successfully builds and passes all linting checks
- No security vulnerabilities were found in the new implementation
