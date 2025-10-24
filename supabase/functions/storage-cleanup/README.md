# Storage Cleanup Edge Function

This Supabase Edge Function deletes all files in the `profile-photos` bucket for a specific user.

## 🚀 Function Overview

**Endpoint**: `storage-cleanup`  
**Method**: `POST`  
**Purpose**: Cleanup user profile photos when user account is deleted

### Request Format
```json
{
  "user_id": "uuid-string"
}
```

### Response Format
```json
{
  "success": true,
  "deleted": 5,
  "error": null
}
```

## 🔧 Setup & Deployment

### 1. Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Supabase project with profile-photos bucket configured

### 2. Configure Environment Variables

In your Supabase Dashboard → Settings → Edge Functions, add:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Deploy the Function

```bash
# Login to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the storage-cleanup function
supabase functions deploy storage-cleanup --no-verify-jwt
```

### 4. Set App Environment Variable

In your Supabase Dashboard → Settings → API, add this environment variable:

```
app.settings.storage_cleanup_url=https://your-project.supabase.co/functions/v1/storage-cleanup
```

## 🛡️ Security & Authorization

- Uses **service role key** for full bucket access
- Validates `user_id` parameter 
- CORS headers configured for cross-origin requests
- No JWT verification required (uses service role internally)

## 📋 Usage Example

### JavaScript/TypeScript
```typescript
const response = await fetch('https://your-project.supabase.co/functions/v1/storage-cleanup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-anon-key'
  },
  body: JSON.stringify({
    user_id: 'user-uuid-here'
  })
});

const result = await response.json();
console.log(`Deleted ${result.deleted} files`);
```

### Using from Profile Deletion Flow
```typescript
// In your user deletion logic
import { supabase } from '@/api/supabase';

async function deleteUserAccount(userId: string) {
  try {
    // Call storage cleanup function
    const { data, error } = await supabase.functions.invoke('storage-cleanup', {
      body: { user_id: userId }
    });
    
    if (error) throw error;
    
    console.log(`Cleaned up ${data.deleted} profile photos`);
    
    // Continue with profile/user deletion...
    
  } catch (error) {
    console.error('Failed to cleanup storage:', error);
  }
}
```

## 🧪 Testing the Function

### Local Testing (if using Supabase local dev)
```bash
# Start local Supabase
supabase start

# Deploy function locally  
supabase functions deploy storage-cleanup --local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/storage-cleanup \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-user-uuid"}'
```

### Production Testing
```bash
curl -X POST https://your-project.supabase.co/functions/v1/storage-cleanup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{"user_id":"actual-user-uuid"}'
```

## ⚠️ Important Notes

1. **Irreversible Operation**: This function permanently deletes files
2. **Service Role Access**: Uses service role key with full database access
3. **Rate Limiting**: Consider implementing rate limiting for production use
4. **Batch Size**: Currently handles up to 1000 files per user (configurable)
5. **Error Handling**: Returns detailed error messages for debugging

## 📁 File Structure
```
supabase/
├── functions/
│   ├── storage-cleanup/
│   │   └── index.ts          # Main function code
│   ├── deno.json            # Deno configuration
│   └── .env.example         # Environment variables template
└── config.toml              # Supabase project config
```

## 🔗 Integration

Once deployed, you can reference the function URL using the environment variable:

```typescript
const cleanupUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/storage-cleanup';
// or use the configured app setting
const cleanupUrl = 'app.settings.storage_cleanup_url'; // if stored in your config
```

This ensures the storage cleanup function can be easily called from your YouDating app when users delete their accounts.