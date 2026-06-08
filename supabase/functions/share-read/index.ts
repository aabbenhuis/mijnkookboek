// Share read edge function
// Publiek leesbaar, geen auth nodig
// Frontend stuurt: ?slug=abc123
// Returnt: scope, recipe(s), eigenaar voornaam, kookboek naam

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    let slug = url.searchParams.get("slug");
    if (!slug && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      slug = body.slug;
    }
    if (!slug) return json({ error: "Geen slug" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const service = createClient(supabaseUrl, serviceKey);

    const { data: link, error: linkErr } = await service
      .from("share_links")
      .select("id, user_id, scope, target_id, expires_at")
      .eq("slug", slug)
      .maybeSingle();

    if (linkErr || !link) return json({ error: "Deze link bestaat niet of is verlopen" }, 404);
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return json({ error: "Deze link is verlopen" }, 410);
    }

    // Haal het eigenaarprofiel op
    const { data: profile } = await service
      .from("profiles")
      .select("first_name, cookbook_name")
      .eq("id", link.user_id)
      .single();

    let recipes: any[] = [];
    if (link.scope === "recipe" && link.target_id) {
      const { data, error } = await service
        .from("recipes")
        .select("*")
        .eq("id", link.target_id)
        .eq("user_id", link.user_id)
        .maybeSingle();
      if (error || !data) return json({ error: "Recept niet meer beschikbaar" }, 404);
      recipes = [data];
    } else if (link.scope === "cookbook") {
      const { data, error } = await service
        .from("recipes")
        .select("*")
        .eq("user_id", link.user_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      recipes = data || [];
    }

    // Verhoog view_count async (niet blocking)
    service
      .from("share_links")
      .update({ view_count: 1 })
      .eq("id", link.id)
      .then(() => {});

    return json({
      scope: link.scope,
      owner: {
        firstName: profile?.first_name || "Vriend van koken",
        cookbookName: profile?.cookbook_name || "Mijn Kookboek",
      },
      recipes,
    }, 200);
  } catch (err: any) {
    console.error("share-read error:", err);
    return json({ error: err?.message || "Onbekende fout" }, 500);
  }
});

function json(body: any, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
