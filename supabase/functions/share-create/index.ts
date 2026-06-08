// Share create edge function
// Genereert een share link voor een recept of het hele kookboek
// Frontend stuurt: { scope: "recipe" | "cookbook", targetId?: string }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Geen authorization header" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);
    if (userError || !user) return json({ error: "Je bent uitgelogd" }, 401);

    const { scope, targetId } = await req.json();
    if (scope !== "recipe" && scope !== "cookbook") {
      return json({ error: "Ongeldig scope" }, 400);
    }
    if (scope === "recipe" && !targetId) {
      return json({ error: "Geen recept id" }, 400);
    }

    const service = createClient(supabaseUrl, serviceKey);

    // Check of er al een actieve share link bestaat voor deze scope+target
    if (scope === "recipe") {
      const { data: existing } = await service
        .from("share_links")
        .select("slug")
        .eq("user_id", user.id)
        .eq("scope", "recipe")
        .eq("target_id", targetId)
        .maybeSingle();
      if (existing) return json({ slug: existing.slug }, 200);
    } else {
      const { data: existing } = await service
        .from("share_links")
        .select("slug")
        .eq("user_id", user.id)
        .eq("scope", "cookbook")
        .maybeSingle();
      if (existing) return json({ slug: existing.slug }, 200);
    }

    // Genereer een korte unieke slug
    const slug = generateSlug();

    const { data, error } = await service
      .from("share_links")
      .insert({
        user_id: user.id,
        scope,
        target_id: scope === "recipe" ? targetId : null,
        slug,
      })
      .select("slug")
      .single();
    if (error) throw error;
    return json({ slug: data.slug }, 200);
  } catch (err: any) {
    console.error("share-create error:", err);
    return json({ error: err?.message || "Onbekende fout" }, 500);
  }
});

function generateSlug() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

function json(body: any, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
