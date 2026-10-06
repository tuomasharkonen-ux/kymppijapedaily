import { createClient, type SupabaseClient, type User } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Verify the caller's JWT and return the user plus a service-role client. */
export async function authenticate(
  req: Request,
): Promise<{ user: User; service: SupabaseClient } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, supabaseAnonKey);
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await userClient.auth.getUser(token);
  if (error || !user) {
    console.log("Failed to verify JWT:", error?.message);
    return json({ error: "Unauthorized" }, 401);
  }

  return { user, service: createClient(supabaseUrl, supabaseServiceKey) };
}

export async function hasPurchase(service: SupabaseClient, userId: string, itemId: string): Promise<boolean> {
  const { data } = await service
    .from("user_purchases")
    .select("id")
    .eq("user_id", userId)
    .eq("item_id", itemId)
    .maybeSingle();
  return !!data;
}

/** Throw counts of all games before the given day (personal bet lines). */
export async function previousThrows(service: SupabaseClient, userId: string, gameDate: string): Promise<number[]> {
  const { data } = await service
    .from("game_records")
    .select("throws_count")
    .eq("user_id", userId)
    .lt("played_date", gameDate);
  return (data ?? []).map((r: { throws_count: number }) => r.throws_count);
}
