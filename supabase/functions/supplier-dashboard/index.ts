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
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    
    if (!user) {
      throw new Error('Non autorisé')
    }

    // Récupérer le profil fournisseur
    const { data: supplierProfile, error: profileError } = await supabaseClient
      .from('supplier_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      throw profileError
    }

    // Récupérer les statistiques
    const { data: orders, error: ordersError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('supplier_id', supplierProfile.id)

    const { data: products, error: productsError } = await supabaseClient
      .from('products')
      .select('*')
      .eq('supplier_id', supplierProfile.id)

    const { data: reviews, error: reviewsError } = await supabaseClient
      .from('reviews')
      .select('*')
      .eq('supplier_id', supplierProfile.id)

    // Calculer les statistiques
    const totalOrders = orders?.length || 0
    const totalProducts = products?.length || 0
    const totalReviews = reviews?.length || 0
    const averageRating = reviews?.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0

    const monthlyRevenue = orders
      ?.filter(order => {
        const orderDate = new Date(order.created_at)
        const currentMonth = new Date()
        return orderDate.getMonth() === currentMonth.getMonth() && 
               orderDate.getFullYear() === currentMonth.getFullYear() &&
               order.payment_status === 'paid'
      })
      ?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0

    return new Response(
      JSON.stringify({ 
        profile: supplierProfile,
        stats: {
          totalOrders,
          totalProducts,
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
          monthlyRevenue
        },
        // Expose full lists to enable filtering/pagination client-side
        orders: orders || [],
        reviews: reviews || [],
        // Keep recent slices for quick dashboards
        recentOrders: orders?.slice(0, 5) || [],
        recentReviews: reviews?.slice(0, 5) || []
      }),
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