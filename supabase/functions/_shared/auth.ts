// Auth helper voor edge functions
// Haalt de ingelogde gebruiker uit de request en verifieert de JWT

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { user: null, error: "Geen authorization header" };
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { user: null, error: "Ongeldige sessie, log opnieuw in" };
  }
  return { user, error: null };
}

export function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export async function spendCredits(
  userId: string,
  amount: number,
  actionKind: string,
  description?: string,
) {
  const service = getServiceClient();
  const { data, error } = await service.rpc("spend_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_action_kind: actionKind,
    p_description: description ?? null,
  });
  if (error) throw error;
  return data as number;
}
