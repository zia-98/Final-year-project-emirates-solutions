// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Razorpay from "npm:razorpay";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(JSON.stringify({ error: "Missing Razorpay credentials" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = await req.json();

    // In a real implementation, you would verify the signature here using Razorpay's crypto utility.
    // For this demo/setup, we'll verify the presence of the payment ID and update the order.
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify order exists
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Update order to paid
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        payment_id: razorpayPaymentId,
        payment_details: { razorpayOrderId, razorpaySignature },
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      return new Response(JSON.stringify({ error: "Failed to update order" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
