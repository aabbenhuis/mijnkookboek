// Recept detail view: tonen, portie scaler, verwijderen, naar boodschappenlijst,
// AI foto genereren, voedingswaarden berekenen, eigen foto uploaden

import * as supabaseClient from "../storage/supabase-client.js";
import { toast } from "../components/toast.js";
import { confirmModal } from "../components/modal.js";
import { updateActiveNav, updateCreditDisplay } from "../components/app-shell.js";
import { showView } from "../router.js";
import { STATE, setState } from "../state.js";
import { COOK_STYLES, getImageHint, getDisplayCookStyle, getStylistTag } from "../data/cook-styles.js";
import { getDiet } from "../data/categories.js";
import { showShareModal } from "../components/share-modal.js";
import { PHOTO_MAX_DIM, PHOTO_QUALITY, PHOTO_MAX_UPLOAD_MB, CREDIT_COSTS } from "../config.js";

let containerEl = null;
let currentRecipe = null;

export async function mount(container, params) {
  containerEl = container;
  updateActiveNav("detail");
  if (!params?.id) {
    toast("Geen recept gevonden", "error");
    showView("home");
    return;
  }
  containerEl.innerHTML = `<div class="container" style="padding: 64px 0;"><p class="muted-text text-center">Recept laden...</p></div>`;
  try {
    currentRecipe = await supabaseClient.getRecipe(params.id);
    render();
  } catch (err) {
    console.error(err);
    toast("Recept niet gevonden", "error");
    showView("home");
  }
}

