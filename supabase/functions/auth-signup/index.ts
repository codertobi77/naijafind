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

    const { 
      email, 
      password, 
      user_metadata,
      supplier_data 
    } = await req.json()

    if (!email || !password) {
      throw new Error('Email et mot de passe requis')
    }

    // Créer l'utilisateur avec Supabase Auth (cela gère automatiquement la table auth.users)
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: user_metadata || {}
    })

    if (authError) {
      throw authError
    }

    // Si c'est un fournisseur, créer les profils nécessaires
    if (user_metadata?.user_type === 'supplier' && supplier_data) {
      // Créer le profil fournisseur
      const { error: supplierProfileError } = await supabaseClient
        .from('supplier_profiles')
        .insert({
          user_id: authData.user.id,
          business_name: supplier_data.business_name,
          business_email: email,
          business_phone: user_metadata.phone || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (supplierProfileError) {
        console.error('Erreur profil fournisseur:', supplierProfileError)
      }

      // Créer l'entrée dans la table suppliers
      const { error: supplierError } = await supabaseClient
        .from('suppliers')
        .insert({
          id: authData.user.id,
          name: supplier_data.business_name,
          email: email,
          phone: user_metadata.phone || null,
          description: supplier_data.description || '',
          category: supplier_data.category || '',
          address: supplier_data.address || '',
          city: supplier_data.city || '',
          state: supplier_data.state || '',
          location: `${supplier_data.city || ''}, ${supplier_data.state || ''}`,
          website: supplier_data.website || null,
          rating: 0,
          reviews_count: 0,
          verified: false,
          featured: false,
          logo_url: null,
          cover_image_url: null,
          business_hours: null,
          social_links: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (supplierError) {
        console.error('Erreur création supplier:', supplierError)
        throw supplierError
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Inscription réussie',
        user: authData.user,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Erreur inscription:', error)
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