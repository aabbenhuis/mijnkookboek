// Recept toevoegen view met drie tabbladen: handmatig, AI generatie, foto inlezen

import { STATE, setState } from "../state.js";
import * as supabaseClient from "../storage/supabase-client.js";
import { toast } from "../components/toast.js";
import { updateActiveNav, updateCreditDisplay } from "../components/app-shell.js";
import { showView } from "../router.js";
import { PHOTO_MAX_DIM, PHOTO_QUALITY, PHOTO_MAX_UPLOAD_MB, CREDIT_COSTS } from "../config.js";
import { populateCookStyleDropdown, cookStyleBlock, getImageHint } from "../data/cook-styles.js";
import { MEAL_TYPES, DISH_TYPES, DIETS } from "../data/categories.js";

let containerEl = null;
let activeTab = "manual";
let aiSubTab = "form";
let pendingPhotoBlob = null;
let pendingPhotoDataUrl = null;
let chatHistory = [];
let aiPreviewRecipe = null;
let photoPreviewRecipe = null;
let linkPreviewRecipe = null;
let editRecipe = null;

export async function mount(container, params = {}) {
  containerEl = container;
  pendingPhotoBlob = null;
  pendingPhotoDataUrl = null;
  chatHistory = [];
  aiPreviewRecipe = null;
  photoPreviewRecipe = null;
  linkPreviewRecipe = null;
  editRecipe = null;
  aiSubTab = "form";
  updateActiveNav("add");

  if (params.editId) {
    containerEl.innerHTML = `<div class="container" style="padding: 64px 0;"><p class="muted-text text-center">Recept laden...</p></div>`;
    try {
      editRecipe = await supabaseClient.getRecipe(params.editId);
      activeTab = "manual";
    } catch (err) {
      toast("Recept laden mislukt", "error");
      showView("home");
      return;
    }
  } else {
    activeTab = params.tab || "manual";
  }
  render();
}

function render() {
  const isEdit = !!editRecipe;
  const heading = isEdit ? "Recept bewerken" : "Nieuw recept";
  const sub = isEdit
    ? `Pas '${escapeHtml(editRecipe.title)}' aan en bewaar je wijzigingen.`
    : "Kies hoe je dit recept wilt maken.";
  const tabs = isEdit
    ? ""
    : `<div class="method-tabs" id="add-tabs">
         <button class="method-tab ${activeTab === "manual" ? "active" : ""}" data-tab="manual"><img src="assets/icon-cook.svg" alt="" /><span>Zelf invullen</span></button>
         <button class="method-tab ${activeTab === "ai" ? "active" : ""}" data-tab="ai"><img src="assets/icon-sparkle.svg" alt="" /><span>Met AI</span></button>
         <button class="method-tab ${activeTab === "photo" ? "active" : ""}" data-tab="photo"><img src="assets/icon-camera.svg" alt="" /><span>Uit foto</span></button>
         <button class="method-tab ${activeTab === "link" ? "active" : ""}" data-tab="link"><img src="assets/icon-link.svg" alt="" /><span>Uit een link</span></button>
       </div>`;
  const backNav = isEdit ? `detail` : `home`;
  const backLabel = isEdit ? "Terug naar recept" : "Terug naar kookboek";
  const backAttr = isEdit ? `data-back-detail` : `data-nav="home"`;

  const heroIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;

  containerEl.innerHTML = `
    <section class="block">
      <div class="container">
        <div class="page-hero">
          <div class="page-hero-icon tint-lavender">${heroIcon}</div>
          <div class="page-hero-text">
            <h1>${heading}</h1>
            <p>${sub}</p>
          </div>
          <button class="btn btn-ghost page-hero-action" ${backAttr}>${backLabel}</button>
        </div>

        ${tabs}

        <div id="tab-content"></div>
      </div>
    </section>
  `;

  containerEl.querySelectorAll("[data-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      containerEl.querySelectorAll("[data-tab]").forEach(b => b.classList.toggle("active", b.dataset.tab === activeTab));
      renderTabContent();
    });
  });

  const backBtn = containerEl.querySelector("[data-back-detail]");
  if (backBtn) {
    backBtn.addEventListener("click", () => showView("detail", { id: editRecipe.id }));
  }

  renderTabContent();
}

function renderTabContent() {
  const target = document.getElementById("tab-content");
  if (activeTab === "manual") renderManualTab(target);
  else if (activeTab === "ai") renderAITab(target);
  else if (activeTab === "photo") renderPhotoTab(target);
  else if (activeTab === "link") renderLinkTab(target);
}

// ============================================================
// MANUAL TAB
// ============================================================

