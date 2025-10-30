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
    const { data: { user } } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    )
    if (!user) {
      return new Response(JSON.stringify({error: 'Non autorisé'}), { headers: corsHeaders, status: 401 })
    }
    // Récupérer le profil fournisseur
    const { data: supplierProfile, error: supplierError } = await supabaseClient
      .from('supplier_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (supplierError || !supplierProfile) {
      throw supplierError || new Error('Profil fournisseur non trouvé')
    }
    if(req.method === 'POST') {
      // Ajout de produit
      const body = await req.json()
      const { name, price, stock, status } = body
      const { error } = await supabaseClient
        .from('products')
        .insert([{ name, price, stock, status, supplier_id: supplierProfile.id }])
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders, status: 201 })
    }
    if(req.method === 'PUT') {
      // Édition de produit
      const body = await req.json()
      const { id, name, price, stock, status } = body
      const { error } = await supabaseClient
        .from('products')
        .update({ name, price, stock, status })
        .eq('id', id)
        .eq('supplier_id', supplierProfile.id)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders, status: 200 })
    }
    if(req.method === 'DELETE') {
      // Suppression de produit
      const url = new URL(req.url)
      const productId = url.searchParams.get('id')
      if (!productId) throw new Error('ID manquant')
      const { error } = await supabaseClient
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('supplier_id', supplierProfile.id)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders, status: 200 })
    }
    return new Response(JSON.stringify({ error: 'Méthode non supportée' }), { headers: corsHeaders, status: 405 })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 400 })
  }
})
