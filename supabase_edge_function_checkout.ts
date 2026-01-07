// Supabase Edge Function: checkout
// Deploy ke: https://supabase.com/dashboard/project/ixjechujsfqirldapwan/functions
// 
// Langkah Deploy:
// 1. Buka Supabase Dashboard > Edge Functions
// 2. Klik "Create a new function"
// 3. Nama: checkout
// 4. Copy-paste kode ini
// 5. Setup Secrets (di Settings > Secrets):
//    - MIDTRANS_SERVER_KEY
//    - MIDTRANS_CLIENT_KEY

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers - izinkan localhost dan production
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Ganti dengan domain spesifik jika mau lebih secure
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Midtrans Sandbox URL (ganti ke production nanti)
const MIDTRANS_API_URL = "https://app.sandbox.midtrans.com/snap/v1/transactions";

serve(async (req: Request) => {
  // Handle preflight CORS request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id, amount, channel, donor, campaign_id } = await req.json();

    // Validasi input
    if (!order_id || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: order_id, amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Midtrans Server Key from secrets
    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY");
    if (!serverKey) {
      return new Response(
        JSON.stringify({ error: "MIDTRANS_SERVER_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare Midtrans payload
    const midtransPayload = {
      transaction_details: {
        order_id: order_id,
        gross_amount: Math.round(amount),
      },
      customer_details: {
        first_name: donor?.name || "Donatur",
        email: donor?.email || "donatur@email.com",
        phone: donor?.phone || "",
      },
      item_details: [
        {
          id: campaign_id || "donation",
          price: Math.round(amount),
          quantity: 1,
          name: "Donasi",
        },
      ],
    };

    // Call Midtrans Snap API
    const authString = btoa(serverKey + ":");
    const midtransResponse = await fetch(MIDTRANS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`,
      },
      body: JSON.stringify(midtransPayload),
    });

    const midtransData = await midtransResponse.json();

    if (!midtransResponse.ok) {
      console.error("Midtrans error:", midtransData);
      return new Response(
        JSON.stringify({ error: "Midtrans API error", details: midtransData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return snap token to frontend
    return new Response(
      JSON.stringify({
        token: midtransData.token,
        redirect_url: midtransData.redirect_url,
        order_id: order_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
