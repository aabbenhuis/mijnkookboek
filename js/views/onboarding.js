// Onboarding flow in drie stappen
// Stap 1: welkom, voornaam, kookboek naam
// Stap 2: kookstijl voorkeur
// Stap 3: eerste actie (voorbeeldrecepten of zelf beginnen)

import { STATE, setState } from "../state.js";
import * as supabaseClient from "../storage/supabase-client.js";
import { supabase, callOpenAIImage } from "../storage/supabase-client.js";
import { toast } from "../components/toast.js";
import { populateCookStyleDropdown, COOK_STYLES, getImageHint } from "../data/cook-styles.js";
import { EXAMPLE_RECIPES, seedPhotoUrl } from "../data/example-recipes.js";
import { PHOTO_MAX_DIM, PHOTO_QUALITY } from "../config.js";

let rootEl = null;
let step = 1;
let formData = {
  firstName: "",
  cookbookName: "Mijn Kookboek",
  cookStyle: "neutraal",
};

export function mount(container) {
  rootEl = container;
  step = 1;
  formData = {
    firstName: STATE.profile?.first_name || "",
    cookbookName: STATE.profile?.cookbook_name || "Mijn Kookboek",
    cookStyle: STATE.profile?.default_cook_style || "neutraal",
  };
  render();
}

function render() {
  rootEl.innerHTML = `
    <div class="auth-screen">
      <div class="card-auth auth-card" style="max-width: 540px;">
        <div class="onboarding-progress">
          <span class="step ${step >= 1 ? "active" : ""}">1</span>
          <span class="step-line ${step >= 2 ? "active" : ""}"></span>
          <span class="step ${step >= 2 ? "active" : ""}">2</span>
          <span class="step-line ${step >= 3 ? "active" : ""}"></span>
          <span class="step ${step >= 3 ? "active" : ""}">3</span>
        </div>
        <div id="onboarding-content"></div>
      </div>
    </div>
  `;
  renderStep();
}

function renderStep() {
  const target = document.getElementById("onboarding-content");
  if (step === 1) renderStep1(target);
  else if (step === 2) renderStep2(target);
  else if (step === 3) renderStep3(target);
}

function renderStep1(target) {
  target.innerHTML = `
    <div class="auth-header" style="margin-bottom: var(--s-xl);">
      <div class="brand-mark">K</div>
      <h1>Welkom in jouw kookboek</h1>
      <p>Eerst even kennismaken. We willen je naam weten zodat we je persoonlijk kunnen aanspreken.</p>
    </div>

    <form id="form-step1" class="stack">
      <div class="field">
        <label for="first-name">Hoe heet je?</label>
        <input type="text" id="first-name" name="firstName" required value="${escapeAttr(formData.firstName)}" placeholder="Bijvoorbeeld: Anke" autocomplete="given-name" />
      </div>
      <div class="field">
        <label for="cookbook-name">Hoe heet jouw kookboek?</label>
        <input type="text" id="cookbook-name" name="cookbookName" value="${escapeAttr(formData.cookbookName)}" placeholder="Mijn Kookboek" maxlength="50" />
        <p class="hint">Verschijnt straks op je PDF cover en bij gedeelde links. Mag ook iets persoonlijks zoals "Anke's keuken" of "Oma's recepten".</p>
      </div>
      <button type="submit" class="btn btn-primary btn-full btn-lg">Verder</button>
    </form>
  `;

  document.getElementById("form-step1").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    formData.firstName = (fd.get("firstName") || "").trim();
    formData.cookbookName = (fd.get("cookbookName") || "Mijn Kookboek").trim();
    if (!formData.firstName) { toast("Vul je voornaam in", "error"); return; }
    step = 2;
    render();
  });
}