function renderManualTab(target) {
  const e = editRecipe || {};
  const v = (k, def = "") => e[k] != null ? String(e[k]) : def;
  const arr = (k) => Array.isArray(e[k]) ? e[k] : [];
  const isEdit = !!editRecipe;
  const submitLabel = isEdit ? "Bewaar wijzigingen" : "Bewaar recept";
  const cancelTarget = isEdit ? "detail" : "home";

  const ingredientsText = arr("ingredients").join("\n");
  const instructionsText = arr("instructions").join("\n");
  const dishTypeFirst = arr("dish_type")[0] || "";
  const dietsArr = arr("diet");
  const tagsText = arr("tags").join(", ");
  const existingPhoto = v("photo_url");

  target.innerHTML = `
    <form id="form-manual" class="form-grid" style="max-width: 720px;">
      <div class="field">
        <label>Titel</label>
        <input type="text" name="title" required placeholder="Bijvoorbeeld: Bowl met zoete aardappel en tahin" value="${escapeAttr(v("title"))}" />
      </div>
      <div class="field">
        <label>Korte omschrijving</label>
        <textarea name="description" placeholder="Een paar zinnen waarom je dit recept lekker vindt">${escapeHtml(v("description"))}</textarea>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Bereidingstijd in minuten</label>
          <input type="number" name="cookTime" min="1" value="${v("cook_time", "30")}" />
        </div>
        <div class="field">
          <label>Aantal porties</label>
          <input type="number" name="servings" min="1" value="${v("servings", "2")}" />
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Maaltijdtype</label>
          <select name="mealType">
            <option value="">Kies een type</option>
            ${MEAL_TYPES.map(m => `<option value="${m}" ${v("meal_type") === m ? "selected" : ""}>${m}</option>`).join("")}
          </select>
          <p class="hint">Wanneer eet je het, bijvoorbeeld Avondeten of Lunch.</p>
        </div>
        <div class="field">
          <label>Gerechttype (optioneel)</label>
          <select name="dishType">
            <option value="">Geen specifiek type</option>
            ${DISH_TYPES.map(d => `<option value="${d}" ${dishTypeFirst === d ? "selected" : ""}>${d}</option>`).join("")}
          </select>
          <p class="hint">Wat is het, bijvoorbeeld Bowl of Pasta.</p>
        </div>
      </div>
      <div class="field">
        <label>Dieet (optioneel, meerdere mogelijk)</label>
        <div class="diet-grid" id="diet-options">
          ${DIETS.map(d => `
            <label class="diet-option">
              <input type="checkbox" name="diet" value="${d.key}" ${dietsArr.includes(d.key) ? "checked" : ""} />
              <span>${d.icon} ${d.label}</span>
            </label>
          `).join("")}
        </div>
      </div>
      <div class="field">
        <label>Tags, gescheiden door komma (optioneel)</label>
        <input type="text" name="tags" placeholder="snel, comfort, familie" value="${escapeAttr(tagsText)}" />
        <p class="hint">Vrije woorden om later op te kunnen zoeken. Geen dieet of categorie nodig, die zitten al apart.</p>
      </div>
      <div class="field">
        <label>Ingredienten, een per regel</label>
        <textarea name="ingredients" placeholder="200 g zoete aardappel&#10;1 el tahin" rows="6">${escapeHtml(ingredientsText)}</textarea>
      </div>
      <div class="field">
        <label>Bereidingsstappen, een per regel</label>
        <textarea name="instructions" placeholder="Verwarm de oven voor op 200 graden.&#10;Snijd de zoete aardappel in blokjes." rows="6">${escapeHtml(instructionsText)}</textarea>
      </div>
      <div class="field">
        <label>Tips (optioneel)</label>
        <textarea name="tips">${escapeHtml(v("tips"))}</textarea>
      </div>
      <div class="field">
        <label>Foto (optioneel)</label>
        <div class="upload-zone" id="manual-upload-zone">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--steel)" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
          <h4>${isEdit && existingPhoto ? "Vervang de foto" : "Sleep een foto hierheen of klik om te kiezen"}</h4>
          <p>JPG of PNG, maximaal ${PHOTO_MAX_UPLOAD_MB} MB</p>
          <input type="file" accept="image/*" id="manual-file-input" style="display:none" />
          <img id="manual-preview" class="upload-preview" style="display:${existingPhoto ? "block" : "none"}" ${existingPhoto ? `src="${escapeAttr(existingPhoto)}"` : ""} />
        </div>
        ${isEdit
          ? `<div style="margin-top: 10px;">
               <button type="button" class="btn btn-secondary" id="manual-ai-photo">Laat AI een foto maken (${CREDIT_COSTS.AI_PHOTO} credits)</button>
               <p class="hint">De AI maakt een foto op basis van de titel en de ingredienten. Een eigen foto hierboven heeft altijd voorrang.</p>
             </div>`
          : `<p class="hint" style="margin-top: 8px;">Een AI foto kun je toevoegen nadat je het recept hebt bewaard. Open het dan en kies Bewerk.</p>`}
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">${submitLabel}</button>
        <button type="button" class="btn btn-secondary" data-cancel-${cancelTarget}>Annuleer</button>
      </div>
    </form>
  `;

  bindUploadZone("manual-upload-zone", "manual-file-input", "manual-preview", (blob, dataUrl) => {
    pendingPhotoBlob = blob;
    pendingPhotoDataUrl = dataUrl;
  });

  if (isEdit) {
    const aiPhotoBtn = document.getElementById("manual-ai-photo");
    if (aiPhotoBtn) aiPhotoBtn.addEventListener("click", () => handleAiPhoto(aiPhotoBtn));
  }

  const cancelBtn = document.querySelector(`[data-cancel-${cancelTarget}]`);
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      if (isEdit) showView("detail", { id: editRecipe.id });
      else showView("home");
    });
  }

  document.getElementById("form-manual").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const dietChecked = Array.from(ev.target.querySelectorAll("input[name='diet']:checked")).map(cb => cb.value);
    const dishType = (fd.get("dishType") || "").trim();
    const data = {
      title: (fd.get("title") || "").trim(),
      description: (fd.get("description") || "").trim(),
      cook_time: Number(fd.get("cookTime")) || null,
      servings: Number(fd.get("servings")) || null,
      meal_type: fd.get("mealType") || null,
      dish_type: dishType ? [dishType] : [],
      diet: dietChecked,
      tags: splitTags(fd.get("tags")),
      ingredients: splitLines(fd.get("ingredients")),
      instructions: splitLines(fd.get("instructions")),
      tips: (fd.get("tips") || "").trim(),
    };
    if (isEdit) {
      await updateExistingRecipe(data, pendingPhotoBlob, ev.target.querySelector("button[type='submit']"));
    } else {
      data.source = "manual";
      data.cook_style = "neutraal";
      await saveRecipeFromForm(data, pendingPhotoBlob, ev.target.querySelector("button[type='submit']"));
    }
  });
}

