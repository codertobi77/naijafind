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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const url = new URL(req.url)
    const query = url.searchParams.get('q') || ''
    const category = url.searchParams.get('category') || ''
    const location = url.searchParams.get('location') || ''
    const latitude = url.searchParams.get('lat')
    const longitude = url.searchParams.get('lng')
    const radius = parseInt(url.searchParams.get('radius') || '50')
    const minRating = parseFloat(url.searchParams.get('rating') || '0')
    const verified = url.searchParams.get('verified') === 'true'
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let queryBuilder = supabaseClient
      .from('suppliers')
      .select('*')

    // Filtrage par texte
    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    // Filtrage par catégorie
    if (category) {
      queryBuilder = queryBuilder.eq('category', category)
    }

    // Filtrage par localisation
    if (location) {
      queryBuilder = queryBuilder.ilike('location', `%${location}%`)
    }

    // Filtrage par note
    if (minRating > 0) {
      queryBuilder = queryBuilder.gte('rating', minRating)
    }

    // Filtrage par vérification
    if (verified) {
      queryBuilder = queryBuilder.eq('verified', true)
    }

    // Pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    const { data: suppliers, error } = await queryBuilder

    if (error) {
      throw error
    }

    // Calcul de la distance si coordonnées fournies
    let suppliersWithDistance = suppliers
    if (latitude && longitude) {
      suppliersWithDistance = suppliers.map(supplier => {
        if (supplier.latitude && supplier.longitude) {
          const distance = calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            supplier.latitude,
            supplier.longitude
          )
          return { ...supplier, distance }
        }
        return { ...supplier, distance: null }
      })

      // Filtrage par rayon
      suppliersWithDistance = suppliersWithDistance.filter(supplier => 
        !supplier.distance || supplier.distance <= radius
      )

      // Tri par distance
      suppliersWithDistance.sort((a, b) => {
        if (!a.distance) return 1
        if (!b.distance) return -1
        return a.distance - b.distance
      })
    }

    return new Response(
      JSON.stringify({ suppliers: suppliersWithDistance }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}