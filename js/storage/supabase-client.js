// Supabase client wrapper
// Centrale plek voor alle database en auth operaties
// Andere modules praten via deze wrapper met Supabase

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "../config.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ============================================================
// AUTH
// ============================================================

export async function signUp({ email, password, firstName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName },
    },
  });
  if (error) throw error;
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => callback(event, session));
}

export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset.html`,
  });
  if (error) throw error;
}

// Bepaal waar de gebruiker na inloggen terechtkomt: altijd in de app, niet op de voorpagina
function appRedirectUrl() {
  const origin = window.location.origin;
  // Lokaal openen via file:// geeft geen bruikbare origin, dan laten we Supabase de Site URL gebruiken
  if (!origin || origin === "null") return undefined;
  return `${origin}/app.html`;
}

// Inloggen of registreren met Google
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: appRedirectUrl(),
    },
  });
  if (error) throw error;
  return data;
}

// Inloggen of registreren met een magische link per mail (geen wachtwoord nodig)
export async function signInWithMagicLink(email) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: appRedirectUrl(),
      shouldCreateUser: true,
    },
  });
  if (error) throw error;
  return data;
}

// ============================================================
// PROFIEL
// ============================================================

export async function getProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(updates) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Niet ingelogd");
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// RECEPTEN
// ============================================================

export async function listRecipes() {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getRecipe(id) {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createRecipe(recipe) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Niet ingelogd");
  const payload = { ...recipe, user_id: user.id };
  delete payload.id;
  const { data, error } = await supabase
    .from("recipes")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRecipe(id, updates) {
  const { data, error } = await supabase
    .from("recipes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRecipe(id) {
  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ============================================================
// BOODSCHAPPENLIJST
// ============================================================

export async function getShoppingList() {
  const user = await getCurrentUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("items")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data?.items || [];
}

export async function saveShoppingList(items) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Niet ingelogd");
  const { error } = await supabase
    .from("shopping_lists")
    .upsert({ user_id: user.id, items });
  if (error) throw error;
}

// ============================================================
// FOTO UPLOAD
// ============================================================

export async function uploadRecipePhoto(recipeId, blobOrFile, ext = "jpg") {
  const user = await getCurrentUser();
  if (!user) throw new Error("Niet ingelogd");
  const path = `${user.id}/${recipeId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("recipe-photos")
    .upload(path, blobOrFile, { upsert: true, contentType: `image/${ext === "jpg" ? "jpeg" : ext}` });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage
    .from("recipe-photos")
    .getPublicUrl(path);
  return publicUrl;
}

export async function deleteRecipePhotos(recipeId) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Niet ingelogd");
  const folder = `${user.id}/${recipeId}`;
  const { data: files } = await supabase.storage.from("recipe-photos").list(folder);
  if (!files || files.length === 0) return;
  const paths = files.map(f => `${folder}/${f.name}`);
  await supabase.storage.from("recipe-photos").remove(paths);
}

// ============================================================
// CREDITS (via RPC functies in de database)
// ============================================================

export async function getCredits() {
  const profile = await getProfile();
  return profile?.credits ?? 0;
}

// Spend credits met server side check, voorkomt minus saldo
export async function spendCredits(amount, actionKind, description = null) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Niet ingelogd");
  const { data, error } = await supabase.rpc("spend_credits", {
    p_user_id: user.id,
    p_amount: amount,
    p_action_kind: actionKind,
    p_description: description,
  });
  if (error) throw error;
  return data; // nieuw saldo
}

// ============================================================
// EDGE FUNCTIONS (AI proxies)
// ============================================================

async function invokeFunction(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    // Probeer de echte foutmelding uit de response body te halen
    let detailedMsg = error.message || "Function aanroep mislukt";
    try {
      const ctx = error.context;
      if (ctx) {
        let errorData;
        if (typeof ctx.json === "function") {
          try {
            errorData = await ctx.json();
          } catch {
            const txt = await ctx.text?.();
            if (txt) {
              try { errorData = JSON.parse(txt); } catch { detailedMsg = txt; }
            }
          }
        } else if (typeof ctx.text === "function") {
          const txt = await ctx.text();
          if (txt) {
            try { errorData = JSON.parse(txt); } catch { detailedMsg = txt; }
          }
        }
        if (errorData?.error) detailedMsg = errorData.error;
      }
    } catch (parseErr) {
      console.error("Error parsing failed:", parseErr);
    }
    console.error(`Edge Function ${name} fout:`, detailedMsg, error);
    throw new Error(detailedMsg);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function callClaude({ system, messages, maxTokens = 2000, actionKind = "generate", creditCost = 1, description = null, model = undefined }) {
  return invokeFunction("claude-proxy", {
    system, messages, maxTokens, actionKind, creditCost, description, model,
  });
}

export async function callClaudeVision({ system, prompt, imageBase64, imageMimeType = "image/jpeg", maxTokens = 3000 }) {
  return invokeFunction("claude-vision", {
    system, prompt, imageBase64, imageMimeType, maxTokens,
  });
}

export async function callOpenAIImage({ prompt, quality = "medium", size = "1024x1024" }) {
  return invokeFunction("openai-image", { prompt, quality, size });
}

// ============================================================
// SHARE LINKS
// ============================================================

export async function createShareLink({ scope, targetId = null }) {
  return invokeFunction("share-create", { scope, targetId });
}

export async function readShareLink(slug) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/share-read?slug=${encodeURIComponent(slug)}`, {
    headers: {
      "apikey": SUPABASE_PUBLISHABLE_KEY,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Fout ${res.status}`);
  }
  return res.json();
}

// ============================================================
// MOLLIE PAYMENTS
// ============================================================

export async function createPayment({ package: packageId }) {
  return invokeFunction("mollie-create-payment", { package: packageId });
}

export async function cloneSharedRecipe(recipe) {
  // Kopieert een gedeeld recept naar het kookboek van de ingelogde gebruiker
  const cleaned = { ...recipe };
  delete cleaned.id;
  delete cleaned.user_id;
  delete cleaned.created_at;
  delete cleaned.updated_at;
  return createRecipe(cleaned);
}