async function updateExistingRecipe(data, photoBlob, submitBtn) {
  if (!data.title?.trim()) { toast("Vul minstens een titel in", "error"); return; }
  const orig = submitBtn?.innerHTML;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Bezig...';
  }
  try {
    await supabaseClient.updateRecipe(editRecipe.id, data);
    if (photoBlob) {
      try {
        const photoUrl = await supabaseClient.uploadRecipePhoto(editRecipe.id, photoBlob, "jpg");
        await supabaseClient.updateRecipe(editRecipe.id, { photo_url: photoUrl, photo_is_ai: false });
      } catch {
        toast("Recept bewaard, maar foto uploaden mislukte", "error");
      }
    }
    toast("Wijzigingen bewaard", "success");
    showView("detail", { id: editRecipe.id });
  } catch (err) {
    toast(err.message || "Bewaren mislukt", "error");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = orig;
    }
  }
}

// AI foto laten maken bij een bestaand recept, vanuit het bewerkscherm.
// De foto wordt meteen bij het recept opgeslagen en in de preview getoond.
async function handleAiPhoto(btn) {
  if (!editRecipe) return;
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Bezig met genereren...';
  try {
    const photoUrl = await generateAiPhotoForRecipe(editRecipe);
    await supabaseClient.updateRecipe(editRecipe.id, { photo_url: photoUrl, photo_is_ai: true });
    editRecipe.photo_url = photoUrl;
    editRecipe.photo_is_ai = true;
    pendingPhotoBlob = null;
    pendingPhotoDataUrl = null;
    const prev = document.getElementById("manual-preview");
    if (prev) { prev.src = photoUrl; prev.style.display = "block"; }
    toast("AI foto opgeslagen bij recept", "success");
    btn.disabled = false;
    btn.innerHTML = orig;
  } catch (err) {
    toast(err.message || "AI foto genereren mislukt", "error");
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

async function generateAiPhotoForRecipe(recipe) {
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

  let rawDataUrl;
  if (result.b64) rawDataUrl = "data:image/png;base64," + result.b64;
  else if (result.url) rawDataUrl = await urlToDataUrl(result.url);
  else throw new Error("Geen afbeelding ontvangen");

  const compressedBlob = await compressDataUrlToBlob(rawDataUrl);
  return await supabaseClient.uploadRecipePhoto(recipe.id, compressedBlob, "jpg");
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

function compressDataUrlToBlob(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, PHOTO_MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * ratio);
      const h = Math.round(img.naturalHeight * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Compressie mislukt")), "image/jpeg", PHOTO_QUALITY);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// ============================================================
// AI TAB
// ============================================================

function renderAITab(target) {
  target.innerHTML = `
    <div class="pill-tabs" style="max-width: 480px;">
      <button class="pill-tab ${aiSubTab === "form" ? "active" : ""}" data-ai-mode="form">Formulier</button>
      <button class="pill-tab ${aiSubTab === "chat" ? "active" : ""}" data-ai-mode="chat">Chat</button>
    </div>
    <div id="ai-sub-content"></div>
  `;
  target.querySelectorAll("[data-ai-mode]").forEach(btn => {
    btn.addEventListener("click", () => {
      aiSubTab = btn.dataset.aiMode;
      target.querySelectorAll("[data-ai-mode]").forEach(b => b.classList.toggle("active", b.dataset.aiMode === aiSubTab));
      renderAISubContent();
    });
  });
  renderAISubContent();
}

function renderAISubContent() {
  const target = document.getElementById("ai-sub-content");
  if (aiSubTab === "form") renderAIFormMode(target);
  else renderAIChatMode(target);
}

function renderAIFormMode(target) {
  target.innerHTML = `
    <form id="form-ai" class="form-grid" style="max-width: 720px;">
      <div class="field">
        <label>Wat heb je in huis of waar heb je zin in</label>
        <textarea name="prompt" placeholder="Bijvoorbeeld: pompoen, kikkererwten, feta. Iets met mediterrane kruiden." required></textarea>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Maaltijdtype</label>
          <select name="mealType">
            <option value="">Maakt niet uit</option>
            ${MEAL_TYPES.map(m => `<option value="${m}">${m}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label>Gerechttype</label>
          <select name="dishType">
            <option value="">Maakt niet uit</option>
            ${DISH_TYPES.map(d => `<option value="${d}">${d}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Bereidingstijd</label>
          <select name="time">
            <option value="">Maakt niet uit</option>
            <option value="15">Onder 15 minuten</option>
            <option value="30">Onder 30 minuten</option>
            <option value="60">Onder een uur</option>
          </select>
        </div>
        <div class="field">
          <label>Voor hoeveel personen</label>
          <input type="number" name="servings" min="1" value="2" />
        </div>
      </div>
      <div class="field">
        <label>Dieet voorkeur (optioneel, meerdere mogelijk)</label>
        <div class="diet-grid">
          ${DIETS.map(d => `
            <label class="diet-option">
              <input type="checkbox" name="diet" value="${d.key}" />
              <span>${d.icon} ${d.label}</span>
            </label>
          `).join("")}
        </div>
      </div>
      <div class="field">
        <label>Kookstijl</label>
        <select name="cookStyle" id="ai-form-cook-style"></select>
        <p class="hint">Kies een kok als signatuur. De stijl bepaalt smaken, technieken en ingredienten.</p>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" id="btn-generate-form">
          <span class="btn-label">Genereer recept (1 credit)</span>
        </button>
        <button type="button" class="btn btn-secondary" data-nav="home">Annuleer</button>
      </div>
    </form>
    <div id="ai-form-result" style="margin-top: 32px; display:none"></div>
  `;
  const preferredStyle = STATE.profile?.default_cook_style || "neutraal";
  populateCookStyleDropdown(document.getElementById("ai-form-cook-style"), preferredStyle);

  document.getElementById("form-ai").addEventListener("submit", handleAIFormGenerate);
}

function renderAIChatMode(target) {
  target.innerHTML = `
    <div class="field" style="max-width: 480px; margin-bottom: 16px;">
      <label>Kookstijl voor dit gesprek</label>
      <select id="chat-cook-style"></select>
      <p class="hint">De stijl bepaalt hoe je souschef de voorstellen en het recept opbouwt.</p>
    </div>
    <div class="chat" id="chat">
      <div class="chat-messages" id="chat-messages">
        <div class="chat-msg assistant">Hoi. Vertel me wat je wil koken, dan geef ik je drie voorstellen om uit te kiezen. Bijvoorbeeld "iets met kip en pasta voor 4 personen" of "een gezonde lunchbowl met wat ik in huis heb".</div>
      </div>
      <div class="chat-input-row">
        <input type="text" id="chat-input" placeholder="Typ je vraag" />
        <button class="btn btn-primary" id="chat-send">Stuur</button>
      </div>
    </div>
    <p class="hint" style="margin-top: 12px">Praten en voorstellen krijgen is gratis. Pas wanneer je souschef het volledige recept aflevert, gaat er 1 credit af.</p>
    <div id="ai-chat-result" style="margin-top: 24px"></div>
  `;
  const preferredStyle = STATE.profile?.default_cook_style || "neutraal";
  populateCookStyleDropdown(document.getElementById("chat-cook-style"), preferredStyle);

  document.getElementById("chat-send").addEventListener("click", handleChatSend);
  document.getElementById("chat-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleChatSend();
  });
}

async function handleAIFormGenerate(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const prompt = (fd.get("prompt") || "").trim();
  if (!prompt) { toast("Beschrijf eerst wat je wil koken", "error"); return; }

  const styleKey = fd.get("cookStyle") || "neutraal";
  const btn = document.getElementById("btn-generate-form");
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Bezig...';

  try {
    const dietChecked = Array.from(e.target.querySelectorAll("input[name='diet']:checked")).map(cb => cb.value);
    const userMsg = `Maak een recept voor mij.
Wat ik heb of waar ik zin in heb: ${prompt}
Maaltijdtype: ${fd.get("mealType") || "maakt niet uit"}
Gerechttype: ${fd.get("dishType") || "maakt niet uit"}
Maximale bereidingstijd: ${fd.get("time") || "geen limiet"} minuten
Aantal personen: ${fd.get("servings") || 2}
Dieet voorkeur: ${dietChecked.length ? dietChecked.join(", ") : "geen voorkeur"}

Geef het recept in het JSON formaat. Vul mealType, dishType en diet zelf in op basis van wat het recept werkelijk is, maar respecteer mijn voorkeuren waar mogelijk.`;

    const result = await supabaseClient.callClaude({
      system: recipeJsonSystem(styleKey),
      messages: [{ role: "user", content: userMsg }],
      actionKind: "generate-form",
      creditCost: CREDIT_COSTS.GENERATE,
      description: "AI recept generatie via formulier",
    });

    // Update credits in state
    if (typeof result.credits === "number") {
      setState({ profile: { ...STATE.profile, credits: result.credits } });
      updateCreditDisplay();
    }

    const recipe = extractJson(result.text);
    recipe.cookStyle = styleKey;
    aiPreviewRecipe = recipe;
    showRecipePreview(recipe, "ai-form-result");
  } catch (err) {
    toast(err.message || "Generatie mislukt", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

async function handleChatSend() {
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  appendChatMessage("user", text);
  chatHistory.push({ role: "user", content: text });

  const sendBtn = document.getElementById("chat-send");
  sendBtn.disabled = true;
  showTyping();

  const styleKey = document.getElementById("chat-cook-style").value || "neutraal";

  try {
    const system = `Je bent de persoonlijke kok van de gebruiker. Praat in jij vorm, zonder gedachtestreepjes. Schrijf concreet en sensorisch. Leg niets uit wat niet gevraagd is.${cookStyleBlock(styleKey)}

Werkwijze:
1. Stel bij een eerste vraag drie korte voorstellen voor. Per voorstel: titel vetgedrukt, een zin omschrijving, geschatte bereidingstijd en geschatte calorieen per persoon. Sluit af met "Welk gerecht spreekt je aan?". Houd de voorstellen duidelijk verschillend qua smaakprofiel of aanpak.
2. Zodra de gebruiker een keuze maakt, werk je het recept volledig uit. Lever het dan in dit formaat, met een korte intro zin en daarna een JSON blok:

\`\`\`json
{ "title": "...", "description": "...", "cookTime": 30, "servings": 2, "mealType": "Ontbijt/Brunch/Tussendoortje/Lunch/Avondeten/Bijgerecht/Toetje/Drankje/Borrelhap/Bakken", "dishType": ["Bowl/Soep/Salade/Pasta/Rijstgerecht/Pizza/Wrap of tortilla/Sandwich of brood/Burger/Risotto/Curry/Stoof of stamppot/Ovenschotel/Quiche of hartige taart/Pannenkoek of poffer/Cake of taart/Koekjes/Smoothie of sap/Saus of dip/Marinade of rub"], "diet": ["vegetarisch/vegan/glutenvrij/lactosevrij/notenvrij/koolhydraatarm/eiwitrijk/suikervrij/halal alleen invullen die toepasselijk zijn"], "tags": ["vrije korte tags"], "ingredients": ["..."], "instructions": ["..."], "tips": "...", "nutrition": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0 } }
\`\`\`

3. Pas wanneer je het JSON blok stuurt is het recept klaar. Daarvoor geen JSON, alleen voorstellen of doorvragen.

Vraag door als iets onduidelijk is. Ga uit van 2 personen tenzij anders gevraagd.`;

    // Voor chat met meerdere berichten en alleen credits aftrekken bij volledig recept:
    // We sturen creditCost 0 voor doorpraten, en doen handmatig credit afhandelen wanneer JSON komt
    // Maar de server side function trekt altijd af. Dus we gebruiken creditCost 0 hier:
    const result = await supabaseClient.callClaude({
      system,
      messages: chatHistory,
      actionKind: "chat-doorpraten",
      creditCost: 0,
      description: "Chat doorpraten",
    });
    hideTyping();

    // Geen credit update hier: doorpraten kost 0 credits, en de server stuurt dan 0 terug.
    // De zichtbare aftrek gebeurt pas bij de echte afrekening (chat-recept-klaar).

    const reply = result.text;
    chatHistory.push({ role: "assistant", content: reply });

    const jsonMatch = reply.match(/```json\s*([\s\S]+?)```/);
    if (jsonMatch) {
      // Recept is klaar, trek nu de echte credit af
      try {
        const charge = await supabaseClient.callClaude({
          system: "Antwoord alleen met OK.",
          messages: [{ role: "user", content: "ok" }],
          actionKind: "chat-recept-klaar",
          creditCost: CREDIT_COSTS.GENERATE,
          description: "AI recept generatie via chat",
          maxTokens: 20,
        });
        if (typeof charge.credits === "number") {
          setState({ profile: { ...STATE.profile, credits: charge.credits } });
          updateCreditDisplay();
        }
      } catch (chargeErr) {
        // Als afrekenen mislukt, vraag opnieuw
        appendChatMessage("assistant", "Geen credits meer om dit recept te bewaren. Ga naar je instellingen om bij te kopen.");
        return;
      }

      const intro = reply.replace(/```json[\s\S]+```/, "").trim();
      if (intro) appendChatMessage("assistant", intro);
      const recipe = JSON.parse(jsonMatch[1]);
      recipe.cookStyle = styleKey;
      aiPreviewRecipe = recipe;
      showRecipePreview(recipe, "ai-chat-result");
    } else {
      appendChatMessage("assistant", reply);
      maybeRenderOptionChips(reply);
    }
  } catch (err) {
    toast(err.message || "Chat mislukt", "error");
  } finally {
    hideTyping();
    sendBtn.disabled = false;
  }
}

function appendChatMessage(role, text) {
  const wrap = document.getElementById("chat-messages");
  const el = document.createElement("div");
  el.className = "chat-msg " + role;
  if (role === "assistant") el.innerHTML = renderChatMarkdown(text);
  else el.textContent = text;
  wrap.appendChild(el);
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderChatMarkdown(text) {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  return esc(text)
    .replace(/^\s*#{1,6}\s*(.+)$/gm, "<strong>$1</strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^[ \t]*[-*]\s+(.+)$/gm, "&bull; $1");
}

// Toont de drie voorstellen als aantikbare kaartjes onder een voorstel bericht
function maybeRenderOptionChips(text) {
  if (!/welk gerecht|spreekt je aan|welke spreekt/i.test(text)) return;
  const titles = [...text.matchAll(/\*\*(.+?)\*\*/g)].map(m => m[1].trim()).filter(Boolean);
  const uniq = [...new Set(titles)].slice(0, 3);
  if (uniq.length < 2) return;
  const wrap = document.getElementById("chat-messages");
  const row = document.createElement("div");
  row.className = "chat-options";
  uniq.forEach(t => {
    const b = document.createElement("button");
    b.className = "chat-option";
    b.innerHTML = `<span class="chat-option-label">Kies</span> ${renderChatMarkdown(t)}`;
    b.addEventListener("click", () => {
      row.querySelectorAll("button").forEach(x => x.disabled = true);
      const input = document.getElementById("chat-input");
      input.value = `Ik kies: ${t}`;
      handleChatSend();
    });
    row.appendChild(b);
  });
  wrap.appendChild(row);
  row.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Laadindicatie terwijl de souschef nadenkt
function showTyping() {
  hideTyping();
  const wrap = document.getElementById("chat-messages");
  if (!wrap) return;
  const el = document.createElement("div");
  el.className = "chat-msg assistant chat-typing";
  el.id = "chat-typing";
  el.innerHTML = `<img src="assets/icon-hat.svg" width="22" height="22" alt="" /><span>Even aan het koken</span><span class="typing-dots"><i></i><i></i><i></i></span>`;
  wrap.appendChild(el);
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideTyping() {
  document.getElementById("chat-typing")?.remove();
}

// ============================================================
// PHOTO TAB
// ============================================================

function renderPhotoTab(target) {
  target.innerHTML = `
    <div class="stack lg" style="max-width: 720px">
      <div class="upload-zone" id="photo-upload-zone">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--steel)" stroke-width="1.5"><path d="M23 19V8a2 2 0 0 0-2-2h-4l-2-2H9L7 6H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2z"/><circle cx="12" cy="13" r="4"/></svg>
        <h4>Maak een foto of upload uit je bibliotheek</h4>
        <p>Werkt op handgeschreven recepten of pagina's uit een kookboek</p>
        <input type="file" accept="image/*" capture="environment" id="photo-file-input" style="display:none" />
        <img id="photo-preview" class="upload-preview" style="display:none" />
      </div>
      <div class="row">
        <button class="btn btn-primary" id="btn-read-photo" disabled>Lees recept uit foto (1 credit)</button>
        <button class="btn btn-secondary" data-nav="home">Annuleer</button>
      </div>
      <div id="photo-result" style="margin-top: 24px"></div>
    </div>
  `;

  bindUploadZone("photo-upload-zone", "photo-file-input", "photo-preview", (blob, dataUrl) => {
    pendingPhotoBlob = blob;
    pendingPhotoDataUrl = dataUrl;
    document.getElementById("btn-read-photo").disabled = false;
  });

  document.getElementById("btn-read-photo").addEventListener("click", handlePhotoRead);
}

async function handlePhotoRead() {
  if (!pendingPhotoDataUrl) { toast("Upload eerst een foto", "error"); return; }

  const btn = document.getElementById("btn-read-photo");
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Bezig...';

  try {
    const base64 = pendingPhotoDataUrl.split(",")[1];
    const result = await supabaseClient.callClaudeVision({
      system: recipeJsonSystem("neutraal"),
      prompt: "Lees dit handgeschreven of gedrukte recept. Zet het netjes om in het JSON formaat dat je krijgt. Vertaal indien nodig naar het Nederlands. Schat de bereidingstijd en porties als die er niet staan.",
      imageBase64: base64,
      imageMimeType: "image/jpeg",
    });

    if (typeof result.credits === "number") {
      setState({ profile: { ...STATE.profile, credits: result.credits } });
      updateCreditDisplay();
    }

    const recipe = extractJson(result.text);
    recipe.cookStyle = "neutraal";
    photoPreviewRecipe = recipe;
    showRecipePreview(recipe, "photo-result");
  } catch (err) {
    toast(err.message || "Foto inlezen mislukt", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

// ============================================================
// LINK TAB
// ============================================================

function renderLinkTab(target) {
  target.innerHTML = `
    <div class="stack lg" style="max-width: 720px">
      <div class="field">
        <label>Link naar een recept</label>
        <input type="url" id="link-url-input" placeholder="https://..." style="width:100%" />
        <p class="hint">Plak een link van een receptenwebsite. Wij lezen het recept uit en zetten het netjes in je kookboek, in het Nederlands. Instagram en TikTok werken nog niet.</p>
      </div>
      <div class="row">
        <button class="btn btn-primary" id="btn-read-link">Lees recept uit link (${CREDIT_COSTS.GENERATE} credit)</button>
        <button class="btn btn-secondary" data-nav="home">Annuleer</button>
      </div>
      <div id="link-result" style="margin-top: 24px"></div>
    </div>
  `;

  document.getElementById("btn-read-link").addEventListener("click", handleLinkRead);
  document.getElementById("link-url-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); handleLinkRead(); }
  });
}

async function handleLinkRead() {
  const input = document.getElementById("link-url-input");
  const url = (input.value || "").trim();
  if (!/^https?:\/\//i.test(url)) { toast("Plak een geldige link die met http begint", "error"); return; }

  const btn = document.getElementById("btn-read-link");
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Bezig met lezen...';

  try {
    const fetched = await supabaseClient.readFromLink(url);
    if (!fetched?.content) throw new Error("Kon geen recept van deze link halen");

    const result = await supabaseClient.callClaude({
      system: recipeJsonSystem("neutraal"),
      messages: [{ role: "user", content: `Hieronder staat de inhoud van een receptpagina. Zet het om in het JSON formaat. Vertaal naar het Nederlands als het in een andere taal staat. Schat de bereidingstijd en porties als ze ontbreken. Verzin geen ingredienten of stappen die er niet staan.\n\n${fetched.content}` }],
      maxTokens: 2000,
      actionKind: "link-import",
      creditCost: CREDIT_COSTS.GENERATE,
      description: "Recept uit een link",
    });

    if (typeof result.credits === "number") {
      setState({ profile: { ...STATE.profile, credits: result.credits } });
      updateCreditDisplay();
    }

    const recipe = extractJson(result.text);
    recipe.cookStyle = "neutraal";
    // Als de website een foto bij het recept had, tonen we die alvast en bewaren we hem mee
    if (fetched.imageBase64 && fetched.imageMime) {
      recipe.photoUrl = `data:${fetched.imageMime};base64,${fetched.imageBase64}`;
    }
    linkPreviewRecipe = recipe;
    showRecipePreview(recipe, "link-result");
  } catch (err) {
    toast(err.message || "Recept uit link lezen mislukt", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

// ============================================================
// SHARED: Recipe preview + save
// ============================================================

function showRecipePreview(recipe, containerId) {
  const c = document.getElementById(containerId);
  c.style.display = "";

  const renderPreview = () => {
    const photo = recipe.photoUrl || recipe.photo_url
      ? `<img src="${recipe.photoUrl || recipe.photo_url}" style="width:100%; max-height:320px; object-fit:cover; border-radius: var(--r-md); margin-bottom: 16px"/>`
      : "";
    const mealType = recipe.mealType || recipe.meal_type;
    const dishTypes = Array.isArray(recipe.dishType) ? recipe.dishType : (Array.isArray(recipe.dish_type) ? recipe.dish_type : []);
    const diets = Array.isArray(recipe.diet) ? recipe.diet : [];
    c.innerHTML = `
      <div class="card-feature tint-mint">
        <h3 style="font-size: 24px; margin: 0 0 8px;">${escapeHtml(recipe.title || "Naamloos recept")}</h3>
        <p style="margin: 0 0 16px;">${escapeHtml(recipe.description || "")}</p>
        ${photo}
        <div class="row" style="margin-bottom: 12px;">
          ${recipe.cookTime || recipe.cook_time ? `<span class="meta-pill">${recipe.cookTime || recipe.cook_time} min</span>` : ""}
          ${recipe.servings ? `<span class="meta-pill">${recipe.servings} porties</span>` : ""}
          ${mealType ? `<span class="meta-pill">${escapeHtml(mealType)}</span>` : ""}
          ${dishTypes.map(d => `<span class="meta-pill">${escapeHtml(d)}</span>`).join("")}
        </div>
        ${diets.length ? `<div class="diet-badges" style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px;">${diets.map(k => {
          const d = DIETS.find(x => x.key === k);
          return d ? `<span class="diet-badge tint-${d.color}">${d.icon} ${escapeHtml(d.label)}</span>` : "";
        }).join("")}</div>` : ""}
        <h4 style="font-size:16px; margin: 16px 0 8px;">Ingredienten</h4>
        <ul style="margin:0; padding-left: 20px">
          ${(recipe.ingredients || []).map(i => `<li>${escapeHtml(i)}</li>`).join("")}
        </ul>
        <h4 style="font-size:16px; margin: 16px 0 8px;">Bereiding</h4>
        <ol style="margin:0; padding-left: 20px">
          ${(recipe.instructions || []).map(i => `<li style="padding: 4px 0">${escapeHtml(i)}</li>`).join("")}
        </ol>
        ${recipe.tips ? `<h4 style="font-size:16px; margin: 16px 0 8px;">Tip</h4><p style="margin:0">${escapeHtml(recipe.tips)}</p>` : ""}
        <div class="form-actions" style="margin-top: 24px">
          <button class="btn btn-primary" data-save-recipe>Bewaar in mijn kookboek</button>
          <button class="btn btn-ghost" data-discard-recipe>Verwerp</button>
        </div>
      </div>
    `;
    bindPreviewActions();
  };

  const bindPreviewActions = () => {
    c.querySelector("[data-save-recipe]")?.addEventListener("click", async () => {
      const toSave = normalizeRecipe(recipe);
      const sourceKind = containerId.includes("photo") ? "photo"
        : containerId.includes("link") ? "link"
        : (containerId.includes("chat") ? "ai-chat" : "ai-form");
      toSave.source = sourceKind;
      // Foto van een website meenemen: comprimeren en mee opslaan
      let photoBlob = null;
      if (typeof recipe.photoUrl === "string" && recipe.photoUrl.startsWith("data:")) {
        try { photoBlob = await compressDataUrlToBlob(recipe.photoUrl); } catch {}
      }
      await saveRecipeFromForm(toSave, photoBlob, null);
      c.innerHTML = "";
      c.style.display = "none";
      aiPreviewRecipe = null;
      photoPreviewRecipe = null;
      linkPreviewRecipe = null;
      chatHistory = [];
    });
    c.querySelector("[data-discard-recipe]")?.addEventListener("click", () => {
      c.innerHTML = "";
      c.style.display = "none";
    });
  };

  renderPreview();
}

function normalizeRecipe(r) {
  return {
    title: r.title || "Naamloos recept",
    description: r.description || "",
    cook_time: Number(r.cookTime || r.cook_time) || null,
    servings: Number(r.servings) || null,
    meal_type: r.mealType || r.meal_type || null,
    dish_type: Array.isArray(r.dishType) ? r.dishType : (Array.isArray(r.dish_type) ? r.dish_type : []),
    diet: Array.isArray(r.diet) ? r.diet : [],
    tags: Array.isArray(r.tags) ? r.tags : [],
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    instructions: Array.isArray(r.instructions) ? r.instructions : [],
    tips: r.tips || "",
    nutrition: r.nutrition || null,
    cook_style: r.cookStyle || r.cook_style || "neutraal",
    language: "nl",
  };
}

async function saveRecipeFromForm(recipeData, photoBlob, submitBtn) {
  if (!recipeData.title?.trim()) { toast("Vul minstens een titel in", "error"); return; }

  const orig = submitBtn?.innerHTML;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Bezig...';
  }

  try {
    const created = await supabaseClient.createRecipe(recipeData);

    if (photoBlob) {
      try {
        const photoUrl = await supabaseClient.uploadRecipePhoto(created.id, photoBlob, "jpg");
        await supabaseClient.updateRecipe(created.id, { photo_url: photoUrl, photo_is_ai: false });
      } catch (photoErr) {
        toast("Recept bewaard, maar foto uploaden mislukte", "error");
      }
    }

    toast("Recept toegevoegd aan je kookboek", "success");
    showView("home");
  } catch (err) {
    toast(err.message || "Recept bewaren mislukt", "error");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = orig;
    }
  }
}

// ============================================================
// HELPERS
// ============================================================

function recipeJsonSystem(styleKey) {
  return `Je bent een vriendelijke Nederlandse souschef. Je geeft recepten in jij vorm, zonder gedachtestreepjes. Schrijf concreet, sensorisch en toegankelijk.${cookStyleBlock(styleKey)}

Geef altijd alleen een geldig JSON object terug, zonder uitleg eromheen, met deze velden:
{
  "title": "string, korte titel",
  "description": "string, twee zinnen",
  "cookTime": number,
  "servings": number,
  "mealType": "Ontbijt, Brunch, Tussendoortje, Lunch, Avondeten, Bijgerecht, Toetje, Drankje, Borrelhap of Bakken",
  "dishType": ["array van 0 of 1 type, kies uit: Bowl, Soep, Salade, Pasta, Rijstgerecht, Pizza, Wrap of tortilla, Sandwich of brood, Burger, Risotto, Curry, Stoof of stamppot, Ovenschotel, Quiche of hartige taart, Pannenkoek of poffer, Cake of taart, Koekjes, Smoothie of sap, Saus of dip, Marinade of rub"],
  "diet": ["array van toepasselijke dieet keys: vegetarisch, vegan, glutenvrij, lactosevrij, notenvrij, koolhydraatarm, eiwitrijk, suikervrij, halal. Alleen die invullen die echt van toepassing zijn op basis van de ingredienten."],
  "tags": ["array van vrije korte tags, bv. comfort, fris, weekend, herfst, troostend, zomers, feest. BELANGRIJK: deze tags mogen NIET overlappen met wat al in mealType, dishType of diet staat. Dus geen tags zoals 'ontbijt', 'pasta', 'vegetarisch', 'eiwitrijk', 'glutenvrij', 'vegan' of variaties zoals 'eiwitbom' of 'glutenarm'. Alleen unieke beschrijvende sfeer of moment tags."],
  "ingredients": ["array, een ingredient per regel, met hoeveelheid"],
  "instructions": ["array, een stap per regel, in jij vorm"],
  "tips": "string, optionele tip",
  "nutrition": { "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number }
}

Voedingswaarden zijn per portie, in gram (behalve calorieen). Schat ze realistisch.`;
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Geen JSON gevonden in antwoord");
  return JSON.parse(match[0]);
}

function bindUploadZone(zoneId, inputId, previewId, onLoaded) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);

  zone.addEventListener("click", (e) => {
    if (e.target.tagName !== "INPUT") input.click();
  });
  zone.addEventListener("dragover", e => { e.preventDefault(); zone.classList.add("dragover"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
  zone.addEventListener("drop", e => {
    e.preventDefault();
    zone.classList.remove("dragover");
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  input.addEventListener("change", e => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });

  async function handleFile(file) {
    if (file.size > PHOTO_MAX_UPLOAD_MB * 1024 * 1024) {
      toast(`Foto is groter dan ${PHOTO_MAX_UPLOAD_MB} MB`, "error");
      return;
    }
    try {
      const { blob, dataUrl } = await compressFile(file);
      preview.src = dataUrl;
      preview.style.display = "";
      onLoaded(blob, dataUrl);
    } catch (err) {
      toast("Foto verwerken mislukt", "error");
    }
  }
}

async function compressFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = Math.min(1, PHOTO_MAX_DIM / Math.max(img.width, img.height));
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error("Compressie mislukt")); return; }
        const dataUrl = canvas.toDataURL("image/jpeg", PHOTO_QUALITY);
        resolve({ blob, dataUrl });
      }, "image/jpeg", PHOTO_QUALITY);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function splitLines(s) { return String(s || "").split("\n").map(x => x.trim()).filter(Boolean); }
function splitTags(s) { return String(s || "").split(",").map(x => x.trim()).filter(Boolean); }
function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
function escapeAttr(s) { return escapeHtml(s); }
