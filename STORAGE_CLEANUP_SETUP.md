# Storage Cleanup Edge Function Setup

## 🎯 **Supabase Edge Function Created Successfully**

I've created a complete storage cleanup Edge Function for your YouDating app that will delete all profile photos for a specific user.

### 📁 **Files Created**

```
supabase/
├── functions/
│   ├── storage-cleanup/
│   │   ├── index.ts              # Main Edge Function code
│   │   ├── README.md             # Comprehensive documentation  
│   │   ├── example-usage.ts      # Integration examples for your app
│   │   └── deploy.sh             # Automated deployment script
│   ├── deno.json                 # Deno configuration for Edge Functions
│   └── .env.example              # Environment variables template
└── config.toml                   # Supabase project configuration
```

## 🚀 **Function Overview**

**Endpoint**: `storage-cleanup`  
**Method**: `POST`  
**Purpose**: Delete all files in `profile-photos/{user_id}` when user deletes account

### **Request Format**
```json
{
  "user_id": "uuid-string"
}
```

### **Response Format**  
```json
{
  "success": true,
  "deleted": 5
}
```

## 🔧 **Deployment Instructions**

### **1. Quick Deployment**
```bash
cd /Users/alex/Desktop/Youdating/supabase/functions/storage-cleanup
./deploy.sh
```

### **2. Manual Deployment**
```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Deploy function
supabase functions deploy storage-cleanup --no-verify-jwt
```

### **3. Configure Environment Variables**

In **Supabase Dashboard → Settings → Edge Functions**, add:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **4. Add App Setting**

In **Supabase Dashboard → Settings → API**, add:
```
app.settings.storage_cleanup_url=https://your-project.supabase.co/functions/v1/storage-cleanup
```

## 🔗 **Integration with YouDating App**

### **Option 1: Using Supabase Client (Recommended)**
```typescript
import { supabase } from '@/api/supabase';

async function cleanupUserPhotos(userId: string) {
  const { data, error } = await supabase.functions.invoke('storage-cleanup', {
    body: { user_id: userId }
  });
  
  if (error) throw error;
  return data; // { success: true, deleted: 5 }
}
```

### **Option 2: Direct HTTP Call**
```typescript
const response = await fetch('https://your-project.supabase.co/functions/v1/storage-cleanup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({ user_id: userId })
});

const result = await response.json();
```

## 🛡️ **Security Features**

- ✅ **Service Role Authorization**: Uses service role key for full bucket access
- ✅ **Input Validation**: Validates `user_id` parameter type and format  
- ✅ **CORS Support**: Configured for cross-origin requests
- ✅ **Error Handling**: Comprehensive error responses with details
- ✅ **Logging**: Console logging for monitoring and debugging

## 🧪 **Testing the Function**

### **Test with curl**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/storage-cleanup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{"user_id":"actual-user-uuid"}'
```

### **Expected Response**
```json
{
  "success": true,
  "deleted": 3
}
```

## ⚙️ **How It Works**

1. **Receives** POST request with `{ user_id: "uuid" }`
2. **Lists** all files in `profile-photos/{user_id}/` folder  
3. **Builds** array of full file paths to delete
4. **Deletes** all files using Supabase Storage API
5. **Returns** success status and count of deleted files

## 📋 **Next Steps**

1. **Deploy** the function using `./deploy.sh`
2. **Configure** environment variables in Supabase Dashboard
3. **Test** the function with a real user ID  
4. **Integrate** into your user deletion flow in YouDating app
5. **Add** error handling for edge cases in your app

The function is ready to be deployed and will provide reliable cleanup of user profile photos when accounts are deleted! 🎉