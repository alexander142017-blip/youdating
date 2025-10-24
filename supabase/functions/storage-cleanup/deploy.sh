#!/bin/bash

# Supabase Edge Function Deployment Script
# This script deploys the storage-cleanup function to your Supabase project

set -e  # Exit on any error

echo "🚀 Deploying storage-cleanup Edge Function..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it with: npm install -g supabase"
    exit 1
fi

# Check if user is logged in to Supabase CLI
if ! supabase projects list &> /dev/null; then
    echo "🔑 Please login to Supabase CLI first:"
    echo "   supabase login"
    exit 1
fi

# Prompt for project reference if not already linked
if [ ! -f ./.supabase/config.toml ]; then
    echo "🔗 Project not linked. Please enter your project reference:"
    read -p "Project reference (from your Supabase dashboard URL): " PROJECT_REF
    
    if [ -z "$PROJECT_REF" ]; then
        echo "❌ Project reference is required"
        exit 1
    fi
    
    echo "🔗 Linking to project: $PROJECT_REF"
    supabase link --project-ref $PROJECT_REF
fi

# Deploy the function
echo "📦 Deploying storage-cleanup function..."
supabase functions deploy storage-cleanup --no-verify-jwt

if [ $? -eq 0 ]; then
    echo "✅ Function deployed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set environment variables in Supabase Dashboard → Settings → Edge Functions:"
    echo "   - SUPABASE_URL=https://your-project.supabase.co"
    echo "   - SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    echo ""
    echo "2. Add this environment variable to your app settings:"
    echo "   app.settings.storage_cleanup_url=https://your-project.supabase.co/functions/v1/storage-cleanup"
    echo ""
    echo "3. Test the function:"
    echo "   curl -X POST https://your-project.supabase.co/functions/v1/storage-cleanup \\"
    echo "     -H \"Content-Type: application/json\" \\"
    echo "     -H \"Authorization: Bearer your-anon-key\" \\"
    echo "     -d '{\"user_id\":\"test-user-uuid\"}'"
else
    echo "❌ Deployment failed"
    exit 1
fi