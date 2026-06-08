// Mollie webhook edge function
// Wordt door Mollie aangeroepen na een betaling
// Mollie POST: id=tr_xxx (urlencoded form)
// Geen auth nodig (publiek bereikbaar voor Mollie)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MOLLIE_API_BASE = "https://api.mollie.com/v2/payments";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mollieKey = Deno.env.get("MOLLIE_API_KEY");
    if (!mollieKey) {
      console.error("MOLLIE_API_KEY ontbreekt");
      return new Response("Config error", { status: 500 });
    }

    // Mollie stuurt id als form data
    const contentType = req.headers.get("content-type") || "";
    let paymentId: string | null = null;
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      paymentId = formData.get("id") as string;
    } else {
      // Fallback: JSON
      const body = await req.json().catch(() => ({}));
      paymentId = body?.id;
    }

    if (!paymentId) {
      console.error("Geen payment id ontvangen");
      return new Response("Missing id", { status: 400 });
    }

    // Haal de betaling op bij Mollie om de echte status te zien
    const mollieRes = await fetch(`${MOLLIE_API_BASE}/${paymentId}`, {
      headers: { "Authorization": `Bearer ${mollieKey}` },
    });
    if (!mollieRes.ok) {
      console.error("Mollie kon payment niet ophalen:", mollieRes.status);
      return new Response("Mollie fetch error", { status: 502 });
    }
    const payment = await mollieRes.json();

    const service = createClient(supabaseUrl, serviceKey);

    // Vind onze order
    const { data: order, error: orderError } = await service
      .from("mollie_orders")
      .select("*")
      .eq("mollie_payment_id", paymentId)
      .single();

    if (orderError || !order) {
      console.error("Order niet gevonden voor payment:", paymentId);
      return new Response("Order not found", { status: 404 });
    }

    // Update order status
    const newStatus = payment.status; // "paid", "failed", "expired", "canceled", "open"
    await service
      .from("mollie_orders")
      .update({
        status: newStatus,
        paid_at: payment.status === "paid" ? payment.paidAt || new Date().toISOString() : null,
      })
      .eq("id", order.id);

    // Als betaald én nog niet eerder verwerkt (status was niet paid), credits toevoegen
    if (payment.status === "paid" && order.status !== "paid") {
      await service.rpc("add_credits", {
        p_user_id: order.user_id,
        p_amount: order.credits,
        p_type: "purchase",
        p_mollie_id: paymentId,
        p_description: `Aankoop ${order.package} pakket: ${order.credits} credits`,
      });
      console.log(`Credits toegevoegd voor user ${order.user_id}: ${order.credits}`);
    }

    return new Response("OK", { status: 200 });
  } catch (err: any) {
    console.error("mollie-webhook error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
