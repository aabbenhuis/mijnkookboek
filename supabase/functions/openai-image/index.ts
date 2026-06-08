// OpenAI Image proxy edge function met retry en duidelijke foutmeldingen

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OPENAI_API = "https://api.openai.com/v1/images/generations";
const DEFAULT_MODEL = "gpt-image-1";
const DEFAULT_QUALITY = "medium";
const CREDIT_COST = 5;
const RETRYABLE_STATUSES = [429, 500, 502, 503, 504];
const MAX_RETRIES = 2;
const RETRY_DELAYS_MS = [2000, 5000];

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

    const { prompt, quality = DEFAULT_QUALITY, size = "1024x1024" } = await req.json();
    if (!prompt) return json({ error: "Geen prompt meegegeven", errorType: "bad_request" }, 400);

    const service = createClient(supabaseUrl, serviceKey);
    let newBalance: number;
    try {
      const { data, error } = await service.rpc("spend_credits", {
        p_user_id: user.id,
        p_amount: CREDIT_COST,
        p_action_kind: "ai-photo",
        p_description: "AI recept foto",
      });
      if (error) throw error;
      newBalance = data as number;
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

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      await refundCredits(service, user.id, CREDIT_COST, "Server config fout");
      return json({
        error: "De server is nog niet helemaal ingericht. Neem contact op met de beheerder.",
        errorType: "config_error",
      }, 500);
    }

    const requestBody = JSON.stringify({ model: DEFAULT_MODEL, prompt, n: 1, size, quality });

    let lastStatus = 0;
    let lastBody = "";
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const res = await fetch(OPENAI_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: requestBody,
      });

      if (res.ok) {
        const data = await res.json();
        const item = data.data?.[0];
        if (!item) {
          await refundCredits(service, user.id, CREDIT_COST, "Geen afbeelding in response");
          return json({
            error: "De AI gaf geen foto terug. Probeer opnieuw, je credits zijn terug.",
            errorType: "ai_error",
            retryable: true,
          }, 502);
        }
        return json({ b64: item.b64_json || null, url: item.url || null, credits: newBalance }, 200);
      }

      lastStatus = res.status;
      lastBody = await res.text();
      console.error(`OpenAI Image fout (poging ${attempt + 1}):`, lastStatus, lastBody.slice(0, 300));

      if (!RETRYABLE_STATUSES.includes(lastStatus)) break;
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAYS_MS[attempt]));
      }
    }

    await refundCredits(service, user.id, CREDIT_COST, `Refund door OpenAI fout ${lastStatus}`);
    return json(translateApiError(lastStatus, lastBody), 502);
  } catch (err: any) {
    console.error("openai-image unexpected:", err);
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

function translateApiError(status: number, bodyText: string) {
  let apiMessage = "";
  try {
    const parsed = JSON.parse(bodyText);
    apiMessage = parsed?.error?.message || "";
  } catch {}

  if (status === 429) {
    if (apiMessage.toLowerCase().includes("billing") || apiMessage.toLowerCase().includes("quota")) {
      return {
        error: "Het tegoed op het OpenAI account is op. Neem contact op met de beheerder.",
        errorType: "ai_quota",
      };
    }
    return {
      error: "Even pauze, te veel foto aanvragen tegelijk. Probeer over een halve minuut opnieuw, je credits zijn terug.",
      errorType: "ai_rate_limit",
      retryable: true,
    };
  }
  if (status >= 500) {
    return {
      error: "De foto generatie dienst is even niet bereikbaar. Probeer het zo opnieuw, je credits zijn terug.",
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
  if (status === 403) {
    if (apiMessage.toLowerCase().includes("verify") || apiMessage.toLowerCase().includes("organization")) {
      return {
        error: "De beheerder moet zijn OpenAI organisatie verifieren voor foto generatie.",
        errorType: "config_verification",
      };
    }
    return {
      error: "AI foto generatie is niet beschikbaar voor deze server.",
      errorType: "ai_forbidden",
    };
  }
  if (status === 400) {
    if (apiMessage.toLowerCase().includes("content policy") || apiMessage.toLowerCase().includes("safety")) {
      return {
        error: "De foto kon niet worden gemaakt omdat de beschrijving tegen het beleid van de AI ingaat. Probeer iets neutralers, je credits zijn terug.",
        errorType: "content_policy",
      };
    }
    return {
      error: "De foto aanvraag kon niet worden verwerkt. Probeer opnieuw, je credits zijn terug.",
      errorType: "bad_request",
    };
  }
  return {
    error: `Er ging iets mis met de foto generatie (code ${status}). Je credits zijn terug.`,
    errorType: "ai_error",
  };
}

function json(body: any, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