function render() {
  const r = currentRecipe;
  const tags = (r.tags || []);
  const tagColors = ["tag-purple", "tag-orange", "tag-green", "tag-sky"];
  const displayStyle = getDisplayCookStyle(r.cook_style);
  let styleBadge = "";
  if (displayStyle) {
    const personBadge = `<span class="badge badge-purple">In de stijl van ${escapeHtml(displayStyle.primary)}</span>`;
    const tagBadge = displayStyle.stylistTag
      ? `<span class="badge badge-stylist">${escapeHtml(displayStyle.stylistTag)}</span>`
      : "";
    styleBadge = `<div class="style-badges" style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px;">${personBadge}${tagBadge}</div>`;
  }

  const aiPhotoBtn = r.photo_url
    ? `<button class="btn btn-secondary" data-detail-regen-image>Vervang met AI foto (${CREDIT_COSTS.AI_PHOTO} credits)</button>`
    : `<button class="btn btn-dark" data-detail-gen-image>Genereer mooie foto met AI (${CREDIT_COSTS.AI_PHOTO} credits)</button>`;
  const uploadBtn = `<button class="btn btn-secondary" data-detail-upload>${r.photo_url ? "Upload eigen foto" : "Of upload een eigen foto"}</button>`;
  const photoActions = `<div style="display: grid; gap: 8px; margin-top: 12px;">${aiPhotoBtn}${uploadBtn}</div>`;

  containerEl.innerHTML = `
    <section class="block">
      <div class="container">
        <div class="row between" style="padding: 32px 0 0">
          <button class="btn btn-ghost recipe-detail-back" data-nav="home">Terug naar kookboek</button>
          <div class="row">
            <button class="btn btn-secondary" id="btn-share">Deel</button>
            <button class="btn btn-danger" id="btn-delete">Verwijder</button>
          </div>
        </div>

        <div class="recipe-detail">
          <div>
            ${r.photo_url
              ? `<div class="photo" style="background-image:url('${r.photo_url}')"></div>`
              : `<div class="photo">Geen foto</div>`}
            ${photoActions}
          </div>
          <div>
            ${styleBadge}
            <h1>${escapeHtml(r.title)}</h1>
            <p style="color: var(--slate); margin: 0 0 16px; font-size: 18px;">${escapeHtml(r.description || "")}</p>

            <div class="recipe-meta-row">
              ${r.cook_time ? `<span class="meta-pill">${r.cook_time} min</span>` : ""}
              ${r.meal_type ? `<span class="meta-pill">${escapeHtml(r.meal_type)}</span>` : ""}
              ${(r.dish_type || []).map(d => `<span class="meta-pill">${escapeHtml(d)}</span>`).join("")}
              <span class="meta-pill">
                Porties
                <span class="scaler">
                  <button data-scale="-1">−</button>
                  <span class="servings" id="serv-display">${r.servings || 1}</span>
                  <button data-scale="1">+</button>
                </span>
              </span>
            </div>

            ${(r.diet && r.diet.length) ? `<div class="diet-badges" style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px;">${r.diet.map(k => {
              const d = getDiet(k);
              return d ? `<span class="diet-badge tint-${d.color}">${d.icon} ${escapeHtml(d.label)}</span>` : "";
            }).join("")}</div>` : ""}

            ${tags.length ? `<div class="recipe-tags" style="margin-bottom: 16px">${tags.map((t, i) => `<span class="tag-chip ${tagColors[i % 4]}">${escapeHtml(t)}</span>`).join("")}</div>` : ""}

            <div style="margin: 16px 0 24px">
              <button class="btn btn-dark" id="btn-add-shopping" style="width: 100%">Voeg toe aan boodschappenlijst</button>
            </div>

            <div class="recipe-section ingredients">
              <h2>Ingredienten</h2>
              <ul id="ingredients-list">
                ${(r.ingredients || []).map(i => `<li data-original="${escapeAttr(i)}">${escapeHtml(i)}</li>`).join("")}
              </ul>
            </div>

            <div class="recipe-section instructions">
              <h2>Bereiding</h2>
              <ol>
                ${(r.instructions || []).map(s => `<li>${escapeHtml(s)}</li>`).join("")}
              </ol>
            </div>

            ${r.tips ? `<div class="recipe-section"><h2>Tip</h2><p>${escapeHtml(r.tips)}</p></div>` : ""}

            <div class="recipe-section" id="nutrition-section">
              <h2>Voedingswaarden per portie</h2>
              ${renderNutritionBlock(r)}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  bindScaler();
  bindDelete();
  bindShopping();
  bindNutritionAction();
  bindPhotoActions();
  bindShareAction();
}

function bindShareAction() {
  const btn = document.getElementById("btn-share");
  if (!btn) return;
  btn.addEventListener("click", () => {
    showShareModal({ scope: "recipe", targetId: currentRecipe.id, title: currentRecipe.title });
  });
}

function renderNutritionBlock(r) {
  if (r.nutrition) return renderNutrition(r.nutrition);
  return `
    <p class="muted-text" style="margin: 0 0 12px;">Nog niet berekend voor dit recept.</p>
    <button class="btn btn-secondary" data-calc-nutrition>Bereken voedingswaarden met AI (${CREDIT_COSTS.NUTRITION} credit)</button>
  `;
}

function renderNutrition(n) {
  return `
    <div class="nutrition-grid">
      <div class="nutri"><span class="nutri-val">${n.calories}</span><span class="nutri-label">kcal</span></div>
      <div class="nutri"><span class="nutri-val">${n.protein} g</span><span class="nutri-label">eiwit</span></div>
      <div class="nutri"><span class="nutri-val">${n.carbs} g</span><span class="nutri-label">koolhydraten</span></div>
      <div class="nutri"><span class="nutri-val">${n.fat} g</span><span class="nutri-label">vet</span></div>
      <div class="nutri"><span class="nutri-val">${n.fiber} g</span><span class="nutri-label">vezels</span></div>
    </div>
    <p class="hint" style="margin-top: 12px">Schatting op basis van ingredienten. Niet bedoeld als medisch advies.</p>
  `;
}

function bindScaler() {
  const base = currentRecipe.servings || 1;
  let current = base;
  const display = document.getElementById("serv-display");
  document.querySelectorAll("[data-scale]").forEach(b => {
    b.addEventListener("click", () => {
      current = Math.max(1, current + Number(b.dataset.scale));
      display.textContent = current;
      const factor = current / base;
      document.querySelectorAll("#ingredients-list li").forEach(li => {
        li.textContent = scaleIngredient(li.dataset.original, factor);
      });
    });
  });
}

function scaleIngredient(text, factor) {
  if (factor === 1) return text;
  return text.replace(/(\d+([.,]\d+)?)/g, (m) => {
    const n = parseFloat(m.replace(",", "."));
    const scaled = n * factor;
    const rounded = Math.round(scaled * 100) / 100;
    return String(rounded).replace(".", ",");
  });
}

function bindDelete() {
  document.getElementById("btn-delete").addEventListener("click", async () => {
    const ok = await confirmModal("Recept verwijderen", "Weet je zeker dat je dit recept uit je kookboek wilt halen?");
    if (!ok) return;
    try {
      await supabaseClient.deleteRecipe(currentRecipe.id);
      // Probeer ook foto's te verwijderen
      try { await supabaseClient.deleteRecipePhotos(currentRecipe.id); } catch {}
      toast("Recept verwijderd", "success");
      showView("home");
    } catch (err) {
      toast(err.message || "Verwijderen mislukt", "error");
    }
  });
}

function bindPhotoActions() {
  const aiBtn = document.querySelector("[data-detail-gen-image], [data-detail-regen-image]");
  if (aiBtn) {
    aiBtn.addEventListener("click", async () => {
      const orig = aiBtn.innerHTML;
      aiBtn.disabled = true;
      aiBtn.innerHTML = '<span class="spinner"></span> Bezig met genereren...';
      try {
        const photoUrl = await generateRecipePhoto(currentRecipe);
        if (photoUrl) {
          await supabaseClient.updateRecipe(currentRecipe.id, { photo_url: photoUrl });
          currentRecipe.photo_url = photoUrl;
          toast("Foto opgeslagen bij recept", "success");
          render();
        } else {
          aiBtn.disabled = false;
          aiBtn.innerHTML = orig;
        }
      } catch (err) {
        toast(err.message || "AI foto genereren mislukt", "error");
        aiBtn.disabled = false;
        aiBtn.innerHTML = orig;
      }
    });
  }

  const uploadBtn = document.querySelector("[data-detail-upload]");
  if (uploadBtn) {
    uploadBtn.addEventListener("click", async () => {
      const orig = uploadBtn.innerHTML;
      uploadBtn.disabled = true;
      uploadBtn.innerHTML = '<span class="spinner"></span> Bezig...';
      try {
        const blob = await pickAndCompressPhoto();
        if (blob) {
          const photoUrl = await supabaseClient.uploadRecipePhoto(currentRecipe.id, blob, "jpg");
          await supabaseClient.updateRecipe(currentRecipe.id, { photo_url: photoUrl });
          currentRecipe.photo_url = photoUrl;
          toast("Eigen foto opgeslagen", "success");
          render();
        } else {
          uploadBtn.disabled = false;
          uploadBtn.innerHTML = orig;
        }
      } catch (err) {
        toast(err.message || "Upload mislukt", "error");
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = orig;
      }
    });
  }
}

function bindNutritionAction() {
  const btn = document.querySelector("[data-calc-nutrition]");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Bezig...';
    try {
      const nutrition = await calculateNutrition(currentRecipe);
      if (nutrition) {
        await supabaseClient.updateRecipe(currentRecipe.id, { nutrition });
        currentRecipe.nutrition = nutrition;
        toast("Voedingswaarden berekend", "success");
        const section = document.getElementById("nutrition-section");
        if (section) section.innerHTML = `<h2>Voedingswaarden per portie</h2>${renderNutrition(nutrition)}`;
      }
    } catch (err) {
      toast(err.message || "Berekening mislukt", "error");
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });
}

async function generateRecipePhoto(recipe) {
  const styleKey = recipe.cook_style || "neutraal";
  const hint = getImageHint(styleKey);
  const topIngredients = (recipe.ingredients || []).slice(0, 5).map(i => i.replace(/^\d+[^a-zA-Z]*/, "")).join(", ");
  const desc = recipe.description ? `${recipe.description}. ` : "";
  const prompt = `Professional overhead food photography of ${recipe.title}. ${desc}Visible ingredients include ${topIngredients}. Style: ${hint}. Shot from above on a rustic surface, natural daylight, shallow depth of field, soft shadows, no text, no labels, no people, square composition.`;

  const result = await supabaseClient.callOpenAIImage({ prompt, quality: "medium", size: "1024x1024" });

  if (typeof result.credits === "number") {
    setState({ profile: { ...STATE.profile, credits: result.credits } });
    updateCreditDisplay();
  }

  // Krijg b64 of url
  let rawDataUrl;
  if (result.b64) rawDataUrl = "data:image/png;base64," + result.b64;
  else if (result.url) rawDataUrl = await urlToDataUrl(result.url);
  else throw new Error("Geen afbeelding ontvangen");

  // Comprimeer
  const compressedBlob = await compressDataUrlToBlob(rawDataUrl);

  // Upload naar Supabase Storage
  return await supabaseClient.uploadRecipePhoto(currentRecipe.id, compressedBlob, "jpg");
}

async function calculateNutrition(recipe) {
  const prompt = `Schat de voedingswaarden per portie voor dit recept en geef alleen een geldig JSON object terug, zonder uitleg.

