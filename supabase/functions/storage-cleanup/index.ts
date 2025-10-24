import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CleanupRequest {
  user_id: string;
}

interface CleanupResponse {
  success: boolean;
  deleted: number;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, deleted: 0, error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing environment variables')
      return new Response(
        JSON.stringify({ 
          success: false, 
          deleted: 0, 
          error: 'Server configuration error' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const body: CleanupRequest = await req.json()
    
    if (!body.user_id || typeof body.user_id !== 'string') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          deleted: 0, 
          error: 'Invalid user_id provided' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log(`[STORAGE-CLEANUP] Starting cleanup for user: ${body.user_id}`)

    // List all files in the user's profile-photos folder
    const { data: files, error: listError } = await supabase.storage
      .from('profile-photos')
      .list(body.user_id, {
        limit: 1000, // Adjust as needed
        sortBy: { column: 'name', order: 'asc' },
      })

    if (listError) {
      console.error(`[STORAGE-CLEANUP] Error listing files:`, listError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          deleted: 0, 
          error: `Failed to list files: ${listError.message}` 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // If no files found, return success with 0 deleted
    if (!files || files.length === 0) {
      console.log(`[STORAGE-CLEANUP] No files found for user: ${body.user_id}`)
      return new Response(
        JSON.stringify({ success: true, deleted: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Build array of file paths to delete
    const filePaths = files.map(file => `${body.user_id}/${file.name}`)
    
    console.log(`[STORAGE-CLEANUP] Found ${filePaths.length} files to delete for user: ${body.user_id}`)
    console.log(`[STORAGE-CLEANUP] Files:`, filePaths)

    // Delete all files
    const { data: deleteData, error: deleteError } = await supabase.storage
      .from('profile-photos')
      .remove(filePaths)

    if (deleteError) {
      console.error(`[STORAGE-CLEANUP] Error deleting files:`, deleteError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          deleted: 0, 
          error: `Failed to delete files: ${deleteError.message}` 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const deletedCount = deleteData?.length || 0
    console.log(`[STORAGE-CLEANUP] Successfully deleted ${deletedCount} files for user: ${body.user_id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted: deletedCount 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('[STORAGE-CLEANUP] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        deleted: 0, 
        error: 'Internal server error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})