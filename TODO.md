# TODO: Integration Implementation

## Critical TODOs (Must be implemented before production)

### 1. File Upload Integration ⚠️
**Location:** `src/api/integrations-local.js` → `UploadFile()`

**Current Status:** Returns placeholder image URL

**Impact:** Used in:
- Onboarding flow (profile photos)
- Edit Profile (photo uploads)
- Verification (verification photo)

**Recommended Implementation:**
```javascript
import { supabase } from './supabase';

export async function UploadFile({ file }) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `public/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return { file_url: data.publicUrl };
}
```

**Steps:**
1. Create a Supabase Storage bucket named 'avatars'
2. Set bucket to public or private as needed
3. Configure storage policies
4. Update the function above
5. Test photo uploads

---

### 2. Email Notification Integration ⚠️
**Location:** `src/api/integrations-local.js` → `SendEmail()`

**Current Status:** Logs to console only

**Impact:** Used in:
- Match notifications (when users match)
- Message notifications (new messages)

**Recommended Services:**
- SendGrid
- AWS SES
- Resend
- Postmark

**Example Implementation (SendGrid):**
```javascript
export async function SendEmail(emailData) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: emailData.to }],
        subject: emailData.subject
      }],
      from: { email: 'noreply@youdating.app' },
      content: [{
        type: 'text/html',
        value: emailData.html
      }]
    })
  });

  if (!response.ok) throw new Error('Failed to send email');
  return { success: true };
}
```

**Steps:**
1. Choose an email service provider
2. Sign up and get API key
3. Add environment variable (e.g., `SENDGRID_API_KEY`)
4. Implement the function
5. Create email templates
6. Test email delivery

---

## Optional TODOs (Implement as needed)

### 3. LLM Integration
**Function:** `InvokeLLM()`
**Use Case:** AI-powered features (bio suggestions, icebreakers, etc.)
**Services:** OpenAI, Anthropic, Cohere

### 4. Image Generation
**Function:** `GenerateImage()`
**Use Case:** Profile avatars, graphics
**Services:** DALL-E, Stable Diffusion, Midjourney

### 5. Document Processing
**Function:** `ExtractDataFromUploadedFile()`
**Use Case:** ID verification, document uploads
**Services:** AWS Textract, Google Cloud Vision

### 6. Signed URLs
**Function:** `CreateFileSignedUrl()`
**Use Case:** Temporary secure file access
**Implementation:** Use Supabase Storage signed URLs

### 7. Private File Upload
**Function:** `UploadPrivateFile()`
**Use Case:** Private documents, sensitive files
**Implementation:** Use Supabase Storage private bucket

---

## Database Setup TODO

Ensure these Supabase tables exist with proper structure:

1. **profiles** - User profile data
2. **likes** - User swipes/likes
3. **matches** - Mutual matches
4. **blocks** - Blocked users
5. **reports** - User reports
6. **messages** - Chat messages
7. **purchases** - Purchase records
8. **analytics_events** - Analytics tracking
9. **config** - App configuration

Run migrations or create tables manually in Supabase dashboard.

---

## Environment Variables

Update your `.env` file:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

For email service (example):
```env
SENDGRID_API_KEY=your-sendgrid-key
```

---

## Testing Checklist

Before deploying:

- [ ] Test user registration and login
- [ ] Test profile creation with photo upload
- [ ] Test editing profile
- [ ] Test discovering profiles
- [ ] Test liking/passing on profiles
- [ ] Test matching flow
- [ ] Test messaging
- [ ] Test email notifications (match, message)
- [ ] Test blocking users
- [ ] Test reporting users
- [ ] Test premium features/purchases
- [ ] Test admin dashboard
- [ ] Load test with multiple users

---

## Quick Start for Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

---

For detailed migration information, see [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
