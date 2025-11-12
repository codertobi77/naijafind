import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: { user } } = await supabaseClient.auth.getUser(token)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { headers: corsHeaders, status: 401 })
    }

    // Vérifier le profil fournisseur
    const { data: supplierProfile, error: supplierError } = await supabaseClient
      .from('supplier_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (supplierError || !supplierProfile) {
      throw supplierError || new Error('Profil fournisseur non trouvé')
    }

    if (req.method === 'PUT') {
      // Mise à jour d'un avis (statut, réponse, etc.)
      const body = await req.json()
      const { id, status, response } = body
      if (!id) return new Response(JSON.stringify({ error: 'ID manquant' }), { headers: corsHeaders, status: 400 })
      const { error } = await supabaseClient
        .from('reviews')
        .update({ status, response })
        .eq('id', id)
        .eq('supplier_id', supplierProfile.id)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders, status: 200 })
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url)
      const id = url.searchParams.get('id')
      if (!id) return new Response(JSON.stringify({ error: 'ID manquant' }), { headers: corsHeaders, status: 400 })
      const { error } = await supabaseClient
        .from('reviews')
        .delete()
        .eq('id', id)
        .eq('supplier_id', supplierProfile.id)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders, status: 200 })
    }

    return new Response(JSON.stringify({ error: 'Méthode non supportée' }), { headers: corsHeaders, status: 405 })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Erreur serveur' }), { headers: corsHeaders, status: 500 })
  }
})



