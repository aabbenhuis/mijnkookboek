// Claude Vision proxy edge function met retry en duidelijke foutmeldingen

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CLAUDE_API = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-opus-4-5";
const CREDIT_COST = 1;
const RETRYABLE_STATUSES = [429, 500, 502, 503, 504, 529];
const MAX_RETRIES = 2;
const RETRY_DELAYS_MS = [1500, 3500];

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

    const { system, prompt, imageBase64, imageMimeType = "image/jpeg", maxTokens = 3000 } = await req.json();
    if (!imageBase64) return json({ error: "Geen foto meegegeven", errorType: "bad_request" }, 400);
    if (!prompt) return json({ error: "Geen prompt meegegeven", errorType: "bad_request" }, 400);

    const service = createClient(supabaseUrl, serviceKey);
    let newBalance: number;
    try {
      const { data, error } = await service.rpc("spend_credits", {
        p_user_id: user.id,
        p_amount: CREDIT_COST,
        p_action_kind: "vision",
        p_description: "Foto recept inlezen",
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

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      await refundCredits(service, user.id, CREDIT_COST, "Server config fout");
      return json({
        error: "De server is nog niet helemaal ingericht. Neem contact op met de beheerder.",
        errorType: "config_error",
      }, 500);
    }

    const requestBody = JSON.stringify({
      model: DEFAULT_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: imageMimeType, data: imageBase64 } },
          { type: "text", text: prompt },
        ],
      }],
    });

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
      console.error(`Claude Vision fout (poging ${attempt + 1}):`, lastStatus, lastBody.slice(0, 300));

      if (!RETRYABLE_STATUSES.includes(lastStatus)) break;
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAYS_MS[attempt]));
      }
    }

    await refundCredits(service, user.id, CREDIT_COST, `Refund door Vision fout ${lastStatus}`);
    return json(translateApiError(lastStatus, lastBody), 502);
  } catch (err: any) {
    console.error("claude-vision unexpected:", err);
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

  if (status === 529 || (status === 503 && apiMessage.toLowerCase().includes("overloaded"))) {
    return {
      error: "Onze AI is op dit moment erg druk en kan je foto niet lezen. Probeer over een minuutje opnieuw, je credit is terug.",
      errorType: "ai_overloaded",
      retryable: true,
    };
  }
  if (status === 429) {
    return {
      error: "Even pauze, te veel aanvragen tegelijk. Probeer over een halve minuut opnieuw, je credit is terug.",
      errorType: "ai_rate_limit",
      retryable: true,
    };
  }
  if (status >= 500) {
    return {
      error: "De AI dienst is even niet bereikbaar. Probeer het zo opnieuw, je credit is terug.",
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
      error: "De foto kon niet worden verwerkt. Probeer een andere foto, scherper of beter belicht.",
      errorType: "bad_request",
    };
  }
  return {
    error: `Er ging iets mis met het foto lezen (code ${status}). Je credit is terug.`,
    errorType: "ai_error",
  };
}

function json(body: any, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