function renderStep2(target) {
  target.innerHTML = `
    <div class="auth-header" style="margin-bottom: var(--s-xl);">
      <div class="brand-mark">K</div>
      <h1>Hoe wil je het liefst koken?</h1>
      <p>Kies een kok als signatuur. Hij of zij bepaalt straks welke ingredienten en technieken voorkomen in de recepten die AI voor je maakt. Je kunt dit altijd later wijzigen of per recept iets anders kiezen.</p>
    </div>

    <form id="form-step2" class="stack">
      <div class="field">
        <label for="cook-style">Jouw voorkeur kookstijl</label>
        <select id="cook-style" name="cookStyle"></select>
      </div>
      <div class="form-actions" style="flex-direction: column;">
        <button type="submit" class="btn btn-primary btn-full btn-lg">Verder</button>
        <button type="button" class="btn btn-ghost btn-full" data-back>Vorige stap</button>
      </div>
    </form>
  `;

  populateCookStyleDropdown(document.getElementById("cook-style"), formData.cookStyle);

  document.getElementById("form-step2").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    formData.cookStyle = fd.get("cookStyle") || "neutraal";
    step = 3;
    render();
  });
  target.querySelector("[data-back]").addEventListener("click", () => { step = 1; render(); });
}

function renderStep3(target) {
  const styleLabel = COOK_STYLES[formData.cookStyle]?.label || "Neutraal";
  target.innerHTML = `
    <div class="auth-header" style="margin-bottom: var(--s-xl);">
      <div class="brand-mark">K</div>
      <h1>Bijna klaar, ${escapeHtml(formData.firstName)}</h1>
      <p>Je kookboek heet <strong>${escapeHtml(formData.cookbookName)}</strong> en je kookstijl is <strong>${escapeHtml(styleLabel)}</strong>. Wil je beginnen met een leeg kookboek of met een paar voorbeeldrecepten van Anke?</p>
    </div>

    <div class="stack lg">
      <button class="onboarding-choice" data-choice="examples">
        <strong>Begin met vijf voorbeeldrecepten</strong>
        <span>PokéBowl, Kip Noedelsoep met Kokos, Pulled Pork Quinoa Bowl, Geroosterde Bloemkool met Tahin en Hollandse Zuurkoolschotel. Direct iets om te bladeren en te koken vanavond.</span>
      </button>
      <button class="onboarding-choice" data-choice="empty">
        <strong>Begin met een leeg kookboek</strong>
        <span>Ik voeg liever direct mijn eigen recepten toe of begin met een foto van een handgeschreven recept.</span>
      </button>
      <button class="btn btn-ghost" data-back>Vorige stap</button>
    </div>

    <div id="step3-status" style="margin-top: 24px;"></div>
  `;

  target.querySelectorAll("[data-choice]").forEach(btn => {
    btn.addEventListener("click", () => completeOnboarding(btn.dataset.choice));
  });
  target.querySelector("[data-back]").addEventListener("click", () => { step = 2; render(); });
}

async function completeOnboarding(choice) {
  const status = document.getElementById("step3-status");
  status.innerHTML = `<p class="muted-text text-center"><span class="spinner"></span> Even je kookboek klaarzetten...</p>`;
  rootEl.querySelectorAll("button").forEach(b => b.disabled = true);

  try {
    // Update profile met voornaam, kookboek naam, kookstijl, en onboarded_at
    const updated = await supabaseClient.updateProfile({
      first_name: formData.firstName,
      cookbook_name: formData.cookbookName,
      default_cook_style: formData.cookStyle,
      onboarded_at: new Date().toISOString(),
    });
    setState({ profile: updated });

    // Voorbeeldrecepten toevoegen indien gekozen
    if (choice === "examples") {
      status.innerHTML = `<p class="muted-text text-center"><span class="spinner"></span> Vijf voorbeeldrecepten worden toegevoegd...</p>`;
      const { added } = await addExampleRecipesToCurrentUser();
      toast(`${added} voorbeeldrecepten staan in je kookboek`, "success");
    } else {
      toast("Welkom in jouw kookboek", "success");
    }

    // Doorsturen naar home, app shell wordt opnieuw gemount
    window.location.reload();
  } catch (err) {
    console.error(err);
    toast(err.message || "Er ging iets mis, probeer opnieuw", "error");
    rootEl.querySelectorAll("button").forEach(b => b.disabled = false);
    status.innerHTML = "";
  }
}