Titel: ${recipe.title}
Porties: ${recipe.servings || 2}
Ingredienten:
${(recipe.ingredients || []).join("\n")}

Geef terug:
{ "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number }

Calorieen in kcal, andere waarden in gram, per portie.`;

  const result = await supabaseClient.callClaude({
    system: "Je bent een voedingsexpert. Schat realistische voedingswaarden op basis van ingredienten.",
    messages: [{ role: "user", content: prompt }],
    maxTokens: 500,
    actionKind: "nutrition",
    creditCost: CREDIT_COSTS.NUTRITION,
    description: "Voedingswaarden berekenen",
  });

  if (typeof result.credits === "number") {
    setState({ profile: { ...STATE.profile, credits: result.credits } });
    updateCreditDisplay();
  }

  const match = result.text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Geen JSON gevonden in antwoord");
  const data = JSON.parse(match[0]);
  return {
    calories: Math.round(Number(data.calories) || 0),
    protein: Math.round(Number(data.protein) || 0),
    carbs: Math.round(Number(data.carbs) || 0),
    fat: Math.round(Number(data.fat) || 0),
    fiber: Math.round(Number(data.fiber) || 0),
  };
}

async function urlToDataUrl(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = reject;
      img.src = url;
    });
  }
}

async function compressDataUrlToBlob(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, PHOTO_MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * ratio);
      const h = Math.round(img.naturalHeight * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Compression failed")), "image/jpeg", PHOTO_QUALITY);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function pickAndCompressPhoto() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    document.body.appendChild(input);
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) { resolve(null); return; }
      if (file.size > PHOTO_MAX_UPLOAD_MB * 1024 * 1024) {
        toast(`Foto is groter dan ${PHOTO_MAX_UPLOAD_MB} MB`, "error");
        resolve(null); return;
      }
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const blob = await compressDataUrlToBlob(reader.result);
          resolve(blob);
        };
        reader.onerror = () => { resolve(null); };
        reader.readAsDataURL(file);
      } catch {
        resolve(null);
      }
    });
    input.click();
  });
}

function bindShopping() {
  document.getElementById("btn-add-shopping").addEventListener("click", async () => {
    try {
      const baseServings = currentRecipe.servings || 1;
      const display = document.getElementById("serv-display");
      const currentServings = display ? Number(display.textContent) : baseServings;
      const factor = currentServings / baseServings;
      const newItems = (currentRecipe.ingredients || []).map(text => {
        const scaled = factor === 1 ? text : scaleIngredient(text, factor);
        return {
          id: uid(),
          text: scaled,
          category: categorizeIngredient(scaled),
          recipeTitle: currentRecipe.title,
          checked: false,
          addedAt: Date.now(),
        };
      });
      const current = await supabaseClient.getShoppingList();
      await supabaseClient.saveShoppingList([...current, ...newItems]);
      toast(`${newItems.length} ingredienten toegevoegd`, "success", {
        label: "Bekijk lijst",
        onClick: () => showView("shopping"),
      });
    } catch (err) {
      toast(err.message || "Toevoegen mislukt", "error");
    }
  });
}

// ===== Helpers (eenvoudige categorisatie voor boodschappen) =====

const SHOPPING_CATEGORIES = [
  { key: "groente", keywords: ["paprika","tomaat","ui","knoflook","wortel","courgette","aubergine","pompoen","spinazie","sla","komkommer","aardappel","zoete aardappel","pastinaak","biet","bloemkool","broccoli","prei","bos ui","lente ui","kool","witlof","champignon","paddenstoel","appel","peer","banaan","citroen","limoen","sinaasappel","aardbei","framboos","bes","granaatappel","avocado","rucola","veldsla","kruiden","peterselie","koriander","basilicum","munt","dille","tijm","rozemarijn","selderij","radijs","rabarber","mango","ananas","druif","kers","abrikoos","perzik"] },
  { key: "zuivel", keywords: ["melk","yoghurt","kwark","kaas","parmezaan","feta","mozzarella","ricotta","mascarpone","room","slagroom","kookroom","crème fraîche","creme fraiche","boter","ei","eieren","kefir","karnemelk"] },
  { key: "vlees-vis", keywords: ["kip","kipfilet","kippendij","gehakt","rund","biefstuk","steak","entrecote","ribeye","varkens","spek","bacon","ham","worst","chorizo","salami","lamskoteletten","lam","kalkoen","eend","gans","zalm","tonijn","kabeljauw","makreel","sardines","ansjovis","garnaal","mosselen"] },
  { key: "droogwaren", keywords: ["pasta","spaghetti","penne","fusilli","rijst","basmati","quinoa","couscous","linzen","kikkererwten","bonen","brood","bloem","gist","suiker","cacao","chocolade","muesli","granola","noten","amandel","walnoot","cashew","zaden","zonnebloempit","sesamzaad","kokos"] },
  { key: "kruiden", keywords: ["olie","olijfolie","azijn","balsamico","sojasaus","tamari","mosterd","mayonaise","honing","kaneel","kurkuma","komijn","koriander","paprikapoeder","chili","gember","oregano","tahin","tahini","miso"] },
];

function categorizeIngredient(text) {
  const low = text.toLowerCase();
  for (const cat of SHOPPING_CATEGORIES) {
    for (const kw of cat.keywords) {
      if (low.includes(kw)) return cat.key;
    }
  }
  return "overig";
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
function escapeAttr(s) { return escapeHtml(s); }
