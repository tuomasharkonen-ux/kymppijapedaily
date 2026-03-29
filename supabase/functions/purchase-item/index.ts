import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Hardcoded item catalog - must match shopItems.ts
// Prices are validated server-side to prevent manipulation
const SHOP_ITEMS: Record<string, { price: number; name: string }> = {
  golden_dice: { price: 200, name: "Golden Dice" },
  diamond_dice: { price: 500, name: "Diamond Dice" },
  german_supermarket_dice: { price: 100, name: "German Supermarket Dice" },
  shake_dice_action: { price: 300, name: "Shake Dice Action" },
  blow_dice_action: { price: 300, name: "Blow Dice Action" },
  insult_dice_action: { price: 300, name: "Insult Your Dice" },
  turbo_spin_throw: { price: 200, name: "Turbo Spin" },
  bounce_drop_throw: { price: 200, name: "Bounce Drop" },
  casino_felt_bg: { price: 300, name: "Casino Felt" },
  starfield_bg: { price: 500, name: "Starfield" },
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user via JWT claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.log("Failed to verify JWT:", claimsError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;
    console.log("Authenticated user:", userId);

    // Parse request body
    const body = await req.json();
    const { itemId } = body;

    if (!itemId || typeof itemId !== "string") {
      console.log("Invalid request body - missing itemId");
      return new Response(
        JSON.stringify({ error: "Invalid request: itemId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate item exists in catalog
    const item = SHOP_ITEMS[itemId];
    if (!item) {
      console.log("Invalid itemId:", itemId);
      return new Response(
        JSON.stringify({ error: "Invalid item ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing purchase: ${item.name} for ${item.price} credits`);

    // Use service role client for database operations (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already owns this item
    const { data: existingPurchase, error: checkError } = await serviceClient
      .from("user_purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("item_id", itemId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing purchase:", checkError);
      return new Response(
        JSON.stringify({ error: "Failed to check purchase status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existingPurchase) {
      console.log("User already owns this item");
      return new Response(
        JSON.stringify({ error: "You already own this item" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduct credits using the secure database function
    const { data: newBalance, error: deductError } = await serviceClient.rpc(
      "decrement_user_credits",
      { p_user_id: userId, p_amount: item.price }
    );

    if (deductError) {
      console.error("Error deducting credits:", deductError);
      // Check for specific error messages
      if (deductError.message.includes("Insufficient credits")) {
        return new Response(
          JSON.stringify({ error: "Insufficient credits" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (deductError.message.includes("User has no credits")) {
        return new Response(
          JSON.stringify({ error: "Insufficient credits" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Failed to process purchase" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert purchase record
    const { error: insertError } = await serviceClient
      .from("user_purchases")
      .insert({
        user_id: userId,
        item_id: itemId,
      });

    if (insertError) {
      console.error("Error inserting purchase record:", insertError);
      // Note: Credits have already been deducted, but this shouldn't happen
      // due to the unique constraint check above. Log for monitoring.
      return new Response(
        JSON.stringify({ error: "Failed to record purchase" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Purchase successful: ${item.name}, new balance: ${newBalance}`);

    return new Response(
      JSON.stringify({
        success: true,
        itemId,
        itemName: item.name,
        newBalance,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