export async function addExampleRecipesToCurrentUser() {
  // Eerst ophalen welke voorbeeldrecepten de gebruiker al heeft
  const existing = await supabaseClient.listRecipes();
  const existingTitles = new Set(
    existing.filter(r => r.is_example).map(r => r.title)
  );

  let added = 0;
  let skipped = 0;
  for (const recipe of EXAMPLE_RECIPES) {
    if (existingTitles.has(recipe.title)) {
      skipped++;
      continue;
    }
    try {
      // Voeg seed photo URL toe indien beschikbaar (check via fetch HEAD)
      const photoUrl = await checkSeedPhotoExists(recipe.slug);
      const toCreate = { ...recipe };
      delete toCreate.slug; // niet in database schema
      if (photoUrl) toCreate.photo_url = photoUrl;
      await supabaseClient.createRecipe(toCreate);
      added++;
    } catch (e) {
      console.error("Voorbeeldrecept toevoegen mislukt:", e);
    }
  }
  return { added, skipped };
}

async function checkSeedPhotoExists(slug) {
  if (!slug) return null;
  const url = seedPhotoUrl(slug);
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (res.ok) return url;
  } catch {}
  return null;
}

// Genereert eenmalig voorbeeldfoto's via AI en uploadt ze naar de seed-photos bucket
// Wordt aangeroepen vanuit Instellingen (admin tool)
export async function generateSeedPhotos(progressCallback) {
  const results = [];
  for (let i = 0; i < EXAMPLE_RECIPES.length; i++) {
    const recipe = EXAMPLE_RECIPES[i];
    progressCallback?.({ index: i, total: EXAMPLE_RECIPES.length, slug: recipe.slug, status: "starting" });

    try {
      // Skip als de foto al bestaat
      const existing = await checkSeedPhotoExists(recipe.slug);
      if (existing) {
        progressCallback?.({ index: i, total: EXAMPLE_RECIPES.length, slug: recipe.slug, status: "skipped" });
        results.push({ slug: recipe.slug, url: existing, status: "skipped" });
        continue;
      }

      // Bouw image prompt
      const styleKey = recipe.cook_style || "neutraal";
      const hint = getImageHint(styleKey);
      const top = (recipe.ingredients || []).slice(0, 5).map(s => s.replace(/^\d+[^a-zA-Z]*/, "")).join(", ");
      const prompt = `Professional overhead food photography of ${recipe.title}. ${recipe.description} Visible ingredients include ${top}. Style: ${hint}. Shot from above on a rustic surface, natural daylight, shallow depth of field, soft shadows, no text, no labels, no people, square composition.`;

      progressCallback?.({ index: i, total: EXAMPLE_RECIPES.length, slug: recipe.slug, status: "generating" });

      // Roep edge function aan
      const result = await callOpenAIImage({ prompt, quality: "medium", size: "1024x1024" });

      let rawDataUrl;
      if (result.b64) rawDataUrl = "data:image/png;base64," + result.b64;
      else if (result.url) rawDataUrl = await urlToDataUrl(result.url);
      else throw new Error("Geen afbeelding ontvangen");

      // Comprimeer naar JPEG
      const blob = await dataUrlToCompressedBlob(rawDataUrl, PHOTO_MAX_DIM, PHOTO_QUALITY);

      // Upload naar seed-photos bucket
      const path = `${recipe.slug}.jpg`;
      const { error } = await supabase.storage
        .from("seed-photos")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from("seed-photos").getPublicUrl(path);

      progressCallback?.({ index: i, total: EXAMPLE_RECIPES.length, slug: recipe.slug, status: "done", url: publicUrl });
      results.push({ slug: recipe.slug, url: publicUrl, status: "done" });
    } catch (err) {
      console.error(`Foto generatie mislukt voor ${recipe.slug}:`, err);
      progressCallback?.({ index: i, total: EXAMPLE_RECIPES.length, slug: recipe.slug, status: "error", error: err.message });
      results.push({ slug: recipe.slug, status: "error", error: err.message });
    }
  }
  return results;
}

async function urlToDataUrl(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToCompressedBlob(dataUrl, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * ratio);
      const h = Math.round(img.naturalHeight * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Compression failed")), "image/jpeg", quality);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
function escapeAttr(s) { return escapeHtml(s); }
