// Claude proxy edge function met retry en duidelijke foutmeldingen
// Frontend stuurt: { system, messages, maxTokens, actionKind, creditCost }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CLAUDE_API = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-opus-4-5";

// HTTP statussen die retry waard zijn (tijdelijke fouten)
const RETRYABLE_STATUSES = [429, 500, 502, 503, 504, 529];
const MAX_RETRIES = 2;
const RETRY_DELAYS_MS = [1500, 3500]; // 1.5s, dan 3.5s

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Geen authorization header", errorType: "auth_missing" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);
    if (userError || !user) {
      return json({ error: "Je bent uitgelogd, log opnieuw in.", errorType: "auth_invalid" }, 401);
    }

    const body = await req.json();
    const {
      system,
      messages,
      maxTokens = 2000,
      model = DEFAULT_MODEL,
      actionKind = "generate",
      creditCost = 1,
      description = null,
    } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: "Geen vraag meegegeven", errorType: "bad_request" }, 400);
    }

    const service = createClient(supabaseUrl, serviceKey);
    let newBalance: number = 0;
    let creditsCharged = false;
    if (creditCost > 0) {
      try {
        const { data, error } = await service.rpc("spend_credits", {
          p_user_id: user.id,
          p_amount: creditCost,
          p_action_kind: actionKind,
          p_description: description,
        });
        if (error) throw error;
        newBalance = data as number;
        creditsCharged = true;
      } catch (e: any) {
        const msg = String(e?.message || e);
        if (msg.includes("Insufficient credits")) {
          return json({
            error: "Je hebt niet genoeg credits voor deze actie.",
            errorType: "insufficient_credits",
          }, 402);
        }
        return json({ error: "Credit check mislukt: " + msg, errorType: "credit_error" }, 500);
      }
    } else {
      // Geen aftrek (bijvoorbeeld doorpraten in de chat): geef het echte saldo terug
      const { data } = await service.from("profiles").select("credits").eq("id", user.id).single();
      newBalance = (data?.credits as number) ?? 0;
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      if (creditsCharged) await refundCredits(service, user.id, creditCost, "Server config fout");
      return json({
        error: "De server is nog niet helemaal ingericht. Neem contact op met de beheerder.",
        errorType: "config_error",
      }, 500);
    }

    // Claude aanroep met retry voor tijdelijke fouten
    const requestBody = JSON.stringify({ model, max_tokens: maxTokens, system, messages });
    let lastStatus = 0;
    let lastBody = "";
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const res = await fetch(CLAUDE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: requestBody,
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text || "";
        return json({ text, credits: newBalance }, 200);
      }

      lastStatus = res.status;
      lastBody = await res.text();
      console.error(`Claude fout (poging ${attempt + 1}/${MAX_RETRIES + 1}):`, lastStatus, lastBody.slice(0, 300));

      // Niet retry-waardige fout: stop direct
      if (!RETRYABLE_STATUSES.includes(lastStatus)) break;

      // Wacht voordat we opnieuw proberen
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAYS_MS[attempt]));
      }
    }

    // Alle pogingen gefaald, refund credits
    if (creditsCharged) await refundCredits(service, user.id, creditCost, `Refund door Claude fout ${lastStatus}`);

    return json(translateApiError(lastStatus, lastBody, "claude"), 502);
  } catch (err: any) {
    console.error("claude-proxy unexpected:", err);
    return json({
      error: "Er ging iets onverwachts mis. Probeer het opnieuw.",
      errorType: "unexpected",
    }, 500);
  }
});

async function refundCredits(service: any, userId: string, amount: number, reason: string) {
  try {
    await service.rpc("add_credits", {
      p_user_id: userId,
      p_amount: amount,
      p_type: "refund",
      p_description: reason,
    });
  } catch (e) {
    console.error("Refund mislukt:", e);
  }
}

function translateApiError(status: number, bodyText: string, service: string) {
  // Parse Anthropic error body indien mogelijk
  let apiMessage = "";
  try {
    const parsed = JSON.parse(bodyText);
    apiMessage = parsed?.error?.message || "";
  } catch {}

  if (status === 529 || (status === 503 && apiMessage.toLowerCase().includes("overloaded"))) {
    return {
      error: "Onze AI souschef is op dit moment heel druk. Probeer het over een minuutje opnieuw, je credits zijn gewoon terug.",
      errorType: "ai_overloaded",
      retryable: true,
    };
  }
  if (status === 429) {
    return {
      error: "Even pauze. Er gaan te veel aanvragen tegelijk. Probeer over een halve minuut opnieuw, je credits zijn terug.",
      errorType: "ai_rate_limit",
      retryable: true,
    };
  }
  if (status >= 500) {
    return {
      error: "De AI dienst is even niet bereikbaar. Probeer het zo opnieuw, je credits zijn terug.",
      errorType: "ai_temporary",
      retryable: true,
    };
  }
  if (status === 401) {
    return {
      error: "De server is nog niet correct ingericht. Neem contact op met de beheerder.",
      errorType: "config_error",
    };
  }
  if (status === 400) {
    return {
      error: "De aanvraag kon niet worden verwerkt. Probeer iets anders te beschrijven.",
      errorType: "bad_request",
    };
  }
  return {
    error: `Er ging iets mis met de AI (code ${status}). Je credits zijn terug.`,
    errorType: "ai_error",
  };
}

function json(body: any, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
