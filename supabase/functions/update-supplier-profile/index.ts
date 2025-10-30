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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: { user } } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    )
    
    if (!user) {
      throw new Error('Non autorisé')
    }

    const profileData = await req.json()

    // Mettre à jour le profil fournisseur
    const { error: profileError } = await supabaseClient
      .from('supplier_profiles')
      .update({
        business_name: profileData.business_name,
        business_email: profileData.email,
        business_phone: profileData.phone,
        description: profileData.description,
        category: profileData.category,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        website: profileData.website,
        business_hours: profileData.business_hours,
        social_links: profileData.social_links,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (profileError) {
      throw profileError
    }

    // Mettre à jour aussi la table suppliers
    const { error: supplierError } = await supabaseClient
      .from('suppliers')
      .update({
        name: profileData.business_name,
        email: profileData.email,
        phone: profileData.phone,
        description: profileData.description,
        category: profileData.category,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        location: `${profileData.city}, ${profileData.state}`,
        website: profileData.website,
        business_hours: profileData.business_hours,
        social_links: profileData.social_links,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (supplierError) {
      console.error('Erreur mise à jour suppliers:', supplierError)
    }

    return new Response(
      JSON.stringify({ 
        message: 'Profil mis à jour avec succès',
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Erreur mise à jour profil:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})