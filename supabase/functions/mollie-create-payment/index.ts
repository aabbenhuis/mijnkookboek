// Mollie create payment edge function
// Maakt een betaling aan en returnt de checkout URL
// Frontend stuurt: { package: "proef" | "populair" | "power" }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MOLLIE_API = "https://api.mollie.com/v2/payments";

const PACKAGES = {
  proef: { credits: 50, priceEur: "4.95", label: "Proef" },
  populair: { credits: 150, priceEur: "12.95", label: "Populair" },
  power: { credits: 500, priceEur: "29.95", label: "Power" },
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
    const mollieKey = Deno.env.get("MOLLIE_API_KEY");
    const appUrl = Deno.env.get("APP_URL") || "https://mijndigitaalkookboek.nl";

    if (!mollieKey) return json({ error: "Server is niet geconfigureerd (MOLLIE_API_KEY ontbreekt)" }, 500);

    const authClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);
    if (userError || !user) return json({ error: "Je bent uitgelogd, log opnieuw in" }, 401);

    const { package: packageId } = await req.json();
    const pkg = PACKAGES[packageId as keyof typeof PACKAGES];
    if (!pkg) return json({ error: "Ongeldig pakket" }, 400);

    const service = createClient(supabaseUrl, serviceKey);

    // Maak een mollie_orders rij aan
    const { data: order, error: orderError } = await service
      .from("mollie_orders")
      .insert({
        user_id: user.id,
        package: packageId,
        credits: pkg.credits,
        amount_eur: pkg.priceEur,
        status: "open",
      })
      .select("id")
      .single();
    if (orderError) throw orderError;

    // Webhook URL: Mollie roept onze edge function aan na betaling
    const webhookUrl = `${supabaseUrl}/functions/v1/mollie-webhook`;
    // Redirect URL: waar de gebruiker terugkomt na betalen
    const redirectUrl = `${appUrl}?payment=done&order=${order.id}`;

    // Roep Mollie API aan
    const mollieRes = await fetch(MOLLIE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mollieKey}`,
      },
      body: JSON.stringify({
        amount: { currency: "EUR", value: pkg.priceEur },
        description: `Mijn Digitaal Kookboek: ${pkg.label} pakket (${pkg.credits} credits)`,
        redirectUrl,
        webhookUrl,
        metadata: {
          user_id: user.id,
          order_id: order.id,
          package: packageId,
          credits: pkg.credits,
        },
      }),
    });

    if (!mollieRes.ok) {
      const errText = await mollieRes.text();
      console.error("Mollie fout:", mollieRes.status, errText);
      // Update order naar failed
      await service.from("mollie_orders").update({ status: "failed" }).eq("id", order.id);
      return json({ error: "Mollie weigerde de betaling: " + mollieRes.status }, 502);
    }

    const molliePayment = await mollieRes.json();

    // Sla het Mollie payment ID op
    await service
      .from("mollie_orders")
      .update({ mollie_payment_id: molliePayment.id })
      .eq("id", order.id);

    return json({
      checkoutUrl: molliePayment._links?.checkout?.href,
      paymentId: molliePayment.id,
      orderId: order.id,
    }, 200);
  } catch (err: any) {
    console.error("mollie-create-payment error:", err);
    return json({ error: err?.message || "Onbekende fout" }, 500);
  }
});

function json(body: any, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
