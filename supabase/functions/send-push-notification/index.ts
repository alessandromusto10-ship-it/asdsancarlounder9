import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, message, userIds, url } = await req.json()

    // Crea client Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verifica autenticazione
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorizzato')
    }

    // Ottieni i OneSignal player IDs
    let query = supabaseClient
      .from('push_subscriptions')
      .select('onesignal_player_id')

    if (userIds && userIds.length > 0) {
      // Notifica a utenti specifici
      query = query.in('user_id', userIds)
    }
    // Se userIds non specificato, invia a tutti

    const { data: subscriptions, error: subsError } = await query
    if (subsError) throw subsError

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Nessuna subscription trovata' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const includePlayerIds = subscriptions.map(s => s.onesignal_player_id)

    // Invia notifica via OneSignal API
    const oneSignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Deno.env.get('ONESIGNAL_REST_API_KEY')}`
      },
      body: JSON.stringify({
        app_id: Deno.env.get('ONESIGNAL_APP_ID'),
        include_player_ids: includePlayerIds,
        headings: { 'it': title },
        contents: { 'it': message },
        ...(url ? { url: url } : {})
      })
    })

    if (!oneSignalResponse.ok) {
      const error = await oneSignalResponse.json()
      throw new Error(`OneSignal error: ${JSON.stringify(error)}`)
    }

    return new Response(
      JSON.stringify({ success: true, sent: includePlayerIds.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Errore Edge Function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})